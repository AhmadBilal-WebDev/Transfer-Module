'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { MdEmail } from 'react-icons/md';
import { IoWarning } from 'react-icons/io5';
import { FaShieldAlt } from 'react-icons/fa';
import { FiArrowLeft, FiArrowRight, FiLock } from 'react-icons/fi';
import { plusJakarta } from '@/lib/fonts';
import BrandLogo from '@/components/BrandLogo';
import { isOtpSessionValid } from '@/lib/otpSession';
import styles from './login.module.css';

const CITIES = ['Makkah', 'Madinah', 'Riyadh', 'Jeddah'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const sessionExpired = searchParams.get('expired') === '1';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const expired = new URLSearchParams(window.location.search).get('expired');
    if (expired === '1') {
      signOut({ redirect: false });
    }
  }, []);

  // Still verified within the 1-hour window → skip login and open bookings.
  useEffect(() => {
    if (sessionExpired) return;
    if (status === 'authenticated' && isOtpSessionValid(session)) {
      router.replace('/dashboard');
    }
  }, [session, status, sessionExpired, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/send-otp`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await res.json();
      if (res.ok && data?.success !== false) {
        setSuccess(data?.message);
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        setError(data?.message);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
    setSuccess('');
  };

  return (
    <div className={`${styles.loginwrapper} ${plusJakarta.className}`}>
      <div className={styles.split}>
        <aside className={styles.visual} aria-hidden="true">
          <div className={styles.visualTop}>
            <Link href="/" className={styles.brandRow} aria-label="Royalane home">
              <BrandLogo className={styles.brandLogoImg} width={168} height={40} priority />
            </Link>
          </div>

          <div className={styles.visualCopy}>
            <span className={styles.rideBadge}>Private rides, door to door</span>
            <h2 className={styles.visualTitle}>
              Airport pickups, intercity rides and hotel drop‑offs — all in one place.
            </h2>
            <p className={styles.visualSubtitle}>
              Track every transfer, see your driver details and settle payments from your Royalane
              account.
            </p>
            <ul className={styles.cityPills}>
              {CITIES.map((city) => (
                <li key={city} className={styles.cityPill}>
                  {city}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <Link href="/" className={styles.backLink}>
              <FiArrowLeft aria-hidden="true" />
              Back to Royalane
            </Link>
          </div>

          <div className={styles.panelBody}>
            <div className={styles.panelInner}>
              <p className={styles.portalLabel}>
                <FiLock aria-hidden="true" />
                Transfers portal
              </p>
              <h1 className={styles.welcomeTitle}>Sign in to manage your rides</h1>
              <p className={styles.welcomeSubtitle}>
                Enter the email you booked with. We&apos;ll send you a one‑time passcode — no
                password needed.
              </p>

              <div className={styles.formCard}>
                {sessionExpired && (
                  <div className={styles.successAlert}>
                    Your session has expired. Please enter your email to log in again.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.inputLabel}>
                      Email address
                    </label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.inputIcon}>
                        <MdEmail size={17} />
                      </span>
                      <input
                        type="email"
                        className={styles.formInput}
                        id="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div className={styles.errorAlert}>
                      <IoWarning size={15} />
                      {error}
                    </div>
                  )}

                  {success && <div className={styles.successAlert}>{success}</div>}

                  <button
                    type="submit"
                    className={`btn w-100 ${styles.loginbtn}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Sending code…
                      </>
                    ) : (
                      <>
                        Send verification code
                        <FiArrowRight aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className={styles.secureBox}>
                <FaShieldAlt className={styles.secureIcon} aria-hidden="true" />
                <div>
                  <p className={styles.secureText}>
                    A 5-digit code will arrive in your inbox within a minute. Codes expire after 10
                    minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.panelFooter}>
            <span>© {new Date().getFullYear()} Royalane. All rights reserved.</span>
            <div className={styles.panelFooterLinks}>
              <Link href="/terms-and-conditions">Terms</Link>
              <Link href="/privacy-policy">Privacy</Link>
              <Link href="/faqs">Help</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
