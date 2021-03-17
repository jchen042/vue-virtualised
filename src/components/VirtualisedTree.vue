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
      <template #default="slotProps">
        <slot :node="slotProps.node" :index="slotProps.index"></slot>
      </template>
    </virtualised-base-tree>
    <template #fallback>
      <!-- <div>Loading...</div> -->
      <slot name="fallback"></slot>
    </template>
  </suspense>
</template>

<script>
import { defineComponent, defineAsyncComponent, h, ref, watch } from "vue";

export default defineComponent({
  name: "VirtualisedTree",
  components: {
    VirtualisedBaseTree: defineAsyncComponent(() =>
      import("./VirtualisedBaseTree.vue")
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
      default: (node, index) => [h("div", { key: index }, node.name ?? node)],
    },
  },
  emits: ["onScroll"],
  setup(props, { emit }) {
    const virtualisedBaseTree = ref(null);
    const updateNode = ref(null);
    const updateNodes = ref(null);

    const handleScroll = (scrollTop) => {
      emit("onScroll", scrollTop);
    };

    watch(
      () => virtualisedBaseTree.value,
      () => {
        updateNode.value = virtualisedBaseTree.value.updateNode;
        updateNodes.value = virtualisedBaseTree.value.updateNodes;
      }
    );

    return { virtualisedBaseTree, updateNode, updateNodes, handleScroll };
  },
});
</script>

<style></style>
