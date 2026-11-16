import React from 'react';
import { HiArrowUpRight } from 'react-icons/hi2';
import { playfair } from '@/lib/fonts';
import styles from './about.module.css';

const contactInfo = [
  { text: '+1 (800) 555-WELL', href: 'tel:+18005559355' },
  { text: 'concierge@holidaywell.com', href: 'mailto:concierge@holidaywell.com' },
  { text: '123 Prime Avenue, Suite 400', href: null },
];

export default function SectionSeven() {
  return (
    <section className={styles.sectionSevenWrapper} aria-label="Contact">
      <div className={styles.shell}>
        <div className={styles.contactPanel}>
          <div className={styles.contactLead}>
            <div className={styles.routeChip}>
              <span>Let&apos;s talk</span>
              <span className={styles.routeChipLine} aria-hidden="true" />
              <span>Concierge</span>
            </div>
            <h2 className={`${styles.contactTitle} ${playfair.className}`}>
              Become a well-travelled insider.
            </h2>
            <p className={styles.contactCopy}>
              Ready to design an unforgettable escape? Speak with one of our travel consultants today.
            </p>
            <ul className={styles.contactList}>
              {contactInfo.map((item) => (
                <li key={item.text}>
                  {item.href ? (
                    <a href={item.href}>{item.text}</a>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <form className={styles.contactForm} noValidate>
            <h3 className={`${styles.formTitle} ${playfair.className}`}>Send a note</h3>
            <div className={styles.field}>
              <label htmlFor="fullName">Full name</label>
              <input type="text" id="fullName" name="fullName" placeholder="Your full name" />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email address</label>
              <input type="email" id="email" name="email" placeholder="you@example.com" />
            </div>
            <div className={styles.field}>
              <label htmlFor="message">Your dream destination / message</label>
              <textarea id="message" name="message" rows={4} placeholder="Tell us about your ideal escape" />
            </div>
            <button type="button" className={styles.submitBtn}>
              Send message
              <HiArrowUpRight aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
