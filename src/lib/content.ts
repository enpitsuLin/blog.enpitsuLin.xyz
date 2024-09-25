import { getCollection, getEntryBySlug } from 'astro:content'

interface ContentOptions {
  limit?: number
  skip?: number
}

const blogCollection = await getCollection('blog')
  .then(res => res.filter(p => !p.data.draft).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()))

export async function usePost(slug: string) {
  const entry = await getEntryBySlug('blog', slug)
  return entry
}

export function usePosts(option?: ContentOptions) {
  return [...blogCollection]
    .slice(option?.skip ?? 0, option?.limit ? (option?.skip ?? 0 + option?.limit) : undefined)
}

export function usePostsSlug() {
  return blogCollection.map(item => item.slug)
}

export const usePostsCount = () => blogCollection.length + 1

export function useAllTags() {
  return Array.from(
    new Set(blogCollection.map(post => post.data.tags)
      .filter(Boolean as unknown as ((a: string[] | undefined) => a is string[]))
      .flat(),
    ),
  )
}

export function usePostsByTag(tag: string) {
  return blogCollection.filter(item => item.data.tags?.includes(tag))
}

export function useArchives() {
  return blogCollection
}
