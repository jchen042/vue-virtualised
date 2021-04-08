/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */

import { Node } from "./types";

export interface NodeStateModel {
  expanded: boolean;
  isLeaf: boolean;
}

export interface NodeModel {
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

export interface UpdateFunction {
  (
    nodes: Array<Node>,
    node: NodeModel,
    index: number,
    updateFn: UpdateNodeCallback
  ): Promise<void>;
}

export interface RemoveFunction {
  (nodes: Array<Node>, path: Array<number>): void;
}
