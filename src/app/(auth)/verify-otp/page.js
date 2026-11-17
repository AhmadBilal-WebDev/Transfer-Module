'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IoWarning, IoMailOutline, IoTimeOutline } from 'react-icons/io5';
import { FiArrowLeft } from 'react-icons/fi';
import { plusJakarta } from '@/lib/fonts';
import BrandLogo from '@/components/BrandLogo';
import { isOtpSessionValid } from '@/lib/otpSession';
import styles from '../login/login.module.css';

const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 5;

function maskEmail(value) {
  if (!value || !value.includes('@')) return value || '';
  const [user, domain] = value.split('@');
  if (!user) return value;
  const visible = user.slice(0, Math.min(2, user.length));
  const stars = '*'.repeat(Math.max(3, Math.min(9, user.length - visible.length)));
  return `${visible}${stars}@${domain}`;
}

function formatCooldown(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function VerifyOtpPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromQuery = searchParams.get('email') || '';
  const email = emailFromQuery || session?.user?.email || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);
  const submittingRef = useRef(false);
  const inputRefs = useRef([]);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  useEffect(() => {
    startCooldown();
  }, [startCooldown]);

  useEffect(() => {
    if (status === 'unauthenticated' && !emailFromQuery) {
      router.replace('/login');
    }
  }, [status, emailFromQuery, router]);

  useEffect(() => {
    if (status === 'authenticated' && isOtpSessionValid(session)) {
      router.replace(searchParams.get('redirect') || '/dashboard');
    }
  }, [status, session, router, searchParams]);

  const sendOtp = useCallback(async () => {
    if (!email) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/send-otp`,
        {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      );
      const data = await res.json();
      if (res.ok && data?.success !== false) {
        setSuccess(data?.message);
        startCooldown();
      } else {
        setError(data?.message);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }, [email, startCooldown]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setError('Please enter the complete 5-digit OTP.');
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await signIn('credentials', {
      email,
      otp,
      redirect: false,
    });

    if (!result?.ok) {
      setError(result?.error);
      setOtp('');
      setLoading(false);
      submittingRef.current = false;
      inputRefs.current[0]?.focus();
      return;
    }

    setSuccess('Verified! Redirecting...');
    try {
      await update({ otpVerifiedAt: Date.now() });
    } catch {
      // Session cookie from signIn is enough; update is a safety stamp for the 1h gate.
    }
    router.push(searchParams.get('redirect') || '/dashboard');
  };

  useEffect(() => {
    if (otp.length === OTP_LENGTH) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const updateOtpValue = (next) => {
    const digits = next.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    setError('');
    setSuccess('');
  };

  const handleBoxChange = (index, raw) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      const chars = otp.split('');
      chars[index] = '';
      updateOtpValue(chars.join('').replace(/\s/g, ''));
      return;
    }

    if (cleaned.length > 1) {
      const merged = (otp.slice(0, index) + cleaned).slice(0, OTP_LENGTH);
      updateOtpValue(merged);
      const focusAt = Math.min(merged.length, OTP_LENGTH - 1);
      inputRefs.current[focusAt]?.focus();
      return;
    }

    const chars = otp.padEnd(OTP_LENGTH, ' ').split('');
    chars[index] = cleaned;
    const next = chars.join('').replace(/ /g, '').slice(0, OTP_LENGTH);
    updateOtpValue(next);
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const chars = otp.split('');
        chars[index] = '';
        updateOtpValue(chars.join(''));
        return;
      }
      if (index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
        const chars = otp.split('');
        chars[index - 1] = '';
        updateOtpValue(chars.join(''));
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text') || '';
    updateOtpValue(pasted);
    const focusAt = Math.min(pasted.replace(/\D/g, '').length, OTP_LENGTH) - 1;
    if (focusAt >= 0) inputRefs.current[focusAt]?.focus();
  };

  if (status === 'loading' && !emailFromQuery) {
    return (
      <div className={`${styles.loginwrapper} ${plusJakarta.className}`}>
        <div className="spinner-border" style={{ color: '#0f63bd' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.loginwrapper} ${plusJakarta.className}`}>
      <div className={styles.split}>
        <aside className={`${styles.visual} ${styles.visualOtp}`} aria-hidden="true">
          <div className={styles.visualTop}>
            <Link href="/" className={styles.brandRow} aria-label="Royalane home">
              <BrandLogo className={styles.brandLogoImg} width={168} height={40} priority />
            </Link>
          </div>

          <div className={styles.visualCopy}>
            <div className={styles.visualDots} aria-hidden="true">
              <span className={styles.visualDot} />
              <span className={`${styles.visualDot} ${styles.visualDotActive}`} />
              <span className={styles.visualDot} />
            </div>
            <h2 className={styles.visualTitle}>One quick check and you&apos;re on your way.</h2>
            <p className={styles.visualSubtitle}>
              Your session stays verified for 1 hour, so you can review rides and payments without
              signing in again.
            </p>
          </div>
        </aside>

        <div className={styles.panel}>
          <div className={`${styles.panelTop} ${styles.panelTopBetween}`}>
            <Link href="/login" className={styles.backLink}>
              <FiArrowLeft aria-hidden="true" />
              Back
            </Link>
            <p className={styles.stepLabel}>Step 2 of 2</p>
          </div>

          <div className={styles.panelBody}>
            <div className={styles.panelInner}>
              <div className={styles.mailBadge} aria-hidden="true">
                <IoMailOutline />
              </div>

              <h1 className={styles.verifyTitle}>Check your inbox</h1>
              <p className={styles.verifyLead}>
                We sent a 5-digit code to <strong>{maskEmail(email)}</strong>.{' '}
                <Link href="/login" className={styles.changeEmailLink}>
                  Change email
                </Link>
              </p>

              <div className={styles.formCard}>
                <form onSubmit={handleSubmit}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} htmlFor="otp-0">
                      Verification code
                    </label>
                    <div className={styles.otpBoxes} onPaste={handlePaste}>
                      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                        <input
                          key={`otp-${index}`}
                          id={`otp-${index}`}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          className={styles.otpBox}
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          maxLength={1}
                          value={otp[index] || ''}
                          onChange={(e) => handleBoxChange(index, e.target.value)}
                          onKeyDown={(e) => handleBoxKeyDown(index, e)}
                          disabled={loading}
                          autoFocus={index === 0}
                          aria-label={`Digit ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className={styles.errorAlert}>
                      <IoWarning size={15} />
                      {error}
                    </div>
                  )}

                  {success && !error && (
                    <div className={styles.successAlert}>{success}</div>
                  )}

                  <button
                    type="submit"
                    className={`btn w-100 ${styles.loginbtn}`}
                    disabled={loading || otp.length !== OTP_LENGTH}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Verifying...
                      </>
                    ) : (
                      'Verify & continue'
                    )}
                  </button>

                  <div className={styles.resendRow}>
                    <span>Didn&apos;t get it?</span>
                    {cooldown > 0 ? (
                      <span className={styles.resendWait}>Resend in {formatCooldown(cooldown)}</span>
                    ) : (
                      <button type="button" onClick={sendOtp} disabled={sending}>
                        {sending ? 'Sending...' : 'Resend code'}
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className={styles.infoBanner}>
                <IoTimeOutline aria-hidden="true" />
                <p className={styles.secureText}>
                  Verification is valid for <strong>1 hour</strong>. After that, we&apos;ll ask you
                  to confirm again.
                </p>
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
