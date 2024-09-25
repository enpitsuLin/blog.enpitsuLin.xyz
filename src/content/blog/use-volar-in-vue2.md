---
title: 在Vue2项目中使用composition-api和setup
date: 2021-10-17 22:32:00
tags: [Vue]
excerpt: 虽然Vue已经发布,但是仍然有很多项目使用Vue2。在使用Vue2进行开发的情况下,选择更好的方式来开发以及使用一些新的技术来提升开发体验和开发效率。
---

公司项目除了由我创建的基本都是 Vue2 项目，众所周知 Vue2 原先的插件 Vetur 需要开启`"vetur.experimental.templateInterpolationService"`选项才能提供模板中代码补全的能力，增加`@vue/composition-api`也是可以使用的,但是增加上用于解决使用 composition-api 造成 return 的变量过多问题的`unplugin-vue2-script-setup`就不太好使了,所以需要引入一些东西来增强这种开发环境下的体验。

# Vue2 使用 composition-api

在 Vue3 还没正式发布的时候 vue2 就有`@vue/composition-api`来支持在 vue2 中使用组合式 api 了。

[@vue/composition-api](https://github.com/vuejs/composition-api)

按照文档中的给出的配置就可以使用了

# 增加对 Vue2 的 setup 语法糖支持

[unplugin-vue2-script-setup](https://github.com/antfu/unplugin-vue2-script-setup/)是 vue 团队核心成员[Anthony Fu](https://antfu.me/)基于他自己开发的对 Rollup 和 webpack 插件的兼容工具开发的一个让 Vue2 项目也能使用 setup 语法糖甚至于 ref 语法糖的插件，具体使用方法可以去仓库里看。

但是使用上这个插件后，Vetur 的提示功能基本就下线了 而且会提示没有默认导出，开发体验不是很好,接下来就是请出 Vue3 推荐的 Volar 了

# 使用 Volar

虽然是 Vue3 专用的插件但是支持 Vue2 也是没问题的。

首先 Volar 是使用`@vue/runtime-dom`来获得对 Vue 文件的类型检查，而 Vue2 中没有这个包，所以我们需要手动安装

```bash
npm install -D @vue/runtime-dom
```

然后在项目的 jsconfig.json 中增加下面两个设置

```json:tsconfig.json
{
  "compilerOptions": {
    ...，
    "types": ["unplugin-vue2-script-setup/types"],
  },
  "vueCompilerOptions": {
    "experimentalCompatMode": 2
  }
}
```

关闭 Vetur 开启 Volar 然后等待 Vue language server 启动，打开 Vue 文件应该能享受到更加美好的开发体验了。

# 一点不足

对于 setup 语法糖引入的组件 Volar 不能很好的对其做出正确的代码染色和类型补全,所以我建议将对组件的命名和子组件引入分开到另一个 script 代码块，如

```html
<script>
  import { defineComponent } from '@vue/composition-api'
  import HelloWorld from './components/HelloWorld.vue'

  export default defineComponent({
    name: 'App',
    components: { HelloWorld },
  })
</script>
<script setup>
  import { ref } from '@vue/composition-api'

  const count = ref(0)
  const countAdd = () => {
    count.value++
  }
</script>
```

因为反正都要将组件命名的，正好也能解决这个小问题，那就这样吧
