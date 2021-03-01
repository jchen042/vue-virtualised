<template>
  <div
    ref="virtualScroller"
    class="virtual-scroller-container"
    :style="{ height: `${viewportHeight}px` }"
    @scroll.passive="handleScroll"
  >
    <div
      class="virtual-scroller-content"
      :style="{
        height: `${totalHeight}px`,
        willChange: 'transform',
      }"
    >
      <div
        :style="{
          willChange: 'transform',
          transform: `translateY(${offsetY}px)`,
        }"
      >
        <cell
          :start-index="startIndex"
          :visible-nodes="visibleNodes"
          :get-node-height="getNodeHeight"
          :cell-renderer="cellRenderer"
        ></cell>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * inspired by Adam Klein
 * https://dev.to/adamklein/build-your-own-virtual-scroll-part-i-11ib
 * https://dev.to/adamklein/build-your-own-virtual-scroll-part-ii-3j86
 */
import {
  defineComponent,
  toRefs,
  ref,
  triggerRef,
  computed,
  onMounted,
  watch,
  watchEffect,
  nextTick,
  h,
} from "vue";

import Cell from "./Cell.vue";

import invariant from "invariant";
import { isNil } from "lodash";

export default defineComponent({
  name: "VirtualScroller",
  components: { Cell },
  props: {
    data: {
      type: Array,
      default: () => [],
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
    tolerance: {
      type: Number,
      default: () => 2,
    },
    getNodeHeight: {
      type: Function,
      default: () => 40,
    },
    cellRenderer: {
      type: Function,
      default: (node, index) => [h("div", {}, node.name)],
    },
  },
  emits: ["onScroll"],
  setup(props, { emit }) {
    // TODO: dynamic data attributes
    const {
      initialScrollTop,
      initialScrollIndex,
      viewportHeight,
      tolerance,
      getNodeHeight,
    } = toRefs(props);

    const data = computed({
      get: () => props.data,
    });

    // TODO: test invalid cases
    invariant(Array.isArray(data.value), "data is not Array");
    invariant(
      !Number.isNaN(initialScrollTop.value),
      `initialScrollTop value ${initialScrollTop.value} is not Number`
    );
    invariant(
      isNil(initialScrollIndex.value) ||
        !Number.isNaN(initialScrollIndex.value),
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
      !Number.isNaN(viewportHeight.value),
      `viewportHeight value ${viewportHeight.value} is not Number`
    );
    invariant(
      !Number.isNaN(tolerance.value),
      `tolerance value ${tolerance.value} is not Number`
    );

    const virtualScroller = ref(null);

    // store an array of child nodes positions
    const getChildPositions = (nodes, getNodeHeight) => {
      let results = [0];
      if (nodes.length > 0) {
        // TODO: handle the scenario that the getNodeHeight method returns an invalid value
        for (let i = 1; i < nodes.length; i++) {
          invariant(
            !Number.isNaN(getNodeHeight(nodes[i - 1])),
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

    console.log(initialScrollIndex, initialScrollIndex.value);
    const scrollTop = ref(
      initialScrollIndex.value && initialScrollIndex.value < data.value.length
        ? childPositions.value[Math.max(0, initialScrollIndex.value)]
        : initialScrollTop.value
    );

    // calculte total content height
    const getTotalHeight = (nodes, childPositions, getNodeHeight) => {
      return nodes.length > 0
        ? childPositions[nodes.length - 1] +
            getNodeHeight(nodes[nodes.length - 1])
        : 0;
    };
    const totalHeight = ref(
      getTotalHeight(data.value, childPositions.value, getNodeHeight.value)
    );

    // start of rendered node's index
    const startIndex = ref(0);
    // offset start node
    const offsetY = ref(0);
    // visible nodes
    const visibleNodes = ref([]);

    // binary search to find the first visible node's index in viewport
    const getFirstVisibleIndex = (
      scrollTop,
      viewportHeight,
      totalHeight,
      childPositions,
      itemCount
    ) => {
      // in the case we don't have enough elements to scroll, return index
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

    // find the last node's index in the viewport
    const getLastVisibleIndex = (
      childPositions,
      firstVisibleIndex,
      itemCount,
      viewportHeight
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
     * calculate nodes to be rendered to the view
     * and offset to be set to the rendered nodes
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
      // set start of rendered node's index
      startIndex.value = Math.max(0, firstVisibleIndex - tolerance.value);

      // last visible node's index
      const lastVisibleIndex = getLastVisibleIndex(
        childPositions.value,
        firstVisibleIndex,
        data.value.length,
        viewportHeight.value
      );
      const endIndex = Math.min(
        data.value.length,
        lastVisibleIndex + tolerance.value
      );

      // amount of nodes needs to be rendered
      const visibleNodeCount = endIndex - startIndex.value + 1;
      // set offset based on the index of start node
      offsetY.value = childPositions.value[startIndex.value];
      // set visible nodes
      visibleNodes.value = data.value.slice(
        startIndex.value,
        startIndex.value + visibleNodeCount
      );

      await nextTick();
      virtualScroller.value.scrollTo({ top: scrollTop.value });
    };

    const handleScroll = () => {
      requestAnimationFrame(() => {
        scrollTop.value = virtualScroller.value.scrollTop;
        emit("onScroll", virtualScroller.value.scrollTop);
      });
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
      // console.log("set state");
      await setScrollState();
    });

    return {
      virtualScroller,
      totalHeight,
      startIndex,
      offsetY,
      visibleNodes,
      handleScroll,
      refreshView,
    };
  },
});
</script>

<style>
.virtual-scroller-container {
  overflow: auto;
}
.virtual-scroller-content {
  overflow: hidden;
  position: relative;
}
</style>
