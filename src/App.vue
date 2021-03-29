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
          style: {
            display: "flex",
            flexDirection: "row",
            height: "100%",
            transform: "translateX(10px)",
            textAlign: "left",
          },
        },
        [
          ...node.parents.map(() =>
            h("div", {
              style: { width: "20px", borderLeft: "1px solid black" },
            })
          ),
          h(
            "div",
            {
              style: {
                display: node.state.isLeaf ? "none" : "block",
                width: "20px",
                marginLeft: "-10px",
                textAlign: "center",
              },
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
              style: {
                position: "absolute",
                right: "20px",
                fontSize: "small",
                cursor: "pointer",
              },
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
</style>
