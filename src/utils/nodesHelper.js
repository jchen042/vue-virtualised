export const nodeHasChildren = (node) => node.children && node.children.length;

export const isNodeExpanded = (node) => node.state && node.state.expanded;

/**
 * build a named function for traverse() method to leverage
 * to avoid creating multiple anonymous functions
 * which is expensive
 */
export const constructBfsTraverseStack = (nodes, parents = [], stack = []) => {
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
