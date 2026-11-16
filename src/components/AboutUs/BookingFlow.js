import { IoLocationOutline, IoCarOutline, IoHappyOutline } from 'react-icons/io5';
import { MdFlight } from 'react-icons/md';
import { playfair, inter } from '@/lib/fonts';
import styles from './BookingFlow.module.css';

const steps = [
  {
    num: '01',
    title: 'Search your route',
    desktopBody:
      'Enter your arrival or departure airport, hotel destination, date, and preferred pickup timing.',
    mobileBody:
      'Enter your pickup airport or station, destination hotel, and arrival time.',
    footer: 'Origin & Destination',
    Icon: IoLocationOutline,
  },
  {
    num: '02',
    title: 'Choose your vehicle',
    desktopBody:
      'Select an Executive Sedan, Premier First Class, luxury family SUV, or spacious executive van.',
    mobileBody:
      'Select from first-class sedans, Mercedes V-Class executive MPVs, or luxury family vans.',
    footer: 'Tailored Vehicle Classes',
    Icon: IoCarOutline,
  },
  {
    num: '03',
    title: 'Enter your details',
    desktopBody:
      'Provide your flight number, guest count, and any custom luggage or accessibility requirements.',
    mobileBody:
      'Provide flight credentials for auto-tracking, passenger headcounts, and special baggage requirements.',
    footer: 'Flight Sync & Name Sign',
    Icon: MdFlight,
  },
  {
    num: '04',
    title: 'Enjoy your ride',
    desktopBody:
      'Meet your chauffeur in arrivals holding a personalized tablet, receive luggage assistance, and unwind.',
    mobileBody:
      'Meet your greeter in the terminal arrival hall, step into air-conditioned comfort, and relax.',
    footer: 'Relaxed Arrival',
    Icon: IoHappyOutline,
  },
];

export default function BookingFlow() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-labelledby="booking-flow-title">
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Simple Booking Flow</p>
          <h2 id="booking-flow-title" className={`${styles.title} ${playfair.className}`}>
            Effortless travel in four simple steps.
          </h2>
          <p className={styles.lead}>
            Book your private airport transfer in less than two minutes with complete itinerary
            confidence.
          </p>
        </header>

        <ol className={styles.grid}>
          {steps.map(({ num, title, desktopBody, mobileBody, footer, Icon }) => (
            <li key={num} className={styles.card}>
              <div className={styles.cardDesktop}>
                <span className={`${styles.numCircle} ${playfair.className}`} aria-hidden="true">
                  {num}
                </span>
                <h3 className={`${styles.cardTitle} ${playfair.className}`}>{title}</h3>
                <p className={styles.cardBody}>{desktopBody}</p>
                <p className={styles.cardFooter}>
                  <Icon aria-hidden="true" />
                  {footer}
                </p>
              </div>

              <div className={styles.cardMobile}>
                <span className={`${styles.numPlain} ${playfair.className}`} aria-hidden="true">
                  {num}
                </span>
                <div className={styles.mobileCopy}>
                  <h3 className={`${styles.cardTitle} ${playfair.className}`}>{title}</h3>
                  <p className={styles.cardBody}>{mobileBody}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
