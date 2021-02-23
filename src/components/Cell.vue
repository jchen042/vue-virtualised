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
    cellRenderer: {
      type: Function,
      default: (node, index) => [h("div", {}, node.name)],
    },
  },
  emits: ["toggleChildNodes"],
  setup(props) {
    return () =>
      props.visibleNodes.map((node, index) =>
        h(
          "div",
          { key: index, style: { height: `${props.getNodeHeight(node)}px` } },
          props.cellRenderer(node, index + props.startIndex)
        )
      );
  },
};
</script>
