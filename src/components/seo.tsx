/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import React, { FunctionComponent } from 'react';
import { Helmet } from 'react-helmet';
import useSiteMetadata from '@/hooks/useSiteMetadata';

interface Meta {
  name?: string;
  property?: string;
  content?: string;
}

interface Props {
  title: string;
  lang?: string;
  meta?: Meta[];
  keywords?: string[];
  description?: string;
}

const Seo: FunctionComponent<Props> = ({ description, lang, meta, title }) => {
  const { site } = useSiteMetadata();

  const metaDescription = description || site?.siteMetadata?.description;
  const defaultTitle = site?.siteMetadata?.title;
  const defaultMeta: Meta[] = [
    {
      name: `description`,
      content: metaDescription
    },
    {
      property: `og:title`,
      content: title
    },
    {
      property: `og:description`,
      content: metaDescription
    },
    {
      property: `og:type`,
      content: `website`
    }
  ];

  return (
    <Helmet
      htmlAttributes={{
        lang
      }}
      title={title}
      titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : null}
      meta={defaultMeta.concat(meta ? meta : [])}
      link={[
        { rel: 'stylesheet', href: '//cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css' },
        {
          href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css',
          rel: 'stylesheet',
          integrity: 'sha384-dRYOpy/KcUgZUv3UgAdBrl5jPEmH+fTv2Vu1Bq4Wsr2/779iKnon9o5hZZVSM76I',
          crossOrigin: 'anonymous'
        }
      ]}
    >
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-KIT91OlDmsIXvQaqzxNONuO4ve97S3yDh9A0nea67fEK+03Wdyc/3oGgd0+DPaf7"
        crossOrigin="anonymous"
      ></script>
    </Helmet>
  );
};

Seo.defaultProps = {
  lang: `zh-Hans`,
  meta: [],
  description: ``
};

export default Seo;
