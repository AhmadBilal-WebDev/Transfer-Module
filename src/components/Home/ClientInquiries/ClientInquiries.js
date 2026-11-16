'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiHeadphones, FiPlus, FiMinus } from 'react-icons/fi';
import { playfair, inter } from '@/lib/fonts';
import styles from './ClientInquiries.module.css';

const FAQS = [
  {
    q: 'How far in advance can I book?',
    a: 'Book any time on web or through our concierge desk. You receive an instant guaranteed quote with no surge multipliers, and booking takes about 60 seconds.',
  },
  {
    q: 'What happens if my flight is delayed?',
    a: 'Share your flight number and we track it live. If your landing moves, your pickup moves with it — no extra fee for monitored delays.',
  },
  {
    q: 'How do I cancel my booking?',
    a: 'Cancel up to 24 hours before pickup for a full refund. You can cancel from your booking voucher or by contacting our concierge desk.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support major cards and secure cashless checkout. Corporate invoicing and automated billing are also available on request.',
  },
  {
    q: 'How do I contact my driver?',
    a: 'Driver details are shared before pickup. You can also reach our 24/7 concierge desk by phone, email, or WhatsApp for live coordination.',
  },
  {
    q: 'How much waiting time is included free?',
    a: 'Airport pickups include 60 minutes of free waiting. City rides include 15 complimentary minutes, so you are never rushed.',
  },
];

export default function ClientInquiries() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Client inquiries">
      <div className={styles.shell}>
        <div className={styles.grid}>
          <aside className={styles.lead}>
            <p className={styles.eyebrow}>Client inquiries</p>
            <h2 className={`${styles.title} ${playfair.className}`}>
              Questions, <em className={styles.titleEm}>answered.</em>
            </h2>
            <p className={styles.subtitle}>
              Everything you need to know about airport meet-
              and-greets and reservation changes.
            </p>

            <div className={styles.supportCard}>
              <span className={styles.supportIcon} aria-hidden="true">
                <FiHeadphones />
              </span>
              <h3 className={`${styles.supportTitle} ${playfair.className}`}>
                Still have a question?
              </h3>
              <p className={styles.supportText}>
                Our multilingual concierge desk is on call 24/7 by phone, email and WhatsApp.
              </p>
              <Link href="/contact-us" className={styles.supportBtn}>
                Contact support
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
          </aside>

          <div className={styles.faqList} role="list">
            {FAQS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <article
                  key={item.q}
                  className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className={styles.faqToggle}
                    aria-expanded={isOpen}
                    onClick={() => toggle(index)}
                  >
                    <span className={`${styles.faqQuestion} ${playfair.className}`}>
                      {item.q}
                    </span>
                    <span className={styles.faqIcon} aria-hidden="true">
                      {isOpen ? <FiMinus /> : <FiPlus />}
                    </span>
                  </button>

                  <div
                    className={styles.faqAnswerWrap}
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className={styles.faqAnswerInner}>
                      <p className={styles.faqAnswer}>{item.a}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
