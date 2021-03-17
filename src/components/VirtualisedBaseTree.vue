<template>
  <virtualised-base-scroller
    ref="virtualisedBaseScroller"
    :data="flattenedTree"
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
  </virtualised-base-scroller>
</template>

<script>
import { defineComponent, toRefs, ref, markRaw, h } from "vue";
import VirtualisedBaseScroller from "./VirtualisedBaseScroller.vue";

import { sliceTask } from "../utils/index";
import {
  nodeHasChildren,
  isNodeExpanded,
  traverse,
  getNumberOfVisibleDescendants,
} from "../utils/nodesHelper";
import { chunk } from "lodash";

export default defineComponent({
  name: "VirtualisedBaseTree",
  components: { VirtualisedBaseScroller },
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
  async setup(props, { emit }) {
    const { useTimeSlicing } = toRefs(props);
    // NO REACTIVE
    // eslint-disable-next-line vue/no-setup-props-destructure
    const { nodes, onChange } = props;

    const virtualisedBaseScroller = ref(null);

    const getFlattenedTree = async (nodes, parents = []) => {
      /**
       * Reactive object makes the iteration time-consuming.
       * To avoid expensive traversal, we have to markRaw object.
       */
      const flattenedTree = markRaw([]);

      // Make sure node pushed to the flattened tree is not reactive.
      const addNodeToFlattenedTree = (node) =>
        flattenedTree.push(markRaw(node));

      const shouldTraverse = (node) =>
        nodeHasChildren(node) && isNodeExpanded(node);

      await traverse(
        nodes,
        parents,
        addNodeToFlattenedTree,
        shouldTraverse,
        useTimeSlicing.value
      );

      return flattenedTree;
    };

    /**
     * Avoid to use reactive() to make flattenedTree reactive
     * because it will cause performance issue
     * as it triggered multiple get() and set() when Vue detecting data changes
     * so it's expensive to apply reactive attribute for large array.
     * Instead, we force refreshing VirtualisedBaseScroller view when updating nodes
     * as it contains limited amount of visible nodes so it's much faster.
     */
    const flattenedTree = markRaw(await getFlattenedTree(nodes));

    const updateTreeNode = (nodes, path, updateFn) => {
      // Traverse props tree by path to get target node to update.
      let parentNodes = nodes;
      const size = path.length - 1;
      for (let i = 0; i < size; i++)
        parentNodes = parentNodes[path[i]].children;

      /**
       * The node referred from the tree will be updated.
       */
      parentNodes[path[path.length - 1]] = updateFn(
        parentNodes[path[path.length - 1]]
      );
    };

    const changeAffectFlattenedTree = (node, updatedNode) => {
      return isNodeExpanded(node) !== isNodeExpanded(updatedNode);
    };

    const expandNodes = async (updatedNode, index, flattenedTree) => {
      // Expand node by inserting node's visible descendants to flattened tree.
      const visibleDescendants = await getFlattenedTree(
        [...updatedNode.children],
        [...updatedNode.parents, updatedNode.index]
      );
      /**
       * Hack: chunk large array into small sub arrays and run splice() method for each
       * to avoid "RangeError: Maximum call stack size exceeded exception".
       * This exception is due to the arguments limitation of JS engine.
       */
      const chunkedVisibleDescendants = chunk(visibleDescendants, 50000);
      let i = index + 1;
      chunkedVisibleDescendants.forEach((nodes) => {
        flattenedTree.splice(i, 0, ...nodes);
        i = i + nodes.length;
      });
    };

    const collapseNodes = async (node, index, flattenedTree) => {
      // Collapse node by removing current node's descendants from flattened tree.
      const numberOfVisibleDescendants = await getNumberOfVisibleDescendants(
        node,
        index,
        flattenedTree,
        useTimeSlicing.value
      );
      flattenedTree.splice(index + 1, numberOfVisibleDescendants);
    };

    // Update a single node.
    const updateNode = async (nodes, node, index, updateFn) => {
      updateTreeNode(nodes, [...node.parents, node.index], updateFn);

      onChange(nodes);

      /**
       * Operation is expensive if we call this method to update the entire flattened tree list:
       * flattenedTree = getFlattenedTree(nodes);
       * Instead, we only update affected area in the list.
       */
      const updatedNode = updateFn(node);

      if (changeAffectFlattenedTree(node, updatedNode)) {
        if (isNodeExpanded(updatedNode)) {
          await expandNodes(updatedNode, index, flattenedTree);
        } else {
          await collapseNodes(node, index, flattenedTree);
        }
      }

      flattenedTree[index] = updatedNode;

      // Force refresh data in child component to trigger UI update.
      virtualisedBaseScroller.value.refreshView();
    };

    const updateNodes = async (nodes, node, index, updateFn) => {
      // Update props tree nodes.
      let pathsList = [[...node.parents, node.index]];
      // Give functions names to avoid creating multiple anonymous functions inside traverse().
      const addNodeToPathsList = (node) =>
        pathsList.push(node.parents.concat(node.index));

      const shouldTraverse = () => true;

      await traverse(
        [...node.children],
        [...node.parents, node.index],
        addNodeToPathsList,
        shouldTraverse,
        useTimeSlicing.value
      );

      /**
       * This iteration will not only update props tree nodes,
       * but also affect all descendant nodes of the current node in the view.
       * Because these descendant nodes are passed by references.
       * Also, to improve performance, avoid using forEach, like this
       * pathsList.forEach((path) => updateTreeNode(nodes, path, updateFn));
       */
      for (let i = 0; i < pathsList.length; i++) {
        updateTreeNode(nodes, pathsList[i], updateFn);
        useTimeSlicing.value && (await sliceTask(i, 1000, 1));
      }

      onChange(nodes);

      // Udpate flattened Tree nodes.
      const updatedNode = updateFn(node);
      if (isNodeExpanded(updatedNode)) {
        collapseNodes(node, index, flattenedTree);
        await expandNodes(updatedNode, index, flattenedTree);
      }

      flattenedTree[index] = updatedNode;

      // Force refresh data in child component to trigger UI update.
      virtualisedBaseScroller.value.refreshView();
    };

    const handleScroll = (scrollTop) => {
      emit("onScroll", scrollTop);
    };

    return {
      virtualisedBaseScroller,
      flattenedTree,
      updateNode,
      updateNodes,
      handleScroll,
    };
  },
});
</script>

<style></style>
