import { formatDate } from '@packages/lib/locale'
import { PostFrontMatter } from '@/types/PostFrontMatter'
import useTranslation from 'next-translate/useTranslation'
import { useState, useEffect } from 'react'
import PageTitle from './PageTitle'
import Tag from './Tag'
import siteMetadata from 'data/siteMetadata'

interface Props {
  frontMatter: PostFrontMatter
}

const PostHeader: React.FC<Props> = ({ frontMatter }) => {
  const { title, date, readingTime, reads, slug } = frontMatter
  const { t } = useTranslation('common')

  useEffect(() => {
    fetch(`/api/get-visit?slug=${slug}`)
  }, [])
  return (
    <header className="pt-6 xl:pb-6">
      <div className="space-y-12 text-center">
        <PageTitle>{title}</PageTitle>
        <div className="pb-6">
          <dl className="flex justify-center flex-wrap space-x-4">
            <div>
              <dt className="sr-only">{t('post.published-on')}</dt>
              <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
              </dd>
            </div>
            <div>
              <dt className="sr-only">{t('post.reading-time')}</dt>
              <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                {t('post.reading-time-var', { time: Math.round(readingTime.minutes) })}
              </dd>
            </div>
            <div>
              <dt className="sr-only">{t('post.words-count')}</dt>
              <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                {t('post.words-count-var', { words: readingTime.words })}
              </dd>
            </div>
            <div>
              <dt className="sr-only">{t('post.reads')}</dt>
              <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                {t('post.reads-var', { reads })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  )
}

export default PostHeader
