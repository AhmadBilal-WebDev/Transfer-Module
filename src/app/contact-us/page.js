import React from 'react';
import TrustSocialSection from './components/TrustSocialSection';
import ContactHero from './components/ContactHero';
import ContactChannels from './components/ContactChannels';
import ContactInquiry from './components/ContactInquiry';
import OperationsCenter from './components/OperationsCenter';
import FrequentInquiries from './components/FrequentInquiries';
import styles from './ContactUs.module.css';

export const metadata = {

  title: 'Contact Royalane | Transfer Booking Support',
  description:
    'Contact Royalane for reliable transfer services and booking assistance. Our team is here to help with airport pickups, drop-offs and comfortable transportation.',
  keywords: [
    'Contact Royalane',
    'Transfer Booking Support',
    'Airport Transfer Contact',
    'Airport Pickup Services',
    'Airport Drop-off Services',
    'Private Transfer Assistance',
    'Transportation Support',
  ],

  alternates: {
    canonical: 'https://royalane.com/contact-us',
  },
};

export default function page() {
  return (
    <div className={styles.page}>
      {/* Section 1 — Hero */}
      <ContactHero />

      {/* Section 2 — Contact Channels */}
      <ContactChannels />

      {/* Section 3 — Inquiry Form */}
      <ContactInquiry />

      {/* Section 4 — UK Operations Center */}
      <OperationsCenter />

      {/* Section 5 — Frequent Inquiries */}
      <FrequentInquiries />

      {/* Remaining sections — will update one by one */}
      {/* <div className={styles.main}>
        <div className={styles.shell}>
          <TrustSocialSection />
        </div>
      </div> */}
    </div>
  );
}
