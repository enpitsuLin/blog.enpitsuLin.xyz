import { renderToString } from 'react-dom/server';
import { dangerouslySkipEscape, escapeInject } from 'vite-plugin-ssr';
import type { PageContextBuiltIn } from 'vite-plugin-ssr/types';
import { localeDefault, locales } from '~/lib/locales';
import { buildSitemap } from './sitemap';
import type { OnBeforePrerender, PageContext } from './types';
import { Document } from './_document';

export { render };

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ['locale', 'pageProps', 'documentProps'];

async function render(pageContext: PageContextBuiltIn & PageContext) {
  const pageHtml = renderToString(<Document pageContext={pageContext} />);

  // See https://vite-plugin-ssr.com/html-head
  const { documentProps } = pageContext;
  const title = (documentProps && documentProps.title) || "enpitsulin's blog";
  const desc = (documentProps && documentProps.description) || 'Make things happy';

  const injected = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="apple-touch-icon" sizes="76x76" href="/static/favicons/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/static/favicons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/static/favicons/favicon-16x16.png"
        />
        <link rel="manifest" href="/static/favicons/site.webmanifest" />
        <link rel="mask-icon" href="/static/favicons/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        <link rel="alternate" type="application/rss+xml" href="/feed" />
        <link rel="sitemap" title="Sitemap" href="/sitemap.xml"/>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="description" content="${desc}" />
        <title>${title}</title>
      </head>
      <body class="bg-gray-100 text-black antialiased dark:bg-gray-900 dark:text-white transition-all duration-300">
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;

  return {
    documentHtml: injected,
    pageContext: {}
  };
}

export const onBeforePrerender: OnBeforePrerender = async ({ pageContexts }) => {
  await buildSitemap(pageContexts);
  pageContexts.forEach((context) => {
    context.locale = localeDefault;
    locales
      .filter((locale) => locale !== localeDefault)
      .forEach((locale) => {
        pageContexts.push({
          ...context,
          urlOriginal: `/${locale}${context.urlOriginal}`,
          locale
        });
      });
  });
};
