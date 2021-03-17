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
      default: () => null,
    },
  },
  emits: [],
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          style: { height: "100%" },
        },
        props.cellRenderer(props.node, props.index + props.startIndex) ?? [
          slots.default({
            node: props.node,
            index: props.index + props.startIndex,
          }),
        ]
      );
  },
};
</script>
