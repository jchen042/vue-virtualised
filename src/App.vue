<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
  <suspense>
    <tree
      ref="treeView"
      :nodes="nodes"
      :use-time-slicing="true"
      :on-change="onChange"
      :viewport-height="viewportHeight"
      :initial-scroll-top="initialScrollTop"
      :initial-scroll-index="initialScrollIndex"
      :tolerance="2"
      :get-node-height="getNodeHeight"
      :cell-renderer="cellRenderer"
    ></tree>
  </suspense>
</template>

<script>
import { ref, reactive, h, onMounted } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
import VirtualScroller from "./components/VirtualScroller.vue";
import Tree from "./components/Tree.vue";

export default {
  name: "App",
  components: {
    HelloWorld,
    VirtualScroller,
    Tree,
  },
  setup() {
    const constructRandomTree = (
      maxDeepness,
      maxNumberOfChildren,
      minNumOfNodes,
      deepness = 1
    ) => {
      return new Array(minNumOfNodes).fill(deepness).map((value, i) => {
        const id = i;
        const numberOfChildren =
          deepness === maxDeepness
            ? 0
            : Math.round(Math.random() * maxNumberOfChildren);

        return {
          id,
          name: `Leaf ${i}`,
          children: numberOfChildren
            ? constructRandomTree(
                maxDeepness,
                maxNumberOfChildren,
                numberOfChildren,
                deepness + 1
              )
            : [],
          state: {
            expanded: numberOfChildren
              ? Boolean(Math.round(Math.random()))
              : false,
            // favorite: Boolean(Math.round(Math.random())),
            // deletable: Boolean(Math.round(Math.random())),
          },
        };
      });
    };

    const constructFixedTree = (
      maxDeepness,
      numberOfChildren,
      numOfNodes,
      deepness = 1
    ) => {
      return new Array(numOfNodes).fill(deepness).map((value, i) => {
        const id = i;

        return {
          id,
          name: `Leaf ${i}`,
          children:
            deepness !== maxDeepness
              ? constructFixedTree(
                  maxDeepness,
                  numberOfChildren,
                  numberOfChildren,
                  deepness + 1
                )
              : [],
          state: {
            expanded: deepness !== maxDeepness ? Boolean(i % 3) : false,
            // favorite: Boolean(Math.round(Math.random())),
            // deletable: Boolean(Math.round(Math.random())),
          },
        };
      });
    };

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
              onClick: () =>
                treeView.value.updateNode(nodes, node, index, (node) => ({
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
              onClick: () =>
                treeView.value.updateNodes(nodes, node, index, (node) => ({
                  ...node,
                  name: "test",
                })),
            },
            "C"
          ),
        ]
      ),
    ];

    return { treeView, nodes, onChange, cellRenderer };
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
