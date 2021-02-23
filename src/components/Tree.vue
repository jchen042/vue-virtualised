<template>
  <div>
    <virtual-scroller
      v-model:scrollTop="scrollTop"
      :data="flattenedTree"
      :viewport-height="400"
      :tolerance="2"
      :get-node-height="getNodeHeight"
      :cell-renderer="cellRenderer"
    ></virtual-scroller>
  </div>
</template>

<script>
import { defineComponent, toRefs, ref, computed, watch, h } from "vue";
import VirtualScroller from "./VirtualScroller.vue";

import { cloneDeep } from "lodash";

export default defineComponent({
  name: "Tree",
  components: { VirtualScroller },
  props: {
    nodes: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:nodes"],
  setup(props, { emit }) {
    const nodes = computed({
      get: () => props.nodes,
      set: (value) => emit("update:nodes", value),
    });
    console.log(nodes);

    const traverse = (obj, cb) => {
      for (let k in obj) {
        if (obj[k] && Array.isArray(obj[k])) {
          obj[k].forEach((el) => traverse(el, cb));
        }
      }
      cb(obj);
    };

    const isNodeExpanded = (node) => node.state && node.state.expanded;
    const nodeHasChildren = (node) => node.children && node.children.length;

    // flatten tree structure to one dimension for virtualised list
    const getFlattenedTree = (nodes, parents = []) =>
      nodes.reduce((flattenedTree, node, index) => {
        const deepness = parents.length;
        const nodeWithHelperAttributes = { ...node, deepness, parents, index };

        if (!nodeHasChildren(node) || !isNodeExpanded(node)) {
          return [
            ...flattenedTree,
            { ...nodeWithHelperAttributes, isLeaf: !nodeHasChildren(node) },
          ];
        }

        return [
          ...flattenedTree,
          nodeWithHelperAttributes,
          ...getFlattenedTree(node.children, [...parents, index]),
        ];
      }, []);

    const flattenedTree = ref(getFlattenedTree(nodes.value));
    console.log(flattenedTree);

    const changeAffectFlattenedTree = (node, updatedNode) => {
      return isNodeExpanded(node) !== isNodeExpanded(updatedNode);
    };

    const getNumberOfVisibleDescendants = (node, index, flattenedTree) => {
      const nodePath = [...node.parents, node.index];
      let count = 0;

      for (let i = index + 1; i < flattenedTree.length; i++) {
        const parents = [...flattenedTree[i].parents];
        // console.log(
        //   i,
        //   nodePath,
        //   parents,
        //   parents.slice(0, nodePath.length).toString() !== nodePath.toString()
        // );
        if (
          parents.slice(0, nodePath.length).toString() !== nodePath.toString()
        )
          break;
        else count++;
      }

      return count;
    };

    // update nodes
    const updateNodes = (nodes, node, index, updatedNode, flattenedTree) => {
      console.log(node, index);

      // traverse tree to get target node to update
      let parentNodes = nodes;
      node.parents.forEach((i) => {
        // console.log(i);
        parentNodes = parentNodes[i].children;
        // console.log(parentNodes);
      });
      // tree will be updated
      parentNodes[node.index] = updatedNode;
      console.log(nodes);

      /**
       * expensive operation if we call this method to update all flattened tree list:
       * flattenedTree = getFlattenedTree(nodes);
       * instead, we only update affected area in the list
       */
      if (changeAffectFlattenedTree) {
        if (isNodeExpanded(updatedNode)) {
          // console.log(
          //   getFlattenedTree(
          //     [...updatedNode.children],
          //     [...updatedNode.parents, updatedNode.index]
          //   )
          // );
          // flattenedTree = [
          //   ...flattenedTree.slice(0, index + 1),
          //   ...ref(
          //     getFlattenedTree(
          //       [...updatedNode.children],
          //       [...updatedNode.parents, updatedNode.index]
          //     )
          //   ).value,
          //   ...flattenedTree.slice(index + 1, flattenedTree.length),
          // ];
          // console.log(flattenedTree);
          flattenedTree.splice(
            index + 1,
            0,
            ...ref(
              getFlattenedTree(
                [...updatedNode.children],
                [...updatedNode.parents, updatedNode.index]
              )
            ).value
          );
        } else {
          // collapse node by removing current node's descendants from flattened tree
          const numberOfVisibleDescendants = getNumberOfVisibleDescendants(
            node,
            index,
            flattenedTree
          );
          // console.log(numberOfVisibleDescendants);
          flattenedTree.splice(index + 1, numberOfVisibleDescendants);
        }
      }

      flattenedTree[index] = updatedNode;
      console.log(flattenedTree);
    };

    const scrollTop = ref(900);

    const cellRenderer = (node, index) => [
      h(
        "div",
        {
          style: {
            height: "100%",
            textAlign: "left",
            borderLeft: "1px solid black",
            marginLeft: `${node.deepness * 30}px`,
          },
        },
        [
          h(
            "button",
            {
              style: { width: "20px" },
              disabled: node.isLeaf,
              onClick: () =>
                updateNodes(
                  nodes.value,
                  node,
                  index,
                  {
                    ...node,
                    state: { ...node.state, expanded: !node.state.expanded },
                  },
                  flattenedTree.value
                ),
            },
            node.isLeaf ? "" : node.state.expanded ? "-" : "+"
          ),
          node.name,
        ]
      ),
    ];

    return { scrollTop, flattenedTree, cellRenderer };
  },
  data() {
    return {
      data: Array.from({ length: 100000 }, (_, i) => ({
        index: i,
        label: i + 1,
      })),
      getNodeHeight: (node) => 30 + (node.id % 10),
    };
  },
});
</script>

<style></style>
