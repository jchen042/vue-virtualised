/* eslint-disable no-unused-vars */

import { VNode, VNodeArrayChildren } from "@vue/runtime-core";

export type GetNodeHeight = (node: any) => number;

export type GetNodeKey = (node: any, index: number) => string | number;

export type CellRenderer = (
  node: any,
  index: number
) => string | number | boolean | VNode | VNodeArrayChildren;
