<script>
import { h } from "vue";

export default {
  name: "VirtualisedBaseCell",
  props: {
    startIndex: { type: Number, default: () => 0 },
    visibleNodes: { type: Array, default: () => [] },
    getNodeHeight: {
      type: Function,
      default: () => 40,
    },
    /**
     * Takes an item from data and renders it into the list.
     */
    cellRenderer: {
      type: Function,
      default: (node, index) => [h("div", { key: index }, node.name ?? node)],
      required: true,
    },
    /**
     * A unique identifier for this list.
     * If there are multiple VirtualisedBaseScroller at the same level of nesting within another VirtualBaseScroller,
     * this key is necessary for virtualisation to work properly.
     */
    getNodeKey: {
      type: Function,
      default: (node, index) => node.key ?? index,
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
