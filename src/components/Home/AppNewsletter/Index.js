'use client';

import { useState } from 'react';
import { FaApple } from 'react-icons/fa';
import { IoLogoGooglePlaystore } from 'react-icons/io5';
import { HiArrowUpRight } from 'react-icons/hi2';
import { playfair } from '@/lib/fonts';
import styles from './AppNewsletter.module.css';

export default function AppNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubscribe = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('invalid');
      return;
    }
    setStatus('success');
    setEmail('');
  };

  return (
    <section className={styles.section} aria-label="App and newsletter">
      <div className={styles.shell}>
        <div className={styles.layout}>
          <article className={styles.appPanel}>
            <div className={styles.panelCopy}>
              <div className={styles.chip}>
                <span>Royalane App</span>
                <span className={styles.chipLine} aria-hidden="true" />
                <span>Mobile</span>
              </div>

              <h2 className={`${styles.heading} ${playfair.className}`}>
                Your world,<br />
                in your pocket.
              </h2>
              <p className={styles.copy}>
                Book, manage and unlock exclusive member-only fares — anywhere, anytime.
              </p>
            </div>

            <div className={styles.storeRow}>
              <a
                href="#app-store"
                className={`${styles.storeBtn}`}
                aria-label="Download on the App Store"
              >
                <FaApple className={styles.storeIcon} aria-hidden="true" />
                <span className={styles.storeText}>
                  <span className={styles.storeEyebrow}>Download on the</span>
                  <span className={styles.storeName}>App Store</span>
                </span>
              </a>

              <a
                href="#google-play"
                className={styles.storeBtn}
                aria-label="Get it on Google Play"
              >
                <IoLogoGooglePlaystore className={styles.storeIcon} aria-hidden="true" />
                <span className={styles.storeText}>
                  <span className={styles.storeEyebrow}>Get it on</span>
                  <span className={styles.storeName}>Google Play</span>
                </span>
              </a>
            </div>
          </article>

          <article className={styles.newsPanel}>
            <div className={styles.panelCopy}>
              <div className={styles.chip}>
                <span>Exclusive Access</span>
                <span className={styles.chipLine} aria-hidden="true" />
                <span>Inbox</span>
              </div>

              <h2 className={`${styles.heading} ${playfair.className}`}>
                Get exclusive<br />
                travel deals.
              </h2>
              <p className={styles.copy}>
                Members-only fares, insider guides and early access to seasonal itineraries —
                straight to your inbox.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubscribe} noValidate>
              <div className={styles.inputShell}>
                <label htmlFor="royalane-newsletter-email" className={styles.srOnly}>
                  Email address
                </label>
                <input
                  id="royalane-newsletter-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== 'idle') setStatus('idle');
                  }}
                  placeholder="your@email.com"
                  className={styles.input}
                  autoComplete="email"
                />
                <button type="submit" className={styles.subscribeBtn}>
                  Subscribe
                  <HiArrowUpRight aria-hidden="true" />
                </button>
              </div>

              {status === 'invalid' && (
                <p className={styles.formMsg} role="alert">
                  Please enter a valid email address.
                </p>
              )}
              {status === 'success' && (
                <p className={styles.formMsgSuccess} role="status">
                  Thanks — you&apos;re on the list.
                </p>
              )}
            </form>
          </article>
        </div>
      </div>
    </section>
  );
}
