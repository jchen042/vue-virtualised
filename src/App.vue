<template>
  <div class="app-container">
    <div class="list-container">
      <div class="title">VirtualisedList</div>
      <virtualised-list
        :nodes="data"
        :viewport-height="viewportHeight"
        :initial-scroll-top="initialScrollTop"
        :initial-scroll-index="initialScrollIndex"
        :scroll-behaviour="'auto'"
        :tolerance="2"
        :get-node-height="getNodeHeight"
        :get-node-key="(node, index) => index"
        :cell-renderer="listCellRenderer"
        @onScroll="handleScroll"
        @onStartReached="handleStartReached"
        @onEndReached="handleEndReached"
      >
      </virtualised-list>
    </div>
    <div class="tree-container">
      <div class="title">VirtualisedTree</div>
      <virtualised-tree
        ref="treeView"
        :nodes="nodes"
        :use-time-slicing="false"
        :on-change="onChange"
        :viewport-height="viewportHeight"
        :initial-scroll-top="initialScrollTop"
        :initial-scroll-index="initialScrollIndex"
        :scroll-behaviour="'smooth'"
        :tolerance="2"
        :get-node-height="getNodeHeight"
        :get-node-key="(node, index) => node.key"
        :cell-renderer="treeCellRenderer"
        @onScroll="handleScroll"
        @onStartReached="handleStartReached"
        @onEndReached="handleEndReached"
      >
        <template #fallback><div>Loading tree...</div></template>
      </virtualised-tree>
    </div>
  </div>
</template>

<script>
import { ref, h } from "vue";
import VirtualisedList from "./components/VirtualisedList";
import VirtualisedTree from "./components/VirtualisedTree";

import { constructFixedTree } from "./utils/mock";

export default {
  name: "App",
  components: {
    VirtualisedTree,
    VirtualisedList,
  },
  setup() {
    const treeView = ref(null);

    const nodes = constructFixedTree(6, 15, 5);

    const onChange = (nodes) => console.log("on change", nodes);

    const listCellRenderer = (node) => [h("div", {}, node.label)];

    const treeCellRenderer = (node, index) => [
      h(
        "div",
        {
          class: "cell-container",
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
                await treeView.value.updateNode(nodes, node, index, (node) => ({
                  ...node,
                  state: { ...node.state, expanded: !node.state.expanded },
                })),
            },
            node.state.isLeaf ? "" : node.state.expanded ? "-" : "+"
          ),
          h("div", {}, node.name),
          h(
            "div",
            {
              class: "update-button",
              onClick: async () =>
                await treeView.value.updateNodes(
                  nodes,
                  node,
                  index,
                  (node) => ({
                    ...node,
                    name: "current node and all descendants updated",
                  })
                ),
            },
            "Bulk update nodes"
          ),
        ]
      ),
    ];

    const handleScroll = (scrollTop) => {
      console.log(scrollTop);
    };

    const handleStartReached = (scrollTop) =>
      console.log("start reached", scrollTop);

    const handleEndReached = (scrollTop) => {
      console.log("end reached", scrollTop);
    };

    return {
      treeView,
      nodes,
      onChange,
      listCellRenderer,
      treeCellRenderer,
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
      initialScrollIndex: 50000,
      getNodeHeight: (node) => 30 + (node.index % 10),
    };
  },
};
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
  display: flex;
  flex-direction: row;
  height: 100%;
  transform: translateX(10px);
  align-items: center;
  text-align: left;
}

.vertical-divider {
  width: 20px;
  height: 100%;
  border-left: 1px solid #2c3e50;
}

.expansion-button {
  width: 20px;
  margin-left: -10px;
  text-align: center;
  cursor: pointer;
}

.update-button {
  position: absolute;
  right: 20px;
  font-size: smaller;
  cursor: pointer;
  border: 1px solid #2c3e50;
  border-radius: 5px;
  padding: 2px;
  visibility: hidden;
}

.cell-container:hover {
  background-color: cadetblue;
}

.cell-container:hover .update-button {
  visibility: visible;
}
</style>
