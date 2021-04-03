<template>
  <label for="components">Select a Component</label>
  <select
    ref="componentSelector"
    name="components"
    @input="onSelectedComponentChange"
  >
    <option
      v-for="(component, index) in components"
      :key="index"
      :value="component"
    >
      {{ component }}
    </option>
  </select>
  <virtualised-list
    v-if="selectedComponent === 'VirtualisedList'"
    :nodes="[1, 2, 3, 4, 5]"
  >
    <template #cell="slotProps">
      {{ slotProps.node }}
    </template>
  </virtualised-list>
  <virtualised-tree
    v-if="selectedComponent === 'VirtualisedTree'"
    :nodes="[
      {
        name: 'Node 1',
        children: [{ name: 'Leaf 1' }],
        state: { expanded: true },
      },
      { name: 'Node 2' },
    ]"
  >
    <template #cell="slotProps">
      <!-- node.parents is an array that contains all parent nodes' index -->
      <div
        :style="{
          textAlign: 'left',
          marginLeft: `${slotProps.node.parents.length * 30}px`,
        }"
      >
        {{ slotProps.node.name }}
      </div>
    </template>
  </virtualised-tree>
</template>

<script>
import { ref, onMounted } from "vue";
import VirtualisedList from "../../components/VirtualisedList";
import VirtualisedTree from "../../components/VirtualisedTree";

export default {
  name: "SimpleExample",
  components: { VirtualisedList, VirtualisedTree },
  setup() {
    const componentSelector = ref(null);
    const components = ref(["VirtualisedList", "VirtualisedTree"]);
    const selectedComponent = ref(null);

    const onSelectedComponentChange = () => {
      selectedComponent.value = componentSelector.value.value;
    };

    onMounted(() => (selectedComponent.value = componentSelector.value.value));

    return {
      componentSelector,
      components,
      selectedComponent,
      onSelectedComponentChange,
    };
  },
};
</script>

<style></style>
