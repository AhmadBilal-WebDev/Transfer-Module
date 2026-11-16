import {
  FaCircleCheck,
  FaPaperPlane,
  FaHeadphones,
  FaLock,
  FaShieldHalved,
  FaEarthAmericas,
} from 'react-icons/fa6';
import { playfair } from '@/lib/fonts';
import styles from './WhyUs.module.css';

const features = [
  {
    id: 'best-price',
    Icon: FaCircleCheck,
    title: 'Best Price Guarantee',
    description: 'Match any lower fare within 24 hours.',
  },
  {
    id: 'instant-booking',
    Icon: FaPaperPlane,
    title: 'Instant Booking',
    description: 'Confirmed itineraries in seconds.',
  },
  {
    id: 'support',
    Icon: FaHeadphones,
    title: '24/7 Support',
    description: 'Real humans, anywhere in the world.',
  },
  {
    id: 'secure-payments',
    Icon: FaLock,
    title: 'Secure Payments',
    description: 'PCI-DSS encrypted checkout.',
  },
  {
    id: 'trusted-partner',
    Icon: FaShieldHalved,
    title: 'Trusted Partner',
    description: '500,000+ travelers since 2012.',
  },
  {
    id: 'worldwide-reach',
    Icon: FaEarthAmericas,
    title: 'Worldwide Reach',
    description: '180+ countries, one platform.',
  },
];

export default function WhyUs() {
  return (
    <section className={styles.section} aria-label="Why Royalane">
      <div className={styles.shell}>
        <div className={styles.layout}>
          <aside className={styles.lead}>
            <p className={`${styles.brand} ${playfair.className}`}>Royalane</p>
            <h2 className={`${styles.title} ${playfair.className}`}>
              Built around the trip,<br />
              not the booking form.
            </h2>
            <p className={styles.subtitle}>
              Six quiet standards that sit behind every search, transfer, and confirmation.
            </p>
            <div className={styles.leadAccent} aria-hidden="true" />
          </aside>

          <ol className={styles.rail}>
            {features.map(({ id, Icon, title, description }, index) => (
              <li key={id} className={styles.item} style={{ '--i': index }}>
                <span className={styles.index} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className={styles.icon} aria-hidden="true">
                  <Icon />
                </span>

                <div className={styles.copy}>
                  <h3 className={styles.itemTitle}>{title}</h3>
                  <p className={styles.itemDesc}>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
