// https://www.damirscorner.com/blog/posts/20200821-CreatingAVuejsComponentLibrary.html

declare module "vue-virtualised" {
  import type { DefineComponent, Plugin } from "vue";

  const VirtualisedList: DefineComponent & Plugin;
  const VirtualisedTree: DefineComponent & Plugin;

  export { VirtualisedList, VirtualisedTree };
}
