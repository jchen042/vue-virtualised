/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */

import { VNode, VNodeArrayChildren } from "vue";

export type NodeState = {
  expanded?: boolean;
  isLeaf?: boolean;
  [key: string]: any;
};

export type Node = {
  key?: string | number;
  name: string | number;
  state?: NodeState;
  children?: Array<Node>;
  [key: string]: any;
};

export type GetNodeHeight = (node: any) => number;

export type GetNodeKey = (node: any, index: number) => string | number;

export type CellRenderer = (
  node: any,
  index: number
) => string | number | boolean | VNode | VNodeArrayChildren;

export type ConditionCallback = (node: any) => boolean;

export type OnChangeCallback = (nodes: Array<Node>) => void;
