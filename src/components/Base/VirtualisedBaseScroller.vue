<template>
  <div
    ref="virtualScroller"
    :style="{ height: `${viewportHeight}px`, overflow: 'auto' }"
    @scroll.passive="handleScroll"
  >
    <div
      :style="{
        height: `${totalHeight}px`,
        willChange: 'transform',
        position: 'relative',
        overflow: 'hidden',
      }"
    >
      <div
        :style="{
          willChange: 'transform',
          transform: `translateY(${offsetY}px)`,
        }"
      >
        <div
          v-for="(node, index) in visibleNodes"
          :key="getNodeKey(node, index)"
          :style="{ height: `${getNodeHeight(node)}px` }"
        >
          <virtualised-base-cell
            :node="node"
            :index="index"
            :start-index="startIndex"
            :cell-renderer="cellRenderer"
          >
            <template #cell="slotProps">
              <slot
                name="cell"
                :node="slotProps.node"
                :index="slotProps.index"
              ></slot>
            </template>
          </virtualised-base-cell>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * inspired by Adam Klein
 * https://dev.to/adamklein/build-your-own-virtual-scroll-part-i-11ib
 * https://dev.to/adamklein/build-your-own-virtual-scroll-part-ii-3j86
 */
import {
  defineComponent,
  PropType,
  toRefs,
  ref,
  triggerRef,
  computed,
  onMounted,
  watch,
  watchEffect,
  nextTick,
} from "vue";

import VirtualisedBaseCell from "./VirtualisedBaseCell.vue";

import invariant from "fbjs/lib/invariant";
import { isNil, isNaN } from "lodash";

import {
  GetNodeHeight,
  GetNodeKey,
  CellRenderer,
  ConditionCallback,
} from "../../types/types";

export default defineComponent({
  name: "VirtualisedBaseScroller",
  components: { VirtualisedBaseCell },
  props: {
    data: {
      type: Array as PropType<Array<any>>,
      required: true,
    },
    viewportHeight: {
      type: Number,
      default: () => 200,
    },
    initialScrollTop: {
      type: Number,
      default: () => 0,
    },
    initialScrollIndex: {
      type: Number,
      default: () => null,
    },
    scrollBehaviour: {
      // TODO: handle type change for parent components
      // eslint-disable-next-line no-undef
      type: Object as PropType<ScrollBehavior>,
      default: () => "auto",
    },
    tolerance: {
      type: Number,
      default: () => 2,
    },
    getNodeHeight: {
      type: Function as PropType<GetNodeHeight>,
      default: () => 40,
    },
    /**
     * A unique identifier for this list.
     * If there are multiple VirtualisedBaseScroller at the same level of nesting within another VirtualBaseScroller,
     * this key is necessary for virtualisation to work properly.
     */
    getNodeKey: {
      type: Function as PropType<GetNodeKey>,
      default: (node: any, index: number) => node.key ?? index,
    },
    cellRenderer: {
      type: Function as PropType<CellRenderer>,
      default: () => null,
    },
  },
  emits: ["onScroll", "onStartReached", "onEndReached"],
  setup(props, { emit }) {
    // TODO: dynamic data attributes
    const {
      viewportHeight,
      initialScrollTop,
      initialScrollIndex,
      scrollBehaviour,
      tolerance,
      getNodeHeight,
    } = toRefs(props);

    const data = computed({
      get: () => props.data,
      set: (val) => {
        data.value = val;
      },
    });

    // TODO: test invalid cases
    invariant(Array.isArray(data.value), "data is not an Array");
    invariant(
      !isNaN(Number(viewportHeight.value)),
      `viewportHeight value ${viewportHeight.value} is not Number`
    );
    invariant(
      viewportHeight.value >= 0,
      `viewportHeight value out of range: requested viewportHeight ${viewportHeight.value} but minimum is 0`
    );
    invariant(
      !isNaN(Number(initialScrollTop.value)),
      `initialScrollTop value ${initialScrollTop.value} is not Number`
    );
    invariant(
      initialScrollTop.value >= 0,
      `initialScrollTop value out of range: requested initialScrollTop ${initialScrollTop.value} but minimn is 0`
    );
    invariant(
      isNil(initialScrollIndex.value) ||
        !isNaN(Number(initialScrollIndex.value)),
      `initialScrollIndex value ${initialScrollIndex.value} is not Number`
    );
    invariant(
      initialScrollIndex.value >= 0,
      `initialScrollIndex value out of range: requested index ${initialScrollIndex.value} but minimum is 0`
    );
    invariant(
      initialScrollIndex.value < data.value.length,
      `initialScrollIndex value out of range: requested index ${
        initialScrollIndex.value
      } is out of 0 to ${data.value.length - 1}`
    );
    invariant(
      !isNaN(Number(tolerance.value)),
      `tolerance value ${tolerance.value} is not Number`
    );
    invariant(
      typeof getNodeHeight.value === "function",
      `getNodeHeight is not a function`
    );

    const virtualScroller = ref<HTMLElement | null>(null);

    // Store an array of child nodes positions from 0.
    const getChildPositions = (
      nodes: Array<any>,
      getNodeHeight: GetNodeHeight
    ) => {
      let results = [0];
      if (nodes.length > 0) {
        for (let i = 1; i < nodes.length; i++) {
          invariant(
            !isNaN(Number(getNodeHeight(nodes[i - 1]))),
            `getNodeHeight(node) method returns an invalid value ${getNodeHeight(
              nodes[i - 1]
            )} at index ${i - 1}`
          );
          results.push(results[i - 1] + getNodeHeight(nodes[i - 1]));
        }
      }

      return results;
    };
    const childPositions = ref(
      getChildPositions(data.value, getNodeHeight.value)
    );

    const scrollTop = ref(
      !isNil(initialScrollIndex.value)
        ? childPositions.value[initialScrollIndex.value]
        : initialScrollTop.value
    );

    // Calculte total content height.
    // TODO: Fix the content height limitation of 33554400px.
    const getTotalHeight = (
      nodes: Array<any>,
      childPositions: Array<number>,
      getNodeHeight: GetNodeHeight
    ) => {
      return nodes.length > 0
        ? childPositions[nodes.length - 1] +
            getNodeHeight(nodes[nodes.length - 1])
        : 0;
    };
    const totalHeight = ref(
      getTotalHeight(data.value, childPositions.value, getNodeHeight.value)
    );

    // Start of rendered node's index.
    const startIndex = ref(0);
    // Offset start node.
    const offsetY = ref(0);
    // Visible nodes in the virtualised view.
    const visibleNodes = ref<Array<number>>([]);

    // Binary search to find the first visible node's index in viewport.
    const getFirstVisibleIndex = (
      scrollTop: number,
      viewportHeight: number,
      totalHeight: number,
      childPositions: Array<number>,
      itemCount: number
    ) => {
      // In the case we don't have enough elements to scroll, so return index 0
      if (totalHeight < scrollTop || totalHeight < viewportHeight) return 0;
      let startRange = 0;
      let endRange = itemCount - 1 < 0 ? 0 : itemCount - 1;
      while (startRange !== endRange) {
        const middle = Math.floor((endRange - startRange) / 2 + startRange);
        if (
          childPositions[middle] < scrollTop &&
          childPositions[middle + 1] > scrollTop
        )
          return middle;
        if (middle === startRange) return endRange;
        else {
          if (childPositions[middle] <= scrollTop) startRange = middle;
          else endRange = middle;
        }
      }
      return itemCount;
    };

    // Find the last node's index in the viewport.
    const getLastVisibleIndex = (
      childPositions: Array<number>,
      firstVisibleIndex: number,
      itemCount: number,
      viewportHeight: number
    ) => {
      let lastVisibleIndex;
      for (
        lastVisibleIndex = firstVisibleIndex;
        lastVisibleIndex < itemCount;
        lastVisibleIndex++
      ) {
        if (
          childPositions[lastVisibleIndex] >
          childPositions[firstVisibleIndex] + viewportHeight
        ) {
          return lastVisibleIndex;
        }
      }
      return lastVisibleIndex;
    };

    /**
     * Calculate nodes to be rendered to the view,
     * and offset to be set to the rendered nodes.
     */
    const setScrollState = async () => {
      // first visible node's index
      const firstVisibleIndex = getFirstVisibleIndex(
        scrollTop.value,
        viewportHeight.value,
        totalHeight.value,
        childPositions.value,
        data.value.length
      );
      // Set start of rendered node's index.
      startIndex.value = Math.max(0, firstVisibleIndex - tolerance.value);

      // Last visible node's index.
      const lastVisibleIndex = getLastVisibleIndex(
        childPositions.value,
        firstVisibleIndex,
        data.value.length,
        viewportHeight.value
      );
      // Set end of rendered node's index.
      const endIndex = Math.min(
        data.value.length,
        lastVisibleIndex + tolerance.value
      );

      // Amount of nodes needs to be rendered.
      const visibleNodeCount = endIndex - startIndex.value + 1;
      // Set offset based on the index of start node.
      offsetY.value = childPositions.value[startIndex.value];
      // Set visible nodes.
      visibleNodes.value = data.value.slice(
        startIndex.value,
        startIndex.value + visibleNodeCount
      );

      await nextTick();

      // Ensure all values are presented.
      if (scrollTop.value !== null && virtualScroller.value !== null)
        virtualScroller.value.scrollTo({
          top: scrollTop.value,
          behavior: scrollBehaviour.value,
        });
    };

    const handleScroll = () => {
      requestAnimationFrame(() => {
        scrollTop.value = virtualScroller.value?.scrollTop ?? 0;
        emit("onScroll", virtualScroller.value?.scrollTop);

        if (scrollTop.value === 0)
          emit("onStartReached", virtualScroller.value?.scrollTop);

        // Hack: we might have 1px tolerance when scrolling to the end
        if (scrollTop.value >= totalHeight.value - viewportHeight.value - 1)
          emit("onEndReached", virtualScroller.value?.scrollTop);
      });
    };

    const scrollToStart = () => {
      virtualScroller.value?.scrollTo({
        top: 0,
        behavior: scrollBehaviour.value,
      });
    };

    const scrollToEnd = () => {
      virtualScroller.value?.scrollTo({
        top: totalHeight.value,
        behavior: scrollBehaviour.value,
      });
    };

    const scrollToIndex = (index: number) => {
      invariant(
        index >= 0,
        `index value out of range: requested index ${index} but minimum is 0`
      );
      invariant(
        index < data.value.length,
        `index value out of range: requested index ${index} is out of 0 to ${
          data.value.length - 1
        }`
      );
      scrollTop.value = childPositions.value[index];
    };

    const scrollToNode = (conditionCallback: ConditionCallback) => {
      invariant(
        conditionCallback && typeof conditionCallback === "function",
        `input parameter ${conditionCallback} is not a function`
      );
      const index = data.value.findIndex((node) => conditionCallback(node));
      if (index !== -1) scrollToIndex(index);
    };

    onMounted(async () => {
      await setScrollState();
    });

    const reCalculateHeights = () => {
      childPositions.value = getChildPositions(data.value, getNodeHeight.value);
      totalHeight.value = getTotalHeight(
        data.value,
        childPositions.value,
        getNodeHeight.value
      );
    };

    const refreshView = () => {
      triggerRef(data);
      reCalculateHeights();
    };

    watch(
      () => getNodeHeight.value,
      () => reCalculateHeights()
    );

    watchEffect(async () => {
      await setScrollState();
    });

    return {
      virtualScroller,
      totalHeight,
      startIndex,
      offsetY,
      visibleNodes,
      handleScroll,
      scrollToStart,
      scrollToEnd,
      scrollToIndex,
      scrollToNode,
      refreshView,
    };
  },
});
</script>

<style></style>
