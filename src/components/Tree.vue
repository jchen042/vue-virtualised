<template>
  <div>
    <virtual-scroller
      ref="virtualScroller"
      v-model:scrollTop="scrollTop"
      :data="flattenedTree"
      :viewport-height="400"
      :tolerance="2"
      :get-node-height="getNodeHeight"
      :cell-renderer="cellRenderer"
    ></virtual-scroller>
  </div>
</template>

<script>
import { defineComponent, toRefs, ref, computed, watch, h } from "vue";
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
    // const key = ref(0);
    const virtualScroller = ref(null);

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

    /**
     * use iteration to flatten tree structure to one dimension for virtualised list
     * use recursive method might cause stack overflow exception
     */
    const getFlattenedTree = (nodes, parents = []) => {
      let stack = nodes.map((node, index) => ({
        ...node,
        index,
        parents,
        isLeaf: !nodeHasChildren(node),
      }));
      const flattenedTree = [];

      while (stack.length > 0) {
        const node = stack.shift();
        flattenedTree.push(node);
        if (nodeHasChildren(node) && isNodeExpanded(node))
          stack = [
            ...node.children.map((n, index) => ({
              ...n,
              index,
              parents: [...node.parents, node.index],
              isLeaf: !nodeHasChildren(n),
            })),
            ...stack,
          ];
      }

      return flattenedTree;
    };
    const flattenedTree = getFlattenedTree(nodes.value);
    console.log("iteration", flattenedTree);

    const changeAffectFlattenedTree = (node, updatedNode) => {
      return isNodeExpanded(node) !== isNodeExpanded(updatedNode);
    };

    // count the amount of visible descendants based on the node
    const getNumberOfVisibleDescendants = (node, index, flattenedTree) => {
      const nodePath = [...node.parents, node.index];
      let count = 0;

      for (let i = index + 1; i < flattenedTree.length; i++) {
        const parents = [...flattenedTree[i].parents];
        // console.log(
        //   i,
        //   nodePath,
        //   parents,
        //   parents.slice(0, nodePath.length).toString() !== nodePath.toString()
        // );
        if (
          parents.slice(0, nodePath.length).toString() !== nodePath.toString()
        )
          break;
        else count++;
      }

      return count;
    };

    // update nodes
    const updateNodes = (nodes, node, index, updatedNode, flattenedTree) => {
      console.log(node, index);

      // traverse tree to get target node to update
      let parentNodes = nodes;
      node.parents.forEach((i) => {
        // console.log(i);
        parentNodes = parentNodes[i].children;
        // console.log(parentNodes);
      });
      // tree will be updated
      parentNodes[node.index] = updatedNode;
      console.log(nodes);

      /**
       * operation is expensive if we call this method to update all flattened tree list:
       * flattenedTree = getFlattenedTree(nodes);
       * instead, we only update affected area in the list
       */
      if (changeAffectFlattenedTree) {
        if (isNodeExpanded(updatedNode)) {
          flattenedTree.splice(
            index + 1,
            0,
            ...getFlattenedTree(
              [...updatedNode.children],
              [...updatedNode.parents, updatedNode.index]
            )
          );
        } else {
          // collapse node by removing current node's descendants from flattened tree
          const numberOfVisibleDescendants = getNumberOfVisibleDescendants(
            node,
            index,
            flattenedTree
          );
          // console.log(numberOfVisibleDescendants);
          flattenedTree.splice(index + 1, numberOfVisibleDescendants);
        }
      }

      flattenedTree[index] = updatedNode;
      // console.log(flattenedTree);
      virtualScroller.value.refreshData();
    };

    const scrollTop = ref(900);

    const cellRenderer = (node, index) => [
      h(
        "div",
        {
          style: {
            height: "100%",
            textAlign: "left",
            borderLeft: "1px solid black",
            marginLeft: `${node.parents.length * 30}px`,
          },
        },
        [
          h(
            "button",
            {
              style: { width: "20px" },
              disabled: node.isLeaf,
              onClick: () =>
                updateNodes(
                  nodes.value,
                  node,
                  index,
                  {
                    ...node,
                    state: { ...node.state, expanded: !node.state.expanded },
                  },
                  flattenedTree
                ),
            },
            node.isLeaf ? "" : node.state.expanded ? "-" : "+"
          ),
          node.name,
        ]
      ),
    ];

    return { virtualScroller, scrollTop, flattenedTree, cellRenderer };
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
