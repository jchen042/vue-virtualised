export const constructRandomTree = (
  maxDeepness,
  maxNumberOfChildren,
  minNumOfNodes,
  deepness = 1
) => {
  return new Array(minNumOfNodes).fill(deepness).map((value, i) => {
    const id = i;
    const numberOfChildren =
      deepness === maxDeepness
        ? 0
        : Math.round(Math.random() * maxNumberOfChildren);

    return {
      id,
      name: `Leaf ${i}`,
      children: numberOfChildren
        ? constructRandomTree(
            maxDeepness,
            maxNumberOfChildren,
            numberOfChildren,
            deepness + 1
          )
        : [],
      state: {
        expanded: numberOfChildren ? Boolean(Math.round(Math.random())) : false,
        // favorite: Boolean(Math.round(Math.random())),
        // deletable: Boolean(Math.round(Math.random())),
      },
    };
  });
};

export const constructFixedTree = (
  maxDeepness,
  numberOfChildren,
  numOfNodes,
  deepness = 1
) => {
  return new Array(numOfNodes).fill(deepness).map((value, i) => {
    const id = i;

    return {
      id,
      name: `Leaf ${i}`,
      children:
        deepness !== maxDeepness
          ? constructFixedTree(
              maxDeepness,
              numberOfChildren,
              numberOfChildren,
              deepness + 1
            )
          : [],
      state: {
        expanded: deepness !== maxDeepness ? Boolean(i % 3) : false,
        // favorite: Boolean(Math.round(Math.random())),
        // deletable: Boolean(Math.round(Math.random())),
      },
    };
  });
};
