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

import { sleep, sliceTask } from "../utils/index";
import {
  nodeHasChildren,
  isNodeExpanded,
  constructBfsTraverseStack,
} from "../utils/nodesHelper";
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
    getNodeHeight: {
      type: Function,
      default: () => 40,
    },
    cellRenderer: {
      type: Function,
      default: (node, index) => [h("div", {}, node.name)],
    },
  },
  emits: [],
  async setup(props, { emit }) {
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
    const traverse = async (nodes, parents = [], cb, shouldTraverse) => {
      let stack = constructBfsTraverseStack(nodes, parents);
      let i = 1;

      while (stack.length > 0) {
        const node = stack.shift();
        cb(node);
        if (shouldTraverse(node)) {
          stack = constructBfsTraverseStack(
            node.children,
            node.parents.concat(node.index),
            stack
          );
        }
        window.useTimeSlicing && (await sliceTask(i++, 1000, 1));
      }
    };

    const getFlattenedTree = async (nodes, parents = []) => {
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

      await traverse(nodes, parents, addNodeToFlattenedTree, shouldTraverse);

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
    const flattenedTree = markRaw(await getFlattenedTree(nodes));

    const updateTreeNode = (nodes, path, updateFn) => {
      // traverse tree by path to get target node to update
      let parentNodes = nodes;
      const size = path.length - 1;
      for (let i = 0; i < size; i++)
        parentNodes = parentNodes[path[i]].children;

      /**
       * the node referred from the tree will be updated
       */
      parentNodes[path[path.length - 1]] = updateFn(
        parentNodes[path[path.length - 1]]
      );
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

    const expandNodes = async (updatedNode, index, flattenedTree) => {
      // expand node by inserting node's visible descendants to flattened tree
      const visibleDescendants = await getFlattenedTree(
        [...updatedNode.children],
        [...updatedNode.parents, updatedNode.index]
      );
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
    const updateNode = async (nodes, node, index, updateFn) => {
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
          await expandNodes(updatedNode, index, flattenedTree);
        } else {
          collapseNodes(node, index, flattenedTree);
        }
      }

      flattenedTree[index] = updatedNode;

      // force refresh data in child component to trigger UI update
      virtualScroller.value.refreshView();
    };

    const updateNodes = async (nodes, node, index, updateFn) => {
      // update tree nodes
      let pathsList = [[...node.parents, node.index]];
      // give functions names to avoid creating multiple anonymous functions inside traverse()
      const addNodeToPathsList = (node) =>
        pathsList.push(node.parents.concat(node.index));

      const shouldTraverse = () => true;

      await traverse(
        [...node.children],
        [...node.parents, node.index],
        addNodeToPathsList,
        shouldTraverse
      );

      /**
       * this iteration will not only update props tree nodes
       * but also affect all descendant nodes of the current node in the view
       * because these descendant nodes are passed by references
       * also, to improve performance, avoid using forEach
       * pathsList.forEach((path) => updateTreeNode(nodes, path, updateFn));
       */
      for (let i = 0; i < pathsList.length; i++) {
        updateTreeNode(nodes, pathsList[i], updateFn);
        window.useTimeSlicing && (await sliceTask(i, 1000));
      }

      onChange(nodes);

      // udpate flattened Tree nodes
      const updatedNode = updateFn(node);
      if (isNodeExpanded(updatedNode)) {
        collapseNodes(node, index, flattenedTree);
        await expandNodes(updatedNode, index, flattenedTree);
      }

      flattenedTree[index] = updatedNode;

      // force refresh data in child component to trigger UI update
      virtualScroller.value.refreshView();
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
});
</script>

<style></style>
