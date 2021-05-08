<template>
  <div class="app-container">
    <div class="list-container">
      <div class="title">VirtualisedList</div>
      <div>
        <button @click="scrollListToStart">Scroll To Start</button>
        <button @click="scrollListToEnd">Scroll To End</button>
        <button @click="scrollListToIndex">Scroll To Index</button>
        <input v-model="listIndex" type="number" min="0" />
        <button @click="scrollListToHeight">Scroll To Height</button>
        <input v-model="listHeight" type="number" min="0" />
      </div>
      <virtualised-list
        ref="listView"
        :nodes="data"
        :viewport-height="viewportHeight"
        :initial-scroll-top="initialScrollTop"
        :initial-scroll-index="initialScrollIndex"
        :scroll-behaviour="'auto'"
        :tolerance="2"
        :get-node-height="getNodeHeight"
        :get-node-key="(node, index) => index"
        :cell-renderer="listCellRenderer"
        @on-scroll="handleScroll"
        @on-start-reached="handleStartReached"
        @on-end-reached="handleEndReached"
      >
      </virtualised-list>
    </div>
    <div class="tree-container">
      <div class="title">VirtualisedTree</div>
      <div>
        <button @click="scrollTreeToStart">Scroll To Start</button>
        <button @click="scrollTreeToEnd">Scroll To End</button>
        <button @click="scrollTreeToIndex">Scroll To Index</button>
        <input v-model="treeIndex" type="number" min="0" />
        <button @click="scrollTreeToHeight">Scroll To Height</button>
        <input v-model="treeHeight" type="number" min="0" />
        <button @click="forceUpdate">Force Refresh</button>
      </div>
      <virtualised-tree
        ref="treeView"
        :nodes="nodes"
        :use-time-slicing="true"
        :on-change="onChange"
        :viewport-height="viewportHeight"
        :initial-scroll-top="initialScrollTop"
        :initial-scroll-index="initialScrollIndex"
        :scroll-behaviour="'smooth'"
        :tolerance="2"
        :get-node-height="getNodeHeight"
        :get-node-key="(node, index) => node.key"
        :cell-renderer="treeCellRenderer"
        @on-scroll="handleScroll"
        @on-start-reached="handleStartReached"
        @on-end-reached="handleEndReached"
      >
        <template #fallback><div>Loading tree...</div></template>
      </virtualised-tree>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, h } from "vue";
import VirtualisedList from "@/components/VirtualisedList.vue";
import VirtualisedTree from "@/components/VirtualisedTree.vue";

import { constructFixedTree } from "../../utils/mock";

import { Node } from "@/types/types";
import { NodeModel } from "@/types/interfaces";

export default defineComponent({
  name: "DemoExample",
  components: {
    VirtualisedList,
    VirtualisedTree,
  },
  setup() {
    const listView = ref<typeof VirtualisedList | null>(null);
    const treeView = ref<typeof VirtualisedTree | null>(null);

    const listIndex = ref<number>(0);
    const listHeight = ref<number>(0);

    const scrollListToStart = () => listView.value?.scrollToStart();
    const scrollListToEnd = () => listView.value?.scrollToEnd();
    const scrollListToIndex = () =>
      listView.value?.scrollToIndex(listIndex.value);
    const scrollListToHeight = () =>
      listView.value?.scrollToHeight(listHeight.value);

    const nodes = constructFixedTree(6, 15, 5);

    const onChange = (nodes: Array<Node | NodeModel>) =>
      console.log("on change", nodes);

    const listCellRenderer = (node: NodeModel) => [
      h("div", { class: "cell-container list-cell-container" }, node.label),
    ];

    const treeIndex = ref<number>(0);
    const treeHeight = ref<number>(0);

    const scrollTreeToStart = () => treeView.value?.scrollToStart();
    const scrollTreeToEnd = () => treeView.value?.scrollToEnd();
    const scrollTreeToIndex = () =>
      treeView.value?.scrollToIndex(treeIndex.value);
    const scrollTreeToHeight = () =>
      treeView.value?.scrollToHeight(treeHeight.value);

    const forceUpdate = async () => await treeView.value?.forceUpdate();

    const treeCellRenderer = (node: NodeModel, index: number) => [
      h(
        "div",
        {
          class: "cell-container tree-cell-container",
        },
        [
          ...node.parents.map(() =>
            h("div", {
              class: "vertical-divider",
            })
          ),
          h(
            "div",
            {
              style: {
                display: node.state.isLeaf ? "none" : "block",
              },
              class: "expansion-button",
              onClick: async () =>
                treeView.value
                  ? await treeView.value.updateNode(
                      nodes,
                      node,
                      index,
                      (node: NodeModel) => ({
                        ...node,
                        state: {
                          ...node.state,
                          expanded: !node.state.expanded,
                        },
                      })
                    )
                  : null,
            },
            node.state.isLeaf ? "" : node.state.expanded ? "-" : "+"
          ),
          h("div", {}, node.name),
          h("div", { class: "util-buttons" }, [
            h(
              "div",
              {
                class: "create-button",
                onClick: async () =>
                  treeView.value
                    ? await treeView.value.createNode(
                        nodes,
                        { name: "new node" },
                        [...node.parents, node.index]
                      )
                    : null,
              },
              "Create"
            ),
            h(
              "div",
              {
                class: "update-button",
                onClick: async () =>
                  treeView.value
                    ? await treeView.value.updateNodes(
                        nodes,
                        node,
                        index,
                        (node: NodeModel) => ({
                          ...node,
                          name: "current node and all descendants updated",
                        })
                      )
                    : null,
              },
              "Bulk update nodes"
            ),
            h(
              "div",
              {
                class: "delete-button",
                onClick: async () =>
                  treeView.value
                    ? await treeView.value.removeNode(nodes, [
                        ...node.parents,
                        node.index,
                      ])
                    : null,
              },
              "Delete"
            ),
          ]),
        ]
      ),
    ];

    const handleScroll = (scrollTop: number) => {
      console.log(scrollTop);
    };

    const handleStartReached = (scrollTop: number) =>
      console.log("start reached", scrollTop);

    const handleEndReached = (scrollTop: number) => {
      console.log("end reached", scrollTop);
    };

    return {
      listView,
      treeView,
      listIndex,
      listHeight,
      scrollListToStart,
      scrollListToEnd,
      scrollListToIndex,
      scrollListToHeight,
      nodes,
      onChange,
      listCellRenderer,
      treeCellRenderer,
      treeIndex,
      treeHeight,
      scrollTreeToStart,
      scrollTreeToEnd,
      scrollTreeToIndex,
      scrollTreeToHeight,
      forceUpdate,
      handleScroll,
      handleStartReached,
      handleEndReached,
    };
  },
  data() {
    return {
      data: Array.from({ length: 100000 }, (_, i) => ({
        index: i,
        label: i,
      })),
      viewportHeight: 500,
      initialScrollTop: 300,
      initialScrollIndex: 0,
      getNodeHeight: (node: NodeModel) => 40 + (node.index % 10),
    };
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.app-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.list-container {
  width: 35%;
}

.tree-container {
  width: 60%;
}

.title {
  margin: 20px;
  font-size: larger;
  font-weight: bold;
}

.cell-container {
  height: 100%;
  align-items: center;
}

.list-cell-container {
  text-align: center;
}

.tree-cell-container {
  display: flex;
  flex-direction: row;
  transform: translateX(10px);
  text-align: left;
}

.vertical-divider {
  width: 20px;
  height: 100%;
  border-left: 1px solid #eaecef;
}

.expansion-button {
  width: 20px;
  margin-left: -10px;
  text-align: center;
  cursor: pointer;
}

.util-buttons {
  position: absolute;
  right: 20px;
  display: flex;
  flex-direction: row;
  visibility: hidden;
}

.create-button {
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 5px;
  border-color: rgba(27, 31, 35, 0.15);
  background-color: #2ea44f;
  color: hsla(0, 0%, 100%, 0.8);
  padding: 5px 16px;
}

.create-button:hover {
  background-color: #2c974b;
  border-color: rgba(27, 31, 35, 0.15);
}

.update-button {
  margin-left: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 5px;
  border-color: rgba(27, 31, 35, 0.15);
  background-color: #fafbfc;
  color: #2ea44f;
  padding: 5px 16px;
  transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
  transition-property: color, background-color, border-color;
}

.update-button:hover {
  background-color: #2c974b;
  color: hsla(0, 0%, 100%, 0.8);
}

.delete-button {
  margin-left: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 5px;
  border-color: rgba(27, 31, 35, 0.15);
  background-color: #fafbfc;
  color: #d73a49;
  padding: 5px 16px;
  transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
  transition-property: color, background-color, border-color;
}

.delete-button:hover {
  color: #fff;
  background-color: #cb2431;
  border-color: rgba(27, 31, 35, 0.15);
}

.cell-container:hover {
  background-color: #f6f8fa;
}

.cell-container:hover .create-button,
.cell-container:hover .update-button,
.cell-container:hover .delete-button {
  visibility: visible;
}
</style>
