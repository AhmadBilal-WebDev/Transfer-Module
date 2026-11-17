import Link from 'next/link'
import { playfair, inter } from '@/lib/fonts'
import styles from './not-found.module.css'

export const metadata = {
  title: '404 — Page Not Found | Royalane',
}

export default function NotFound() {
  return (
    <main className={`${styles.page} ${inter.className}`}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Error 404</p>
        <h1 className={`${styles.title} ${playfair.className}`}>
          This page took a wrong turn.
        </h1>
        <p className={styles.text}>
          The link may be broken or the page may have moved. Head home or book a
          transfer to continue your journey.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Back to Home
          </Link>
          {/* <Link href="/transfers" className={styles.secondaryBtn}>
            Book a Transfer
          </Link> */}
        </div>
      </div>
    </main>
  )
}
