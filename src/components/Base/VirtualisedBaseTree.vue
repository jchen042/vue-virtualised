<template>
  <virtualised-base-scroller
    ref="scroller"
    :data="flattenedTree"
    :viewport-height="viewportHeight"
    :initial-scroll-top="initialScrollTop"
    :initial-scroll-index="initialScrollIndex"
    :scroll-behaviour="scrollBehaviour"
    :tolerance="tolerance"
    :get-node-height="getNodeHeight"
    :get-node-key="getNodeKey"
    :cell-renderer="cellRenderer"
    @onScroll="handleScroll"
    @onStartReached="handleStartReached"
    @onEndReached="handleEndReached"
  >
    <template #cell="slotProps">
      <slot name="cell" :node="slotProps.node" :index="slotProps.index"></slot>
    </template>
  </virtualised-base-scroller>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  toRefs,
  ref,
  markRaw,
  onMounted,
} from "vue";
import VirtualisedBaseScroller from "./VirtualisedBaseScroller.vue";

import { sliceTask } from "../../utils/index";
import {
  nodeHasChildren,
  isNodeExpanded,
  traverse,
  getNumberOfVisibleDescendants,
} from "../../utils/nodesHelper";
import chunk from "lodash/chunk";

import {
  Node,
  OnChangeCallback,
  GetNodeHeight,
  GetNodeKey,
  CellRenderer,
  ConditionCallback,
} from "../../types/types";

import {
  NodeModel,
  UpdateNodeCallback,
  UpdateFunction,
} from "../../types/interfaces";

export default defineComponent({
  name: "VirtualisedBaseTree",
  components: { VirtualisedBaseScroller },
  props: {
    nodes: {
      type: Array as PropType<Array<Node>>,
      required: true,
    },
    useTimeSlicing: { type: Boolean, default: () => true },
    onChange: {
      type: Function as PropType<OnChangeCallback>,
      default: () => null,
    },
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
    scrollBehaviour: {
      // eslint-disable-next-line no-undef
      type: String as PropType<ScrollBehavior>,
      default: () => "auto",
    },
    tolerance: {
      type: Number,
      default: () => 2,
    },
    getNodeHeight: {
      type: Function as PropType<GetNodeHeight>,
      default: () => 40,
    },
    getNodeKey: {
      type: Function as PropType<GetNodeKey>,
      default: (node: NodeModel, index: number) => node.key ?? index,
    },
    cellRenderer: {
      type: Function as PropType<CellRenderer>,
      default: () => null,
    },
  },
  emits: ["onScroll", "onStartReached", "onEndReached"],
  async setup(props, { emit }) {
    const { useTimeSlicing } = toRefs(props);
    // NO REACTIVE
    // eslint-disable-next-line vue/no-setup-props-destructure
    const { nodes, onChange } = props;

    const scroller = ref<typeof VirtualisedBaseScroller | null>(null);
    const scrollToStart = ref<(() => void) | null>(null);
    const scrollToEnd = ref<(() => void) | null>(null);
    // eslint-disable-next-line no-unused-vars
    const scrollToIndex = ref<((index: number) => void) | null>(null);
    const scrollToNode = ref<
      // eslint-disable-next-line no-unused-vars
      ((conditionCallback: ConditionCallback) => void) | null
    >(null);

    onMounted(() => {
      scrollToStart.value = scroller.value?.scrollToStart;
      scrollToEnd.value = scroller.value?.scrollToEnd;
      scrollToIndex.value = scroller.value?.scrollToIndex;
      scrollToNode.value = scroller.value?.scrollToNode;
    });

    const getFlattenedTree = async (
      nodes: Array<Node | NodeModel>,
      parents: Array<number> = []
    ): Promise<Array<NodeModel>> => {
      /**
       * Reactive object makes the iteration time-consuming.
       * To avoid expensive traversal, we have to markRaw object.
       */
      const flattenedTree = markRaw<Array<NodeModel>>([]);

      // Make sure node pushed to the flattened tree is not reactive.
      const addNodeToFlattenedTree = (node: NodeModel) =>
        flattenedTree.push(markRaw<NodeModel>(node));

      const shouldTraverse = (node: NodeModel): boolean =>
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
    const flattenedTree = markRaw<Array<NodeModel>>(
      await getFlattenedTree(nodes)
    );

    const updateTreeNode = (
      nodes: Array<Node>,
      path: Array<number>,
      updateFn: UpdateNodeCallback
    ): void => {
      // Traverse props tree by path to get target node to update.
      let parentNodes = nodes;
      const size = path.length - 1;
      for (let i = 0; i < size; i++)
        parentNodes = parentNodes[path[i]].children ?? [];

      /**
       * The node referred from the tree will be updated.
       */
      parentNodes[path[path.length - 1]] = updateFn(
        parentNodes[path[path.length - 1]]
      );
    };

    const changeAffectFlattenedTree = (
      node: NodeModel,
      updatedNode: NodeModel
    ): boolean => {
      return isNodeExpanded(node) !== isNodeExpanded(updatedNode);
    };

    const expandNodes = async (
      updatedNode: NodeModel,
      index: number,
      flattenedTree: Array<NodeModel>
    ): Promise<void> => {
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

    const collapseNodes = async (
      node: NodeModel,
      index: number,
      flattenedTree: Array<NodeModel>
    ): Promise<void> => {
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
    const updateNode: UpdateFunction = async (nodes, node, index, updateFn) => {
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
      scroller.value?.refreshView();
    };

    const updateNodes: UpdateFunction = async (
      nodes,
      node,
      index,
      updateFn
    ) => {
      // Update props tree nodes.
      const pathsList = [[...node.parents, node.index]];
      // Give functions names to avoid creating multiple anonymous functions inside traverse().
      const addNodeToPathsList = (node: NodeModel) =>
        pathsList.push(node.parents.concat(node.index));

      const shouldTraverse = (): boolean => true;

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
      scroller.value?.refreshView();
    };

    const handleScroll = (scrollTop: number): void => {
      emit("onScroll", scrollTop);
    };

    const handleStartReached = (scrollTop: number): void => {
      emit("onStartReached", scrollTop);
    };

    const handleEndReached = (scrollTop: number): void => {
      emit("onEndReached", scrollTop);
    };

    return {
      scroller,
      flattenedTree,
      updateNode,
      updateNodes,
      scrollToStart,
      scrollToEnd,
      scrollToIndex,
      scrollToNode,
      handleScroll,
      handleStartReached,
      handleEndReached,
    };
  },
});
</script>

<style></style>
