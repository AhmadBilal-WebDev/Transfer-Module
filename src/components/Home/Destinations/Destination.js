'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css/pagination';
import { playfair } from '@/lib/fonts';
import styles from './Destinations.module.css';

// Static fallback data — replace with an API fetch once the endpoint is live.
const destinations = [
  {
    id: 1,
    name: "United Arab Emirates",
    country: "Dubai",
    image: "/images/destinations/des1.png",
    search: {
      place: "United Arab Emirates",
      city: "Dubai",
      nationality: "PK",
      lat: "25.2048493",
      lng: "55.2707828",
      code: "AE",
      location: "Dubai",
      country: "United Arab Emirates",
    },
  },
  {
    id: 2,
    name: "INDIAN OCEAN",
    country: "Maldives",
    image: "/images/destinations/des2.png",
    search: {
      place: "INDIAN OCEAN",
      city: "Maldives",
      nationality: "PK",
      lat: "3.202778",
      lng: "73.22068",
      code: "MV",
      location: "Maldives",
      country: "Maldives",
    },
  },
  {
    id: 3,
    name: 'Phukat',
    country: 'Thailand',
    image: '/images/destinations/des3.png',
    search: {
      place: "THAILAND",
      city: "Phukat",
      nationality: "PK",
      lat: "7.9843109",
      lng: "98.3307468",
      code: "TH",
      location: "Phukat",
      country: "Thailand",
    },
  },
  {
    id: 4,
    name: 'Istanbul',
    country: 'Turkey',
    image: '/images/destinations/des4.png',
    search: {
      place: "Istanbul",
      city: "Istanbul",
      nationality: "PK",
      lat: "41.0082376",
      lng: "28.9783589",
      code: "TR",
      location: "Istanbul",
      country: "Turkey",
    },
  },
];

const getDates = () => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);

  const format = (date) => date.toISOString().split("T")[0];

  return {
    checkIn: format(checkIn),
    checkOut: format(checkOut),
  };
};

const numberWords = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
  'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
];

export default function Destinations() {
  if (!destinations.length) return null;

  const count = destinations.length;
  const countLabel = numberWords[count] || String(count);
  const { checkIn, checkOut } = getDates();

  return (
    <section className={styles.section} aria-label="Popular Destinations">
      <div className="container">
        <header className={styles.header}>
          <span className={styles.tag}>Where to next</span>
          <h2 className={`${styles.title} ${playfair.className}`}>
            Popular Destinations
          </h2>
          <p className={styles.subtitle}>
            {countLabel} cities worth the trip.
          </p>
        </header>

        <div className={styles.sliderWrap}>
          <Swiper
            modules={[Pagination, Navigation]}
            spaceBetween={16}
            slidesPerView={1}
            slidesPerGroup={1}
            watchOverflow
            pagination={{ clickable: true, dynamicBullets: true }}
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
              768: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 20,
              },
              992: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 22,
              },
              1200: {
                slidesPerView: 4,
                slidesPerGroup: 4,
                spaceBetween: 24,
              },
            }}
            className={styles.destSwiper}
          >
            {destinations.map((destination, index) => {
              const href = {
                pathname: "/hotels",
                query: {
                  checkIn,
                  checkOut,
                  currency: "GBP",
                  ...destination.search,
                },
              };

              return (
                <SwiperSlide key={destination.id ?? index}>
                  <Link
                    href={href}
                    className={styles.cardLink}
                  >
                    <article className={styles.card}>
                      <Image
                        fill
                        src={destination.image}
                        alt={destination.name}
                        className={styles.cardImage}
                        sizes="(max-width: 576px) 90vw, (max-width: 992px) 45vw, 25vw"
                      />

                      <div className={styles.overlay} aria-hidden="true" />

                      <div className={styles.cardBody}>
                        {destination.name && (
                          <p className={styles.country}>{destination.name}</p>
                        )}
                        <h3 className={`${styles.destName} ${playfair.className}`}>
                          {destination.country}
                        </h3>
                      </div>
                    </article>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
