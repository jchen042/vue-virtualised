import type { App } from "vue";

import VirtualisedList from "@/components/VirtualisedList.vue";
import VirtualisedTree from "@/components/VirtualisedTree.vue";

const components = [VirtualisedList, VirtualisedTree];

// Vue 3 doesn't have class method Vue.use() anymore. Instead, it uses instance method app.use().
const install = (app: App): void => {
  components.forEach((component) => app.component(component.name, component));
};

export default { install };

export { VirtualisedList, VirtualisedTree };

export {
  NodeState,
  Node,
  GetNodeHeight,
  GetNodeKey,
  CellRenderer,
  ConditionCallback,
  OnChangeCallback,
} from "@/types/types";

export {
  NodeStateModel,
  NodeModel,
  UpdateNodeCallback,
  CreateFunction,
  UpdateFunction,
  RemoveFunction,
} from "@/types/interfaces";
