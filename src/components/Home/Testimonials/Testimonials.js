'use client';

import Image from 'next/image';
import { FaStar } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css/pagination';
import { playfair } from '@/lib/fonts';
import styles from './Testimonials.module.css';

// Static fallback data — replace with an API fetch once the endpoint is live.
const testimonials = [
  {
    id: 1,
    rating: 5,
    quote:
      "Every detail was flawless — from the private transfer to the overwater villa. Royalane redefines luxury travel.",
    avatar: '/images/testimonials/t1.png',
    name: 'Amelia Carter',
    location: 'United Kingdom',
    package: 'Deluxe Umrah Experience',
  },
  {
    id: 2,
    rating: 5,
    quote:
      "Our Umrah package was handled with grace. The team anticipated every need before we even asked.",
    avatar: '/images/testimonials/t2.png',
    name: 'Rashid Al Mansoori',
    location: 'United Arab Emirates',
    package: 'Family Umrah Package',
  },
  {
    id: 3,
    rating: 5,
    quote:
      "Cappadocia at sunrise, private balloon, five-star hotel. The itinerary read like a love letter.",
    avatar: '/images/testimonials/t3.png',
    name: 'Sofia Rossi',
    location: 'Italy',
    package: 'Custom Umrah Build',
  },
];

const renderStars = (rating) => {
  const count = Math.min(5, Math.max(0, Math.floor(Number(rating) || 5)));
  return Array.from({ length: count }, (_, i) => (
    <FaStar key={i} className={styles.star} aria-hidden="true" />
  ));
};

export default function Testimonials() {
  if (!testimonials.length) return null;

  return (
    <section className={styles.section} aria-label="Testimonials">
      <div className="container">
        <header className={styles.header}>
          <span className={styles.tag}>Loved worldwide</span>
          <h2 className={`${styles.title} ${playfair.className}`}>
            From our travelers
          </h2>
          <p className={styles.subtitle}>
            Real stories from journeys we designed.
          </p>
        </header>

        <div className={styles.sliderWrap}>
          <Swiper
            modules={[Pagination, Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            slidesPerGroup={1}
            watchOverflow
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={{
              nextEl: '.testimonials-next',
              prevEl: '.testimonials-prev',
            }}
            breakpoints={{
              0: {
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 24,
              },
              992: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 24,
              },
            }}
            className={styles.testimonialSwiper}
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={testimonial.id ?? index}>
                <article className={styles.card}>
                  <div className={styles.ratingRow}>
                    {renderStars(testimonial.rating)}
                  </div>

                  <p className={`${styles.quoteText} ${playfair.className}`}>
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  <div className={styles.footer}>
                    <div className={styles.avatarWrap}>
                      <Image
                        fill
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className={styles.avatar}
                        sizes="44px"
                      />
                    </div>

                    <div className={styles.person}>
                      <span className={styles.name}>{testimonial.name}</span>
                      {testimonial.location && (
                        <span className={styles.location}>
                          {testimonial.location}
                          {testimonial.package ? ` · ${testimonial.package}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
