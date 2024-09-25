import type { MarkdownHeading } from 'astro'

export interface Toc extends MarkdownHeading {
  children: MarkdownHeading[]
}

export function buildToc(headings: MarkdownHeading[]) {
  return {
    headings,
    toc: {} as Toc,
  }
}
