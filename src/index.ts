import Vue, { ComponentOptions, Plugin } from "vue";

import VirtualisedList from "@/components/VirtualisedList.vue";
import VirtualisedTree from "@/components/VirtualisedTree.vue";

// Define typescript interfaces for installable component
type InstallableComponent = ComponentOptions<typeof Vue> & Plugin;

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

install();

export { VirtualisedList, VirtualisedTree };
