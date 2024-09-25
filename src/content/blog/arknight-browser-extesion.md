---
title: 做了一个浏览器扩展来监控罗德岛上的运行状态
date: 2023-09-08 15:10:00
tags: [Game]
excerpt: 由于鹰角终于推出了自家的交流平台——森空岛, 同时也为各位刀客塔获取岛上信息增加了一些途径, 终于不需要打开游戏就能看到岛上的运行状态啦, 于是我也就基于森空岛的 API 开发了一个简单的浏览器扩展, 用来监控罗德岛上的运行状态。
draft: true
---

因为早前注册了 Chrome 开发者, 所以想着不开发个浏览器扩展好像有点对不起自己, 作为一个萌~~新~~旧刀客塔就想着做一个浏览器扩展来监控罗德岛上的运行状态。

于是一个命名为罗德岛远程指挥部的扩展就诞生了。[Github 地址](https://github.com/enpitsuLin/rhodes-headquarters)

## Plasmo 还是别的啥

本来一开始是想着用 [plasmo](https://github.com/PlasmoHQ/plasmo) 来开发, 回过头多练习练习 React 和接触 React 生态, 但是发现这个只能使用 Tailwind 而不能使用心水的 Unocss , 同时甚至 @unocss/postcss 也不太好用, 而且好多东西不太好扩展, 还是选择其他方案了。

只能回到 Vue 这边, 来到了 antfu 大佬的 [vitesse-webext](https://github.com/antfu/vitesse-webext) 这里, 这个模板提供了相当多增强开发体验的工具, 写逻辑快人一步XD, 只能说还是 vite 的开发体验更吸引人啊。

## 使用到的组件开发方案

其实既然使用了 原子化CSS 的技术方案, 肯定还是 headless 的组件库来自己撸所有的交互组件。

正好在早前了解到了 [zag.js](https://zagjs.com/) , 提供底层的状态机描述 UI 的变化而不是提供组件, 这样就可以与原子化CSS的解决方案组合的同时支持不同的框架—— Vue,React,Solid 均支持, 如果对 headless ui 感兴趣的可以多了解了解, 也是原先 React 第三大 UI 库 [chakra-ui](https://github.com/chakra-ui) 的作者的新作品

## 设计方面

说实话再一些设计上尽量向舟味靠拢并参考了很多方舟官网的设计元素, 但是说实话还是感觉不太适合一个浏览器扩展。这方面确实有点小问题

## 规划

现在仅实现了一些基础信息,公招信息和日/周常的显示, 还有一块比较重要的内容就是基建~~小人打工~~不过已经在设计实现的过程中了
