<template>
  <virtualised-base-scroller
    ref="scroller"
    :data="nodes"
    :viewport-height="viewportHeight"
    :initial-scroll-top="initialScrollTop"
    :initial-scroll-index="initialScrollIndex"
    :scroll-behaviour="scrollBehaviour"
    :tolerance="tolerance"
    :get-node-height="getNodeHeight"
    :get-node-key="getNodeKey"
    :cell-renderer="cellRenderer"
    @onScroll="handleScroll"
    @onStartReached="handleStartReached"
    @onEndReached="handleEndReached"
  >
    <template #cell="slotProps">
      <slot name="cell" :node="slotProps.node" :index="slotProps.index"></slot>
    </template>
  </virtualised-base-scroller>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */

import { defineComponent, PropType, ref, onMounted } from "vue";
import VirtualisedBaseScroller from "./Base/VirtualisedBaseScroller.vue";

import { GetNodeHeight, GetNodeKey, CellRenderer } from "../types/types";

export default defineComponent({
  name: "VirtualisedList",
  components: { VirtualisedBaseScroller },
  props: {
    nodes: {
      type: Array as PropType<Array<any>>,
      required: true,
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
    scrollBehaviour: {
      // eslint-disable-next-line no-undef
      type: String as PropType<ScrollBehavior>,
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
    const scroller = ref<typeof VirtualisedBaseScroller | null>(null);
    const scrollToStart = ref(null);
    const scrollToEnd = ref(null);
    const scrollToIndex = ref(null);
    const scrollToNode = ref(null);
    const refreshView = ref(null);

    const handleScroll = (scrollTop: number): void => {
      emit("onScroll", scrollTop);
    };

    const handleStartReached = (scrollTop: number): void => {
      emit("onStartReached", scrollTop);
    };

    const handleEndReached = (scrollTop: number): void => {
      emit("onEndReached", scrollTop);
    };

    onMounted(() => {
      scrollToStart.value = scroller.value?.scrollToStart;
      scrollToEnd.value = scroller.value?.scrollToEnd;
      scrollToIndex.value = scroller.value?.scrollToIndex;
      scrollToNode.value = scroller.value?.scrollToNode;
      refreshView.value = scroller.value?.refreshView;
    });

    return {
      scroller,
      scrollToStart,
      scrollToEnd,
      scrollToIndex,
      scrollToNode,
      handleScroll,
      handleStartReached,
      handleEndReached,
      refreshView,
    };
  },
});
</script>

<style></style>
