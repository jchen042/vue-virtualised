<script>
import { defineComponent, h } from "vue";

import invariant from "fbjs/lib/invariant";

export default defineComponent({
  name: "VirtualisedBaseCell",
  props: {
    node: { type: [Object, String, Number], required: true },
    index: { type: Number, required: true },
    startIndex: { type: Number, default: () => 0, required: true },
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
    invariant(
      typeof props.cellRenderer === "function",
      `cellRenderer ${props.cellRenderer} is not a function`
    );

    return () =>
      h(
        "div",
        {
          style: { height: "100%" },
        },
        props.cellRenderer(props.node, props.index + props.startIndex) ?? [
          slots?.cell({
            node: props.node,
            index: props.index + props.startIndex,
          }),
        ]
      );
  },
});
</script>
