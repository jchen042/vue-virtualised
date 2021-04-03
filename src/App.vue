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

    const listCellRenderer = (node) => [
      h("div", { class: "cell-container list-cell-container" }, node.label),
    ];

    const treeCellRenderer = (node, index) => [
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
      initialScrollIndex: 0,
      getNodeHeight: (node) => 40 + (node.index % 10),
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

.update-button {
  position: absolute;
  right: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 5px;
  background-color: #2ea44f;
  color: hsla(0, 0%, 100%, 0.8);
  padding: 5px 16px;
  visibility: hidden;
}

.cell-container:hover {
  background-color: #f6f8fa;
}

.cell-container:hover .update-button {
  visibility: visible;
}
</style>
