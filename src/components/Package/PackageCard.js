import React from 'react'
import {
  FaPlaneDeparture,
  FaStar,
  FaUser,
  FaClock,
  FaCalendarAlt,
  FaRegHeart,
} from 'react-icons/fa'
import { FaLocationDot } from 'react-icons/fa6'
import Image from 'next/image'
import Link from 'next/link'
import moment from 'moment'
import PriceDisplay from '../Currency/PriceDisplay'
import styles from './PackageCard.module.css'

export default function PackageCard({ packageList }) {
  return (
    <div className={styles.list}>
      {packageList.map((item, index) => {
        const validPrices = item?.price_Details?.filter((p) => p.type !== 'without_beds')

        const minPrice = validPrices?.reduce(
          (min, p) => (Number(p.sale_per_person) < min ? Number(p.sale_per_person) : min),
          validPrices?.[0]?.sale_per_person
        )

        const nights = moment(item.end_date).diff(moment(item.start_date), 'days')
        const days = nights > 0 ? nights + 1 : 1
        const rating = Number(item?.star_rating) || 0
        const departure = item?.flights?.[0]?.stops?.[0]?.departure_from
        const detailHref = `/${item.category.slug}/${item.slug}`
        const locationLabel =
          item?.destination ||
          item?.location ||
          item?.category?.name ||
          'Saudi Arabia'

        return (
          <article className={styles.card} key={item?.id || item?.slug || index}>
            <div className={styles.media}>
              <div className={styles.mediaLink}>
                <Image
                  src={item?.featured_image}
                  width={480}
                  height={320}
                  className={styles.image}
                  alt={item.title}
                />
              </div>
              {item?.category?.name && (
                <span className={styles.categoryBadge}>{item.category.name}</span>
              )}
              <span className={styles.wishBtn} aria-hidden="true">
                <FaRegHeart size={14} />
              </span>
            </div>

            <div className={styles.body}>
              <div className={styles.title}>
                {item.title}
              </div>

              <div className={styles.meta}>
                <span className={styles.metaItem}>
                  <FaLocationDot size={13} aria-hidden="true" />
                  {locationLabel}
                </span>
                <span className={styles.metaItem}>
                  <FaClock size={12} aria-hidden="true" />
                  {days} Days - {nights} Night{nights !== 1 ? 's' : ''}
                </span>
                {rating > 0 && (
                  <span className={styles.metaRating}>
                    <FaStar size={13} aria-hidden="true" />
                    {rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}
                  </span>
                )}
              </div>

              <div className={styles.pricing}>
                <span className={styles.priceFrom}>From</span>
                <div className={styles.priceMain}>
                  <PriceDisplay price={Number(minPrice)} currency={item?.currency_code} />
                </div>
                <p className={styles.priceNote}>per person · Tax and Fees Included</p>
              </div>

              {item?.description_text && (
                <p className={styles.desc}>{item.description_text}</p>
              )}

              <div className={styles.pills}>
                {departure && (
                  <span className={styles.pill}>
                    <FaPlaneDeparture size={12} aria-hidden="true" />
                    Departure: {departure}
                  </span>
                )}
                <span className={styles.pill}>
                  <FaCalendarAlt size={12} aria-hidden="true" />
                  {moment(item.start_date).format('DD-MM-YYYY')} -{' '}
                  {moment(item.end_date).format('DD-MM-YYYY')}
                </span>
                <span className={styles.pill}>
                  <FaUser size={12} aria-hidden="true" />
                  Pax: {item?.pax}
                </span>
              </div>

              <div className={styles.footer}>
                <Link href="tel:01217772522" className={styles.btnOutline}>
                  Call Now
                </Link>
                <Link href={detailHref} className={styles.btnPrimary}>
                  Book Now <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
