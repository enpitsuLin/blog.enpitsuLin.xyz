---
title: node-sass 安装失败解决方案
date: 2020-08-14 22:12:00
tags: [Node.js]
updateDate: 2022-03-29 14:23:00
excerpt: 由于某些不可描述的原因,使用node包管理器安装node-sass无论什么环境下总是会出现下载安装失败...
---

> node-sass _[已经被废弃](https://sass-lang.com/blog/libsass-is-deprecated)_，dart-sass 是官方推荐的选择，也不会遇到本文的问题 现在 npm 上安装 sass 默认已经是 dart-sass 了 —— 2022-3-29

# node-sass

node-sass 是我们开发中很常见的依赖包，也是安装时间冗长和最常见到报错的依赖。无论是自己的项目想要使用还是使用他人的项目进行依赖安装,运行

```shell
npm install
```

总是会出大大小小的毛病

# 解决

遇到问题肯定是找搜索引擎啊,基本检索 node-sass 就会出现[失败,fail]等关键词联想=。=说明这个问题真的是非常普遍。然后简单记录下各种方法还有自己的方法。

## 这里是一些前人经验:

## 因为 npm 源速度慢导致的下载失败

一般来说都是推荐直接使用 cnpm 下载能够改善

```shell
cnpm install
```

或者更改源设置更完美,没有一些隐性 bug 出现.

```shell
npm config set registry https://registry.npm.taobao.org
```

或者可以仅将 node-sass 的下载源更改成淘宝镜像

```shell
npm config set sass-binary-site http://npm.taobao.org/mirrors/node-sass
```

## 因为二进制文件源访问速度慢或无法访问

node-sass 除了 npm 部分的代码，还会下载二进制文件，但是默认源是 github，总所周知,github 国内访问较慢,特殊时期甚至无法访问。我们也可以将其改成国内源,直接添加一条环境变量:

```shell
set SASS_BINARY_SITE=https://npm.taobao.org/mirrors/node-sass/ && npm install node-sass
```

或者可以在项目内添加一条<code>.npmrc</code> 文件然后添加

```
sass_binary_site=https://npm.taobao.org/mirrors/node-sass/
```

这样使用 npm 安装 node-sass 时就会去淘宝镜像下载二进制文件了.

# 最终解决方法

最终解决方法!使用梯子并设置代理

```shell
npm config set proxy http://127.0.0.1:#你梯子开启的本地端口#
npm install node-sass

# 下载完成后删除 http 代理
npm config delete proxy
```

# 特殊手段解决

如果是因为下载失败的原因,那么我们可以提前下载到本地,先是查询系统的版本确定适合哪个版本的二进制文件.

查询指令如下

```shell
node -p "[process.platform, process.arch, process.versions.modules].join('-')"
```

然后会弹出<code>win32-x64-83</code>形式的系统版本,然后在下面两个地址中选择一个去下载对应系统版本的后缀为 .node 的 node-sass 文件

> cnpm https://npm.taobao.org/mirrors/node-sass/
>
> github https://github.com/sass/node-sass/releases

然后我们需要手动指定 node-sass 二进制文件的下载源为下载的那个文件.

```shell
npm config set sass-binary-path 你存放刚才下载的二进制文件的目录
// 例如 npm config set sass-binary-path e:/web/win32-x64-48_binding.node
```

然后<code>npm i</code>应该就完事了,但是这个方法的确定就是无法更新 node-sass 的版本了,建议前面的方法都解决不了在尝试.
