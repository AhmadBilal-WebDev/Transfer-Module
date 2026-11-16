'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  IoShieldCheckmarkOutline,
  IoLockClosedOutline,
  IoAirplaneOutline,
  IoArrowUpOutline,
  IoMailOutline,
  IoHelpCircleOutline,
  IoCheckmark,
  IoGlobeOutline,
  IoBusinessOutline,
} from 'react-icons/io5';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { playfair, inter } from '@/lib/fonts';
import styles from './PrivacyPolicy.module.css';

const SECTIONS = [
  { id: 'who-we-are', short: 'Who we are', jump: '1. Who We Are' },
  { id: 'information-we-collect', short: 'Information we collect', jump: '2. Data Collected' },
  { id: 'how-we-use', short: 'How we use your information', jump: '3. Use of Data' },
  { id: 'who-we-share', short: 'Who we share it with', jump: '4. Sharing' },
  { id: 'international-transfers', short: 'International transfers', jump: '5. Transfers' },
  { id: 'retention', short: 'How long we keep your data', jump: '6. Retention' },
  { id: 'cookies', short: 'Cookies & Tracking', jump: '7. Cookies' },
  { id: 'legal-rights', short: 'Your legal rights', jump: '8. Rights' },
  { id: 'security', short: 'Data Security & Encryption', jump: '9. Security' },
  { id: 'minors', short: 'Protection of Minors', jump: '10. Minors' },
  { id: 'changes', short: 'Changes to this policy', jump: '11. Updates' },
  { id: 'contact', short: 'Contact our Officer', jump: '12. Contact' },
];

function CheckItem({ label, children }) {
  return (
    <li className={styles.checkItem}>
      <span className={styles.checkIcon} aria-hidden="true">
        <IoCheckmark />
      </span>
      <p className={styles.checkText}>
        <strong>{label}</strong> {children}
      </p>
    </li>
  );
}

export default function PrivacyPolicyContent() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const articleRefs = useRef({});
  const jumpRefs = useRef({});
  const scrollingToRef = useRef(null);

  useEffect(() => {
    const nodes = SECTIONS.map((section) => articleRefs.current[section.id]).filter(Boolean);
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingToRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: '-18% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const jumpBtn = jumpRefs.current[activeId];
    if (!jumpBtn || typeof window === 'undefined') return;
    if (window.innerWidth > 991) return;

    const item = jumpBtn.closest('li');
    const scroller = jumpBtn.closest('ul');
    if (!item || !scroller) return;

    const target = item.offsetLeft - (scroller.clientWidth - item.offsetWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeId]);

  const scrollToSection = (id) => {
    const node = articleRefs.current[id];
    if (!node) return;

    setActiveId(id);
    scrollingToRef.current = id;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });

    window.setTimeout(() => {
      scrollingToRef.current = null;
    }, 700);
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`${styles.page} ${inter.className}`}>
      <section className={styles.hero} aria-label="Privacy policy">
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>Legal</span>
            <span aria-hidden="true">/</span>
            <span>Privacy Policy</span>
          </nav>

          <span className={styles.badge}>
            <IoShieldCheckmarkOutline aria-hidden="true" />
            Legal Compliance
          </span>

          <h1 className={`${styles.title} ${playfair.className}`}>Privacy Policy</h1>
          <p className={styles.intro}>
            Last updated: March 15, 2026 · Effective across all Royalane transfer terminals, digital
            applications, and executive reservation platforms.
          </p>

          <div className={styles.heroPills} aria-label="Compliance highlights">
            <span className={styles.heroPill}>
              <IoGlobeOutline aria-hidden="true" />
              UK &amp; EU GDPR Regulated
            </span>
            <span className={styles.heroPill}>
              <IoLockClosedOutline aria-hidden="true" />
              PCI-DSS Level 1 Encryption
            </span>
            <span className={styles.heroPill}>
              <IoShieldCheckmarkOutline aria-hidden="true" />
              Synchronized Telemetry Security
            </span>
          </div>
        </div>
      </section>

      <div className={styles.complianceBar}>
        <div className={styles.complianceInner}>
          <ul className={styles.complianceList}>
            <li className={styles.complianceItem}>
              <IoShieldCheckmarkOutline aria-hidden="true" />
              UK &amp; EU GDPR Regulated
            </li>
            <li className={styles.complianceItem}>
              <IoLockClosedOutline aria-hidden="true" />
              PCI-DSS Level 1 Encryption
            </li>
            <li className={styles.complianceItem}>
              <IoAirplaneOutline aria-hidden="true" />
              Synchronized Telemetry Security
            </li>
          </ul>
          <p className={styles.reference}>Reference: VYR-DPO-2026-V4</p>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className={styles.shell}>
          <div className={styles.mobileJump}>
            <div className={styles.mobileJumpHead}>
              <p className={styles.mobileJumpLabel}>Jump to section</p>
              <p className={styles.mobileJumpCount}>12 Articles</p>
            </div>
            <ul className={styles.mobileJumpList}>
              {SECTIONS.map((section) => (
                <li key={`jump-${section.id}`}>
                  <button
                    type="button"
                    ref={(el) => {
                      jumpRefs.current[section.id] = el;
                    }}
                    className={`${styles.mobileJumpBtn} ${
                      activeId === section.id ? styles.mobileJumpBtnActive : ''
                    }`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.jump}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.mobileDpo}>
            <span className={styles.mobileDpoIcon} aria-hidden="true">
              <IoMailOutline />
            </span>
            <div className={styles.mobileDpoCopy}>
              <p className={styles.mobileDpoLabel}>Data Protection Officer</p>
              <p className={styles.mobileDpoEmail}>example@royalane.com</p>
            </div>
            <a className={styles.mobileDpoBtn} href="mailto:example@royalane.com">
              Email DPO
            </a>
          </div>

          <div className={styles.layout}>
            <aside className={styles.sidebar} aria-label="Table of contents">
              <div className={styles.tocCard}>
                <div className={styles.tocHead}>
                  <p className={styles.tocTitle}>On this page</p>
                  <p className={styles.tocCount}>12 Articles</p>
                </div>
                <ol className={styles.tocList}>
                  {SECTIONS.map((section, index) => (
                    <li key={section.id}>
                      <button
                        type="button"
                        className={`${styles.tocBtn} ${
                          activeId === section.id ? styles.tocBtnActive : ''
                        }`}
                        onClick={() => scrollToSection(section.id)}
                        aria-current={activeId === section.id ? 'true' : undefined}
                      >
                        {index + 1}. {section.short}
                      </button>
                    </li>
                  ))}
                </ol>
                <button type="button" className={styles.backTopBtn} onClick={scrollToTop}>
                  <IoArrowUpOutline aria-hidden="true" />
                  Back to top
                </button>
              </div>

              <div className={styles.dpoCard}>
                <span className={styles.dpoIcon} aria-hidden="true">
                  <IoHelpCircleOutline />
                </span>
                <h2 className={`${styles.dpoTitle} ${playfair.className}`}>
                  Data Protection Officer
                </h2>
                <p className={styles.dpoText}>
                  Direct inquiries regarding GDPR, DSAR access requests, or flight telemetry
                  deletion.
                </p>
                <a className={styles.dpoLink} href="mailto:example@royalane.com">
                  example@royalane.com
                  <HiOutlineExternalLink aria-hidden="true" />
                </a>
              </div>
            </aside>

            <div className={styles.contentRail}>
              <div className={styles.assuranceCard}>
                <div className={styles.assuranceThumb}>
                  <Image
                    src="/updatedImages/aboutUsBanner.jpg"
                    alt="Royalane chauffeur transfer service"
                    fill
                    className={styles.assuranceThumbImg}
                    sizes="168px"
                  />
                </div>
                <div>
                  <p className={styles.assuranceEyebrow}>Executive Assurance</p>
                  <h2 className={`${styles.assuranceTitle} ${playfair.className}`}>
                    <span className={styles.assuranceTitleIcon} aria-hidden="true">
                      <IoShieldCheckmarkOutline />
                    </span>
                    Discretion by Architecture
                  </h2>
                  <p className={styles.assuranceCopy}>
                    In alignment with bespoke executive mobility protocols, data minimisation is
                    embedded directly into our dispatch infrastructure. Chauffeurs receive strictly
                    obfuscated drop-off manifests, and cabin telemetry is purged following itinerary
                    sign-off.
                  </p>
                  <div className={styles.assuranceHeroImg}>
                    <Image
                      src="/updatedImages/aboutUsBanner.jpg"
                      alt="Royalane private transfer at airport terminal"
                      fill
                      className={styles.assuranceThumbImg}
                      sizes="(max-width: 991px) 100vw, 0px"
                    />
                  </div>
                </div>
              </div>

              <article
                id="who-we-are"
                ref={(el) => {
                  articleRefs.current['who-we-are'] = el;
                }}
                className={styles.panel}
              >
                <div className={styles.articleMeta}>
                  <p className={styles.articleLabel}>Article 01</p>
                  <IoBusinessOutline className={styles.articleMetaIcon} aria-hidden="true" />
                </div>
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>1. Who we are</h2>
                <div className={styles.panelBody}>
                  <p>
                    Royalane (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates this website and provides
                    luxury passenger ground transport and flight-synchronized airport transfers. This
                    Privacy Policy details our obligations, legal foundations, and transparent
                    mechanisms to collect, protect, and process your personal information.
                  </p>
                  <div className={`${styles.callout} ${styles.desktopOnlyCallout}`}>
                    <strong>Operating Entity:</strong> Royalane
                    <br />
                    <strong>Headquarters:</strong> 693a Stratford Road, Birmingham B11 4DX, United
                    Kingdom.
                    <br />
                    <strong>Primary Contact:</strong>{' '}
                    <a href="mailto:example@royalane.com">example@royalane.com</a>
                  </div>
                  <div className={styles.entityBox}>
                    <p className={styles.entityBoxLabel}>Registered Entity &amp; Headquarters</p>
                    <p className={styles.entityBoxText}>
                      Royalane · 693a Stratford Road, Birmingham B11 4DX, United Kingdom
                    </p>
                  </div>
                </div>
              </article>

              <article
                id="information-we-collect"
                ref={(el) => {
                  articleRefs.current['information-we-collect'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  2. Information we collect
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    We collect personal data required to coordinate executive transfers and uphold
                    punctuality standards across our reservation platforms.
                  </p>
                  <ul className={styles.checkList}>
                    <CheckItem label="Booking details:">
                      Full name, email, telephone, billing address, country, honorifics, and companion
                      identities.
                    </CheckItem>
                    <CheckItem label="Trip &amp; Telemetry details:">
                      Pickup/drop-off coordinates, timestamps, flight call signs, and vehicle
                      configuration preferences (infant seating, water options).
                    </CheckItem>
                    <CheckItem label="Payment verification:">
                      PCI-DSS Level 1 payment infrastructure. Royalane does not store complete card
                      digits.
                    </CheckItem>
                    <CheckItem label="Technical metrics:">
                      Encrypted IP traces, browser parameters, and session markers via cookies.
                    </CheckItem>
                    <CheckItem label="Direct correspondence:">
                      Messages, itinerary modifications, and instructions through our 24/7 operations
                      desk.
                    </CheckItem>
                  </ul>
                </div>
              </article>

              <article
                id="how-we-use"
                ref={(el) => {
                  articleRefs.current['how-we-use'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  3. How we use your information
                </h2>
                <div className={styles.panelBody}>
                  <ul className={styles.checkList}>
                    <CheckItem label="Bookings:">
                      To process and confirm transfer bookings and itinerary changes.
                    </CheckItem>
                    <CheckItem label="Dispatch:">
                      To coordinate chauffeur assignment, flight monitoring, and meet-and-greet
                      service.
                    </CheckItem>
                    <CheckItem label="Support:">
                      To provide customer support and respond to service requests.
                    </CheckItem>
                    <CheckItem label="Improvement:">
                      To improve website performance, safety, and product experience.
                    </CheckItem>
                    <CheckItem label="Compliance:">
                      To meet legal, regulatory, and fraud-prevention requirements.
                    </CheckItem>
                  </ul>
                </div>
              </article>

              <article
                id="who-we-share"
                ref={(el) => {
                  articleRefs.current['who-we-share'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  4. Who we share it with
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Your personal data will never be sold. We only share information with trusted
                    providers who help deliver your booking — such as payment processors, licensed
                    chauffeurs, and operational partners — and only to the extent required for the
                    service.
                  </p>
                </div>
              </article>

              <article
                id="international-transfers"
                ref={(el) => {
                  articleRefs.current['international-transfers'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  5. International transfers
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Where your journey involves international partners, data may be processed outside
                    your home country under appropriate safeguards and only for delivering the booked
                    service.
                  </p>
                  <div className={styles.callout}>
                    Transfers rely on contractual protections and security measures aligned with UK
                    and EU data protection standards.
                  </div>
                </div>
              </article>

              <article
                id="retention"
                ref={(el) => {
                  articleRefs.current.retention = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  6. How long we keep your data
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    We retain personal data only for as long as needed to fulfil bookings, meet
                    accounting and legal requirements, resolve disputes, and enforce our agreements.
                    When data is no longer required, it is securely deleted or anonymised.
                  </p>
                </div>
              </article>

              <article
                id="cookies"
                ref={(el) => {
                  articleRefs.current.cookies = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  7. Cookies &amp; Tracking
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    We use essential cookies to keep the booking experience reliable, plus limited
                    analytics cookies to understand performance. You can control non-essential cookies
                    through your browser settings where available.
                  </p>
                </div>
              </article>

              <article
                id="legal-rights"
                ref={(el) => {
                  articleRefs.current['legal-rights'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  8. Your legal rights
                </h2>
                <div className={styles.panelBody}>
                  <p>Depending on applicable law, you may have the right to:</p>
                  <ul className={styles.checkList}>
                    <CheckItem label="Right of access:">Request a copy of your personal data.</CheckItem>
                    <CheckItem label="Right to correction:">Ask us to fix inaccurate information.</CheckItem>
                    <CheckItem label="Right to erasure:">Request deletion where legally permitted.</CheckItem>
                    <CheckItem label="Right to restrict processing:">Limit how we use your data.</CheckItem>
                    <CheckItem label="Right to object / withdraw consent:">
                      Object to certain processing or withdraw optional consent.
                    </CheckItem>
                  </ul>
                </div>
              </article>

              <article
                id="security"
                ref={(el) => {
                  articleRefs.current.security = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  9. Data Security &amp; Encryption
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    We maintain administrative, technical, and organisational measures to help prevent
                    unauthorised access, misuse, or loss of personal information. Access is limited to
                    authorised personnel and required service providers.
                  </p>
                  <div className={styles.callout}>
                    No method of transmission over the internet is completely secure. Please protect
                    your account credentials and share booking references carefully.
                  </div>
                </div>
              </article>

              <article
                id="minors"
                ref={(el) => {
                  articleRefs.current.minors = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  10. Protection of Minors
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Our services are not directed at children. Where bookings include minors as
                    passengers, data is processed only as needed to deliver the transfer and under the
                    responsibility of the booking adult.
                  </p>
                </div>
              </article>

              <article
                id="changes"
                ref={(el) => {
                  articleRefs.current.changes = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  11. Changes to this policy
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date
                    at the top of this page reflects the latest revision. Continued use of our
                    services after changes take effect constitutes acceptance of the updated policy.
                  </p>
                </div>
              </article>

              <article
                id="contact"
                ref={(el) => {
                  articleRefs.current.contact = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  12. Contact our Officer
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Your privacy is important to us. If you have questions or concerns about our
                    privacy practices, please contact us:
                  </p>
                  <div className={styles.contactBox}>
                    <p>
                      <strong>Email:</strong>{' '}
                      <a href="mailto:example@royalane.com">example@royalane.com</a>
                    </p>
                    <p>
                      <strong>Phone:</strong>{' '}
                      <a href="tel:+441214343738">+44 121 434 3738</a>
                    </p>
                    <p>
                      <strong>Address:</strong> 693a Stratford Road, Birmingham B11 4DX, UK
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
