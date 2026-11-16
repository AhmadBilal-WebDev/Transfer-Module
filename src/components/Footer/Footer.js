'use client';

import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaHeadset } from 'react-icons/fa';
import { FaXTwitter, FaArrowUp } from 'react-icons/fa6';
import { dmSans, plusJakarta } from '@/lib/fonts';
import BrandLogo from '@/components/BrandLogo';
import styles from './footer.module.css';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Contact Us', href: '/contact-us' },
  { label: 'About Us', href: '/about-us' },
];

const travelServices = [
  { label: 'Blogs', href: '/blogs' },
  { label: 'Destination', href: '/holiday-packages' },
];

const supportLinks = [
  { label: 'Help Center', href: '/faqs' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className={`${styles.footer} ${dmSans.className}`}>
      <div className={styles.shell}>
        <div className={styles.topRow}>
          <div className={styles.brandCol}>
            <div className={styles.brandHead}>
              <div>
                <Link href="/" className={styles.brand} aria-label="Royalane home">
                  <BrandLogo className={styles.brandLogo} width={180} height={44} />
                </Link>
                <p className={styles.tagline}>Explore · Discover · Travel</p>
              </div>

              <button
                type="button"
                className={styles.scrollTop}
                onClick={scrollToTop}
                aria-label="Back to top"
              >
                <FaArrowUp aria-hidden="true" />
              </button>
            </div>

            <div className={styles.socialIcons}>
              <a
                href="https://www.instagram.com/royalane"
                aria-label="Follow us on Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.facebook.com/royalane"
                aria-label="Visit our Facebook page"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://x.com/royalane"
                aria-label="Follow us on X"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaXTwitter />
              </a>
            </div>
          </div>

          <div className={styles.linksGrid}>
            <div className={styles.linkCol}>
              <h5 className={styles.heading}>Quick Links</h5>
              <ul className={styles.linkList}>
                {quickLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkCol}>
              <h5 className={styles.heading}>Travel Services</h5>
              <ul className={styles.linkList}>
                {travelServices.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${styles.linkCol} ${styles.supportCol}`}>
              <h5 className={styles.heading}>Support</h5>
              <ul className={styles.linkList}>
                {supportLinks.map((item) => (
                  <li key={`support-${item.label}`}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className={`${styles.copyright} ${plusJakarta.className}`}>
          © {new Date().getFullYear()} ROYALANE Travel. All rights reserved.
        </p>
      </div>

      {/* <a
        href="https://wa.me/447305570864"
        className={styles.chatFab}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <FaHeadset aria-hidden="true" />
        Chat with us
      </a> */}
    </footer>
  );
}
