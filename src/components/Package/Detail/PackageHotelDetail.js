'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { IoBedOutline, IoMoonOutline } from 'react-icons/io5'
import { RiCalendarCheckLine, RiCalendarCloseLine } from 'react-icons/ri'
import { FaStar, FaStarHalf, FaCheck } from 'react-icons/fa'
import { FaLocationDot, FaHotel as FaHotelIcon } from 'react-icons/fa6'
import moment from 'moment'
import styles from './PackageHotelDetail.module.css'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

function Stars({ rating }) {
  const value = Number(rating) || 0
  const full = Math.floor(value)
  const half = value % 1 >= 0.5
  if (value <= 0) return <span className={styles.noRating}>No rating</span>
  return (
    <>
      {Array.from({ length: full }).map((_, i) => (
        <FaStar key={`f-${i}`} color="#f5b301" size={13} />
      ))}
      {half && <FaStarHalf color="#f5b301" size={13} />}
    </>
  )
}

function roomLabel(room) {
  const parts = [
    room?.type,
    room?.items?.data?.meal,
    room?.items?.data?.view,
  ].filter(Boolean)
  return parts.join(' - ')
}

export default function PackageHotelDetail({ PackageDetail }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentHotelIndex, setCurrentHotelIndex] = useState(null)

  const hotels = PackageDetail?.hotels || []
  if (!hotels.length) return null

  const openLightbox = (index) => {
    setCurrentHotelIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setCurrentHotelIndex(null)
  }

  return (
    <section className={styles.hotelSection}>
      <p className={styles.eyebrow}>Key Journey Highlights</p>
      <h2 className={styles.sectionTitle}>Hotels</h2>

      <div className={styles.hotelGrid}>
        {hotels.map((item, index) => {
          const hotel = item?.hotel || {}
          const rating = Number(hotel?.rating)
          const nights = moment(hotel?.booked_to).diff(moment(hotel?.booked_from), 'days')
          const hasImage = !!hotel?.featured_image
          const galleryCount = hotel?.gallery_images?.length || 0
          const rooms = item?.rooms || []

          return (
            <article key={hotel?.id || index} className={styles.hotelCard}>
              <div
                className={styles.imageWrap}
                onClick={() => (galleryCount > 0 || hasImage) && openLightbox(index)}
                style={{ cursor: galleryCount > 0 || hasImage ? 'pointer' : 'default' }}
                role={galleryCount > 0 || hasImage ? 'button' : undefined}
                tabIndex={galleryCount > 0 || hasImage ? 0 : undefined}
                onKeyDown={(e) => {
                  if ((galleryCount > 0 || hasImage) && e.key === 'Enter') openLightbox(index)
                }}
              >
                {hasImage ? (
                  <Image
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className={styles.hotelImage}
                    src={hotel.featured_image}
                    alt={hotel?.name || 'Hotel image'}
                  />
                ) : (
                  <div className={styles.placeholderBanner}>
                    <FaHotelIcon className={styles.placeholderIcon} />
                  </div>
                )}

                {index === 0 && (
                  <span className={styles.popularBadge}>
                    <FaCheck size={10} aria-hidden="true" /> Popular
                  </span>
                )}

                {galleryCount > 0 && (
                  <span className={styles.galleryIndicator}>
                    {galleryCount} {galleryCount === 1 ? 'Photo' : 'Photos'}
                  </span>
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.starsRow}>
                  <Stars rating={rating} />
                </div>

                <div className={styles.titleRow}>
                  <h3 className={styles.hotelName}>{hotel?.name}</h3>
                  {hotel?.city && <span className={styles.cityName}>{hotel.city}</span>}
                </div>

                <div className={styles.infoPill}>
                  {hotel?.address ? (
                    <span className={styles.infoPillItem}>
                      <FaLocationDot size={12} aria-hidden="true" />
                      <span>{hotel.address}</span>
                    </span>
                  ) : null}
                  <span className={styles.infoPillItem}>
                    <RiCalendarCheckLine size={14} aria-hidden="true" />
                    <span>{moment(hotel?.booked_from).format('DD MMM YYYY')}</span>
                  </span>
                  <span className={styles.infoPillSep} aria-hidden="true" />
                  <span className={styles.infoPillItem}>
                    <RiCalendarCloseLine size={14} aria-hidden="true" />
                    <span>{moment(hotel?.booked_to).format('DD MMM YYYY')}</span>
                  </span>
                  <span className={styles.infoPillSep} aria-hidden="true" />
                  <span className={styles.infoPillItem}>
                    <IoMoonOutline size={13} aria-hidden="true" />
                    <span>
                      {nights} {nights === 1 ? 'Night' : 'Nights'}
                    </span>
                  </span>
                </div>

                {rooms.length > 0 && (
                  <div className={styles.roomsBlock}>
                    <div className={styles.roomsLabel}>
                      <IoBedOutline size={15} className={styles.roomsIcon} />
                      Room Type
                    </div>
                    <div className={styles.roomsList}>
                      {rooms.map((room, rindex) => (
                        <div key={rindex} className={styles.roomRow}>
                          {roomLabel(room)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {lightboxOpen &&
        currentHotelIndex !== null &&
        hotels[currentHotelIndex]?.hotel && (
          <Lightbox
            open={lightboxOpen}
            close={closeLightbox}
            slides={(
              hotels[currentHotelIndex].hotel.gallery_images?.length
                ? hotels[currentHotelIndex].hotel.gallery_images
                : hotels[currentHotelIndex].hotel.featured_image
                  ? [hotels[currentHotelIndex].hotel.featured_image]
                  : []
            ).map((img) => ({
              src: img,
              alt: hotels[currentHotelIndex]?.hotel?.name || 'Hotel image',
            }))}
            carousel={{
              finite:
                (hotels[currentHotelIndex].hotel.gallery_images?.length || 1) <= 1,
            }}
            render={{
              buttonPrev:
                (hotels[currentHotelIndex].hotel.gallery_images?.length || 1) <= 1
                  ? () => null
                  : undefined,
              buttonNext:
                (hotels[currentHotelIndex].hotel.gallery_images?.length || 1) <= 1
                  ? () => null
                  : undefined,
            }}
          />
        )}
    </section>
  )
}
