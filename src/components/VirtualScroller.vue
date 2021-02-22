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
        <div
          v-for="(item, index) in visibleNodes"
          :key="index"
          :style="{
            height: `${getNodeHeight(item)}px`,
            borderLeft: '1px solid black',
            textAlign: 'left',
            marginLeft: `${item.deepness * 30}px`,
          }"
        >
          <button
            :style="{ width: '20px' }"
            :disabled="item.isLeaf"
            @click="$emit('toggleChildNodes', item)"
          >
            {{ item.isLeaf ? "" : item.state.expanded ? "-" : "+" }}
          </button>
          <span>{{ item.name ?? item.label }}</span>
        </div>
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
  computed,
  onMounted,
  watch,
  watchEffect,
  nextTick,
} from "vue";

export default defineComponent({
  name: "VirtualScroller",
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    viewportHeight: {
      type: Number,
      default: () => 0,
    },
    scrollTop: {
      type: Number,
      default: () => 0,
    },
    tolerance: {
      type: Number,
      default: () => 2,
    },
    getNodeHeight: {
      type: Function,
      default: () =>
        function () {
          return 40;
        },
    },
  },
  emits: ["update:scrollTop"],
  setup(props, { emit }) {
    // TODO: dynamic data attributes
    const { data, viewportHeight, tolerance, getNodeHeight } = toRefs(props);

    const scrollTop = computed({
      get: () => props.scrollTop,
      set: (value) => {
        emit("update:scrollTop", value);
      },
    });
    const virtualScroller = ref(null);

    // store an array of child nodes positions
    const getChildPositions = (nodes, getNodeHeight) => {
      let results = [0];
      if (nodes.length > 0) {
        // TODO: handle the scenario that the getNodeHeight method returns an invalid value
        for (let i = 1; i < nodes.length; i++) {
          results.push(results[i - 1] + getNodeHeight(nodes[i - 1]));
        }
      }

      return results;
    };
    const childPositions = ref(
      getChildPositions(data.value, getNodeHeight.value)
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

    // offset start node
    const offsetY = ref(0);
    // visible nodes
    const visibleNodes = ref([]);

    // TODO: handle edge case
    // binary search to find the first visible node's index in viewport
    const findFirstVisibleIndex = (scrollTop, childPositions, itemCount) => {
      let startRange = 0;
      let endRange = itemCount - 1;
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
    const findLastVisibleIndex = (
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

    // calculate nodes to be rendered to the view
    // and offset to be set to the rendered nodes
    const setScrollState = async () => {
      // first visible node's index
      const firstVisibleIndex = findFirstVisibleIndex(
        scrollTop.value,
        childPositions.value,
        data.value.length
      );
      // start of rendered node's index
      const startIndex = Math.max(0, firstVisibleIndex - tolerance.value);

      // last visible node's index
      const lastVisibleIndex = findLastVisibleIndex(
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
      const visibleNodeCount = endIndex - startIndex + 1;
      // set offset based on the index of start node
      offsetY.value = childPositions.value[startIndex];
      // set visible nodes
      visibleNodes.value = data.value.slice(
        startIndex,
        startIndex + visibleNodeCount
      );

      await nextTick();
      virtualScroller.value.scrollTo({ top: scrollTop.value });
    };

    const handleScroll = () => {
      requestAnimationFrame(() => {
        scrollTop.value = virtualScroller.value.scrollTop;
      });
    };

    onMounted(async () => {
      await setScrollState();
    });

    watch(
      () => getNodeHeight.value,
      () => {
        childPositions.value = getChildPositions(
          data.value,
          getNodeHeight.value
        );
        totalHeight.value = getTotalHeight(
          data.value,
          childPositions.value,
          getNodeHeight.value
        );
      }
    );

    watch(
      () => data.value,
      () => {
        childPositions.value = getChildPositions(
          data.value,
          getNodeHeight.value
        );
        totalHeight.value = getTotalHeight(
          data.value,
          childPositions.value,
          getNodeHeight.value
        );
      }
    );

    watchEffect(async () => {
      // console.log("set state");
      await setScrollState();
    });

    return {
      virtualScroller,
      totalHeight,
      offsetY,
      visibleNodes,
      setScrollState,
      handleScroll,
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
