/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */

import { Node, NodeState } from "@/types/types";

export interface NodeStateModel extends NodeState {
  expanded: boolean;
  isLeaf: boolean;
}

export interface NodeModel extends Node {
  key: string | number;
  name: string | number;
  index: number;
  parents: Array<number>;
  state: NodeStateModel;
  children: Array<NodeModel | Node>;
}

export interface UpdateNodeCallback {
  (node: Node | NodeModel): NodeModel;
}

export interface CreateFunction {
  (nodes: Array<Node>, node: Node, path: Array<number>): void;
}

export interface UpdateFunction {
  (
    nodes: Array<Node>,
    node: NodeModel,
    index: number,
    updateFn: UpdateNodeCallback
  ): Promise<void>;
}

export interface RemoveFunction {
  (nodes: Array<Node>, path: Array<number>): Promise<void>;
}
