---
title: Vue3中的Portal——Teleport
date: 2021-10-10 21:10:00
tags: [Vue]
excerpt: Vue3 中迎来了一个新的内置组件Teleport，它可以在将一个组件渲染到Dom的任意节点上，并且可以控制组件的显示和隐藏。对于组件的开发可以无需外部依赖达成某些效果
---

对于使用 React 的前端开发者来说，`portals`传送门应该是比较熟悉的，能够将节点渲染到父组件以外的节点上。

这种让节点任意渲染到其他位置的功能在开发自定义组件的时候非常的实用，特别是一些模态的组件或者弹出层的组件，能够将部分内容挂载到`body`上使得逻辑更清晰，并能使其不受父元素影响，使得父元素的样式调整更灵活。

但是相似的的功能在 Vue 中一直是没有的，甚至需要第三方的库来实现。但是 Vue3 中我们迎来了一个新的内置组件`Teleport`——我称为传送面板(误

> Teleport online！

# 用法

作为内置组件`Teleport`和`Transition`、`KeepAlive`一样，我们可以在任意 Vue3 项目中使用，如下。

```javascript
const app = Vue.createApp({
  name: 'test',
  template: `
    <div class="text">
      <div>Hello World</div>
      <teleport to="body">
        <span>this is teleport</span>
      </teleport>
    </div>
  `,
})
const vm = app.mount('#app')
```

会渲染成如下结构

```html
<body>
  <div id="app" data-v-app="">
    <div class="text">
      <div>Hello World</div>
      <!--teleport start-->
      <!--teleport end-->
    </div>
  </div>

  <span>this is teleport</span>
</body>
```

# 组件 props

`Teleport`组件只有两个 props——to、disabled

to 必须，用于指定查询选择器或 HTMLElement，而且此属性能够被`:、v-bind`修饰，对参数的改变会导致传送的目标变化，而且是对真实的 Dom 进行移动，所以元素的状态也会被保存

disabled 可选，用于禁用功能，为 true 则意味着并不移动内容至 to 参数指定的位置；通过控制 disabled 属性可以灵活的操作其默认插槽内容，而且也如同 to 被动态更改一样是对真实的 Dom 进行移动

# 更详细的用途

其实如同`Portal`一样，很多用途都是相同的，主要是`Teleport`更好控制，使用更适合 vue 的模板语法。

通过这种能移动内容的功能我们能够更容易封装能够被统一控制的 Popover 类型的组件，将组件内容移动到 body 节点下能够更好的控制样式还有不会对原有的父元素产生不明的影响。
