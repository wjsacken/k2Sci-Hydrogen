import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import {PageHeader, Section} from '~/components';
import {ATTR_LOADING_EAGER} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import styles from '../../../styles/custom-font.css';
import {routeHeaders, CACHE_LONG} from '~/data/cache';

const BLOG_HANDLE = 'News';

export const headers = routeHeaders;

export const links = () => {
  return [{rel: 'stylesheet', href: styles}];
};

export async function loader({request, params, context}) {
  const {language, country} = context.storefront.i18n;

  invariant(params.journalHandle, 'Missing journal handle');

  const {blog} = await context.storefront.query(ARTICLE_QUERY, {
    variables: {
      blogHandle: BLOG_HANDLE,
      articleHandle: params.journalHandle,
      language,
    },
  });

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  const article = blog.articleByHandle;

  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article?.publishedAt));

  const seo = seoPayload.article({article, url: request.url});

  return json(
    {article, formattedDate, seo},
    {
      headers: {
        'Cache-Control': CACHE_LONG,
      },
    },
  );
}

export default function Article() {
  const {article, formattedDate} = useLoaderData();

  const {title, image, contentHtml, author} = article;

  return (
    <div className="justCent grid">
      <div className="container">
        <PageHeader heading={title} variant="blogPost">
          <br></br>
          <span>
            {formattedDate} &middot; {author.name}
          </span>
        </PageHeader>
        <Section as="article" padding="x">
          {image && (
            <Image
              data={image}
              className="w-full mx-auto mt-8 md:mt-16 max-w-7xl"
              sizes="90vw"
              widths={[400, 800, 1200]}
              width="100px"
              loading={ATTR_LOADING_EAGER}
              loaderOptions={{
                scale: 2,
                crop: 'center',
              }}
            />
          )}
          <div
            dangerouslySetInnerHTML={{__html: contentHtml}}
            className="article"
          />
        </Section>
      </div>
    </div>
  );
}

const ARTICLE_QUERY = `
  query ArticleDetails(
    $language: LanguageCode
    $blogHandle: String!
    $articleHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
`;
