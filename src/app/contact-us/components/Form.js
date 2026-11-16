'use client';

import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import ReCAPTCHA from 'react-google-recaptcha';
import { HiArrowUpRight } from 'react-icons/hi2';
import { IoHelpCircleOutline, IoLockClosedOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import { playfair, inter } from '@/lib/fonts';
import styles from './Form.module.css';

const initialState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export default function Form() {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'phone' ? value.replace(/[^\d+\s-]/g, '') : value,
    });

    setErrors({
      ...errors,
      [name]: '',
    });
  };

  const handleCaptcha = (token) => {
    setCaptchaToken(token);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Contact number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 6) {
      newErrors.phone = 'Enter a valid contact number';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;
    if (!captchaToken) {
      setErrorMsg('Please verify captcha');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to submit');
      const response = await res.json();
      notifications.show({
        title: 'Success',
        message: response?.Description,
        color: 'green',
      });
      setFormData(initialState);
      setCaptchaToken(null);
    } catch (error) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.card} ${inter.className}`}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h3 className={`${styles.title} ${styles.titleDesktop} ${playfair.className}`}>
            Transfer Support &amp; Inquiry
          </h3>
          <p className={`${styles.subtitle} ${styles.subtitleDesktop}`}>
            Submit your itinerary or support inquiry below
          </p>
          <h3 className={`${styles.title} ${styles.titleMobile} ${playfair.className}`}>
            Priority Transmission
          </h3>
          <p className={`${styles.subtitle} ${styles.subtitleMobile}`}>
            Secure private mobility relay
          </p>
        </div>
        <span className={styles.headerIcon} aria-hidden="true">
          <IoHelpCircleOutline className={styles.iconDesktop} />
          <IoShieldCheckmarkOutline className={styles.iconMobile} />
        </span>
      </header>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="contact-name">
              Full Name <span className={styles.req}>*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              placeholder="e.g. Lord Alexander Wright"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <small className={styles.fieldError}>{errors.name}</small>}
          </div>

          <div className={styles.field}>
            <label htmlFor="contact-email">
              Email Address <span className={styles.req}>*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              placeholder="a.wright@executive.co.uk"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <small className={styles.fieldError}>{errors.email}</small>}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-phone">
            Contact Number <span className={styles.req}>*</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            name="phone"
            placeholder="7911 123456"
            value={formData.phone}
            onChange={handleChange}
            inputMode="tel"
            autoComplete="tel"
          />
          {errors.phone && <small className={styles.fieldError}>{errors.phone}</small>}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-subject">
            Subject <span className={styles.req}>*</span>
          </label>
          <input
            id="contact-subject"
            type="text"
            name="subject"
            placeholder="How can we help?"
            value={formData.subject}
            onChange={handleChange}
          />
          {errors.subject && <small className={styles.fieldError}>{errors.subject}</small>}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-message">
            Message <span className={styles.req}>*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows="5"
            placeholder="Please share booking details, route needs, or any support request..."
            value={formData.message}
            onChange={handleChange}
          />
          {errors.message && <small className={styles.fieldError}>{errors.message}</small>}
        </div>

        <div className={styles.captchaWrap}>
          <ReCAPTCHA
            sitekey="6LdH_IQsAAAAAP8J5zF09QteWVZjAjnWSJjrW64J"
            onChange={handleCaptcha}
          />
        </div>

        {errorMsg && (
          <p className={styles.submitError} role="alert">
            {errorMsg}
          </p>
        )}

        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send message'}
          {!loading && <HiArrowUpRight aria-hidden="true" />}
        </button>

        <p className={`${styles.note} ${styles.noteDesktop}`}>
          All communications are encrypted and managed in line with Royalane Confidentiality Standards.
        </p>
        <p className={`${styles.note} ${styles.noteMobile}`}>
          <IoLockClosedOutline aria-hidden="true" />
          End-to-end encrypted under UK Executive Discretion Standard
        </p>
      </form>
    </div>
  );
}
