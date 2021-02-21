<template>
  <div
    class="virtual-scroller-container"
    ref="virtualScroller"
    :style="{ height: `${viewportHeight}px` }"
    @scroll="onScroll"
  >
    <div
      :style="{
        height: `${totalHeight}px`,
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
</template>

<script>
import { slice } from "lodash";

export default {
  name: "VirtualScroller",
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      itemHeight: 40,
      scrollTop: 300,
      tolerance: 2,
      viewportHeight: 200,
      visibleNodes: [],
      offsetY: 0,
    };
  },
  mounted() {
    this.setInitialState();
  },
  methods: {
    setInitialState() {
      this.totalHeight = this.data.length * this.itemHeight;
      // start of visible node's index
      const startIndex = Math.max(
        0,
        Math.floor(this.scrollTop / this.itemHeight) - this.tolerance
      );
      // amount of visible nodes
      const visibleNodeCount = Math.min(
        this.data.length - startIndex,
        Math.ceil(this.viewportHeight / this.itemHeight) + this.tolerance * 2
      );
      // offset total content
      this.offsetY = startIndex * this.itemHeight;
      this.visibleNodes = slice(
        this.data,
        startIndex,
        startIndex + visibleNodeCount
      );
      this.$nextTick(() =>
        this.$refs.virtualScroller.scrollTo({ top: this.scrollTop })
      );
    },
    onScroll(e) {
      //   console.log(e);
    },
  },
};
</script>

<style>
.virtual-scroller-container {
  overflow: auto;
}
</style>
