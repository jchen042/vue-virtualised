import { sliceTask } from "./index";

export const nodeHasChildren = (node) => node.children && node.children.length;

export const isNodeExpanded = (node) => node.state && node.state.expanded;

/**
 * build a named function for traverse() method to leverage
 * to avoid creating multiple anonymous functions
 * which is expensive
 */
const constructBfsTraverseStack = (nodes, parents = [], stack = []) => {
  let _nodes = stack;

  for (let index = nodes.length - 1; index >= 0; index--) {
    const node = nodes[index];

    node.key = node.key ? node.key : parents.concat(index).toString();
    node.parents = parents;
    node.index = index;

    node.state = node.state ? node.state : {};
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
  nodes,
  parents = [],
  cb,
  shouldTraverse,
  useTimeSlicing = true
) => {
  let stack = constructBfsTraverseStack(nodes, parents);
  let i = 1;

  while (stack.length > 0) {
    const node = stack.shift();
    cb(node);
    if (shouldTraverse(node)) {
      stack = constructBfsTraverseStack(
        node.children,
        node.parents.concat(node.index),
        stack
      );
    }
    useTimeSlicing && (await sliceTask(i++, 1000, 1));
  }
};

// count the amount of visible descendants based on the node
export const getNumberOfVisibleDescendants = async (
  node,
  index,
  flattenedTree,
  useTimeSlicing
) => {
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
