export const nodeHasChildren = (node) => node.children && node.children.length;

export const isNodeExpanded = (node) => node.state && node.state.expanded;
