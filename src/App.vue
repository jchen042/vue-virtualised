<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
  <div :style="{ display: 'flex', flexDirection: 'row' }">
    <div :style="{ width: '50%' }">
      VirtualisedTree
      <virtualised-tree
        ref="treeView"
        :nodes="nodes"
        :use-time-slicing="false"
        :on-change="onChange"
        :viewport-height="viewportHeight"
        :initial-scroll-top="initialScrollTop"
        :initial-scroll-index="initialScrollIndex"
        :tolerance="2"
        :get-node-height="getNodeHeight"
        :cell-renderer="cellRenderer"
        @onScroll="handleScroll"
        @onStartReached="handleStartReached"
        @onEndReached="handleEndReached"
      >
        <template #cell="slotProps">{{ slotProps.node.name }}</template>
        <template #fallback><div>Loading tree...</div></template>
      </virtualised-tree>
    </div>
    <div :style="{ width: '50%' }">
      VirtualisedList
      <virtualised-list
        :nodes="data"
        :viewport-height="viewportHeight"
        :initial-scroll-top="initialScrollTop"
        :initial-scroll-index="initialScrollIndex"
        :tolerance="2"
        :get-node-height="getNodeHeight"
        :cell-renderer="listCellRenderer"
        @onScroll="handleScroll"
        @onStartReached="handleStartReached"
        @onEndReached="handleEndReached"
      >
        <template #cell="slotProps">{{ slotProps.node }}</template>
      </virtualised-list>
    </div>
  </div>
</template>

<script>
import { ref, h } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
import VirtualisedList from "./components/VirtualisedList";
import VirtualisedTree from "./components/VirtualisedTree";

import { constructFixedTree } from "./utils/mock";

export default {
  name: "App",
  components: {
    HelloWorld,
    VirtualisedTree,
    VirtualisedList,
  },
  setup() {
    const treeView = ref(null);

    const nodes = constructFixedTree(6, 15, 5);

    const onChange = (nodes) => console.log("on change", nodes);

    const cellRenderer = (node, index) => [
      h(
        "div",
        {
          style: {
            height: "100%",
            textAlign: "left",
            borderLeft: "1px solid black",
            marginLeft: `${node.parents.length * 30}px`,
          },
        },
        [
          h(
            "button",
            {
              style: { width: "20px" },
              disabled: node.state.isLeaf,
              onClick: async () =>
                await treeView.value.updateNode(nodes, node, index, (node) => ({
                  ...node,
                  state: { ...node.state, expanded: !node.state.expanded },
                })),
            },
            node.state.isLeaf ? "" : node.state.expanded ? "-" : "+"
          ),
          node.name,
          h(
            "button",
            {
              style: { width: "20px" },
              onClick: async () =>
                await treeView.value.updateNodes(
                  nodes,
                  node,
                  index,
                  (node) => ({
                    ...node,
                    name: "test",
                  })
                ),
            },
            "C"
          ),
        ]
      ),
      h("div", {
        style: {
          borderBottom: "1px solid black",
          marginLeft: `${node.parents.length * 30}px`,
        },
      }),
    ];

    const listCellRenderer = (node, index) => [h("div", {}, node.label)];

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
      cellRenderer,
      listCellRenderer,
      handleScroll,
      handleStartReached,
      handleEndReached,
    };
  },
  data() {
    return {
      data: Array.from({ length: 100000 }, (_, i) => ({
        index: i,
        label: i + 1,
      })),
      viewportHeight: 400,
      initialScrollTop: 300,
      initialScrollIndex: 0,
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
</style>
