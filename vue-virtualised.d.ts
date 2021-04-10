// https://www.damirscorner.com/blog/posts/20200821-CreatingAVuejsComponentLibrary.html

declare module "vue-virtualised" {
  import Vue, { ComponentOptions, Plugin } from "vue";

  const VirtualisedList: ComponentOptions<typeof Vue> & Plugin;
  const VirtualisedTree: ComponentOptions<typeof Vue> & Plugin;

  export { VirtualisedList, VirtualisedTree };
}
