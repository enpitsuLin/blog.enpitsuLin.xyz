import type { APIRoute } from 'astro'
import rss from '@astrojs/rss'
import { usePosts } from '~/lib/content'
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts'

export const get: APIRoute = async (context) => {
  const posts = usePosts()
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site?.toString() ?? '',
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`,
      description: post.data.excerpt,
    })),
  })
}
