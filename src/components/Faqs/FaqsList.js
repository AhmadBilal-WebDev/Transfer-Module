'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Accordion } from '@mantine/core';
import { IoSearchOutline, IoCallOutline, IoChatbubbleEllipsesOutline, IoAdd } from 'react-icons/io5';
import { playfair, inter } from '@/lib/fonts';
import styles from './FaqsList.module.css';

const faqGroups = [
  {
    id: 'booking',
    label: 'Booking',
    items: [
      {
        id: 'b1',
        question: 'How do I book a transfer?',
        answer:
          'Search your route, choose a vehicle class, enter passenger and flight details, then confirm payment. You will receive an instant booking confirmation by email.',
      },
      {
        id: 'b2',
        question: 'How far in advance should I book?',
        answer:
          'We recommend booking as soon as your flight is confirmed. Same-day bookings are often available, but advance booking secures preferred vehicles and fixed rates.',
      },
      {
        id: 'b3',
        question: 'Can I book for someone else?',
        answer:
          'Yes. Enter the traveller details during checkout and include the correct flight number so our dispatch team can sync pickup timing.',
      },
      {
        id: 'b4',
        question: 'What is the difference between private and shared?',
        answer:
          'Private transfers are exclusive to your party. Shared options may combine passengers on the same route at a lower fare while still using professional chauffeurs.',
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing & payment',
    items: [
      {
        id: 'p1',
        question: 'Is the price final?',
        answer:
          'Yes. The quoted fare is fixed and includes applicable taxes and standard airport access charges, with no surge pricing after confirmation.',
      },
      {
        id: 'p2',
        question: 'Which payment methods do you accept?',
        answer:
          'We accept major debit and credit cards through secure checkout, with an immediate receipt after successful payment.',
      },
      {
        id: 'p3',
        question: 'Is my payment secure?',
        answer:
          'Payments are processed through encrypted checkout providers. Card details are never stored on Royalane servers.',
      },
    ],
  },
  {
    id: 'changes',
    label: 'Changes & cancellations',
    items: [
      {
        id: 'c1',
        question: 'Can I cancel my booking?',
        answer:
          'Yes. Complimentary cancellation may apply up to 24 hours before pickup, depending on the transfer policy shown at checkout.',
      },
      {
        id: 'c2',
        question: 'Can I change my booking?',
        answer:
          'Most bookings can be amended for pickup time, flight number, or passenger details. Contact support with your booking reference for assistance.',
      },
      {
        id: 'c3',
        question: 'How do refunds work?',
        answer:
          'Eligible refunds are returned to the original payment method after cancellation is confirmed by our support team.',
      },
    ],
  },
  {
    id: 'pickup',
    label: 'Pickup & travel',
    items: [
      {
        id: 'u1',
        question: 'Where will my driver meet me?',
        answer:
          'For airport arrivals, your chauffeur meets you in the arrivals hall with a name sign. Exact meeting instructions are included in your confirmation.',
      },
      {
        id: 'u2',
        question: 'What if my flight is delayed?',
        answer:
          'We monitor flight status automatically. Pickup timing adjusts with your arrival so you are not charged for standard flight delays.',
      },
      {
        id: 'u3',
        question: 'How long will the driver wait?',
        answer:
          'Complimentary waiting time is typically included for airport pickups. Exact wait buffers are shown on your booking details.',
      },
      {
        id: 'u4',
        question: 'How do I contact my driver?',
        answer:
          'Driver contact details and tracking links are shared before pickup via SMS and email so you can coordinate directly if needed.',
      },
    ],
  },
  {
    id: 'luggage',
    label: 'Luggage & extras',
    items: [
      {
        id: 'l1',
        question: 'How much luggage can I bring?',
        answer:
          'Luggage capacity depends on the selected vehicle. Capacity details are shown on each vehicle card before you continue to checkout.',
      },
      {
        id: 'l2',
        question: 'Can I request extras?',
        answer:
          'Yes. Child seats, extra luggage space, and other add-ons can be requested during booking or by contacting our concierge team.',
      },
    ],
  },
];

const allItems = faqGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, category: group.id, categoryLabel: group.label })),
);

const categories = [
  { id: 'all', label: 'All Questions', count: allItems.length },
  ...faqGroups.map((group) => ({
    id: group.id,
    label: group.label,
    count: group.items.length,
  })),
];

export default function FaqsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const visibleGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return faqGroups
      .map((group) => {
        if (activeCategory !== 'all' && group.id !== activeCategory) {
          return null;
        }

        const items = group.items.filter((item) => {
          if (!query) return true;
          return (
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
          );
        });

        if (!items.length) return null;
        return { ...group, items };
      })
      .filter(Boolean);
  }, [activeCategory, searchQuery]);

  return (
    <div className={`${styles.page} ${inter.className}`}>
      <section className={styles.hero} aria-label="FAQs hero">
        <div className={styles.shell}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>FAQs</span>
          </nav>

          <p className={styles.eyebrow}>Help Center</p>
          <h1 className={`${styles.title} ${playfair.className}`}>
            Frequently asked questions.
          </h1>
          <p className={styles.lead}>
            Everything you need to know about airport transfers, pricing, drivers, and booking with
            Royalane.
          </p>

          <div className={styles.searchWrap}>
            <IoSearchOutline className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search for an answer (e.g. flight delay, luggage, cancellation)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search FAQs"
            />
          </div>
        </div>
      </section>

      <div className={styles.main}>
        <div className={styles.shell}>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <div className={styles.categoriesCard}>
                <p className={styles.catHeading}>Categories</p>
                <ul className={styles.catList}>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        type="button"
                        className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catBtnActive : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                      >
                        <span>{cat.label}</span>
                        <span className={styles.catCount}>{cat.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.helpCard}>
                <p className={styles.helpEyebrow}>
                  <IoChatbubbleEllipsesOutline aria-hidden="true" />
                  24/7 Concierge
                </p>
                <h2 className={`${styles.helpTitle} ${playfair.className}`}>Still need help?</h2>
                <p className={styles.helpText}>
                  Our luxury dispatch and client managers are available around the clock to tailor
                  your itinerary.
                </p>
                <a href="tel:+441214343738" className={styles.helpPhone}>
                  <IoCallOutline aria-hidden="true" />
                  +44 121 434 3738
                </a>
              </div>
            </aside>

            <div className={styles.content}>
              <div className={styles.mobileCats} aria-label="FAQ categories">
                {categories.map((cat) => (
                  <button
                    key={`mobile-${cat.id}`}
                    type="button"
                    className={`${styles.mobileCatBtn} ${activeCategory === cat.id ? styles.mobileCatBtnActive : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>

              {visibleGroups.length === 0 ? (
                <div className={styles.empty}>No questions matched your search.</div>
              ) : (
                visibleGroups.map((group) => (
                  <section key={group.id} className={styles.group} aria-labelledby={`faq-${group.id}`}>
                    <h2 id={`faq-${group.id}`} className={`${styles.groupTitle} ${playfair.className}`}>
                      <span className={styles.groupDot} aria-hidden="true" />
                      {group.label}
                    </h2>
                    <Accordion
                      multiple
                      variant="separated"
                      className={styles.accordion}
                      chevron={
                        <span className={styles.plusIcon} aria-hidden="true">
                          <IoAdd />
                        </span>
                      }
                    >
                      {group.items.map((item) => (
                        <Accordion.Item key={item.id} value={item.id}>
                          <Accordion.Control>{item.question}</Accordion.Control>
                          <Accordion.Panel>{item.answer}</Accordion.Panel>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </section>
                ))
              )}

              <div className={styles.mobileHelp}>
                <span className={styles.mobileHelpText}>Immediate assistance.</span>
                <a href="tel:+441214343738" className={styles.mobileHelpBtn}>
                  Call
                </a>
              </div>
            </div>
          </div>

          <div className={styles.cta}>
            <h2 className={`${styles.ctaTitle} ${playfair.className}`}>Didn&apos;t find your answer?</h2>
            <p className={styles.ctaText}>
              Our dedicated concierge desk is online 24 hours a day to assist with any bespoke
              itinerary, flight adjustments, or vehicle requests.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/contact-us" className={styles.ctaPrimary}>
                Contact us
              </Link>
              <a href="tel:+441214343738" className={styles.ctaSecondary}>
                <IoCallOutline aria-hidden="true" />
                Call +44 121 434 3738
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
