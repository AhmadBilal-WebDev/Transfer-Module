'use client';

import React from 'react';
import { FaFacebookF, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import styles from './SocialMediaShare.module.css';

export default function SocialMediaShare() {
  const currentURL = typeof window !== 'undefined' ? window.location.href : '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentURL)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentURL)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentURL)}`,
  };

  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        <li className={styles.item}>
          <a href={shareLinks.facebook} target="_blank" rel="noreferrer" aria-label="Share on Facebook">
            <FaFacebookF />
          </a>
        </li>
        <li className={styles.item}>
          <a href={shareLinks.twitter} target="_blank" rel="noreferrer" aria-label="Share on X">
            <FaXTwitter />
          </a>
        </li>
        <li className={styles.item}>
          <a href={shareLinks.linkedin} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn">
            <FaLinkedinIn />
          </a>
        </li>
      </ul>
    </div>
  );
}
