/* eslint-disable @typescript-eslint/no-explicit-any */

import { sliceTask } from "@/utils/index";

import { Node } from "@/types/types";
import { NodeModel } from "@/types/interfaces";

export const nodeHasChildren = (node: Node | NodeModel): boolean =>
  !!(node.children && node.children.length);

export const isNodeExpanded = (node: Node | NodeModel): boolean =>
  !!(node.state && node.state.expanded);

/**
 * build a named function for traverse() method to leverage
 * to avoid creating multiple anonymous functions
 * which is expensive
 */
const constructBfsTraverseStack = (
  nodes: Array<Node | NodeModel>,
  parents: Array<number> = [],
  stack: Array<NodeModel> = []
): Array<NodeModel> => {
  const _nodes = stack;

  for (let index = nodes.length - 1; index >= 0; index--) {
    const node = <NodeModel>nodes[index];

    node.key = node.key ? node.key : parents.concat(index).toString();
    node.parents = parents;
    node.index = index;
    node.children = node.children ?? [];

    node.state = node.state ? node.state : { expanded: false, isLeaf: false };
    node.state.expanded = !!isNodeExpanded(node);
    node.state.isLeaf = !nodeHasChildren(node);

    _nodes.unshift(node);
  }

  return _nodes;
};

/**
 * use iteration to flatten tree structure to one dimension for virtualised list
 * use recursive method might cause stack overflow exception
 */
export const traverse = async (
  nodes: Array<Node | NodeModel>,
  parents: Array<number> = [],
  // eslint-disable-next-line no-unused-vars
  cb: (node: NodeModel) => any,
  // eslint-disable-next-line no-unused-vars
  shouldTraverse: (node: NodeModel) => boolean,
  useTimeSlicing = true
): Promise<void> => {
  let stack = constructBfsTraverseStack(nodes, parents);
  let i = 1;

  while (stack.length > 0) {
    const node = stack.shift();
    cb(<NodeModel>node);
    if (shouldTraverse(<NodeModel>node)) {
      stack = constructBfsTraverseStack(
        (<NodeModel>node).children ?? [],
        (<NodeModel>node).parents.concat((<NodeModel>node).index),
        stack
      );
    }

    useTimeSlicing && (await sliceTask(i++, 1000, 1));
  }
};

export const getNodePath = (node: NodeModel): Array<number> => [
  ...node.parents,
  node.index,
];

// count the amount of visible descendants based on the node
export const getNumberOfVisibleDescendants = async (
  node: NodeModel,
  index: number,
  flattenedTree: Array<NodeModel>,
  useTimeSlicing: boolean
): Promise<number> => {
  const nodePath = [...node.parents, node.index];
  let count = 0;

  for (let i = index + 1; i < flattenedTree.length; i++) {
    const parents = [...flattenedTree[i].parents];
    if (parents.slice(0, nodePath.length).toString() !== nodePath.toString())
      break;
    else count++;

    useTimeSlicing && (await sliceTask(i, 1000, 1));
  }

  return count;
};
