'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css/pagination';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { playfair } from '@/lib/fonts';
import styles from './TopActivities.module.css';

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';

function ActivityCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
      <div className={`${styles.imageWrap} ${styles.skeletonImage}`} />
      <div className={styles.cardBody}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonLocation}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        <div className={styles.cardFooter}>
          <div className={styles.priceBlock}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonPrice}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonTax}`} />
          </div>
          <div className={`${styles.skeletonBlock} ${styles.skeletonBtn}`} />
        </div>
      </div>
    </article>
  );
}

export default function TopActivities() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/activities/search?date=${moment().add(1, 'days').format('YYYY-MM-DD')}`,
          {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!res.ok) return;

        const response = await res.json();

        if (response.Success && Array.isArray(response?.Content?.activities)) {
          setActivities(response.Content.activities);
        }
      } catch (error) {
        console.error('Activities fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (!isLoading && !activities.length) return null;

  const activityDate = moment().add(1, 'days').format('YYYY-MM-DD');

  return (
    <section className={styles.section} aria-label="Activities and Experiences">
      <div className="container">
        <header className={styles.header}>
          <span className={styles.tag}>Beyond the stay</span>
          <h2 className={`${styles.title} ${playfair.className}`}>
            Activities &amp; Experiences
          </h2>
          <p className={styles.subtitle}>Skip lines, book the best.</p>
        </header>

        {isLoading ? (
          <div className={styles.skeletonGrid} aria-busy="true" aria-label="Loading activities">
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
          </div>
        ) : (
          <div className={styles.sliderWrap}>
            {/* <div className={styles.controls}>
              <button
                type="button"
                className={`${styles.navBtn} topActivities-prev`}
                aria-label="Previous activities"
              >
                <FaArrowLeft />
              </button>
              <button
                type="button"
                className={`${styles.navBtn} topActivities-next`}
                aria-label="Next activities"
              >
                <FaArrowRight />
              </button>
            </div> */}

            <Swiper
              modules={[Pagination, Navigation]}
              spaceBetween={16}
              slidesPerView={1}
              slidesPerGroup={1}
              watchOverflow
              pagination={{ clickable: true, dynamicBullets: true }}
              navigation={{
                nextEl: '.topActivities-next',
                prevEl: '.topActivities-prev',
              }}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                  slidesPerGroup: 1,
                  spaceBetween: 16,
                },
                576: {
                  slidesPerView: 2,
                  slidesPerGroup: 2,
                  spaceBetween: 16,
                },
                992: {
                  slidesPerView: 3,
                  slidesPerGroup: 3,
                  spaceBetween: 20,
                },
                1200: {
                  slidesPerView: 4,
                  slidesPerGroup: 4,
                  spaceBetween: 22,
                },
              }}
              className={styles.activitySwiper}
            >
              {activities.slice(0, 8).map((activity) => {
                const locationLabel =
                  [activity.city, activity.country].filter(Boolean).join(', ') ||
                  activity.address ||
                  '';
                const activityHref = `/activities/${activity.slug}?from=${activityDate}&to=${activityDate}&language=en`;
                const isBookable = activity.provider !== 'hotelbeds';

                return (
                  <SwiperSlide key={activity.id}>
                    <article className={styles.card}>
                      <div className={styles.imageWrap}>
                        {isBookable ? (
                          <Link href={activityHref} className={styles.imageLink} aria-label={activity.title}>
                            <Image
                              src={
                                activity.featured_image ||
                                activity.banner_image ||
                                PLACEHOLDER_IMAGE
                              }
                              alt={activity.title}
                              fill
                              className={styles.cardImage}
                              sizes="(max-width: 576px) 90vw, (max-width: 992px) 45vw, 25vw"
                            />
                          </Link>
                        ) : (
                          <Image
                            src={
                              activity.featured_image ||
                              activity.banner_image ||
                              PLACEHOLDER_IMAGE
                            }
                            alt={activity.title}
                            fill
                            className={styles.cardImage}
                            sizes="(max-width: 576px) 90vw, (max-width: 992px) 45vw, 25vw"
                          />
                        )}
                      </div>

                      <div className={styles.cardBody}>
                        {locationLabel && (
                          <p className={styles.location}>
                            {locationLabel}
                            {activity.activity_duration ? ` · ${activity.activity_duration}` : ''}
                            {activity.max_people > 0 ? ` · Max ${activity.max_people}` : ''}
                          </p>
                        )}

                        <h3 className={`${styles.activityTitle} ${playfair.className}`}>
                          {activity.title}
                        </h3>

                        <div className={styles.cardFooter}>
                          <div className={styles.priceBlock}>
                            <div className={styles.priceRow}>
                              <span className={styles.priceFrom}>from</span>
                              <span className={styles.priceValue}>
                                <PriceDisplay
                                  price={activity.sale_price}
                                  currency={activity.currency_code}
                                />
                              </span>
                              <span className={styles.priceUnit}>/Per Person</span>
                            </div>
                            <span className={styles.taxNote}>
                              Vat and Taxes included
                            </span>
                          </div>

                          {isBookable ? (
                            <Link
                              href={activityHref}
                              className={styles.viewBtn}
                              aria-label={`View details for ${activity.title}`}
                            >
                              <FaArrowRight className={styles.viewBtnIcon} aria-hidden="true" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className={styles.comingSoonBtn}
                            >
                              Coming Soon
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
}
