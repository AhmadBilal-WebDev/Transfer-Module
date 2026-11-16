import Link from 'next/link';
import { IoCalendarClearOutline, IoPersonOutline, IoTimeOutline, IoChevronForward } from 'react-icons/io5';
import { MdFlight } from 'react-icons/md';
import { playfair, inter } from '@/lib/fonts';
import styles from './FrequentInquiries.module.css';

const inquiries = [
  {
    title: 'How do I cancel my booking?',
    desktopSub: 'Complimentary up to 24h prior',
    mobileSub: 'Full refund up to 12h prior to arrival.',
    href: '/faqs',
    Icon: IoCalendarClearOutline,
  },
  {
    title: 'How do I contact my driver?',
    desktopSub: 'Automated SMS & direct link',
    mobileSub: 'Direct SMS & encrypted call link sent 2h prior.',
    href: '/faqs',
    Icon: IoPersonOutline,
  },
  {
    title: 'What if my flight is delayed?',
    desktopSub: 'Complimentary 60-min wait time',
    mobileSub: 'Flight tracking includes 60 min complimentary wait.',
    href: '/faqs',
    IconDesktop: IoTimeOutline,
    IconMobile: MdFlight,
  },
];

export default function FrequentInquiries() {
  return (
    <section
      className={`${styles.section} ${inter.className}`}
      aria-labelledby="frequent-inquiries-title"
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDesktop}>Frequent Inquiries</span>
            <span className={styles.eyebrowMobile}>Self-Service Protocols</span>
          </p>
          <h2 id="frequent-inquiries-title" className={`${styles.title} ${playfair.className}`}>
            Looking for immediate guidance?
          </h2>
          <p className={styles.leadDesktop}>
            Find instant answers regarding chauffeur meeting points, flight synchronization, and
            cancellation rules.
          </p>
          <p className={styles.leadMobile}>
            Tap below for instant operational policies regarding itinerary alterations.
          </p>
        </header>

        <ul className={styles.grid}>
          {inquiries.map((item) => {
            const DesktopIcon = item.Icon || item.IconDesktop;
            const MobileIcon = item.IconMobile || item.Icon || item.IconDesktop;
            return (
              <li key={item.title}>
                <Link href={item.href} className={styles.card}>
                  <span className={`${styles.icon} ${styles.iconDesktop}`} aria-hidden="true">
                    <DesktopIcon />
                  </span>
                  <span className={`${styles.icon} ${styles.iconMobile}`} aria-hidden="true">
                    <MobileIcon />
                  </span>
                  <div className={styles.copy}>
                    <p className={styles.cardTitle}>{item.title}</p>
                    <p className={styles.cardSubDesktop}>{item.desktopSub}</p>
                    <p className={styles.cardSubMobile}>{item.mobileSub}</p>
                  </div>
                  <IoChevronForward className={styles.chevron} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
