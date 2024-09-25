import cloudflare from '@astrojs/cloudflare'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import solidJs from '@astrojs/solid-js'

import { defineConfig } from 'astro/config'
import { toc } from 'mdast-util-toc'
import { refractor } from 'refractor/lib/all'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrismDiff from 'rehype-prism-diff'
import rehypePrismGenerator from 'rehype-prism-plus/generator'
import rehypeRewrite from 'rehype-rewrite'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'
import remarkEmoji from 'remark-emoji'
import remarkCodeTitles from 'remark-flexible-code-titles'
import Unocss from 'unocss/astro'

refractor.alias('html', ['vue', 'svelte'])
const rehypePrismPlus = rehypePrismGenerator(refractor)

const remarkPlugins = [
  remarkEmoji,
  [
    remarkCodeTitles,
    {
      title: false,
      containerProperties: (lang, title) => ({
        'data-language': lang,
        'data-title': title,
      }),
    },
  ],
  () => (tree, file) => {
    file.data.astro.frontmatter.toc = toc(tree, {
      tight: true,
      ordered: true,
    })
  },
  remarkDirective,
  remarkDirectiveRehype,
]
const rehypePlugins = [
  [rehypePrismPlus, { ignoreMissing: true }],
  rehypePrismDiff,
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    {
      behavior: 'append',
      properties: {
        ariaHidden: 'true',
        tabIndex: -1,
        className: ['ml-2'],
      },
      content: {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['op-0', 'group-hover:op-80', 'i-ri:links-fill', 'w-4', 'h-4'],
        },
      },
    },
  ],
  [
    rehypeRewrite,
    {
      rewrite: (node) => {
        if (node.type === 'element' && node.tagName === 'img') {
          node.properties = Object.assign(node.properties || {}, {
            'data-zoomable': true,
            'loading': 'lazy',
          })
        }
        if (node.type === 'element' && ['h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) {
          node.properties = Object.assign(node.properties || {}, {
            className: 'group flex items-center',
          })
        }
      },
    },
  ],
]

export default defineConfig({
  site: 'https://enpitsulin.xyz',
  integrations: [mdx(), sitemap(), Unocss(), solidJs()],
  output: 'server',
  adapter: cloudflare(),
})
