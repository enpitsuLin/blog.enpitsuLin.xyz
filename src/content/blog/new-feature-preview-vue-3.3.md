---
title: Vue 3.3 新特性前瞻和简单评价
date: 2023-04-27
tags: [Develop, Vue]
excerpt: 虽然3.3当前还处于beta阶段但是其带来的一些特性十分激动人心，就在这里简单的给大家带来新特性的前瞻，为以后的升级做做准备😁
---

虽然3.3当前还处于beta阶段但是其带来的一些特性十分激动人心，就在这里简单的给大家带来新特性的前瞻，为以后的升级简单做准备😁

## 泛型组件支持

Vue[一直以来](https://github.com/vuejs/core/issues/3102)都是没办法很好的实现泛型组件，终于在3.3版本增加了这一功能

首先是面向TSX用户为`defineComponent` 工具函数增加了泛型支持，当参数传入一个泛型函数时类型会提示正常，比如我们可以基于这个特性使用tsx简单构造一个表格组件

```tsx
import { defineComponent } from 'vue'

interface Props<T> { data: T[], columns: { label: string, field: keyof T }[] }

const Table = defineComponent(<T,>(props: Props<T>) => {
  return () => (
    <table>
      <thead>
        <tr>
          {props.columns?.map(item => (
            <th>{item.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.data?.map(row =>
          props.columns?.map(column => <td>{row[column.field]}</td>)
        )}
      </tbody>
    </table>
  )
})

export default Object.assign(Table, {
  name: 'GenericsTableTsx',
  props: ['columns', 'data']
})
```

但是值得注意的是我们仍需要为这个组件传入`props`属性，否则在使用的时候会将应该是`props`的的属性挂载到`$attrs`上，这点其实基本上杜绝了这样的用法，所以说仅仅只是类型正确，不太推荐生产用这样的方法构建泛型组件。

### SFC泛型组件支持

其实上面的功能还是为了铺垫这个，我们了解怎么用SFC来复现上面的组件

```vue
<template>
  <table>
    <thead>
      <tr>
        <th v-for="item in columns">
          <slot name="header-cell" v-bind="{ label: item.label }">
            {{ item.label }}
          </slot>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in data">
        <td v-for="column in columns">
          <slot name="cell" v-bind="{ data: row[column.field] }">
            {{ row[column.field] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
<script setup lang="ts" generic="T">
  const { columns, data } = defineProps<{
    data: T[];
    columns: {
      label: string;
      field: keyof T;
    }[];
  }>();
</script>
```

`Vue@3.3`为`script`增加了一个属性`generic`用于创建泛型参数，多个参数当然也像是ts中使用`,`隔开。

> 评价: 很强的新特性，vue终于有泛型组件了真的是可喜可贺，就是对于TSX的支持还是需要额外增加props属性比较麻烦，这个问题也是比较久远的了，希望vue团队以后在为TSX的开发体验提升上努努力

## defineProps 宏支持引入的类型

[这个需求](https://github.com/vuejs/core/issues/4294)已经2年过去了，不过大部分开发者都有使用一些社区插件来达到这个用法，现在官方终于提供了，在3.3我们可以轻松的使用外部导入的类型创建`Props`

```vue
<script setup lang="ts">
import type { SomeType } from 'some-where'

const props = defineProps<{ data: SomeType }>()
</script>
```

> 评价: 众望所归，更方便的管理在Vue项目中的类型，不需要再在SFC中写又臭又长的类型体操了

## defineEmits 宏更简便的写法

对于3.2,`defineEmits`基于泛型需要这样使用

```typescript
defineEmits<{
  (e: 'foo', id: string): void
  (e: 'bar', ...args: any[]): void
}>()
```

3.3的写法，对于单个参数使用具名元组的方式定义，如果使用`rest params`的参数可以直接使用`T[]`来解决

```typescript
defineEmits<{
  foo: [id: string]
  bar: any[]
}>()
```

> 评价: 提升DX的小功能，函数重载的形式写起太多的emits确实有点烦人

## 为v-model带来新的工具

这是来自[智子君](https://github.com/sxzz)的[新特性](https://github.com/vuejs/core/pull/8018)，可以在`<script setup/>`中使用`defineModel`和非`<script setup/>`中使用的`useModel`工具

```typescript
// 默认的model (通过 `v-model`)
const modelValue = defineModel()
// ^? Ref<any>
modelValue.value = 10

const modelValue = defineModel<string>() // 增加类型
// ^? Ref<string | undefined>
modelValue.value = 'hello'

// 带有设置的默认model, 要求非undefined
const modelValue = defineModel<string>({ required: true })
// ^? Ref<string>

// 特定名称的model (通过 `v-model:count` )
const count = defineModel<number>('count')
count.value++

// 具有默认值的特定名称的model
const count = defineModel<number>('count', { default: 0 })
// ^? Ref<number>

// 本地作用域可变的 model, 顾名思义
// 可以不需要父组件传递v-model
const count = defineModel<number>('count', { local: true, default: 0 })
```

还有`useModel`作为非`<script setup/>`中使用的工具

```typescript
import { useModel } from 'vue'

export default {
  props: {
    modelValue: { type: Number, default: 0 },
  },
  emits: ['update:modelValue'],
  setup(props) {
    const modelValue = useModel(props, 'modelValue')
    // ^? Ref<number>

    return { modelValue }
  }
}
```

> 评价: 又一提升DX的利器，定义一个`v-model`的属性确实比较繁琐，而且在sfc内实用性不强，一般需要搭配[`vueuse/useVModels`](https://vueuse.org/core/useVModels/#usevmodels)使用，官方加入这个宏和工具函数确实是很不错

## defineOptions

又是智子君的pr，早前来自[RFC](https://github.com/vuejs/rfcs/discussions/430)，这个内容的话应该不少人都在`Vue Macro`中用过了

本来Vue如果你需要在`<script setup>`中定义一些原先`Option Api`的属性比如`inheritAttrs/name`是需要创建一个`<script>`单独导出这两个属性的，现在有了`defineOptions`就可以省去这一步骤

```vue
<script setup>
// 一些代码
</script>
<script>
export default {
  name: "ComponentName"
}
</script>
```

```vue
<script setup>
defineOptions({
  name: "ComponentName"
})
// 一些代码
</script>
```

> 评价: 这个特性可以在[`Vue Macro`](https://vue-macros.sxzz.moe/macros/define-options.html)使用到，先行体验，反正我是用上了很爽

## defineSlots 宏以及 slots 属性

还是来自[智子君](https://github.com/vuejs/core/pull/7982)，TQL

允许定义`slots`的具体类型，首先是新增了一个`SlotsType`以及`slots`属性可以`options api`中使用

```typescript
import { SlotsType } from 'vue'

export default defineComponent({
  slots: Object as SlotsType<{
    default: { foo: string, bar: number }
    item: { data: number }
  }>,
  setup(props, { slots }) {
    expectType<undefined | ((scope: { foo: string, bar: number }) => any)>(
      slots.default
    )
    expectType<undefined | ((scope: { data: number }) => any)>(slots.item)
  }
})
```

对于这个定义的组件`SlotComponent`，再组件中使用的话就是

```vue
<template>
  <SlotComponent>
    <template #default="{ foo, bar }">
      {{ foo }} is string,{{ bar }} is number
    </template>
    <template #item="{ data }">
      {{ data }} is number
    </template>
  </SlotComponent>
</template>
```

`defineSlots`和`slots`属性类似，不过提供一个函数语法

```typescript
// 与 对象语法表现一致，谢谢ES没有将default当属性关键词 可喜可贺可喜可贺😆
const slots = defineSlots<{
  default: (props: { foo: string, bar: number }) => any // or VNode[]
}>()
```

> 评价: slot有正确的类型的话对于组件库来说是一个挺好的消息，毕竟从引入`scopeSlot`到现在用户都不能很好地确定自己该怎么用某个`scopeSlot`

## 模板中使用 console.log

突然的调试可能会用到的`console.log`但是在模板中不好使，现在3.3加上了额外支持，不需要再自己为模板作用域增加一个函数来打印东西了

> 评价: 无伤大雅，提升DX，偶尔会用到会感觉很舒服

## 不太重要的特性

### 对Suspense的改进

个人觉得vue的`<Suspense>`可以暂时不用关注，实验性特性好久了，pr在[这里](https://github.com/vuejs/core/pull/6736)

### 废弃和修改的特性

#### v-is 指令废弃

废弃`v-is`了，全部改用`:is`指令（好奇真的有人还在用这个指令吗？）

#### app.config.unwrapInjectedRef

`app.config.unwrapInjectedRef`这个属性没了，在3.3会默认对使用`Option api`的`inject`属性进行注入的ref进行拆包，

#### vnode hook 废弃

vnode hook 应该用户比较少，就是有一个`@vnode-*`的指令变成了`@vue:*`，这个特性应该蛮少用的，甚至连网上都没有什么介绍，好像是为Vnode的生命周期提供一些类似与组件生命周期的功能，不知道有没有清楚这个特性能干吗的伙伴介绍下。

## 对于生态开发者的改进

### app.runWithContext()

在App上增加了一个`runWithContext()`可以用于确保对应用程序级别的全局变量存在，比如通过`provide`的各个值，可以用于改进vue生态的各个包，`pinia/vue-router`之类的

```typescript
const app = createApp(App)

app.provide('foo', 1)

app.runWithContext(() => inject('foo')) // should return 1
```

### hasInjectionContext

`hasInjectionContext`这是面向基于vue的库作者用于检查是否可以使用`inject()`的工具，如果当前环境可以使用就返回true，不可以的环境其实就是setup外了，库作者使用该函数可以省去额外对当前环境的检测。

> 评价: 这些对生态开发者来说比较有用的功能，如果有写库的小伙伴可以注意一下

## 需要注意的

对于TSX用户,vue3.3不在默认注册全局JSX命名空间，需要手动在tsconfig.json中修改[jsxImportSource](https://www.typescriptlang.org/tsconfig#jsxImportSource)或者使用魔法注释`/* @jsxImportSource vue */`这是避免全局jsx类型冲突。
