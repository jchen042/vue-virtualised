import { isNodeExpanded, nodeHasChildren } from "../nodesHelper";

/**
 * build a named function for traverse() method to leverage
 * to avoid creating multiple anonymous functions
 * which is expensive
 */
const constructBfsTraverseStack = (nodes, parents = [], stack = []) => {
  let _nodes = stack;

  // NO MAP AND ARROW
  for (let index = nodes.length - 1; index >= 0; index--) {
    const node = nodes[index];

    // NO SPREAD
    // ...node,
    node.key = node.key ? node.key : parents.concat(index).toString(); //[...parents, index].toString()
    node.parents = parents;
    node.index = index;
    // NO SPREAD
    // ...node.state,
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
const traverse = (nodes, shouldTraverseInvisibleNodes, parents = []) => {
  let stack = constructBfsTraverseStack(nodes, parents);
  let pathsList = [];

  while (stack.length > 0) {
    const node = stack.shift();
    pathsList.push(node.parents.concat(node.index));
    if (
      shouldTraverseInvisibleNodes ||
      (nodeHasChildren(node) && isNodeExpanded(node))
    ) {
      stack = constructBfsTraverseStack(
        node.children,
        //[...node.parents, node.index],
        node.parents.concat(node.index),
        stack
      );
    }
  }

  return pathsList;
};

onmessage = (e) => {
  console.log("message received", e.data);
  const { nodes, shouldTraverseInvisibleNodes, parents } = e.data;
  const parentsList = traverse(nodes, shouldTraverseInvisibleNodes, parents);
  postMessage(parentsList);
  close();
};
