---
title: Jsdoc的奇妙——无法使用ts的无奈之举
date: 2021-09-26 20:21:00
tags: [JavaScript, TypeScript]
excerpt: 在现代前端项目中使用 ts 以及成为常态, 但是在很多还是只能使用 JavaScript 的项目中也往往也很需要静态类型检查, 但因为一些原因快速引入 ts 不太现实, 使用Jsdoc来标注类型可能是一种解决方法。
---

在现代前端项目中使用 ts 以及成为常态~~TypeScript 成为事实上的 JavaScript,JS 大呼不可战胜~~

但是在很多还是只能使用 JavaScript 的项目中也往往也很需要静态类型检查，但快速引入 ts 不太现实，甚至 Vue2 的一些项目引入 TS 效果反而不好。

其实在许多现代编辑器~~特指 VScode~~本身就有能够提供静态类型检查的方法，只需要多写注释就能达到 ts 的效果，就是——Jsdoc。

jsdoc 提供了一种非侵入式的手段为项目增加类型检查，但是代价是注释量可能比较大，本项目就用实现简易 jsx 的例子展现一些在良好的 IDE 环境下 Jsdoc 能提供的能力，虽然不能像 ts 那样跳类型体操，但是基础的类型检查还是能做到的。

其实大多数时候我们写注释的时候总会用到 Jsdoc 例如

```javascript
/**
 * @desc 删除用户
 * @param id 用户id
 */
function deleteUser(id) {
  // ...
}
```

## 启用JSDoc

### 增加 jsconfig.json

增加`jsconfig.json`的主要目的是告知 IDE 该工作区是一个 js 项目,配置如下，主要是让 IDE 知道项目的根路径和一些存在 js 文件的目录

```json
{
  "compilerOptions": {
    "jsx": "react",
    "target": "esNext",
    "module": "esNext",
    "baseUrl": "./"
  },
  "include": ["src/**/*", "index.jsx", "index.js"],
  "exclude": ["node_modules"]
}
```

### 启用类型错误提示

```javascript
// @ts-check
```

在 js 文件第一行加上就可以直接看到错误提示,这是 Typescript 对 jsdoc 的[额外支持](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

类型错误提示仅支持 jsdoc 的下列代码块

- @type
- @param (or @arg or @argument)
- @returns (or @return)
- @typedef
- @callback
- @template
- @class (or @constructor)
- @this
- @extends (or @augments)
- @enum
- @deprecated

## 我常用的块标签

### @type 声明类型

这可能是最常用的一个标签了,一般用于声明一个变量的类型

```javascript
/** @type {number} */
const CURRENT_YEAR = 2021
/** @type {{name:string;sex:'male'|'female'}} */
const onePerson = { name: 'unknown', sex: 'male' }
```

差不多相当于,当然 ts 中我们有类型推断一般不需要这样使用

```typescript
const CURRENT_YEAR: number = 2021
const onePerson: { name: string, sex: 'male' | 'female' } = { name: 'unknown', sex: 'male' }
```

大多数 ts 的用法都是支持的 比如 tagName 为 HTML 标签的类型

```javascript {diff}
/** @type {keyof HTMLElementTagNameMap} */
- let tagName = 'adsad'; //wrong
+ let tagName = 'div';
```

### 定义可复用的类型

jsdoc 中可以使用仅使用注释编写的文件来完成自定义类型的复用为虚拟注释,

```javascript
// Person.js
/**
 * 定义Person类型
 * @typedef {object} Person
 * @property {string} name name 属性
 * @property {string} [nickname] [] 包裹的为可选属性
 */
```

于是可以在其他 js 文件中使用这个`Person`类型,相当于 ts 中

```typescript
// Person.d.ts
interface Person {
  name: string
  nickname?: string
}
```

而且得益于 VSCode 的强大，在使用 `@type` 标签的时候会自动使用项目中经过 `@typedef` 的类型,但是对于重名的可能会需要手动导入使用(不开启//ts-check 时)

```javascript
/** @type {import('./src/typings/ELement').Element} */
```

或者声明命名空间来使用,比较推荐使用命名空间

### 命名空间

与 Typescript 的命名空间类似 jsdoc 也同样能提供避免与其他第三方库中类型声明重复的方法就是命名空间

```javascript
/**
 * @namespace React
 */

// 然后对虚拟类型注释声明其命名空间

/**
 * @typedef {keyof HTMLElementTagNameMap} React.ElementNode
 * @memberof React
 */

// 然后就能使用`React.ElementNode`类型避免冲突了
```

### 泛型类型

基础类型无法满足需求可以使用`@template`来定义泛型

```javascript
/**
 * @template T
 * @typedef {object} generics
 * @property {T} value
 * @property {name} string
 */
```

对于一些可能需要泛型的函数可以直接使用typescript 的方式

```javascript
/**
 * @typedef {<T>(a:T,a:T)=>T} Add
 */
```

### 直接从d.ts中导入类型

对于更精细的类型我们甚至可以放在typescript文件中并通过导入功能导入

```javascript:import.js
/**
 * @typedef {import('./test').Toc} Toc
 */
```

```typescript:export.js
export type Toc = {
  value: string
  depth: number
}
```
