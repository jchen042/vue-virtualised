<template>
  <div
    class="virtual-scroller-container"
    ref="virtualScroller"
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
          v-for="item in visibleNodes"
          :key="item"
          :style="{
            height: `${itemHeight}px`,
            borderBottom: '1px solid black',
          }"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  defineComponent,
  toRefs,
  ref,
  computed,
  onMounted,
  watch,
  nextTick,
} from "vue";
import { slice } from "lodash";

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
    itemHeight: {
      type: Number,
      default: () => 40,
    },
    scrollTop: {
      type: Number,
      default: () => 0,
    },
    tolerance: {
      type: Number,
      default: () => 2,
    },
  },
  setup(props, { emit }) {
    console.log(props);
    const { data, viewportHeight, itemHeight, tolerance } = toRefs(props);
    const scrollTop = computed({
      get: () => props.scrollTop,
      set: (value) => {
        emit("update:scrollTop", value);
      },
    });
    const virtualScroller = ref(null);
    // total content height
    const totalHeight = ref(data.value.length * itemHeight.value);
    // offset start node
    const offsetY = ref(0);
    // visible nodes
    const visibleNodes = ref([]);

    const setScrollState = async () => {
      // start of visible node's index
      const startIndex = Math.max(
        0,
        Math.floor(scrollTop.value / itemHeight.value) - tolerance.value
      );
      // amount of visible nodes
      const visibleNodeCount = Math.min(
        data.value.length - startIndex,
        Math.ceil(viewportHeight.value / itemHeight.value) + tolerance.value * 2
      );
      // set offset based on the index of start node
      offsetY.value = startIndex * itemHeight.value;
      // set visible nodes
      visibleNodes.value = slice(
        data.value,
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
      () => scrollTop.value,
      async () => await setScrollState()
    );

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
