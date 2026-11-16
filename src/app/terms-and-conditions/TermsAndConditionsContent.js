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
  IoChatbubbleEllipsesOutline,
  IoCheckmark,
  IoGlobeOutline,
} from 'react-icons/io5';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { playfair, inter } from '@/lib/fonts';
import styles from './TermsAndConditions.module.css';

const SECTIONS = [
  { id: 'who-we-are', short: 'Who we are', jump: '1. Who We Are' },
  { id: 'booking-confirmation', short: 'Booking confirmation', jump: '2. Booking' },
  { id: 'payment-policy', short: 'Payment policy', jump: '3. Payment' },
  { id: 'cancellation-refunds', short: 'Cancellations & refunds', jump: '4. Cancellations' },
  { id: 'service-changes', short: 'Service changes', jump: '5. Changes' },
  { id: 'responsibilities', short: 'Responsibilities', jump: '6. Liability' },
  { id: 'travel-documents', short: 'Travel documents', jump: '7. Documents' },
  { id: 'code-of-conduct', short: 'Code of conduct', jump: '8. Conduct' },
  { id: 'privacy-data', short: 'Privacy & data', jump: '9. Privacy' },
  { id: 'governing-law', short: 'Governing law', jump: '10. Law' },
  { id: 'changes-terms', short: 'Changes to terms', jump: '11. Updates' },
  { id: 'contact', short: 'Contact', jump: '12. Contact' },
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

export default function TermsAndConditionsContent() {
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
      <section className={styles.hero} aria-label="Terms and conditions">
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>Legal</span>
            <span aria-hidden="true">/</span>
            <span>Terms &amp; Conditions</span>
          </nav>

          <span className={styles.badge}>
            <IoShieldCheckmarkOutline aria-hidden="true" />
            Legal Compliance
          </span>

          <h1 className={`${styles.title} ${playfair.className}`}>Terms &amp; Condition</h1>
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
              <IoGlobeOutline aria-hidden="true" />
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
          <p className={styles.reference}>Reference: VYR-LEGAL-2026-V4</p>
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
                  <IoChatbubbleEllipsesOutline />
                </span>
                <h2 className={`${styles.dpoTitle} ${playfair.className}`}>
                  Data Protection Officer
                </h2>
                <p className={styles.dpoText}>
                  Direct inquiries regarding bookings, GDPR requests, or service terms.
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
                    These terms set clear expectations for reservations, payments, and chauffeur
                    operations so every journey remains punctual, confidential, and professionally
                    delivered.
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
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>1. Who we are</h2>
                <div className={styles.panelBody}>
                  <p>
                    Royalane (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates this website and provides
                    passenger ground transport, airport transfers, and related travel arrangements.
                    These Terms &amp; Conditions govern your use of our platforms and the services you
                    book with us.
                  </p>
                  <div className={styles.callout}>
                    <strong>Operating Entity:</strong> Royalane
                    <br />
                    <strong>Headquarters:</strong> 693a Stratford Road, Birmingham B11 4DX, United
                    Kingdom.
                    <br />
                    <strong>Primary Contact:</strong>{' '}
                    <a href="mailto:example@royalane.com">example@royalane.com</a>
                  </div>
                </div>
              </article>

              <article
                id="booking-confirmation"
                ref={(el) => {
                  articleRefs.current['booking-confirmation'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  2. Booking and confirmation
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    A booking is confirmed once payment (or the required deposit) is received and
                    written acknowledgment is issued by email. You are responsible for ensuring all
                    passenger and trip details are accurate.
                  </p>
                  <ul className={styles.checkList}>
                    <CheckItem label="Booking details:">
                      Full name, email, telephone, pickup and drop-off locations, travel dates, and
                      companion identities must be complete and correct.
                    </CheckItem>
                    <CheckItem label="Trip requirements:">
                      Flight numbers, timestamps, vehicle preferences, infant seating, and special
                      assistance requests should be provided at booking.
                    </CheckItem>
                    <CheckItem label="Availability:">
                      Service availability is subject to change until confirmation is finalized and
                      payment clearance is complete.
                    </CheckItem>
                  </ul>
                </div>
              </article>

              <article
                id="payment-policy"
                ref={(el) => {
                  articleRefs.current['payment-policy'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>3. Payment policy</h2>
                <div className={styles.panelBody}>
                  <p>
                    To secure your reservation, payment must be completed according to the invoice and
                    package requirements before the travel date. Accepted methods include bank
                    transfer, approved online portals, and other methods we publish at checkout.
                  </p>
                  <ul className={styles.checkList}>
                    <CheckItem label="Payment verification:">
                      Card payments are processed through PCI-DSS compliant infrastructure. Royalane
                      does not store complete card digits.
                    </CheckItem>
                    <CheckItem label="Timely settlement:">
                      Late payment may delay chauffeur assignment, visa support where applicable, or
                      lead to cancellation of the hold on your booking.
                    </CheckItem>
                  </ul>
                </div>
              </article>

              <article
                id="cancellation-refunds"
                ref={(el) => {
                  articleRefs.current['cancellation-refunds'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  4. Cancellations and refunds
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Cancellations must be submitted in writing. Refund eligibility depends on service
                    type, notice period, and any third-party supplier rules. Processing or gateway fees
                    may be non-refundable.
                  </p>
                  <div className={styles.callout}>
                    Early notice generally improves refund options. Late cancellations may incur
                    higher deductions or full fare charges where a chauffeur has already been
                    deployed.
                  </div>
                </div>
              </article>

              <article
                id="service-changes"
                ref={(el) => {
                  articleRefs.current['service-changes'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  5. Changes to services
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Royalane may adjust itineraries, vehicle assignments, hotels, flights, or
                    ground services when operational circumstances require it. We will communicate
                    material changes promptly and work with you to minimize inconvenience.
                  </p>
                </div>
              </article>

              <article
                id="responsibilities"
                ref={(el) => {
                  articleRefs.current.responsibilities = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  6. Responsibilities and liability
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Passengers are responsible for passports, visas, vaccinations, and personal
                    belongings. Royalane is not liable for delays, cancellations, or events
                    outside our reasonable control, including airline disruption, weather, traffic
                    incidents, or government restrictions.
                  </p>
                  <ul className={styles.checkList}>
                    <CheckItem label="Travel insurance:">
                      We strongly recommend comprehensive travel insurance for unexpected incidents.
                    </CheckItem>
                    <CheckItem label="Accurate instructions:">
                      Incorrect addresses, missed flight updates, or unreachable contact numbers may
                      affect pickup windows and waiting-time policy.
                    </CheckItem>
                  </ul>
                </div>
              </article>

              <article
                id="travel-documents"
                ref={(el) => {
                  articleRefs.current['travel-documents'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  7. Travel documents and visas
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Every passenger must carry valid travel documents. Where we assist with visa
                    processing, approval remains subject to the relevant authority. Errors or delays
                    in documentation that affect travel remain the passenger&apos;s responsibility.
                  </p>
                </div>
              </article>

              <article
                id="code-of-conduct"
                ref={(el) => {
                  articleRefs.current['code-of-conduct'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>8. Code of conduct</h2>
                <div className={styles.panelBody}>
                  <p>
                    Passengers must follow local laws, respect cultural norms, and treat chauffeurs
                    and staff courteously. Disruptive, unsafe, or abusive behaviour may result in
                    refusal or termination of service without refund.
                  </p>
                </div>
              </article>

              <article
                id="privacy-data"
                ref={(el) => {
                  articleRefs.current['privacy-data'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  9. Privacy and data protection
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    Personal information collected during booking is used to arrange and deliver your
                    transfer or travel package. Our practices are described in full in our{' '}
                    <Link href="/privacy-policy">Privacy Policy</Link>.
                  </p>
                </div>
              </article>

              <article
                id="governing-law"
                ref={(el) => {
                  articleRefs.current['governing-law'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>10. Governing law</h2>
                <div className={styles.panelBody}>
                  <p>
                    These Terms and Conditions are governed by the laws of England and Wales. Any
                    dispute arising from your booking or travel arrangements will be subject to the
                    exclusive jurisdiction of the courts of England and Wales.
                  </p>
                </div>
              </article>

              <article
                id="changes-terms"
                ref={(el) => {
                  articleRefs.current['changes-terms'] = el;
                }}
                className={styles.panel}
              >
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>
                  11. Changes to these terms
                </h2>
                <div className={styles.panelBody}>
                  <p>
                    We may update these Terms &amp; Conditions from time to time. The &quot;Last
                    updated&quot; date at the top of this page reflects the latest revision. Continued
                    use of our services after changes take effect constitutes acceptance of the
                    updated terms.
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
                <h2 className={`${styles.panelTitle} ${playfair.className}`}>12. Contact</h2>
                <div className={styles.panelBody}>
                  <p>
                    Questions about these terms, a reservation, or a service issue can be raised with
                    our concierge desk:
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
