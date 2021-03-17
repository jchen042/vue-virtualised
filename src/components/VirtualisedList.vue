<template>
  <virtualised-base-scroller
    ref="virtualisedBaseScroller"
    :data="nodes"
    :viewport-height="viewportHeight"
    :initial-scroll-top="initialScrollTop"
    :initial-scroll-index="initialScrollIndex"
    :tolerance="tolerance"
    :get-node-height="getNodeHeight"
    :cell-renderer="cellRenderer"
    @onScroll="handleScroll"
  >
    <template #default="slotProps">
      <slot :node="slotProps.node" :index="slotProps.index"></slot>
    </template>
  </virtualised-base-scroller>
</template>

<script>
import { h } from "vue";
import VirtualisedBaseScroller from "./Base/VirtualisedBaseScroller";

export default {
  name: "VirtualisedList",
  components: { VirtualisedBaseScroller },
  props: {
    nodes: {
      type: Array,
      default: () => [],
    },
    viewportHeight: {
      type: Number,
      default: () => 400,
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
      default: () => null,
    },
  },
  emits: ["onScroll"],
  setup(props, { emit }) {
    const handleScroll = (scrollTop) => {
      emit("onScroll", scrollTop);
    };

    return { handleScroll };
  },
};
</script>

<style></style>
