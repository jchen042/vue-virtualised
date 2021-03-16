<script>
import { h } from "vue";

export default {
  name: "Cell",
  props: {
    startIndex: { type: Number, default: () => 0 },
    visibleNodes: { type: Array, default: () => [] },
    getNodeHeight: {
      type: Function,
      default: () => 40,
    },
    /**
     * Takes an item from data and renders it into the list
     */
    cellRenderer: {
      type: Function,
      default: (node, index) => [
        h("div", {}, `${index} - ${node.name ?? node}`),
      ],
      required: true,
    },
    /**
     * A unique identifier for this list.
     * If there are multiple VirtualScroller at the same level of nesting within another VirtualScroller,
     * this key is necessary for virtualisation to work properly.
     */
    getNodeKey: {
      type: Function,
      default: (node, index) => `${index}_${node.key}`,
    },
  },
  emits: [],
  setup(props) {
    return () =>
      props.visibleNodes.map((node, index) =>
        h(
          "div",
          {
            key: props.getNodeKey(node, index),
            style: { height: `${props.getNodeHeight(node)}px` },
          },
          props.cellRenderer(node, index + props.startIndex)
        )
      );
  },
};
</script>
