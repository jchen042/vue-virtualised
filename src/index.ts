import type { DefineComponent, Plugin } from "vue";

import VirtualisedList from "@/components/VirtualisedList.vue";
import VirtualisedTree from "@/components/VirtualisedTree.vue";

// Define typescript interfaces for installable component
type InstallableComponent = DefineComponent & Plugin;

function install(): void {
  [VirtualisedList, VirtualisedTree].forEach((component) => {
    // Assign InstallableComponent type
    const installable = (component as unknown) as InstallableComponent;

    // Attach install function executed by Vue.use()
    installable.install = (Vue) => {
      Vue.component(component.name, installable);
    };
  });
}

// Create module definition for Vue.use()
const plugin = {
  install,
};

// Auto-install when vue is found (eg. in browser via <script> tag)
// https://stackoverflow.com/a/56458070/10890476
declare global {
  interface Window {
    Vue: DefineComponent;
  }
  // https://stackoverflow.com/a/42304473/10890476
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      document: Document;
      window: Window;
      navigator: Navigator;
      Vue: DefineComponent;
    }
  }
}

let GlobalVue = null;
if (typeof window !== "undefined") {
  GlobalVue = window.Vue;
} else if (typeof global !== "undefined") {
  GlobalVue = global.Vue;
}
if (GlobalVue) {
  GlobalVue.use(plugin);
}

export { VirtualisedList, VirtualisedTree };
