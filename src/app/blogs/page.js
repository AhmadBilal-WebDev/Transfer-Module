import React from 'react';
import moment from 'moment';
import Image from 'next/image';
import Link from 'next/link';
import BlogPagination from './BlogPagination';
import { HiArrowUpRight } from 'react-icons/hi2';
import { IoBookOutline, IoTimeOutline } from 'react-icons/io5';
import { playfair, inter } from '@/lib/fonts';
import styles from './Blogs.module.css';

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';

const formatDate = (value) => {
  if (!value) return '';
  const parsed = moment(value, 'DD-MM-YYYY HH:mm:ss', true);
  if (parsed.isValid()) return parsed.format('D MMM YYYY');
  return moment(value).isValid() ? moment(value).format('D MMM YYYY') : '';
};

const getCategoryLabel = (post) =>
  post?.category?.name ||
  post?.categories?.[0]?.name ||
  post?.tags?.[0]?.name ||
  'Travel Journal';

export default async function page({ searchParams }) {
  const resolvedParams = await searchParams;
  const page = resolvedParams?.page || 1;

  let blogs = [];
  let paggination = {};
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/blogs?page=${page}`;
    const res = await fetch(url, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await res.json();
    if (response?.Success) {
      blogs = response?.Content?.posts || [];
      paggination = response?.Content?.pagination || {};
    }
  } catch (error) {
    console.error('Fetch Error:', error);
  }

  if (!blogs || blogs === null) blogs = [];
  const featuredBlog = blogs[0] || null;
  const restBlogs = blogs.slice(1);
  const currentPage = paggination.current_page || 1;
  const totalPages = paggination.last_page || 1;
  const total = paggination.total || 0;
  const from = paggination.from || 0;
  const to = paggination.to || 0;

  return (
    <div className={`${styles.page} ${inter.className}`}>
      <section className={styles.hero} aria-label="Royalane blog">
        <div className={styles.heroShell}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span aria-hidden="true">/</span>
                <span>Blogs</span>
              </nav>

              <p className={styles.eyebrow}>Royalane Journal</p>

              <h1 className={`${styles.heroTitle} ${playfair.className}`}>
                Travel notes worth reading before you go.
              </h1>

              <p className={styles.heroLead}>
                Practical guides, airport transfer tips, and destination advice from our team —
                written to make every journey smoother.
              </p>

              <div className={styles.heroBadges}>
                <span className={styles.heroBadge}>
                  <IoBookOutline aria-hidden="true" />
                  Guides &amp; tips
                </span>
                <span className={styles.heroBadge}>
                  <IoTimeOutline aria-hidden="true" />
                  Updated regularly
                </span>
              </div>
            </div>

            <div className={styles.heroMedia}>
              <div className={styles.mediaFrame}>
                <Image
                  src="/images/BlogHeroBG.jpg"
                  alt="Royalane travel journal"
                  fill
                  priority
                  quality={90}
                  className={styles.mediaImage}
                  sizes="(max-width: 991px) 100vw, 560px"
                />
                <div className={styles.mediaShade} aria-hidden="true" />
                <div className={styles.mediaFloat}>
                  <span className={styles.mediaFloatIcon} aria-hidden="true">
                    <IoBookOutline />
                  </span>
                  <div>
                    <p className={styles.mediaFloatEyebrow}>Editorial</p>
                    <p className={styles.mediaFloatTitle}>Transfer &amp; travel insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featuredBlog && (
        <section className={styles.featuredSection} aria-label="Featured article">
          <div className={styles.shell}>
            <article className={styles.featured}>
              <Link
                href={`/blogs/${featuredBlog.slug}`}
                className={styles.featuredMedia}
                aria-label={featuredBlog.title}
              >
                <Image
                  src={featuredBlog?.thumbnail?.url || PLACEHOLDER_IMAGE}
                  alt={featuredBlog?.title || featuredBlog?.slug}
                  fill
                  className={styles.featuredImage}
                  sizes="(max-width: 767px) 100vw, 58vw"
                  priority
                />
              </Link>

              <div className={styles.featuredBody}>
                <div>
                  <p className={styles.category}>{getCategoryLabel(featuredBlog)}</p>
                  <p className={styles.meta}>
                    {featuredBlog?.author?.name || 'Royalane'}
                    {formatDate(featuredBlog.created_at) && (
                      <span> · {formatDate(featuredBlog.created_at)}</span>
                    )}
                  </p>
                  <h2 className={`${styles.featuredTitle} ${playfair.className}`}>
                    <Link href={`/blogs/${featuredBlog.slug}`}>{featuredBlog.title}</Link>
                  </h2>
                  {(featuredBlog?.excerpt || featuredBlog?.seo?.meta_description) && (
                    <p className={styles.excerpt}>
                      {featuredBlog?.seo?.meta_description || featuredBlog?.excerpt}
                    </p>
                  )}
                </div>

                <div className={styles.actions}>
                  <Link href={`/blogs/${featuredBlog.slug}`} className={styles.primaryBtn}>
                    Read article
                    <HiArrowUpRight aria-hidden="true" />
                  </Link>
                  <Link href="/contact-us" className={styles.ghostBtn}>
                    Contact us
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      <section className={styles.listSection} aria-label="All articles">
        <div className={styles.shell}>
          <header className={styles.listHeader}>
            <p className={styles.listEyebrow}>All stories</p>
            <h2 className={`${styles.listTitle} ${playfair.className}`}>
              Explore more from the journal
            </h2>
            <p className={styles.listSubtitle}>
              Fresh notes on routes, timing, and travel details worth saving before your next
              booking.
            </p>
          </header>

          {restBlogs.length === 0 && !featuredBlog ? (
            <div className={styles.emptyState}>
              <h3 className={`${styles.emptyTitle} ${playfair.className}`}>No blogs found</h3>
              <p className={styles.emptyCopy}>
                We couldn&apos;t find any blog posts at the moment. Please check back later.
              </p>
              <Link href="/" className={styles.primaryBtn}>
                Back to home
                <HiArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          ) : restBlogs.length === 0 ? (
            <p className={styles.onlyFeaturedNote}>You&apos;re viewing the latest story above.</p>
          ) : (
            <>
              <div className={styles.blogGrid}>
                {restBlogs.map((item, index) => (
                  <article key={item.id ?? item.slug ?? index} className={styles.blogCard}>
                    <Link
                      href={`/blogs/${item.slug}`}
                      className={styles.blogCardMedia}
                      aria-label={item.title}
                    >
                      <Image
                        src={item?.thumbnail?.url || PLACEHOLDER_IMAGE}
                        alt={item?.title || item?.slug}
                        fill
                        className={styles.blogCardImage}
                        sizes="(max-width: 575px) 100vw, (max-width: 991px) 50vw, 33vw"
                      />
                    </Link>

                    <div className={styles.blogCardBody}>
                      <p className={styles.category}>{getCategoryLabel(item)}</p>
                      <p className={styles.meta}>
                        {item?.author?.name || 'Royalane'}
                        {formatDate(item.created_at) && (
                          <span> · {formatDate(item.created_at)}</span>
                        )}
                      </p>
                      <h3 className={`${styles.blogCardTitle} ${playfair.className}`}>
                        <Link href={`/blogs/${item.slug}`}>{item.title}</Link>
                      </h3>
                      {(item?.excerpt || item?.seo?.meta_description) && (
                        <p className={styles.blogCardExcerpt}>
                          {item?.seo?.meta_description || item?.excerpt}
                        </p>
                      )}
                      <div className={styles.blogCardActions}>
                        <Link href={`/blogs/${item.slug}`} className={styles.primaryBtn}>
                          Read article
                          <HiArrowUpRight aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.paginationWrap}>
                <BlogPagination
                  totalPages={totalPages}
                  currentPage={currentPage}
                  total={total}
                  from={from}
                  to={to}
                  metaClassName={styles.paginationMeta}
                />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export const metadata = {
  title: 'Royalane Blog | Airport Transfers & Travel Tips',
  description:
    'Explore the Royalane blog for useful travel tips, airport transfer guides, transportation advice and helpful insights to make every journey smooth and stress-free.',
  keywords:
    'Royalane Blog, Airport Transfer Guides, Airport Transfer Tips, Travel Tips, Airport Transportation, Private Transfer Services, Airport Pickup Guide, Airport Drop-off Guide, Travel Advice, Comfortable Transportation, Transfer Booking Guide',
  alternates: {
    canonical: 'https://royalane.com/blogs',
  },
};
