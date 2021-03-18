<template>
  <suspense>
    <virtualised-base-tree
      ref="virtualisedBaseTree"
      :nodes="nodes"
      :use-time-slicing="useTimeSlicing"
      :on-change="onChange"
      :viewport-height="viewportHeight"
      :initial-scroll-top="initialScrollTop"
      :initial-scroll-index="initialScrollIndex"
      :tolerance="tolerance"
      :get-node-height="getNodeHeight"
      :cell-renderer="cellRenderer"
      @onScroll="handleScroll"
    >
      <template #cell="slotProps">
        <slot
          name="cell"
          :node="slotProps.node"
          :index="slotProps.index"
        ></slot>
      </template>
    </virtualised-base-tree>
    <template #fallback>
      <slot name="fallback"></slot>
    </template>
  </suspense>
</template>

<script>
import { defineComponent, defineAsyncComponent, ref, watch } from "vue";

export default defineComponent({
  name: "VirtualisedTree",
  components: {
    VirtualisedBaseTree: defineAsyncComponent(() =>
      import("./Base/VirtualisedBaseTree.vue")
    ),
  },
  props: {
    nodes: {
      type: Array,
      default: () => [],
    },
    useTimeSlicing: { type: Boolean, default: () => true },
    onChange: { type: Function, default: () => {} },
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
    const virtualisedBaseTree = ref(null);
    const updateNode = ref(null);
    const updateNodes = ref(null);
    const scrollToStart = ref(null);
    const scrollToEnd = ref(null);
    const scrollToIndex = ref(null);
    const scrollToNode = ref(null);

    const handleScroll = (scrollTop) => {
      emit("onScroll", scrollTop);
    };

    watch(
      () => virtualisedBaseTree.value,
      () => {
        updateNode.value = virtualisedBaseTree.value.updateNode;
        updateNodes.value = virtualisedBaseTree.value.updateNodes;
        scrollToStart.value = virtualisedBaseTree.value.scrollToStart;
        scrollToEnd.value = virtualisedBaseTree.value.scrollToEnd;
        scrollToIndex.value = virtualisedBaseTree.value.scrollToIndex;
        window.scrollTreeToIndex = scrollToIndex.value;
        scrollToNode.value = virtualisedBaseTree.value.scrollToNode;
        window.scrollTreeToNode = scrollToNode.value;
      }
    );

    return {
      virtualisedBaseTree,
      updateNode,
      updateNodes,
      scrollToStart,
      scrollToEnd,
      scrollToIndex,
      handleScroll,
    };
  },
});
</script>

<style></style>
