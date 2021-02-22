<template>
  <div>
    <virtual-scroller
      v-model:scrollTop="scrollTop"
      :data="flattenedTree"
      :viewport-height="400"
      :tolerance="2"
      :get-node-height="getNodeHeight"
    ></virtual-scroller>
  </div>
</template>

<script>
import { defineComponent, toRefs, ref } from "vue";
import VirtualScroller from "./VirtualScroller.vue";

export default defineComponent({
  name: "Tree",
  components: { VirtualScroller },
  props: {
    nodes: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    const { nodes } = toRefs(props);
    console.log(nodes);

    const isNodeExpanded = (node) => node.state && node.state.expanded;
    const nodeHasChildren = (node) => node.children && node.children.length;

    const getFlattenedTree = (nodes, parents = []) =>
      nodes.reduce((flattenedTree, node) => {
        const deepness = parents.length;
        const nodeWithHelpers = { ...node, deepness, parents };

        if (!nodeHasChildren(node) || !isNodeExpanded(node)) {
          return [...flattenedTree, nodeWithHelpers];
        }

        return [
          ...flattenedTree,
          nodeWithHelpers,
          ...getFlattenedTree(node.children, [...parents, node.id]),
        ];
      }, []);

    const flattenedTree = ref(getFlattenedTree(nodes.value));
    console.log(flattenedTree);

    const scrollTop = ref(900);

    return { scrollTop, flattenedTree };
  },
  data() {
    return {
      data: Array.from({ length: 100000 }, (_, i) => ({
        index: i,
        label: i + 1,
      })),
      getNodeHeight: (node) => 30 + (node.id % 10),
    };
  },
});
</script>

<style></style>
