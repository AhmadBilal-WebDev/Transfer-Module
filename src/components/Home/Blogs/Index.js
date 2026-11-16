'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { playfair, inter } from '@/lib/fonts';
import styles from './Blogs.module.css';

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';

const getCategoryLabel = (post) =>
  post?.category?.name ||
  post?.categories?.[0]?.name ||
  post?.tags?.[0]?.name ||
  'Travel Journal';

const getExcerpt = (post) => {
  const raw =
    post?.excerpt ||
    post?.short_description ||
    post?.description ||
    post?.content ||
    '';

  if (!raw) {
    return 'Fresh notes from our editors — routes, timing, and travel details worth saving.';
  }

  const text = String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= 140) return text;
  return `${text.slice(0, 140).trim()}…`;
};

function BlogCard({ post }) {
  const category = getCategoryLabel(post);
  const excerpt = getExcerpt(post);

  return (
    <article className={styles.card}>
      <Link
        href={`/blogs/${post.slug}`}
        className={styles.media}
        aria-label={post.title}
      >
        <Image
          src={post?.thumbnail?.url || PLACEHOLDER_IMAGE}
          alt={post?.title || post?.slug || 'Blog post'}
          fill
          className={styles.cardImage}
          sizes="(max-width: 767px) 85vw, 360px"
        />
      </Link>

      <div className={styles.cardBody}>
        {category && <p className={styles.cardCategory}>{category}</p>}
        <h3 className={`${styles.cardTitle} ${playfair.className}`}>
          <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className={styles.cardText}>{excerpt}</p>
        <Link href={`/blogs/${post.slug}`} className={styles.learnMore}>
          Learn more
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default function Blogs() {
  const scrollerRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blogs?page=1`, {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return;

        const response = await res.json();

        if (response?.Success && Array.isArray(response?.Content?.posts)) {
          setPosts(response.Content.posts);
        }
      } catch (error) {
        console.error('Blogs fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || isLoading || !posts.length) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [isLoading, posts, updateScrollState]);

  if (isLoading || !posts.length) return null;

  const scrollByCard = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(`.${styles.card}`);
    const gap = 20;
    const amount = card ? card.offsetWidth + gap : Math.min(el.clientWidth * 0.85, 360);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Latest from the blog">
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Travel Journal</p>
          <h2 className={`${styles.title} ${playfair.className}`}>
            Notes from the road
          </h2>
          <p className={styles.subtitle}>
            Routes, timing, and travel details worth saving — written for your next trip.
          </p>
        </header>

        <div className={styles.toolbar}>
          <Link href="/blogs" className={styles.allLink}>
            All articles
          </Link>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => scrollByCard(-1)}
              disabled={!canScrollPrev}
              aria-label="Previous articles"
            >
              <FaArrowLeft />
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => scrollByCard(1)}
              disabled={!canScrollNext}
              aria-label="Next articles"
            >
              <FaArrowRight />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className={styles.scroller}
          aria-label="Blog articles"
        >
          {posts.map((post) => (
            <BlogCard key={post.id ?? post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
