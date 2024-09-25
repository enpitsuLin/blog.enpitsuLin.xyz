---
title: 不到100行代码构建响应式UI框架
date: 2023-05-30 14:39:00
tags: [JavaScript]
excerpt: 在 Github 的时间线上看到了一个自称是世界上最小的响应式UI框架 vanjs-org/van 简单预览了一下，研究一下它的底层实现方式，是如何做到100行代码不到就构建了一个简单的响应式前端框架
---

在 Github 的时间线上看到了一个非常厉害的项目，自称是世界上最小的响应式UI框架

:::div{.flex.justify-center}

https://github.com/vanjs-org/van
:::

简单预览了一下，发现确实很小，而且很适合研究它的底层实现方式，虽然代码风格过于极简主义导致可读性比较差(作者本人也[指出](https://vanjs.org/about#coding-style))

但是通过一定的整理还是比较容易搞懂的，毕竟本体就不到100行（事实上只有94行）

![image](https://oss.enpitsulin.xyz/images/vanjs-lines.webp)

简单研究了下帮忙跳了个类型体操完善了下类型定义，本身我是比较讨厌那套研究各种源码的卷劲的，但是基于这个库的轻量我觉得可以简单解析下

## 基于函数的构建dom形式

可能有人会问什么叫基于函数的，难道JSX的本质`createElement`不是函数嘛？

这个基于函数是单纯的通过一系列的函数构建标签而非使用vdom之流(但其实体验和jsx很相像)，因为作者把这个库定义为前端的bash脚本（甚至是要你下载源码引入使用的 :smile:不过发布到npm在计划中 ）所以使用vdom或者什么jsx不太符合它的设计哲学

库提供了[`van.tags`](https://vanjs.org/tutorial#api-tags)通过解构出的属性可以作为函数直接创建dom标签，其本质就是`document.createElement`

但是他这一部分的实现是比较巧妙的，不需要声明所有的tag作为属性，而是通过 Proxy包装一个函数做 target 和设置了一个 handler 来处理获取属性

```javascript
// name形参实际上是解构的 properties name, ...args 才是最终实际上使用的函数参数
const tags = new Proxy((name, ...args) => {
  // 由于允许不传标签 props/attrs 所以处理下使props有一个值
  const [props, ...children] = protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args]
  const dom = document.createElement(name)
  Obj.entries(props).forEach(([k, v]) => {
    // 设置dom propeties 或者 attributes, 其实这里判断 undefined 的方法是有明显bug的, 永远会走 falsy 的情况
    const setter = dom[k] !== _undefined ? v => dom[k] = v : v => dom.setAttribute(k, v)
    // 处理 vanjs 的响应式 state
    if (protoOf(v) === stateProto)
      bind(v, v => (setter(v), dom))
    else if (protoOf(v) === objProto)
      bind(...v.deps, (...deps) => (setter(v.f(...deps)), dom))
    else setter(v)
  })
  return add(dom, ...children)
}, { get: (tag, name) =>
  // bind 处理掉 name 参数,实际上 target 的第一个参数变成了使用到的 property name
  tag.bind(_undefined, name) })
```

:small[PS: 说实话这个 tags 内部的类型是真的不可能直出**正确类型**的,把源码扩展和加类型标注来阅读的时候,遇到这样的情况真的第一次让我感觉 TypeScript 是有缺陷的,想看扩展后和进行标注的代码放在文末 gist 链接]

## 响应式基础

关于现在的响应式UI框架的基础其实还是换汤不换药，本质还是发布订阅模式或者观察者模式

但是 vanjs 走的极致压缩size路线,导致这部分除开这个实现逻辑的代码确实是很强悍,让我有一种回到es5手写原型链实现class的感觉

### 状态管理

vanjs 提供了 state 函数来提供状态,其实本质就是实现一个响应式变量作为发布者

但是其实现不像 vue2/vue3 这样通过 defineProperties 或者 Proxy 包装的,而是直接通过getter/setter简单的完成这个步骤

所以这里就有个缺陷,就是 state 的响应式只是浅层的,就类似于 vue3 的 `shallowRef`, 必须通过修改 `State.val` 才会触发

首先是定义了 `stateProto` 作为state的原型

```javascript
const stateProto = {
  get val() { return this._val },

  set val(value) {
    // Aliasing `this` to reduce the bundle size.
    const self = this; const currentVal = self._val
    if (value !== currentVal) {
      if (self.oldVal === currentVal)
        changedStates = addAndScheduleOnFirst(changedStates, self, updateDoms)
      else if (value === self.oldVal)
        changedStates.delete(self)
      self._val = value
      self.listeners.forEach(l => l(value, currentVal))
    }
  },

  onnew(listener) { this.listeners.push(listener) },
}
```

实际上就是简单实现了

```ts
interface State<T = any> {
  val: T
  onnew: (l: (val: T, oldVal: T) => void) => void
}
```

如果用 class 来写应该大多数人会直接 `class StateImpl implements State` 但是vanjs 为了极致的 size 没有选择 class (实际上几个 minor 之前还是class :satisfied:)

vanjs是怎么做的呢, 其实很简单直接用个对象字面量以及将其**proto**指向这个`stateProto`就ok了,显著减少代码体积

:small[PS:如果有手写过原型链的朋友应该很熟悉这样的写法,但是脱离了构造函数而是直接对象字面量和__proto__属性 ~~不过这里使用`Object.create` w/ `Object.assgin`可能会得到一点点性能提升XD~~]

### 绑定状态

vanjs 提供了[`bind`](https://vanjs.org/tutorial#api-bind)函数来将状态和一些有副作用的调度任务进行绑定,内部如之前的 tags 中处理 props/attrs 更新的地方也是用到这个函数

:small[PS:我给vanjs贡献的就是这个函数的签名类型,简单的跳了个类型体操解决原先手写10个函数重载但实际上还是不够用的的签名:grin:]

```javascript
function bind(...deps) {
  const [func] = deps.splice(-1, 1)
  const result = func(...deps.map(d => d._val))
  if (result == _undefined)
    return []
  const binding = { _deps: deps, dom: toDom(result), func }
  deps.forEach((s) => {
    statesToGc = addAndScheduleOnFirst(statesToGc, s, () => (statesToGc.forEach(filterBindings), statesToGc = _undefined), bindingGcCycleInMs)
    s.bindings.push(binding)
  })
  return binding.dom
}
```

这部分函数中 statesToGc 实际上是管理GC的,和响应式没有太大关系啊

这函数主要是产生了一个`binding`然后将这个`binding`增加到状态的`bindings`列表里去了

然后就是当对 `State.val`进行修改的时候会触发调度任务来进行副作用的执行通过 `updateDoms`这个函数,回到`stateProto`这个原型对象中可以看到 val 的 setter 函数中的逻辑是当 setter 传入的值与当前值`_val`不同时会进行一系列逻辑

```javascript
set "val"(value) {
  // Aliasing `this` to reduce the bundle size.
  let self = this, currentVal = self._val
  if (value !== currentVal) {
    if (self.oldVal === currentVal)
      changedStates = addAndScheduleOnFirst(changedStates, self, updateDoms)
    else if (value === self.oldVal)
      changedStates.delete(self)
    self._val = value
    self.listeners.forEach(l => l(value, currentVal))
  }
}
```

首先如果保存的旧值`oldVal`和当前值`_val`一样时(这里state初始化时这两个值是一样的)

即第一次变更状态时vanjs 会将当前 state 实例加入到 `changedStates` 这个 `Set<State>`中,并通过一个没有delay参数的`setTimeout`来执行 `updateDoms` 的任务(宏任务队列 下一次循环直接执行)

那么副作用的实际执行逻辑其实就是在 `updateDoms`

---

但是`else if`的分支是干什么的呢?

因为我们在上个分支中插入了一个`updateDoms`到宏任务队列,但是在本次事件循环中如果这个`State.val`再次被修改了,并且修改的目标值和`oldVal`一致(值被复原了)

那么可以直接将原先加入到`changedStates`这个`Set<State>`的当前`State`删除,让其在`updateDoms`时不会执行当前`State`改变两次并变回原先的`oldVal`从而生成的错误的副作用

当然 如果 目标值和`oldVal`不一样就会老老实实的还是执行该有的副作用了

:small[PS:不过这里还是有引用类型比较的问题,还是造成shlldowRef的效果,改变深层值可能并不会触发该有的副作用,当然甚至修改状态也不会有:pig:]

### 执行副作用

```javascript
function updateDoms() {
  const changedStatesArray = [...changedStates]
  changedStates = _undefined
  new Set(changedStatesArray.flatMap(filterBindings)).forEach((b) => {
    const { _deps, dom, func } = b
    const newDom = func(..._deps.map(d => d._val), dom, ..._deps.map(d => d.oldVal))
    // 元素引用不同则视作dom变化 其实vanjs比较推荐直接修改一个元素引用的prop/attrs的 毕竟没有什么vdom
    if (newDom !== dom) {
      if (newDom != _undefined)
        dom.replaceWith(b.dom = toDom(newDom)); else dom.remove(), b.dom = _undefined
    }
  })
  changedStatesArray.forEach(s => s.oldVal = s._val)
}
```

这部分的逻辑也不算复杂,先是将`changedStates`这个`Set<State>`解构成了一个`State[]`变量然后把原先的`changedStates`置空

接着将获得的`changedStatesArray`获取里面的`bindings`并拍平得到了一个`bindings`的数组

通过`new Set`去重并遍历通过`binding`中的状态依赖、dom元素、副作用函数获得新的元素,然后检测新老元素引用是否一致来更新dom节点和是否需要删除旧dom节点

最后再将 `changedStateArray`中的所有状态的`oldVal`赋当前`_val`值,这样如果此`State`再次更改就依旧会触发相应的副作用

## 总结

其实里面还有一些控制GC的东西,但是不太熟悉这部分就也没研究就罢了

其实说到底构建一个响应式前端框架的核心难度并不高,其生态构建和周边配套设施的开发才是难点,特别是你直接使用一些浏览器现有的api而不是什么虚拟dom,难度是非常低的,不过这个库的特点是尺寸十分轻量,虽然导致一些东西明显看着会有问题~~XD~~

但是这样的工具构建的[网页](https://vanjs.org/)(vanjs的官网)其实也是不输vue/react构建的,我也顺手做了个[ todomvc ](https://github.com/enpitsuLin/vanjs-todomvc) 感觉还不错,还会继续关注这个项目有机会提提pr

最后贴个 [gist: 扩展+类型标注 版本 导入的类型参考官方仓库 ](https://gist.github.com/enpitsuLin/cc51f3b326708a04f76caf797eaf46d6) 供学习

希望看完本文你会学到一些什么:heart:
