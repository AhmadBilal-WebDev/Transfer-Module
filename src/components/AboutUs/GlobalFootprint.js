import { playfair, inter } from '@/lib/fonts';
import styles from './GlobalFootprint.module.css';

const stats = [
  {
    value: '100+',
    label: 'Airports Covered',
    sub: 'Key global transport hubs',
  },
  {
    value: '20+',
    label: 'Countries',
    sub: 'Seamless global mobility',
  },
  {
    value: '24/7',
    label: 'Dedicated Support',
    sub: 'Instant concierge dispatch',
  },
  {
    value: '100%',
    label: 'Fixed Price Guarantee',
    sub: 'Zero hidden airport surcharges',
  },
];

export default function GlobalFootprint() {
  return (
    <section
      className={`${styles.section} ${inter.className}`}
      aria-labelledby="global-footprint-title"
    >
      <div className={styles.shell}>
        <header className={styles.mobileHeader}>
          <p className={styles.eyebrow}>Reliability In Scale</p>
          <h2 id="global-footprint-title" className={`${styles.mobileTitle} ${playfair.className}`}>
            Our Global Footprint
          </h2>
        </header>

        <ul className={styles.stats}>
          {stats.map((item) => (
            <li key={item.label} className={styles.stat}>
              <p className={`${styles.value} ${playfair.className}`}>{item.value}</p>
              <p className={styles.label}>{item.label}</p>
              <p className={styles.sub}>{item.sub}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
