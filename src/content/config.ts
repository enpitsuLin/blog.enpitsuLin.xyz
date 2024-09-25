import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).optional(),
    lang: z.string().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().default(false),
  }),
})

const friends = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    url: z.string(),
    description: z.string(),
    favicon: z.string().or(z.object({
      light: z.string(),
      dark: z.string(),
    })),
  }),
})

export const collections = { blog, friends }
