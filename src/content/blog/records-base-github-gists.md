---
title: 使用Nextjs、Github Gists创建阅读观影纪录应用
date: 2022-04-08 20:26:00
tags: [Github, Nextjs]
excerpt: 仅使用Nextjs与Github Gists创建观影纪录应用，无需后端服务器与数据库，可以直接托管在Vercel上或者使用Nextjs的静态导出功能导出为静态页面部署在你喜欢的托管平台比如Github pages
---

# 前言

重新开发部署博客到后深刻地体会到 Nextjs 这个 react 元框架的优秀之处，于是就基于 Nextjs 创建一个简单的应用用于记录自己的读书观影记录

# JAMStack

使用 Nextjs、使用 Github Gists 作为数据来源，使用 windicss 简化应用样式

比较简单的实现了一个[JAMStack 结构](https://jamstack.org/)

## 创建 Nextjs 应用

Next 官方并没有一个 windicss 的模板，我们直接从零开始构建一个项目

## 创建项目文件夹

```sh
mkdir records
cd records
```

## 初始化项目

```sh
pnpm init
git init #或许可选?
```

### 安装依赖

```sh
pnpm add next react react-dom @octokit/core
pnpm add -D @types/node @types/react @types/react-dom typescript windicss windicss-webpack-plugin
```

其中 `@octokit/core`是 github 官方 api 的 js client,我们通过这个包来获取 Github Gists 的内容来生成页面

在`package.json`中新增一个 script

```json:package.json diff
{
    ...
    "scripts":{
+        "dev":"next",
    }
}
```

### 配置 windicss

在项目根目录下新建`next.config.js`

```js:next.config.js
const WindiCSSWebpackPlugin = require('windicss-webpack-plugin')

/** @type {import('next').NextConfig} */
const config = {
  webpack(config) {
    config.plugins.push(new WindiCSSWebpackPlugin())
    return config
  }
}
module.exports = config
```

然后我们新建一个 pages 目录用于放置 nextjs 基于约定的路由页面, 里面新建`_app.tsx`文件

在顶端引入`import 'windi.css'`并[自定义 App](https://nextjs.org/docs/advanced-features/custom-app)

```tsx:pages/_app.tsx
import { AppProps } from 'next/app'
import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import 'windi.css'

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <Head>
        <title>我看过的</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </Head>
      <Component {...pageProps}></Component>
    </ThemeProvider>
  )
}

export default App
```

## 创建页面

在 pages/下新建一个`index.tsx`,这是应用的根页面,我们先创建一个空页面

```tsx:pages/index.tsx
const Home: React.FC<Props> = ({ records }) => {
  return <div></div>
}

export default Home
```

## 创建组件

我们需要一个卡片组件用于展示记录的信息,新建一个`components/card.tsx`简单的设置下卡片样式

```tsx:components/card.tsx
const Card: React.FC = () => {
  return (
    <section className="before:content-open-quote relative pb-10 before:(absolute inset-y-0 border-l-2 -left-30px) first:before:top-1 last:before:bottom-10">
      content
    </section>
  )
}
export default Card
```

然后我们先定义一个 interface 用于描述记录的信息,顺便导出一下

```ts
export interface RecordItem {
  /** 名称 */
  title: string
  /** 分类 */
  type: 'anime' | 'book' | 'tv' | 'movie'
  /** 发布年份 */
  year: number
  /** 封面图片url */
  cover: string
  /** 评分 */
  score: 1 | 2 | 3 | 4 | 5
  /** 观看日期 */
  date: string
  /** 评论 */
  comment: string
}
```

然后我们借助这个类型将组件完善一下,其中使用 next/image 来图片优化

如果选择 SSG 的话,可以直接使用 img 标签以及把对应的图片资源放在 public 下做[静态文件服务](https://nextjs.org/docs/basic-features/static-file-serving)或者使用图床链接~~如果准备托管到 Vercel 就直接使用 Image 组件~~

```tsx:components/card.tsx
import Image from 'next/image'
import { useState } from 'react'

export interface RecordItem {
  /** 名称 */
  title: string
  /** 分类 */
  type: 'anime' | 'book' | 'tv' | 'movie'
  /** 发布年份 */
  year: number
  /** 封面图片url */
  cover: string
  /** 评分 */
  score: 1 | 2 | 3 | 4 | 5
  /** 观看日期 */
  date: string
  /** 评论 */
  comment: string
}

const Score: React.FC<Pick<RecordItem, 'score'>> = ({ score }) => {
  switch (score) {
    case 1:
      return <big className="text-gray-500 font-bold">🍅 烂</big>
    case 2:
      return <big className="text-green-500 font-bold">🥱 无聊</big>
    case 3:
      return <big className="text-blue-500 font-bold">🤔 还行</big>
    case 4:
      return <big className="text-violet-500 font-bold">🤩 值得一看</big>
    case 5:
      return <big className="text-orange-500 font-bold">💯 神作！</big>
  }
}

function renderType(type: RecordItem['type']) {
  const typeMap = {
    movie: '电影',
    tv: '剧集',
    book: '书籍',
    anime: '动漫'
  }
  return typeMap[type] ?? '未知'
}

export const Card: React.FC<RecordItem> = (props) => {
  const [loading, setLoading] = useState(true)
  const loadingClasses
    = 'backdrop-filter backdrop-grayscale backdrop-blur-lg transform  scale-110 hover:opacity-75 duration-300 ease-in-out'
  const loadedClasses
    = 'backdrop-filter backdrop-grayscale-0 backdrop-blur-0 transform  scale-100 hover:opacity-75 duration-300 ease-in-out'
  const classes = loading ? loadingClasses : loadedClasses

  return (
    <section className="before:content-open-quote relative pb-10 before:(absolute inset-y-0 border-l-2 -left-30px) first:before:top-1 last:before:bottom-10">
      <p className="relative mb-2 text-sm sm:mb-3 sm:text-base">
        {new Date(props.date).toLocaleDateString()}

        <i className="absolute top-1/2 h-4 w-4 translate-y-[-50%] transform rounded-full bg-gray-200 -left-9" />
      </p>
      <div className="flex justify-between">
        <div className="mr-2 flex-1">
          <p className="text-md mb-2 leading-6 sm:mb-3 sm:text-2xl">
            {props.title}
            <span>
              （
              {props.year}
              ）
            </span>
          </p>

          <p className="text-base md:text-sm">
            <span>评分：</span>
            <Score score={props.score} />
          </p>

          <p className="text-base md:text-sm">
            <span>分类：</span>
            {renderType(props.type)}
          </p>

          <div className="md:text-x mt-4 text-sm text-gray-700 dark:text-gray-300">{props.comment}</div>
        </div>
        <div className="w-87px overflow-hidden rounded-xl md:rounded-md">
          <Image
            src={props.cover}
            layout="fixed"
            width={87}
            height={116}
            objectFit="cover"
            alt={props.title}
            className={classes}
            onLoadingComplete={() => setLoading(false)}
          />
        </div>
      </div>
    </section>
  )
}
```

如果使用了 next/image 组件，我们需要修改一下 next.config.js 文件，添加[图片域名配置](https://nextjs.org/docs/api-reference/next/image#domains),添加封面图片可能的域名

```js:next.config.js {9-11}
const WindiCSSWebpackPlugin = require('windicss-webpack-plugin')

/** @type {import('next').NextConfig} */
const config = {
  webpack(config) {
    config.plugins.push(new WindiCSSWebpackPlugin())
    return config
  },
  images: {
    domains: ['img1.doubanio.com', 'img2.doubanio.com', 'img3.doubanio.com', 'img9.doubanio.com']
  }
}
module.exports = config
```

然后可以在 pages/index.tsx 设置看看效果

```tsx:pages/index.tsx {1,6-14}
import Card from 'components/Card.tsx'

const Home: React.FC<Props> = ({ records }) => {
  return (
    <div>
      <Card
        title="猎罪图鉴"
        type="tv"
        year={2022}
        cover="https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2647399331.webp"
        score={4}
        date="2022-04-02"
        comment="国产刑侦剧，除了最后关于程序员的部分有点让从业者尴尬，总体感觉值得一看"
      />
    </div>
  )
}

export default Home
```

## 设置和获取数据

首先我们以设定好的[先新建一个 json 格式的 Gist](https://gist.github.com/),我们 gist 中每一个 file 就是一条记录按照设定的类型如下

```json
{
  "title": "猎罪图鉴",
  "type": "tv",
  "year": 2022,
  "cover": "https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2647399331.webp",
  "score": 4,
  "date": "2022-04-02",
  "comment": "国产刑侦剧，除了最后关于程序员的部分有点让从业者尴尬，总体感觉值得一看"
}
```

如果想直接新建多条可以点击`Add file`,然后`Create public gist`或者`Create private gist`,

然后记住这条 Gist 的 id `https://gist.github.com/enpitsuLin/<gist id>`,新建一个`.env`文件，添加如下内容

```
GIST_ID=<gist id>
```

### 获取 token

如果你的 gist 是 private 的则需要[新建 token](https://github.com/settings/tokens/new),过期时间建议不过期,然后也在`.env`文件中添加如下内容

```{2}
GIST_ID=<gist id>
GIT_TOKEN=<token>
```

当然这一部分建议不要上传至代码库，因为这样会导致你的 token 被泄露，如果使用 Vercel 托管就到 settings 里写入 Environment Variables

### 获取数据

新增`lib/get-records.ts`文件用于获取数据的逻辑

```ts:lib/get-records.ts
import { Octokit } from '@octokit/core'

const octokit = new Octokit({ auth: process.env.GIT_TOKEN })

export async function getRecords() {
  const res = await octokit.request('GET /gists/{gist_id}', { gist_id: process.env.GIST_ID })
  return res
}
```

这里有几种方法在页面中拿到数据,使用`getStaticProps`/`getServerSideProps`,或者在页面中使用 fetch 或者 xhr 获取数据并渲染~~推荐使用 swr~~

如果目的是创建一个静态页面的话只能使用`getStaticProps`或者在页面运行是的时候获取数据

如果是托管在 Vercel 之类的网站托管服务或者自己的服务器部署的话可以使用`getServerSideProps`

#### getStaticProps

使用 getStaticProps 则只能获取在每次构建的时候的数据,用于 ssg 最好但是数据不及时

```tsx:pages/index.tsx {2-33,35,38-40}
import { Card } from 'components/Crad'
import { getRecords } from 'lib/get-records'
import { GetStaticProps } from 'next'
import { RecordItem } from 'types/records'

interface Props {
  records: RecordItem[]
}

function filterTruthy<T>(x: T | false): x is T {
  return Boolean(x)
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data } = await getRecords()
  const records = Object.keys(data.files)
    .map((key) => {
      try {
        return JSON.parse(data.files[key].content) as RecordItem
      }
      catch (error) {
        return false
      }
    })
    .filter(filterTruthy)

  return {
    props: {
      records: records.sort((a, b) => {
        return new Date(a.date) < new Date(b.date) ? 1 : -1
      })
    }
  }
}

const Home: React.FC<Props> = ({ records }) => {
  return (
    <div>
      {records.map(record => (
        <Card {...record} key={record.title} />
      ))}
    </div>
  )
}

export default Home
```

使用 getServerSideProps 的话则和 getStaticProps 基本一致但是需要托管在平台上或者自己部署

如果在运行时获取的话需要在`useEffect`中获取或者使用 swr 的`useSWR`,具体就不展示这两种用法了

### 优化样式

最后再美化一下页面布局然后可以增加多主题功能,还有列表懒加载之类的功能

# 效果

[仓库](https://github.com/enpitsuLin/octokit-records)
[页面](https://records.enpitsulin.xyz/)
