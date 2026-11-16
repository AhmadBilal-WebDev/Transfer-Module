import Link from 'next/link';
import Image from 'next/image';
import moment from 'moment';
import RecentBlogs from './RecentBlogs';
import SocialMediaShare from './SocialMediaShare';
import { playfair, inter } from '@/lib/fonts';
import styles from './BlogDetailHero.module.css';

const formatDate = (value) => {
  if (!value) return '';
  const parsed = moment(value, 'DD-MM-YYYY HH:mm:ss', true);
  if (parsed.isValid()) return parsed.format('MMMM D, YYYY');
  return moment(value).isValid() ? moment(value).format('MMMM D, YYYY') : '';
};

const BlogDetail = ({ selectedBlog }) => {
  const dateLabel = formatDate(selectedBlog?.created_at);
  const readLabel = selectedBlog?.reading_time
    ? `${selectedBlog.reading_time} minute read`
    : null;

  return (
    <div className={`${styles.page} ${inter.className}`}>
      <section className={styles.hero} aria-label="Blog article">
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blogs">Blogs</Link>
            <span aria-hidden="true">/</span>
            <span className={styles.crumbCurrent}>{selectedBlog?.title}</span>
          </nav>

          {selectedBlog?.category?.name && (
            <span className={styles.badge}>{selectedBlog.category.name}</span>
          )}

          <h1 className={`${styles.title} ${playfair.className}`}>{selectedBlog?.title}</h1>

          {(selectedBlog?.excerpt || selectedBlog?.seo?.meta_description) && (
            <p className={styles.excerpt}>
              {selectedBlog.seo?.meta_description || selectedBlog.excerpt}
            </p>
          )}

          <div className={styles.metaRow}>
            <div className={styles.authorMeta}>
              <span className={styles.authorName}>
                {selectedBlog?.author?.name || 'Royalane'}
              </span>
              <span className={styles.authorDate}>
                {[dateLabel, readLabel].filter(Boolean).join(' · ')}
              </span>
            </div>
            <SocialMediaShare />
          </div>
        </div>
      </section>

      <section className={styles.mainSection}>
        <div className={styles.mainInner}>
          {selectedBlog?.thumbnail?.url && (
            <div className={styles.coverFrame}>
              <Image
                src={selectedBlog.thumbnail.url}
                alt={selectedBlog?.title || 'Blog cover'}
                fill
                priority
                className={styles.coverImage}
                sizes="(max-width: 860px) 100vw, 860px"
              />
            </div>
          )}

          <div
            className={styles.contentBody}
            dangerouslySetInnerHTML={{ __html: selectedBlog?.content }}
          />

          <div className={styles.ctaBox}>
            <div className={styles.ctaCopy}>
              <p className={styles.ctaEyebrow}>Need a transfer?</p>
              <h2 className={`${styles.ctaTitle} ${playfair.className}`}>
                Talk to our dispatch team
              </h2>
              <p className={styles.ctaSubtitle}>
                Fixed-price airport transfers and private chauffeurs — book with confidence.
              </p>
            </div>
            <Link href="/contact-us" className={styles.ctaBtn}>
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <RecentBlogs />
    </div>
  );
};

export default BlogDetail;
