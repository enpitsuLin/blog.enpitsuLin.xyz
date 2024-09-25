---
title: 从0开始的TypeScript学习和踩坑
date: 2021-08-29 22:03:00
tags: [JavaScript, TypeScript, React, Vue]
excerpt: TypeScript 作为 JavaScript 具有类型的超集, 并支持所有的所有的 JavaScript语法, 并在此之上对 JavaScript 添加了一些扩展,在生产中使用可以大大提高代码的可读性和项目的健壮性
---

`TypeScript` 作为 `JavaScript` 具有类型的超集,并支持所有的所有的 `JavaScript`语法。并在此之上对 `JavaScript` 添加了一些扩展,在生产中使用可以大大提高代码的可读性和项目的健壮性

作为强类型语言,赋予了 JS 原先不曾有的类型系统和开发时的静态类型检查,静态类型检查可以避免很多不必要的错误, 不用在调试的时候才发现问题(其实有的时候根本调试不出问题,可能为以后埋下一个炸弹);所以作为一个前端开始学习 TS 还是很有必要的(｡･∀･)ﾉﾞ

# 前言

说是从 0 开始，事实上在已经算是在生产中体验过 `Vue3 + ts + vscode + Volar`的魔力了。

但是生产中束缚于业务老是束手束脚的，放不开，正好也好久没有继续 React 的学习了,本身 Vue3 的`composition api`用起来就很香，不如正好搞一波`React + ts + Hooks`的学习。

~~Vue3.2 都发布了 性能那么爆炸 还抱着 Vue2 搞生产真的有点便秘 项目还烂代码堆积 😶~~

# 项目搭建

> 项目搭建方法略 ~~善用搜索引擎~~

# 类型小坑

## 函数式组件的类型声明

对于`react`的组件,函数式的组件在使用函数声明或者函数表达式方式定义的时候有些许不同

所以一般推荐使用函数表达式方式声明组件并导出使用

```ts
/**
 * function statement
 * 不会将props推断需要显示声明
 */
function Button(props:PropsWithChildren<ButtonProps>): ReactElement<Props> {
	return <button>{somethings}</button>;
}
/**
 * function expression
 * 此处props会推断成PropsWithChildren<ButtonProps>
 */
const Button:React.FC<Props> = (props)=>
```

## 对于 Class 组件的 Prop 类型

Class 组件可能在某些场合还是很有必要存在的所以还是要注意下坑

对于定义好 Props 和 State 的接口需要在继承`Component`时注意泛型选项

```typescript
class SomeComponent extends Component<Props, State> {
  /// ...
}
```
