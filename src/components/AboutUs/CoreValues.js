import { IoTimeOutline, IoShieldCheckmarkOutline, IoAccessibilityOutline } from 'react-icons/io5';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { playfair, inter } from '@/lib/fonts';
import styles from './CoreValues.module.css';

const values = [
  {
    title: 'Reliability',
    desktopBody:
      'We track your commercial or private flight and adjust chauffeur arrival times automatically if your flight is delayed or early.',
    mobileBody:
      'Punctuality is not merely our target—it is our contract. Flight radar synchronization ensures your private chauffeur is positioned before your wheels touch tarmac.',
    link: 'Synchronized Flights',
    Icon: IoTimeOutline,
  },
  {
    title: 'Transparent Pricing',
    desktopBody:
      'The guaranteed quotation you review includes toll fees, terminal parking, airport access, and local taxes. Zero unexpected add-ons.',
    mobileBody:
      'The rate confirmed during reservation is the exact final fee. No sudden holiday surcharges, luggage upcharges, or hidden peak tolls—ever.',
    link: 'All-Inclusive Fares',
    Icon: HiOutlineDocumentText,
  },
  {
    title: 'Safety First',
    desktopBody:
      'Vetted, licensed professionals with extensive background assessments, paired with impeccably serviced, pristine premium vehicles.',
    mobileBody:
      'Rigorous vetting, background checks, defensive driving certifications, and sanitized executive-grade motor fleets maintained to exacting standards.',
    link: 'Inspected Fleets',
    Icon: IoShieldCheckmarkOutline,
  },
  {
    title: 'Care for Everyone',
    desktopBody:
      'Child safety seats, wheelchair assistance, pushchair space, and walking frame luggage setups—every family journey matters.',
    mobileBody:
      'Attentive support tailored for every family member. We seamlessly accommodate foldable wheelchairs, strollers, child safety seats, and mobility walking frames.',
    link: 'Special Requests',
    Icon: IoAccessibilityOutline,
  },
];

export default function CoreValues() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-labelledby="core-values-title">
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Our Core Values</p>
          <h2 id="core-values-title" className={`${styles.title} ${playfair.className}`}>
            Built on transparency, safety, and uncompromising care.
          </h2>
          <p className={styles.lead}>
            Every policy, chauffeur onboarding review, and fleet inspection is designed around total
            client peace of mind.
          </p>
        </header>

        <ul className={styles.grid}>
          {values.map(({ title, desktopBody, mobileBody, link, Icon }) => (
            <li key={title} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">
                <Icon />
              </span>
              <h3 className={`${styles.cardTitle} ${playfair.className}`}>{title}</h3>
              <p className={`${styles.cardBody} ${styles.cardBodyDesktop}`}>{desktopBody}</p>
              <p className={`${styles.cardBody} ${styles.cardBodyMobile}`}>{mobileBody}</p>
              <span className={styles.cardLink}>
                {link}
                <span aria-hidden="true"> →</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
