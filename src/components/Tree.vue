<template>
  <virtual-scroller
    ref="virtualScroller"
    :data="flattenedTree"
    :viewport-height="viewportHeight"
    :initial-scroll-top="initialScrollTop"
    :tolerance="2"
    :get-node-height="getNodeHeight"
    :cell-renderer="cellRenderer"
  ></virtual-scroller>
</template>

<script>
import {
  defineComponent,
  toRefs,
  ref,
  reactive,
  computed,
  watch,
  h,
} from "vue";
import VirtualScroller from "./VirtualScroller.vue";

import { chunk } from "lodash";

export default defineComponent({
  name: "Tree",
  components: { VirtualScroller },
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
  },
  emits: ["update:nodes"],
  setup(props, { emit }) {
    const nodes = computed({
      get: () => props.nodes,
      set: (value) => emit("update:nodes", value),
    });
    console.log(nodes);

    const virtualScroller = ref(null);

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
    // TODO: handle non-exist properties
    // TODO: extract traverse function
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

    /**
     * avoid to use reactive() to make flattenedTree reactive will cause performance issue
     * because it triggered multiple get() and set() when Vue detecting data changes
     * it's expensive to apply reactive attribute for large array
     * instead, we force refreshing Virtual Scroller view when updating nodes
     * as it contains limited amount of visible nodes so it's much faster
     */
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

    const updateTreeNodes = (nodes, node, updateFn, broadcast = false) => {
      // traverse tree by path to get target node to update
      let parentNodes = nodes;
      node.parents.forEach((i) => {
        parentNodes = parentNodes[i].children;
      });
      // the node referred from the tree will be updated
      parentNodes[node.index] = updateFn(node);
      console.log(nodes);
    };

    // update nodes
    const updateNodes = (nodes, node, index, updateFn, broadcast = false) => {
      console.log(node, index);

      updateTreeNodes(nodes, node, updateFn, broadcast);

      /**
       * operation is expensive if we call this method to update all flattened tree list:
       * flattenedTree = getFlattenedTree(nodes);
       * instead, we only update affected area in the list
       */
      const updatedNode = updateFn(node);

      if (changeAffectFlattenedTree(node, updatedNode)) {
        if (isNodeExpanded(updatedNode)) {
          // expand node by inserting node's visible descendants to flattened tree
          const visibleDescendants = getFlattenedTree(
            [...updatedNode.children],
            [...updatedNode.parents, updatedNode.index]
          );
          console.log(visibleDescendants);
          /**
           * hack: chunk large array into small sub arrays and run splice() method for each
           * to avoid RangeError: Maximum call stack size exceeded exception
           * this exception is due to the limitation of JS engine
           */
          const chunkedVisibleDescendants = chunk(visibleDescendants, 50000);
          let i = index + 1;
          chunkedVisibleDescendants.forEach((nodes) => {
            flattenedTree.splice(i, 0, ...nodes);
            i = i + nodes.length;
          });
        } else {
          // collapse node by removing current node's descendants from flattened tree
          const numberOfVisibleDescendants = getNumberOfVisibleDescendants(
            node,
            index,
            flattenedTree
          );
          flattenedTree.splice(index + 1, numberOfVisibleDescendants);
        }
      }

      flattenedTree[index] = updatedNode;
      // console.log(flattenedTree);

      // force refresh data in child component to trigger UI update
      virtualScroller.value.refreshView();
    };

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
                updateNodes(nodes.value, node, index, (node) => ({
                  ...node,
                  state: { ...node.state, expanded: !node.state.expanded },
                })),
            },
            node.isLeaf ? "" : node.state.expanded ? "-" : "+"
          ),
          node.name,
        ]
      ),
    ];

    return {
      // handleScroll,
      virtualScroller,
      flattenedTree,
      cellRenderer,
    };
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
