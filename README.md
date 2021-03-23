# Vue3 Virtualised

> Vue components developed by [Vue.js 3.0](https://v3.vuejs.org/) for efficiently rendering large scrollable lists and hierarchical data.

## Getting started

Install `vue3-virtualised` using npm.

```sh
# npm
npm install vue3-virtualised --save

# yarn
yarn add vue3-virtualised
```

ES6 and CommonJS builds are available with each distribution.
For example:

```js
// You can import any component you want as a named export from 'vue3-virtualised'. e.g.
import { VirtualisedList, VirtualisedTree } from 'vue3-virtualised';

// Or you can import the component as a named export. e.g.
import { VirtualisedTree as Tree } from 'vue3-virtualised';
```

## Usage

TBC...

## Props

### Mutual props

Here are props that are identical between both `VirtualisedList` and `VirtualisedTree` components.

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
|cellRenderer|`Function`|||A function that takes the current node and its current index in the virtualised scroller as parameters, and returns an array of Children VNodes, built using [`h()`](https://v3.vuejs.org/guide/render-function.html#h-arguments), or using strings to get "text VNodes" or an object with slots. If this prop is specified, the `cell` slot in the template will be override.|

### Virtualised List

|Prop|Type|Required?|Default|Description|
|---|---|:---:|---|---|
|nodes|`Array<any>`|✓||List data for rendering.|

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
