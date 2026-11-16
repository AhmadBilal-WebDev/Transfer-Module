import { MdPhoneInTalk, MdOutlineMail, MdChatBubbleOutline } from 'react-icons/md';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import { playfair, inter } from '@/lib/fonts';
import styles from './ContactChannels.module.css';

const channels = [
  {
    id: 'call',
    title: 'Call us',
    value: '+44 121 434 3738',
    href: 'tel:+441214343738',
    body: 'Available 24/7 for live airport transfers, tarmac departures, and urgent passenger manifest updates.',
    cta: 'Call now',
    badge: '24/7 Tarmac Link',
    category: 'Direct Voice Dispatch',
    Icon: MdPhoneInTalk,
    CtaIcon: MdPhoneInTalk,
    primary: true,
  },
  {
    id: 'email',
    title: 'Email us',
    value: 'example@royalane.com',
    href: 'mailto:example@royalane.com',
    body: 'Inquiries regarding corporate master accounts, invoice settlement, and customized private fleet reservations.',
    cta: 'Send an email',
    badge: '< 8 Min Turnaround',
    category: 'Corporate & Master Accounts',
    Icon: MdOutlineMail,
    CtaIcon: MdOutlineMail,
    primary: false,
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Concierge',
    value: '+44 7309 803307',
    href: 'https://wa.me/447309803307',
    body: 'Fastest route for tarmac curbside dispatch, luggage handling updates, and live chauffeur tracking links.',
    cta: 'Open WhatsApp',
    badge: 'Priority Protocol',
    category: 'WhatsApp Concierge Desk',
    Icon: MdChatBubbleOutline,
    CtaIcon: HiOutlinePaperAirplane,
    primary: false,
    external: true,
  },
];

export default function ContactChannels() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Contact channels">
      <div className={styles.shell}>
        <ul className={styles.grid}>
          {channels.map((item) => {
            const Icon = item.Icon;
            const CtaIcon = item.CtaIcon;
            return (
              <li key={item.id} className={styles.card}>
                <div className={styles.cardDesktop}>
                  <span className={styles.icon} aria-hidden="true">
                    <Icon />
                  </span>
                  <h3 className={`${styles.title} ${playfair.className}`}>{item.title}</h3>
                  <a
                    href={item.href}
                    className={styles.value}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {item.value}
                  </a>
                  <p className={styles.body}>{item.body}</p>
                  <a
                    href={item.href}
                    className={styles.cta}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {item.cta}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </div>

                <div className={styles.cardMobile}>
                  <div className={styles.mobileTop}>
                    <span className={styles.iconRound} aria-hidden="true">
                      <Icon />
                    </span>
                    <span className={styles.badge}>{item.badge}</span>
                  </div>
                  <p className={styles.category}>{item.category}</p>
                  <a
                    href={item.href}
                    className={`${styles.valueMobile} ${playfair.className}`}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {item.value}
                  </a>
                  <p className={styles.body}>{item.body}</p>
                  <a
                    href={item.href}
                    className={`${styles.ctaMobile} ${item.primary ? styles.ctaPrimary : ''}`}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <CtaIcon aria-hidden="true" />
                    {item.cta}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
