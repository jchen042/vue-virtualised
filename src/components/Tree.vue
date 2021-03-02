<template>
  <virtual-scroller
    ref="virtualScroller"
    :data="flattenedTree"
    :viewport-height="viewportHeight"
    :initial-scroll-top="initialScrollTop"
    :initial-scroll-index="initialScrollIndex"
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
  unref,
  onMounted,
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
    onChange: { type: Function, default: (nodes) => {} },
    viewportHeight: {
      type: Number,
      default: () => 400,
    },
    initialScrollTop: {
      type: Number,
      default: () => 0,
    },
    cellRenderer: {
      type: Function,
      default: (node, index) => [h("div", {}, node.name)],
    },
  },
  emits: [],
  setup(props, { emit }) {
    const { nodes, onChange } = toRefs(props);
    console.log(nodes);

    const virtualScroller = ref(null);

    // const traverse = (obj, cb) => {
    //   for (let k in obj) {
    //     if (obj[k] && Array.isArray(obj[k])) {
    //       obj[k].forEach((el) => traverse(el, cb));
    //     }
    //   }
    //   cb(obj);
    // };

    const nodeHasChildren = (node) => node.children && node.children.length;

    const isNodeExpanded = (node) => node.state && node.state.expanded;

    /**
     * use iteration to flatten tree structure to one dimension for virtualised list
     * use recursive method might cause stack overflow exception
     */
    const traverse = (nodes, parents = [], cb, shouldTraverse) => {
      let stack = nodes.map((node, index) => ({
        ...node,
        key: node.key
          ? node.key
          : crypto.getRandomValues(new Uint32Array(2)).join(""),
        index,
        parents,
        state: {
          ...node.state,
          expanded: !!(node.state && node.state.expanded),
          isLeaf: !nodeHasChildren(node),
        },
      }));

      while (stack.length > 0) {
        const node = stack.shift();
        cb(node);
        if (shouldTraverse(node)) {
          stack = [
            ...node.children.map((n, index) => ({
              ...n,
              key: n.key
                ? n.key
                : crypto.getRandomValues(new Uint32Array(2)).join(""),
              index,
              parents: [...node.parents, node.index],
              state: {
                ...n.state,
                expanded: !!(n.state && n.state.expanded),
                isLeaf: !nodeHasChildren(n),
              },
            })),
            ...stack,
          ];
        }
      }
    };

    const getFlattenedTree = (nodes, parents = []) => {
      const flattenedTree = [];

      traverse(
        nodes,
        parents,
        (node) => {
          flattenedTree.push(node);
        },
        (node) => nodeHasChildren(node) && isNodeExpanded(node)
      );

      return flattenedTree;
    };

    /**
     * avoid to use reactive() to make flattenedTree reactive
     * because it will cause performance issue
     * as it triggered multiple get() and set() when Vue detecting data changes
     * so it's expensive to apply reactive attribute for large array
     * instead, we force refreshing Virtual Scroller view when updating nodes
     * as it contains limited amount of visible nodes so it's much faster
     */
    const flattenedTree = getFlattenedTree(nodes.value);
    console.log("iteration", flattenedTree);

    const updateTreeNode = (nodes, path, updateFn) => {
      // traverse tree by path to get target node to update
      let parentNodes = nodes;
      path.slice(0, path.length - 1).forEach((i) => {
        parentNodes = parentNodes[i].children;
      });

      /**
       * the node referred from the tree will be updated
       */
      parentNodes[path[path.length - 1]] = updateFn(
        parentNodes[path[path.length - 1]]
      );
      // console.log(nodes);
    };

    const changeAffectFlattenedTree = (node, updatedNode) => {
      return isNodeExpanded(node) !== isNodeExpanded(updatedNode);
    };

    // count the amount of visible descendants based on the node
    const getNumberOfVisibleDescendants = (node, index, flattenedTree) => {
      const nodePath = [...node.parents, node.index];
      let count = 0;

      for (let i = index + 1; i < flattenedTree.length; i++) {
        const parents = [...flattenedTree[i].parents];
        if (
          parents.slice(0, nodePath.length).toString() !== nodePath.toString()
        )
          break;
        else count++;
      }

      return count;
    };

    const expandNodes = (updatedNode, index, flattenedTree) => {
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
    };

    const collapseNodes = (node, index, flattenedTree) => {
      // collapse node by removing current node's descendants from flattened tree
      const numberOfVisibleDescendants = getNumberOfVisibleDescendants(
        node,
        index,
        flattenedTree
      );
      flattenedTree.splice(index + 1, numberOfVisibleDescendants);
    };

    // update single node
    const updateNode = (nodes, node, index, updateFn) => {
      console.log(node, index);

      updateTreeNode(nodes, [...node.parents, node.index], updateFn);
      onChange.value(nodes);

      /**
       * operation is expensive if we call this method to update all flattened tree list:
       * flattenedTree = getFlattenedTree(nodes);
       * instead, we only update affected area in the list
       */
      const updatedNode = updateFn(node);

      if (changeAffectFlattenedTree(node, updatedNode)) {
        if (isNodeExpanded(updatedNode)) {
          expandNodes(updatedNode, index, flattenedTree);
        } else {
          collapseNodes(node, index, flattenedTree);
        }
      }

      flattenedTree[index] = updatedNode;
      // console.log(flattenedTree);

      // force refresh data in child component to trigger UI update
      virtualScroller.value.refreshView();
    };

    const updateNodes = (nodes, node, index, updateFn) => {
      // update tree nodes
      let pathsList = [[...node.parents, node.index]];
      traverse(
        [...node.children],
        [...node.parents, node.index],
        (n) => {
          pathsList.push([...n.parents, n.index]);
        },
        () => true
      );
      console.log(pathsList);

      /**
       * this iteration will not only update props tree nodes
       * but also affect all descendant nodes of the current node in the view
       * because these descendant nodes are passed by references
       */
      pathsList.forEach((path) => updateTreeNode(nodes, path, updateFn));
      onChange.value(nodes);

      // udpate flattened Tree nodes
      const updatedNode = updateFn(node);
      if (isNodeExpanded(updatedNode)) {
        collapseNodes(node, index, flattenedTree);
        expandNodes(updatedNode, index, flattenedTree);
      }

      flattenedTree[index] = updatedNode;

      // force refresh data in child component to trigger UI update
      virtualScroller.value.refreshView();
    };

    const initialScrollIndex = ref(20);

    return {
      // handleScroll,
      virtualScroller,
      flattenedTree,
      updateNode,
      updateNodes,
      initialScrollIndex,
    };
  },
  data() {
    return {
      getNodeHeight: (node) => 30 + (node.index % 10),
    };
  },
});
</script>

<style></style>
