<script>
import { h } from "vue";

export default {
  name: "VirtualisedBaseCell",
  props: {
    node: { type: Object, default: () => null },
    index: { type: Number, default: () => 0 },
    startIndex: { type: Number, default: () => 0 },
    /**
     * Takes an item from data and renders it into the list.
     */
    cellRenderer: {
      type: Function,
      default: (node, index) => [h("div", { key: index }, node.name ?? node)],
      required: true,
    },
  },
  emits: [],
  setup(props) {
    return () =>
      h(
        "div",
        {
          style: { height: "100%" },
        },
        props.cellRenderer(props.node, props.index + props.startIndex)
      );
  },
};
</script>
