<template>
  <div>
    <img alt="Vue logo" src="./assets/logo.png" />
    <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
    <!-- <virtual-scroller
      v-model:scrollTop="scrollTop"
      :data="data"
      :viewport-height="200"
      :tolerance="2"
      :get-node-height="getNodeHeight"
    ></virtual-scroller> -->
    <tree :nodes="nodes"></tree>
  </div>
</template>

<script>
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
  data() {
    return {
      data: Array.from({ length: 100000 }, (_, i) => ({
        index: i,
        label: i + 1,
      })),
      scrollTop: 300,
      getNodeHeight: (node) => 30 + (node.index % 10),
      nodes: this.constructTree(4, 30, 500),
    };
  },
  methods: {
    constructTree(
      maxDeepness,
      maxNumberOfChildren,
      minNumOfNodes,
      deepness = 1
    ) {
      return new Array(minNumOfNodes).fill(deepness).map((si, i) => {
        const id = i;
        const numberOfChildren =
          deepness === maxDeepness
            ? 0
            : Math.round(Math.random() * maxNumberOfChildren);

        return {
          id,
          name: `Leaf ${id}`,
          children: numberOfChildren
            ? this.constructTree(
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
    },
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
