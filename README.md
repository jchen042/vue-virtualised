# Vue Virtualised

> Vue components developed by [Vue.js 3.0](https://v3.vuejs.org/) for efficiently rendering large scrollable lists and hierarchical data. `vue-virtualised` is able to render and update 1 million nodes within a few seconds in front-end.

![Demo](/src/assets/demo-20200331-60fps.gif)

## Getting started

Install `vue-virtualised` using npm.

```sh
# npm
npm install vue-virtualised --save

# yarn
yarn add vue-virtualised
```

ES6 and CommonJS builds are available with each distribution.
For example:

```js
// You can import any component you want as a named export from 'vue-virtualised'. e.g.
import { VirtualisedList, VirtualisedTree } from 'vue-virtualised';

// Or you can import the component as a named export. e.g.
import { VirtualisedTree as Tree } from 'vue-virtualised';
```

## Usage

### `VirtualisedList` usage

```vue
<virtualised-list :nodes="[1, 2, 3, 4, 5]">
  <template #cell="slotProps">
    {{ slotProps.node }}
  </template>
</virtualised-list>
```

### `VirtualisedTree` usage

```vue
<virtualised-tree
  :nodes="[
    {
      name: 'Node 1',
      children: [{ name: 'Leaf 1' }],
      state: { expanded: true },
    },
    { name: 'Node 2' },
  ]"
>
  <template #cell="slotProps">
    <!-- node.parents is an array that contains all parent nodes' index -->
    <div
      :style="{
        textAlign: 'left',
        marginLeft: `${slotProps.node.parents.length * 30}px`,
      }"
    >
      {{ slotProps.node.name }}
    </div>
  </template>
</virtualised-tree>
```

## Props

### Mutual props

Here are props that are identical in both `VirtualisedList` and `VirtualisedTree` components.

<!-- markdownlint-disable MD033 -->
|Prop|Type|Required?|Default|Description|
|---|---|:---:|---|---|
|viewportHeight|`Number`||`400`|The height of the scrollable container for rendering elements.|
|initialScrollTop|`Number`||`0`|The initial scroll position.|
|initialScrollIndex|`Number`||`0`|The initial scroll index. If this prop is specified, it will override `initialScrollTop` prop.|
|scrollBehaviour|`String`||`auto`|Inherited from [`ScrollToOptions.behavior`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions/behavior) that specifies whether the scrolling should animate smoothly, or happen instantly in a single jump. Value is an enum, which can be one of the following: <ul><li>`smooth`: The scrolling animates smoothly.</li><li>`auto`: The scrolling happens in a single jump. </li></ul>|
|tolerance|`Number`||`2`|Padding of nodes outside of the viewport to allow for smooth scrolling.|
|getNodeHeight|`Function`|||A function that takes the current node as a parameter, and returns the height of the node. <div>e.g. `(node) => 30 + (node.index % 10)`</div>|
|getNodeKey|`Function`|||A function that takes the current node and the index of the node in the virtual scroller as parameters, and returns the key of the node. Key is a unique identifier for the virtualised scroller. <div>e.g. `(node, index) => node.key`</div>|
|cellRenderer|`Function`|||A function that takes the current node and its current index in the virtualised scroller as parameters, and returns an array of Children VNodes, built using [`h()`](https://v3.vuejs.org/guide/render-function.html#h-arguments), or using strings to get "text VNodes" or an object with slots. If this prop is specified, the `cell` slot in the template will be override. <div>e.g. `(node, index) => [h("div", {style: {height: "100%"}}, node.name)]`</div>|

### `VirtualisedList` props

|Prop|Type|Required?|Default|Description|
|---|---|:---:|---|---|
|nodes|`Array<any>`|✓||List data for rendering and can be any types inside of the array.|

### `VirtualisedTree` props

|Prop|Type|Required?|Default|Description|
|---|---|:---:|---|---|
|nodes|`Array<Node>`|✓||Tree data with implementing the following keys: <ul><li>`name`: The primary label for the node.</li><li>`state?`: An object stores states of each node.<ul><li>`expanded?`: shows children of the node if `true`, or hides them if `false`. Defaults to `false`.</li></ul></li><li>`children`: An array of child nodes belonging to the node.</li></ul><div>e.g. `[{name: "Node 1", children: [{name: "Leaf 1"}]}, {name: "Node 2"}]`</div>|
|useTimeSlicing|`boolean`||`false`|Time slicing is a technique allows for switching between micro tasks (i.e. DOM redrawing) and micro tasks (i.e. node updating) when traversing and manipulating enormous amount of nodes. If it's set to `true`, we can avoid blocking the whole web application. However, the total amount of traversal time will be longer.|
|onChange|`Function`|||A function that takes `nodes` prop as a parameter. This function will be called when executing `updateNode()` and `updateNodes()` methods.|

## Events

### Mutual events

Here are events that are identical in both `VirtualisedList` and `VirtualisedTree` components.

|Event|Description|
|---|---|
|onScroll|Triggered when the user is scrolling the rendered content. This event emits the current scroll position of the rendered content.|
|onStartReached|Triggered once when the scroll position gets the bottom of the rendered content. This event emits the current scroll position of the rendered content.|
|onEndReached|Triggered once when the scroll position gets the top of the rendered content. This event emits the current scroll position of the rendered content.|

## Slots

### Mutual slots

Slots are provided for rendering content dynamically. Here are slots that are identical in both `VirtualisedList` and `VirtualisedTree` components.

|Slot|Props|Description|
|---|---|---|
|cell|<ul><li>`node`: The current node for rendering.<ul><li>`index`: The current index of the node in `children` of its parent node.</li><li>`parents`: An array of indices of all parent nodes ordered from the root node.</li><li>`key`: A unique identifier of the node.</li><li>`name`: The name of the node.</li><li>`state`: An object stores states of each node.<ul><li>`expanded`: shows children of the node if `true`, or hides them if `false`.</li><li>`isLeaf`: A boolean that indicates if the current node is the leaf node.</li></ul></li><li>`children`: An array of child nodes belonging to the node.</li></ul></li><li>`index`: The current node's index in the rendered content.</li></ul>|The slot for rendering a single node in the content. If `cellRenderer` props is specified, this slot won't have effect.|

### `VirtualisedTree` slots

|Slot|Props|Description|
|---|---|---|
|fallback||There are cases when it's useful to specify fallback (i.e. default) content for a slot, to be rendered only when no content is provided.|

## Methods

### Mutual methods

#### `scrollToStart()`

```ts
scrollToStart(): void
```

#### `scrollToEnd()`

```ts
scrollToEnd(): void
```

#### `scrollToIndex()`

```ts
scrollToIndex(index: number): void
```

Valid `index` should be in the range from `0` to `nodes.length - 1`.

#### `scrollToNode()`

```ts
scrollToNode(conditionCallback: Function): void
```

Valid `conditionCallback` should be a function that takes a node as a parameter and returns a `boolean`:

```ts
conditionCallback(node: Node): boolean
```

### `VirtualisedList` methods

#### `refreshView()`

```ts
refreshView(): void
```

Forces refresh rendered content.

### `VirtualisedTree` methods

#### `updateNode()`

```ts
updateNode(nodes: Array<Node>, node: Node, index: number, updateFn: Function): void
```

This method updates a single node in both original data and the view. Valid parameters are:

- `nodes`: `nodes` prop.
- `node`: The current node that needs to be updated.
- `index`: The index of the node that needs to be updated.
- `updateFn`: The function that manipulates the current node and returns an updated node:

```ts
updateFn(node: Node): Node
```

#### `updateNodes()`

```ts
updateNodes(nodes: Array<Node>, node: Node, index: number, updateFn: Function): void
```

This method updates a single node including all its descendants in both original data and the view. Valid parameters are:

- `nodes`: `nodes` prop.
- `node`: The current node that needs to be updated.
- `index`: The index of the node that needs to be updated.
- `updateFn`: The function that manipulates the current node and returns an updated node:

```ts
updateFn(node: Node): Node
```

## Contributing

Pull requests are welcome!

### Project setup

```shell
yarn install
```

#### Compiles and hot-reloads for development

```shell
yarn serve
```

#### Compiles and minifies for production

```shell
yarn build
```

#### Lints and fixes files

```shell
yarn lint
```

## License
[MIT](http://opensource.org/licenses/MIT)
