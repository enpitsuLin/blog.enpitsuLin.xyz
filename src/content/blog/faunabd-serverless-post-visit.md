---
title: 基于Faunadb和serverless函数为你的静态博客增加阅读计数功能
date: 2022-04-12 15:04:00
tags: [Blog, Serverless]
excerpt: 对于基于Nextjs的静态站点生成计数的博客，为文章增加阅读计数功能不同于基于Wordpress等CMS框架的博客，但是如果使用Vercel等支持serverless函数的托管平台，我们可以比较轻易的集成一些数据库服务来做阅读计数功能。
---

博客由于全站都是静态导出的页面，没有后台服务器的接口支持，所以增加阅读计数这种简单的功能也无法实现

但是由于 [JAMStack](https://jamstack.org/) 概念的普及以及 Serverless 这个概念的出现一些网站托管平台如 Vercel/Netlify 均提供了 Serverless 函数服务，可以让我们的静态网站更简单的去集成一些 BaaS 来增加网站功能。

比如博客的评论功能就是集成了[giscus](https://giscus.app/)这个使用 Github Discussions 驱动的评论系统

# Firebase vs Faunadb

其实市面上有很多 SaaS 数据库服务，比如 firebase 或者 faunadb

firebase 背靠 google 功能强大，提供各种服务，包括认证、实时数据库、crashlytics、存储和无服务器云功能。

Faunadb 只是提供了一个简单的无服务器应用框架，可以提供 GraphQL API 来简化操作，但使用 Faunadb 来建立服务比起 firebase 简单得多，所以我就选择 faunadb 来构建我想要的阅读计数功能。

# 从 Fauna 开始

首先时[注册](https://dashboard.fauna.com/accounts/register)一个 Fauna 账户，

创建一个新的数据库，按照你喜欢的方式命名一下，然后新建一个 collection，命名为`visit`，过期时间和 TTL 可以就保持默认。

![new-collection|518x319](https://s3.bmp.ovh/imgs/2022/04/12/fde4c3413d92fdac.png)

接着我们创建一个新的索引，索引是 Faunadb 重要的一个属性，你只能查询索引。新建立的索引命名为`visit_by_slug`，terms 字段增加一个`data.slug`使用 data 中的 slug 字段作为索引

![new-index|497x637](https://s3.bmp.ovh/imgs/2022/04/12/41604ba62ee4d4fa.png)

我们可以在 collection 里面新增一个 document 来测试一下

![new-document|449x494](https://s3.bmp.ovh/imgs/2022/04/12/22f9b4feccfd86b3.png)

新增 document 很简单直接把 js 对象字面量表示出来就好，这里我的数据类型就是

```ts
interface Visit {
  slug: string
  count: number
}
```

然后在 Indexes 里对`visit_by_slug`索引进行搜索一下，可以得到相应的结果，可以看到结果中是将我们 document 中的数据包装在 data 字段中，这里就对应索引对应这 terms 字段了

![search](https://s3.bmp.ovh/imgs/2022/04/12/aa122e9865e7415f.png)

接下来的一系列 CURD 操作就可以在代码中操作了

## 获取 Token

我们在 Security 选项卡中新建一个 key，之后保存好，在项目环境列表中添加一项`FAUNADB_SECRET`，并且设置为相应的值，然后就可以在代码中使用`process.env.FAUNADB_SECRET`来获取。

本地调试可以放在`.env.local`中并排除在版本控制中防止泄露

![new-key|489x391](https://s3.bmp.ovh/imgs/2022/04/12/178476aad0e0b964.png)

# 项目中增加获取数据的逻辑

对于 Netlify 或者 Vercel 我们都可以使用 nextjs 的 [api 路由](https://nextjs.org/docs/api-routes/introduction)来访问到这两个平台的 serverless 函数功能

> 如果你的静态博客程序并不是使用 Nextjs 如 Hugo,Hexo,Nuxtjs,甚至 Vanilla 应该可以参考：
>
> - [Vercel docs](https://vercel.com/docs/concepts/functions/serverless-functions)
> - [Netlify docs](https://docs.netlify.com/functions/overview/)

## api 路由

按照我们的设计我们的 api 路由可以形成如下的伪代码

```
function visitPage(request) {
  connect to database;
  let slug = some parameter from the request
  if (slug is missing) {
    return 404 error;
  }
  if (!collection.exists(slug)) {
    database.createDocument({
      slug: slug,
      count: 0,
    })
  }
  document = database.query(slug);
  // Increment the # of hits, to account for
  // this current visitor
  document.update({
    count: document.hits + 1,
  })
  // Return the number of hits
  return { count: document.count };
}
```

我们的这个函数有几个职责~~不太符合单一职责原则，但是我觉得问题不大~~

- 新建一个 document 如果 slug 对应的 document 不存在
- 更新 document 的 count 字段使其 ++1
- 返回 document 的 count 字段

## 实现

首先我们为项目引入依赖

```sh
pnpm add faunadb
```

这里仅实现 Nextjs ，其他的静态生成器不是很熟就不献丑了

```ts:/pages/api/get-visit.ts
import { Client, query as q } from 'faunadb'
import { NextApiHandler } from 'next'

interface Visit {
  count: number
  slug: string
}

const client = new Client({
  secret: process.env.FAUNADB_SECRET
})

const handler: NextApiHandler = async (req, res) => {
  const slug = req.query.slug as string
  if (!slug) {
    res.status(400).json({
      message: 'slug is required'
    })
  }
  const isSlugExist = await client.query(q.Exists(q.Match(q.Index('visit_by_slug'), slug)))
  if (!isSlugExist) {
    client.query(
      q.Create(q.Collection('visit'), {
        data: {
          slug,
          count: 0
        }
      })
    )
  }

  const document = await client.query<{ ref: string, data: Visit }>(q.Get(q.Match(q.Index('visit_by_slug'), slug)))
  await client.query(q.Update(document.ref, { data: { count: document.data.count + 1 } }))

  res.status(200).json({
    message: 'get post visit success',
    count: document.data.count
  })
}

export default handler
```

## 展示到页面上

现在就可以访问`/api/get-visit`这个接口来获取数据了

对于我的博客我在文章头部展示了这个数据，对于其他情况也是访问这个接口然后再页面上渲染出来就行了。

```tsx:/src/components/PostHeader.tsx {13-20,53-58}
import formatDate from '@/lib/utils/formatDate'
import { PostFrontMatter } from '@/types/PostFrontMatter'
import { useEffect, useState } from 'react'
import PageTitle from './PageTitle'
import Tag from './Tag'

interface Props {
  frontMatter: PostFrontMatter
}

const PostHeader: React.FC<Props> = ({ frontMatter }) => {
  const { title, date, readingTime, tags, slug } = frontMatter
  const [visit, setVisit] = useState(0)

  useEffect(() => {
    fetch(`/api/get-visit?slug=${slug}`).then(async (response) => {
      const data = (await response.json()) as { count: number, message: string }
      setVisit(data.count)
    })
  }, [])
  return (
    <header className="pt-6 xl:pb-6">
      <div className="text-center space-y-12">
        <PageTitle>{title}</PageTitle>
        <div className="pb-6">
          <dl className="flex flex-wrap justify-center space-x-4">
            <div>
              <dt className="sr-only">Tags</dt>
              <dd className="text-base text-gray-500 font-medium leading-6 dark:text-gray-400">
                {tags.map(tag => (
                  <Tag key={tag} text={tag} />
                ))}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Published on</dt>
              <dd className="text-base text-gray-500 font-medium leading-6 dark:text-gray-400">
                <time dateTime={date}>{formatDate(date)}</time>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Reading time</dt>
              <dd className="text-base text-gray-500 font-medium leading-6 dark:text-gray-400">
                {Math.round(readingTime.minutes)}
                {' '}
                分钟阅读
              </dd>
            </div>
            <div>
              <dt className="sr-only">Word count</dt>
              <dd className="text-base text-gray-500 font-medium leading-6 dark:text-gray-400">
                约
                {' '}
                {readingTime.words}
                {' '}
                字
              </dd>
            </div>
            <div>
              <dt className="sr-only">Reads</dt>
              <dd className="text-base text-gray-500 font-medium leading-6 dark:text-gray-400">
                {visit}
                {' '}
                次阅读
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  )
}

export default PostHeader
```
