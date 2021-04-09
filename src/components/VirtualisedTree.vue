<template>
  <suspense>
    <virtualised-base-tree
      ref="virtualisedBaseTree"
      :key="key"
      :nodes="nodes"
      :use-time-slicing="useTimeSlicing"
      :on-change="onChange"
      :viewport-height="viewportHeight"
      :initial-scroll-top="initialScrollTop"
      :initial-scroll-index="initialScrollIndex"
      :scroll-behaviour="scrollBehaviour"
      :tolerance="tolerance"
      :get-node-height="getNodeHeight"
      :get-node-key="getNodeKey"
      :cell-renderer="cellRenderer"
      @on-scroll="handleScroll"
      @on-start-reached="handleStartReached"
      @on-end-reached="handleEndReached"
      @force-update="forceUpdate"
      @render-complete="renderComplete"
    >
      <template #cell="slotProps">
        <slot
          name="cell"
          :node="slotProps.node"
          :index="slotProps.index"
        ></slot>
      </template>
    </virtualised-base-tree>
    <template #fallback>
      <slot name="fallback"></slot>
    </template>
  </suspense>
</template>

<script lang="ts">
import {
  defineComponent,
  defineAsyncComponent,
  PropType,
  ref,
  watch,
  nextTick,
} from "vue";
import VirtualisedBaseTree from "./Base/VirtualisedBaseTree.vue";

import {
  Node,
  OnChangeCallback,
  GetNodeHeight,
  GetNodeKey,
  CellRenderer,
  ConditionCallback,
} from "../types/types";
import { NodeModel, UpdateFunction, RemoveFunction } from "../types/interfaces";

export default defineComponent({
  name: "VirtualisedTree",
  components: { VirtualisedBaseTree },
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
  setup(props, { emit }) {
    const virtualisedBaseTree = ref<typeof VirtualisedBaseTree | null>(null);
    const key = ref<number>(0);
    const updateNode = ref<UpdateFunction | null>(null);
    const updateNodes = ref<UpdateFunction | null>(null);
    const removeNode = ref<RemoveFunction | null>(null);
    const getScrollTop = ref<(() => number) | null>(null);
    const scrollTop = ref<number>(props.initialScrollTop);
    const scrollToStart = ref<(() => void) | null>(null);
    const scrollToEnd = ref<(() => void) | null>(null);
    const scrollToHeight = ref<
      // eslint-disable-next-line no-unused-vars, no-undef
      ((height: number, behaviour?: ScrollBehavior) => void) | null
    >(null);
    // eslint-disable-next-line no-unused-vars
    const scrollToIndex = ref<((index: number) => void) | null>(null);
    const scrollToNode = ref<
      // eslint-disable-next-line no-unused-vars
      ((conditionCallback: ConditionCallback) => void) | null
    >(null);

    let isForcedUpdate = false;

    const handleScroll = (scrollTop: number): void => {
      emit("onScroll", scrollTop);
    };

    const handleStartReached = (scrollTop: number): void => {
      emit("onStartReached", scrollTop);
    };

    const handleEndReached = (scrollTop: number): void => {
      emit("onEndReached", scrollTop);
    };

    const forceUpdate = async (): Promise<void> => {
      isForcedUpdate = true;
      scrollTop.value = getScrollTop.value ? getScrollTop.value() : 0;
      key.value++;
    };

    const renderComplete = (): void => {
      isForcedUpdate && scrollToHeight.value
        ? scrollToHeight.value(scrollTop.value, "auto")
        : null;
      isForcedUpdate = false;
    };

    watch(
      () => virtualisedBaseTree.value,
      () => {
        updateNode.value = virtualisedBaseTree.value?.updateNode;
        updateNodes.value = virtualisedBaseTree.value?.updateNodes;
        removeNode.value = virtualisedBaseTree.value?.removeNode;
        getScrollTop.value = virtualisedBaseTree.value?.getScrollTop;
        scrollToStart.value = virtualisedBaseTree.value?.scrollToStart;
        scrollToEnd.value = virtualisedBaseTree.value?.scrollToEnd;
        scrollToHeight.value = virtualisedBaseTree.value?.scrollToHeight;
        scrollToIndex.value = virtualisedBaseTree.value?.scrollToIndex;
        scrollToNode.value = virtualisedBaseTree.value?.scrollToNode;
      }
    );

    return {
      virtualisedBaseTree,
      key,
      updateNode,
      updateNodes,
      removeNode,
      scrollToStart,
      scrollToEnd,
      scrollToHeight,
      scrollToIndex,
      scrollToNode,
      handleScroll,
      handleStartReached,
      handleEndReached,
      forceUpdate,
      renderComplete,
    };
  },
});
</script>

<style></style>
