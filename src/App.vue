<template>
  <div>
    <img alt="Vue logo" src="./assets/logo.png" />
    <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
    <virtual-scroller
      v-model:scrollTop="scrollTop"
      :data="data"
      :viewport-height="200"
      :tolerance="2"
      :get-node-height="getNodeHeight"
    ></virtual-scroller>
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import VirtualScroller from "./components/VirtualScroller.vue";

export default {
  name: "App",
  components: {
    HelloWorld,
    VirtualScroller,
  },
  data() {
    return {
      data: Array.from({ length: 100000 }, (_, i) => ({
        index: i,
        label: i + 1,
      })),
      scrollTop: 300,
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
