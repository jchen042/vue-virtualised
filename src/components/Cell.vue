<script>
import { h } from "vue";

export default {
  name: "Cell",
  props: {
    visibleNodes: { type: Array, default: () => [] },
    getNodeHeight: {
      type: Function,
      default: () => 40,
    },
    getNodeName: { type: Function, default: (node) => node.name },
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
          props.cellRenderer(node, index, { name: props.getNodeName(node) })
        )
      );
  },
};
</script>
