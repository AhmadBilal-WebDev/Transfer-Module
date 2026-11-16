import React from 'react';
import AboutHero from '@/components/AboutUs/AboutHero';
import WhoWeAre from '@/components/AboutUs/WhoWeAre';
import GlobalFootprint from '@/components/AboutUs/GlobalFootprint';
import CoreValues from '@/components/AboutUs/CoreValues';
import BookingFlow from '@/components/AboutUs/BookingFlow';
import RoyalaneStandard from '@/components/AboutUs/RoyalaneStandard';
import ReserveTransfer from '@/components/AboutUs/ReserveTransfer';
import SectionFour from '@/components/AboutUs/SectionFour';
import SectionFive from '@/components/AboutUs/SectionFive';
import SectionSix from '@/components/AboutUs/SectionSix';
import SectionSeven from '@/components/AboutUs/SectionSeven';
import styles from './aboutHero.module.css';

export const metadata = {

  title: 'About Royalane | Reliable Transfer Services',
  description:
    'Discover Royalane, your trusted partner for reliable and comfortable transfer services. We make every journey easier with convenient pickups, smooth transportation and dependable travel solutions.',
  keywords: [
    'Royalane',
    'About Royalane',
    'Transfer Services',
    'Airport Transfers',
    'Private Transfers',
    'Reliable Transportation',
    'Comfortable Travel',
    'Pickup and Drop-off Services',
  ],

  alternates: {
    canonical: 'https://royalane.com/about-us',
  },
};

export default function page() {
  return (
    <div className={styles.page}>
      {/* Section 1 — Hero */}
      <AboutHero />

      {/* Section 2 — Who We Are */}
      <WhoWeAre />

      {/* Section 3 — Global Footprint */}
      <GlobalFootprint />

      {/* Section 4 — Core Values */}
      <CoreValues />

      {/* Section 5 — Booking Flow */}
      <BookingFlow />

      {/* Section 6 — Royalane Standard */}
      <RoyalaneStandard />

      {/* Section 7 — Reserve Transfer CTA */}
      <ReserveTransfer />

      {/* Remaining sections — will update one by one */}
      {/* <div id="our-story">
        <SectionFour />
        <SectionFive />
        <SectionSix />
        <SectionSeven />
      </div> */}
    </div>
  );
}
