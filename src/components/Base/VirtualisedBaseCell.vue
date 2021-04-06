<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */

import { defineComponent, PropType, h } from "vue";

import invariant from "fbjs/lib/invariant";

import { CellRenderer } from "../../types/types";

export default defineComponent({
  name: "VirtualisedBaseCell",
  props: {
    node: { type: [Object, Number, String] as PropType<any>, required: true },
    index: { type: Number, required: true },
    startIndex: { type: Number, default: () => 0, required: true },
    /**
     * Takes an item from data and renders it into the list.
     */
    cellRenderer: {
      type: Function as PropType<CellRenderer>,
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          slots.cell!({
            node: props.node,
            index: props.index + props.startIndex,
          }),
        ]
      );
  },
});
</script>
