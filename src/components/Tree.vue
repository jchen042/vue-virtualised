<template>
  <div>
    <virtual-scroller
      v-model:scrollTop="scrollTop"
      :data="flattenedTree"
      :viewport-height="400"
      :tolerance="2"
      :get-node-height="getNodeHeight"
      @toggle-child-nodes="onToggleChildNodes"
    ></virtual-scroller>
  </div>
</template>

<script>
import { defineComponent, toRefs, ref, computed, watch } from "vue";
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
  emits: ["update:nodes"],
  setup(props, { emit }) {
    const nodes = computed({
      get: () => props.nodes,
      set: (value) => emit("update:nodes", value),
    });
    console.log(nodes);

    const traverse = (obj, cb) => {
      for (let k in obj) {
        if (obj[k] && Array.isArray(obj[k])) {
          obj[k].forEach((el) => traverse(el, cb));
        }
      }
      cb(obj);
    };

    const isNodeExpanded = (node) => node.state && node.state.expanded;
    const nodeHasChildren = (node) => node.children && node.children.length;

    const getFlattenedTree = (nodes, parents = []) =>
      nodes.reduce((flattenedTree, node, index) => {
        const deepness = parents.length;
        const nodeWithHelpers = { ...node, deepness, parents, index };

        if (!nodeHasChildren(node) || !isNodeExpanded(node)) {
          return [
            ...flattenedTree,
            { ...nodeWithHelpers, isLeaf: !nodeHasChildren(node) },
          ];
        }

        return [
          ...flattenedTree,
          nodeWithHelpers,
          ...getFlattenedTree(node.children, [...parents, index]),
        ];
      }, []);

    const flattenedTree = ref(getFlattenedTree(nodes.value));
    console.log(flattenedTree);

    const onToggleChildNodes = (node) => {
      // console.log("toggle", node);
      let parentNodes = nodes.value;
      node.parents.forEach((index) => {
        // console.log(index);
        parentNodes = parentNodes[index].children;
        // console.log(parentNodes);
      });
      // console.log(parentNodes[node.index]);
      parentNodes[node.index].state.expanded = !parentNodes[node.index].state
        .expanded;

      console.log(nodes);
      flattenedTree.value = getFlattenedTree(nodes.value);
    };

    // watch(
    //   () => nodes.value,
    //   () => {
    //     console.log("node change");
    //     flattenedTree.value = getFlattenedTree(nodes.value);
    //   }
    //   // { deep: true }
    // );

    const scrollTop = ref(900);

    return { scrollTop, flattenedTree, onToggleChildNodes };
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
