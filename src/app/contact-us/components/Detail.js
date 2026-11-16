import React from 'react';
import { playfair } from '@/lib/fonts';
import styles from "../ContactUs.module.css";

const details = [
  {
    index: '01',
    title: 'Visit our office',
    lines: [{ text: '693a Stratford Road Birmingham B11 4DX, UK' }],
  },
  {
    index: '02',
    title: 'Direct inquiries',
    lines: [
      { label: 'Main line', text: '0121 434 3738', href: 'tel:01214343738' },
      { label: 'WhatsApp', text: '+44 7309 803307', href: 'https://wa.me/+447309803307', external: true },
    ],
  },
  {
    index: '03',
    title: 'Email',
    lines: [
      { label: 'General', text: 'example@royalane.com', href: 'mailto:example@royalane.com' },
    ],
  },
  {
    index: '04',
    title: 'Hours',
    lines: [
      { label: 'Mon – Fri', text: '9AM – 6PM' },
      { label: 'Weekend', text: 'By appointment' },
    ],
  },
];

export default function Detail() {
  return (
    <aside className={styles.contactdetail}>
      <header className={styles.detailHeader}>
        <p className={`${styles.detailBrand} ${playfair.className}`}>Royalane</p>
        <h2 className={`${styles.detailTitle} ${playfair.className}`}>
          Reach the team behind the itinerary.
        </h2>
      </header>

      <ol className={styles.detailStack}>
        {details.map((item) => (
          <li key={item.index} className={styles.detailCard}>
            <span className={styles.detailIndex} aria-hidden="true">{item.index}</span>
            <div className={styles.detailBody}>
              <h4>{item.title}</h4>
              {item.lines.map((line) => (
                <p key={`${item.index}-${line.text}`}>
                  {line.label && <span className={styles.detailLabel}>{line.label}</span>}
                  {line.href ? (
                    <a
                      href={line.href}
                      {...(line.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {line.text}
                    </a>
                  ) : (
                    <span>{line.text}</span>
                  )}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
