'use client'
import React, { useState } from 'react'
import { Modal, Grid, GridCol } from '@mantine/core'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import styles from './PackageGalleryImages.module.css'

const SLOT_CLASS = [
  styles.slotMain,
  styles.slotSideTop,
  styles.slotSideTall,
  styles.slotBottom1,
  styles.slotBottom2,
  styles.slotBottom3,
  styles.slotBottom4,
]

export default function PackageGalleryImages({ imageList, badgeLabel }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [basicExampleOpen, setBasicExampleOpen] = useState(false)

  const images = Array.isArray(imageList) ? imageList.filter(Boolean) : []
  const visible = images.slice(0, 7)

  const handlemodalopenclose = () => {
    setModalOpen((open) => !open)
  }

  const normalizeImageSrc = (raw) => {
    if (!raw) return '/images/hotelloadimg.jpg'
    if (typeof raw === 'object' && raw?.url) return normalizeImageSrc(raw.url)
    if (raw.startsWith('data:') || raw.startsWith('/')) return raw
    if (/^https?:\/\//i.test(raw)) return raw
    if (raw.startsWith('//')) {
      if (typeof window !== 'undefined') return window.location.protocol + raw
      return 'https:' + raw
    }
    return 'http://' + raw.replace(/^\/+/, '')
  }

  const openLightboxAt = (index) => {
    setCurrentIndex(index)
    setBasicExampleOpen(true)
  }

  if (!images.length) {
    return null
  }

  const gridMod =
    visible.length <= 1
      ? styles.gridSingle
      : visible.length <= 3
        ? styles.gridCompact
        : ''

  return (
    <div className={styles.gallery}>
      <div className={`${styles.grid} ${gridMod}`}>
        {visible.map((item, index) => (
          <div
            key={`${normalizeImageSrc(item)}-${index}`}
            className={`${styles.cell} ${SLOT_CLASS[index] || styles.slotExtra}`}
            onClick={() => openLightboxAt(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') openLightboxAt(index)
            }}
          >
            <Image
              src={normalizeImageSrc(item)}
              alt={`Package image ${index + 1}`}
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              unoptimized
              className={styles.image}
              onError={(e) => {
                e.currentTarget.src = '/images/hotelloadimg.jpg'
              }}
            />

            {index === 0 && badgeLabel && (
              <span className={styles.badge}>{badgeLabel}</span>
            )}
          </div>
        ))}

        <button
          type="button"
          className={`${styles.cell} ${styles.slotViewAll}`}
          onClick={handlemodalopenclose}
          aria-label="View all photos"
        >
          View all photos →
        </button>
      </div>

      <Modal
        lockScroll
        trapFocus
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        opened={modalOpen}
        onClose={handlemodalopenclose}
        size="70%"
        title="Package Images"
      >
        <Grid className="p-3" grow gutter="xs">
          <GridCol span={{ base: 12 }}>
            <Grid grow gutter="xs">
              {images.map((image, index) => {
                let spanValue
                if (index === 0) {
                  spanValue = { base: 12, md: 6 }
                } else if (index === 1 || index === 2) {
                  spanValue = { base: 6, md: 3 }
                } else {
                  spanValue = { base: 6, md: 4 }
                }

                return (
                  <GridCol key={index} span={spanValue}>
                    <Image
                      height={200}
                      width={300}
                      unoptimized
                      onClick={() => openLightboxAt(index)}
                      className={styles.modalImage}
                      src={normalizeImageSrc(image)}
                      alt={`Package image ${index + 1}`}
                      onError={(e) => {
                        e.currentTarget.src = '/images/hotelloadimg.jpg'
                      }}
                    />
                  </GridCol>
                )
              })}
            </Grid>
          </GridCol>
        </Grid>
      </Modal>

      <Lightbox
        open={basicExampleOpen}
        close={() => setBasicExampleOpen(false)}
        slides={images.map((img) => ({ src: normalizeImageSrc(img) }))}
        index={currentIndex}
      />
    </div>
  )
}
