import Image from 'next/image';
import Link from 'next/link';
import { playfair, inter } from '@/lib/fonts';
import styles from './RecentBlogs.module.css';

export default async function RecentBlogs() {
  let posts = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blogs`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      posts = data?.Content?.posts?.slice(0, 3) ?? [];
    }
  } catch {}

  if (posts.length === 0) return null;

  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Related articles">
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Keep reading</p>
            <h2 className={`${styles.heading} ${playfair.className}`}>Related articles</h2>
          </div>
          <Link href="/blogs" className={styles.browseBtn}>
            Browse all
          </Link>
        </div>

        <div className={styles.grid}>
          {posts.map((item, i) => (
            <article key={item.id ?? item.slug ?? i} className={styles.card}>
              <Link href={`/blogs/${item.slug}`} className={styles.imgWrap} aria-label={item.title}>
                <Image
                  src={item.thumbnail?.url || '/images/placeholder.jpg'}
                  alt={item.title || 'Blog'}
                  fill
                  className={styles.img}
                  sizes="(max-width: 576px) 100vw, (max-width: 900px) 50vw, 33vw"
                />
              </Link>
              <div className={styles.body}>
                <span className={styles.category}>{item.category?.name || 'Travel Journal'}</span>
                <h3 className={`${styles.title} ${playfair.className}`}>
                  <Link href={`/blogs/${item.slug}`}>{item.title}</Link>
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
