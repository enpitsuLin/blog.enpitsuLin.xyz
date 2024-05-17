import type { MarkdownHeading } from 'astro';
import type { Link, List, Paragraph, Text } from 'mdast';
import { For, createEffect, createSignal, type Component } from 'solid-js';

interface TocItem extends MarkdownHeading {
  children: TocItem[];
}

interface TocOpts {
  maxHeadingLevel?: number | undefined;
  minHeadingLevel?: number | undefined;
}

/** Inject a ToC entry as deep in the tree as its `depth` property requires. */
function injectChild(items: TocItem[], item: TocItem): void {
  const lastItem = items.at(-1);
  if (!lastItem || lastItem.depth >= item.depth) {
    items.push(item);
  } else {
    injectChild(lastItem.children, item);
    return;
  }
}

export function generateToc(
  headings: ReadonlyArray<MarkdownHeading>,
  { maxHeadingLevel = 4, minHeadingLevel = 2 }: TocOpts = {},
) {
  // by default this ignores/filters out h1 and h5 heading(s)
  const bodyHeadings = headings.filter(
    ({ depth }) => depth >= minHeadingLevel && depth <= maxHeadingLevel,
  );
  const toc: Array<TocItem> = [];

  for (const heading of bodyHeadings) injectChild(toc, { ...heading, children: [] });

  return toc;
}

function useActiveId(itemIds: string[]) {
  const [activeId, setActiveId] = createSignal(``);
  createEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: `0% 0% -90% 0%` }
    );
    itemIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });
    return () => {
      itemIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [itemIds]);
  return activeId;
}

const TocHeading: Component<{ toc: TocItem, activeSlug: string }> = (props) => {
  return (
    <li
      classList={{
        'ml-2': props.toc.depth > 2
      }}
    >
      <a
        aria-label={`Scroll to section: ${props.toc.text}`}
        class="block line-clamp-2 hover:text-neutral"
        classList={{
          'mt-3': props.toc.depth <= 2,
          "mt-3 text-0.75rem": props.toc.depth > 2,
          "text-neutral-700 dark:text-neutral": props.activeSlug === props.toc.slug
        }}
        href={`#${props.toc.slug}`}
      >
        <span class='mr-0.5'></span>
        # {props.toc.text}
      </a>
      {!!props.toc.children && (
        <ul>
          <For each={props.toc.children}>
            {item => (<TocHeading toc={item} activeSlug={props.activeSlug} />)}
          </For>
        </ul>
      )}
    </li>
  )
}

export const PostToc: Component<{ headings: MarkdownHeading[] }> = (props) => {
  let containerRef: HTMLDivElement | undefined;

  const [maxWidth, setMaxWidth] = createSignal(0);

  createEffect(() => {
    if (containerRef) {
      setMaxWidth(
        (window.innerWidth - (containerRef?.parentElement?.clientWidth || 0)) /
        2 -
        40
      );
    }
  });

  const toc = generateToc(props.headings)
  const activeSlug = useActiveId(props.headings.map(i => i.slug));

  return (
    <div
      ref={containerRef}
      class="absolute left-full pl-10 h-full top-0"
      classList={{
        'hidden lg:block': maxWidth() > 40,
        hidden: maxWidth() < 40
      }}
      style={{
        'max-width': maxWidth() > 40 ? maxWidth() + 'px' : 0
      }}
    >
      <div class="sticky top-14 text-sm truncate leading-loose">
        <ul class="mt-4 text-xs">
          <For each={toc}>
            {(item) => <TocHeading toc={item} activeSlug={activeSlug()} />}
          </For>
        </ul>
      </div>
    </div>
  );
};
