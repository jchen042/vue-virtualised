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
  isProxy,
  isReactive,
  markRaw,
  onMounted,
  computed,
  watch,
  h,
} from "vue";
import VirtualScroller from "./VirtualScroller.vue";

import {
  nodeHasChildren,
  isNodeExpanded,
  constructBfsTraverseStack,
} from "../utils/nodesHelper";
import NodesTraversalWorker from "../utils/worker/nodesTraversal.worker";
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
    // const { nodes, onChange } = toRefs(props);
    // NO REACTIVE
    // eslint-disable-next-line vue/no-setup-props-destructure
    const { nodes, onChange } = props;

    const virtualScroller = ref(null);

    // const traverse = (obj, cb) => {
    //   for (let k in obj) {
    //     if (obj[k] && Array.isArray(obj[k])) {
    //       obj[k].forEach((el) => traverse(el, cb));
    //     }
    //   }
    //   cb(obj);
    // };

    /**
     * use iteration to flatten tree structure to one dimension for virtualised list
     * use recursive method might cause stack overflow exception
     */
    const traverse = (nodes, parents = [], cb, shouldTraverse) => {
      let stack = constructBfsTraverseStack(nodes, parents);

      while (stack.length > 0) {
        const node = stack.shift();
        cb(node);
        if (shouldTraverse(node)) {
          stack = constructBfsTraverseStack(
            node.children,
            //[...node.parents, node.index],
            node.parents.concat(node.index),
            stack
          );
        }
      }
    };

    const getFlattenedTree = (nodes, parents = []) => {
      /**
       * reactive object makes the iteration time-consuming
       * to avoid expensive traversal, we have to markRaw object
       */
      const flattenedTree = markRaw([]);

      // make sure node pushed to the flattened tree is not reactive
      const addNodeToFlattenedTree = (node) =>
        flattenedTree.push(markRaw(node));

      const shouldTraverse = (node) =>
        nodeHasChildren(node) && isNodeExpanded(node);

      traverse(nodes, parents, addNodeToFlattenedTree, shouldTraverse);

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
    const flattenedTree = markRaw(getFlattenedTree(nodes));
    console.log("iteration", flattenedTree);

    const updateTreeNode = (nodes, path, updateFn) => {
      // traverse tree by path to get target node to update
      let parentNodes = nodes;
      // path.slice(0, path.length - 1).forEach((i) => {
      //   parentNodes = parentNodes[i].children;
      // });
      const size = path.length - 1;
      for (let i = 0; i < size; i++)
        parentNodes = parentNodes[path[i]].children;

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
      // onChange.value(nodes);
      onChange(nodes);

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

    const _updateNodes = async (nodes, node, pathsList, index, updateFn) => {
      const sleep = (time) => new Promise((rs) => setTimeout(() => rs(), time));

      // console.log(pathsList);
      console.log("_updateNodes:before", performance.now());

      /**
       * this iteration will not only update props tree nodes
       * but also affect all descendant nodes of the current node in the view
       * because these descendant nodes are passed by references
       * also, to improve performance, avoid using forEach
       * pathsList.forEach((path) => updateTreeNode(nodes, path, updateFn));
       */
      // for (let i = 0; i < pathsList.length; i++)
      //   updateTreeNode(nodes, pathsList[i], updateFn);
      const arraySize = pathsList.length;
      const chunkSize = 100000;
      const chunkNumb = Math.floor(arraySize / chunkSize);
      console.log("_for:before", performance.now(), arraySize, chunkNumb);
      for (let c = 0; c < chunkNumb; c++) {
        for (let i = 0; i < chunkSize; i++) {
          const index = c * chunkSize + i;
          if (!index < arraySize - 1) break;
          updateTreeNode(nodes, pathsList[index], updateFn);
        }
        console.log("_for:body", performance.now(), c);
        await sleep(60);
      }
      console.log("_for:after", performance.now());

      // onChange.value(nodes);
      onChange(nodes);

      // udpate flattened Tree nodes
      const updatedNode = updateFn(node);
      if (isNodeExpanded(updatedNode)) {
        collapseNodes(node, index, flattenedTree);
        expandNodes(updatedNode, index, flattenedTree);
      }

      flattenedTree[index] = updatedNode;

      // force refresh data in child component to trigger UI update
      virtualScroller.value.refreshView();
      console.log("updateNodes:after", performance.now());
    };

    const updateNodes = (nodes, node, index, updateFn) => {
      console.log("updateNodes:before", performance.now());
      // update tree nodes
      // eslint-disable-next-line no-constant-condition
      if (window.Worker && false) {
        const nodesTraversalWorker = new NodesTraversalWorker();
        console.log("postMessage:before", performance.now());
        nodesTraversalWorker.postMessage({
          nodes: [...node.children],
          parents: [...node.parents, node.index],
          shouldTraverseInvisibleNodes: true,
        });
        console.log("postMessage:after", performance.now());
        nodesTraversalWorker.onmessage = (e) => {
          console.log("onMessage:before", performance.now());
          // console.log(e);
          let { pathsList } = e.data;
          pathsList = [[...node.parents, node.index], ...pathsList];

          _updateNodes(nodes, node, pathsList, index, updateFn);
        };
      } else {
        let pathsList = [[...node.parents, node.index]];
        // avoid creating multiple anonymous functions inside traverse()
        const addNodeToPathsList = (node) =>
          pathsList.push(node.parents.concat(node.index));

        const shouldTraverse = () => true;

        traverse(
          [...node.children],
          [...node.parents, node.index],
          addNodeToPathsList,
          shouldTraverse
        );

        _updateNodes(nodes, node, pathsList, index, updateFn);
      }
    };

    const initialScrollIndex = ref(0);

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
