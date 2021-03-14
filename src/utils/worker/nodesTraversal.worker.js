import {
  isNodeExpanded,
  nodeHasChildren,
  constructBfsTraverseStack,
} from "../nodesHelper";

/**
 * use iteration to flatten tree structure to one dimension for virtualised list
 * use recursive method might cause stack overflow exception
 */
const traverse = (nodes, shouldTraverseInvisibleNodes, parents = []) => {
  let stack = constructBfsTraverseStack(nodes, parents);
  let pathsList = [];
  let nodesList = [];

  while (stack.length > 0) {
    const node = stack.shift();
    pathsList.push(node.parents.concat(node.index));
    nodesList.push(node);
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

  return { pathsList, nodesList };
};

onmessage = (e) => {
  console.log("message received", e.data);
  const { nodes, shouldTraverseInvisibleNodes, parents } = e.data;
  const data = traverse(nodes, shouldTraverseInvisibleNodes, parents);
  postMessage(data);
  close();
};
