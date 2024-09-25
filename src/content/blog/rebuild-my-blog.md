---
title: 使用Nextjs重构我的博客
date: 2022-03-30 09:34:00
tags: [Blog, Nextjs, Tailwind]
excerpt: 又到了一年一度鼓捣博客的时间咳咳，因为升级 gatsby 导致仓库收到太多依赖警告了，同时意识到大而全的框架的一些缺点，所以决定抛弃 Gatsby 转而使用 Nextjs
---

又到了一年一度鼓捣博客的时间~~咳咳~~，因为升级 gatsby 导致仓库收到太多依赖警告了，同时意识到大而全的框架的一些缺点，所以决定抛弃 Gatsby 转而使用 Nextjs

# Gatsby vs Nextjs

同为 React 生态中的页面构建框架，他们均提供了 SSG 的功能，作为一个简单的博客仅静态导出就完全能够达到我的需求了。

对于页面数据的获取上，Gatsby 和 Nextjs 差异在于 Nextjs 允许从任意的数据源获取数据，仅仅需要在指定生命周期函数`getStaticProps`中返回相应的值即可，但是 gatsby 的数据源是基于`graphql`的，但是很多实现均依赖插件，很大程度上依赖社区和官方的工作。

当前文章内容都是通过本地文件系统保存，使用 Gatsby 和 Nextjs 基本等效，但是对于 Typescript 的支持 Nextjs 远远的将 Gatsby 甩在后面

# 使用模板

本身是想将原先的使用 Nextjs 复现然后再进行更改，但是中途发现使用 [MDX](https://mdxjs.com/) 来构建文章会比纯 markdown 的展示效果更好。

但是在集成的过程中发现在 Nextjs 中使用 MDX 如果不作为 pages 页面交给 Nextjs 处理则无法进行很好的自定义，但是通过`next-mdx-remote` 或 `mdx-bundler`在渲染的时候需要使用`new Function()`

虽然最后解决了这个问题，但是觉得不是很优雅，然后在寻找解决方法的过程中发现了一个[模板](https://github.com/timlrx/tailwind-nextjs-starter-blog)，同时此模板使用了[tailwindcss](https://tailwindcss.com/)，近期我也总是有在使用同类型的[windicss](https://windicss.org/)~~因为之前 tailwind 没有 JIT 模式~~

然后就转而使用该模板，很多布局我觉得挺不错的，但是其中的一些功能和页面展示样式我觉得还是需要改进，首页之类的还过于简陋。

# 内容管理

在先前 Gastby 最后的版本中我使用了 Netlify CMS 来管理内容，基本也形成了 JAMStack 的结构，但是使用体验来说着实还是差点，作为内容管理我觉得使用体验不是很到位。

中途也尝试用 Notion 来做内容管理，但多多少少又一些不如直接 markdown 来的效果好

## 使用额外的内容管理

现在目标是通过 Sukka 大佬的这篇文章[使用 Next.js + Hexo 重构我的博客](https://blog.skk.moe/post/use-nextjs-and-hexo-to-rebuild-my-blog/)的启发使用 hexo 与 nextjs 整合或者与 [contentlayers](https://github.com/contentlayerdev/contentlayer) 结合。

### contentlayer

这个包的野心很大，目标是整合各种内容源——无论是本地文件如 MDX、markdown、json、纯文本或者是 CMS 都可以通过其进行管理

但其部分目标功能处于 wip 状态，不过可能的未来能和 notion 集成我觉得挺香的。

### hexo

Hexo 不仅是一个静态站点生成器，其内部的数据库还暴露了一系列 api 可以直接操作本地的文章

这部分可以参考 Sukka 大佬的文章和 hexo 官方文档，而且有一方面的优点 hexo 可以基于文件系统将数据持久化，这个可以让构建省去一部分的时间资源

同时 hexo 集成的一些功能如 rss 和 sitemap 生成可以让我将现有的此部分内容重构为更简单的代码，还有很多 hexo cli 能提供的功能也是很香

# 集成 i18n

其实国际化似乎对于我这个小博客没有什么多大的作用，但是一直在工作中用不上，就算是为以后的英文文章铺路？会有吗？

## next-translate

其实看仓库的提交记录就知道一开始是选择`next-i18next`来做 i18n 的但是发现需要对所有动态路由手动增加 props，十分的麻烦，然后还是使用了`next-translate`

日后的计划是对文章的 frontmatter 增加额外的 `lang` 属性用于标识语言,然后在文章列表显示语言标签来标识文章内容的语言，以及可能未来有的双语文章中切换语言就以后在做额外的处理吧。

不过格式化时间字符串似乎还是跟随读者的语言而变化的，这个还是有待改善的。

~~做字符串翻译工作也好费时间~~

# 解析域名

挂载 github 或者 vercel 看着怪 low 的，于是~~斥巨资~~购买了一个`enpitsulin.xyz`域名然后去 vercel 控制台绑定`blog.enpitsulin.xyz`，然后在阿里云的控制台按照 vercel 给出的记录添加解析设置，然后稍等一会就行了

但是好像现在还是要挂梯子，这部分以后在调整吧。

然后根域名就备案了放着为以后做学习用途吧。
