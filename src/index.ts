import type { App } from "vue";

import VirtualisedList from "@/components/VirtualisedList.vue";
import VirtualisedTree from "@/components/VirtualisedTree.vue";

const components = [VirtualisedList, VirtualisedTree];

// Vue 3 doesn't have Vue.use() anymore. Instead, it has instance method app.use().
const install = (app: App): void => {
  components.forEach((component) => app.component(component.name, component));
};

export default { install };

export { VirtualisedList, VirtualisedTree };
