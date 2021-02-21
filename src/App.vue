<template>
  <div>
    <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
    <virtual-scroller :data="data"></virtual-scroller>
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import VirtualScroller from "./components/VirtualScroller.vue";

export default {
  name: "App",
  data() {
    return {
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    };
  },
  components: {
    HelloWorld,
    VirtualScroller,
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
