'use client'
import React, { useState, useEffect } from 'react'
import { Modal, Grid, GridCol } from '@mantine/core';
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import styles from './GalleryImages.module.css';

const THUMB_CLASS = [styles.thumb1, styles.thumb2, styles.thumb3, styles.thumb4];

export default function GalleryImages({ imageList, type }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [basicExampleOpen, setBasicExampleOpen] = useState(false);
  const [compactMobile, setCompactMobile] = useState(false);

  const images = Array.isArray(imageList) ? imageList.filter(Boolean) : [];
  const mainImage = images[0];
  const sideImages = images.slice(1, 5);
  const lastSideIndex = sideImages.length - 1;

  const handlemodalopenclose = () => {
    setModalOpen((open) => !open);
  };

  useEffect(() => {
    const syncCompact = () => {
      setCompactMobile(type === 'umrah-getaway' && window.innerWidth < 768);
    };

    syncCompact();
    window.addEventListener('resize', syncCompact);
    return () => window.removeEventListener('resize', syncCompact);
  }, [type]);

  const normalizeImageSrc = (raw) => {
    if (!raw) return '/images/hotelloadimg.jpg';
    if (raw.startsWith('data:') || raw.startsWith('/')) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('//')) {
      if (typeof window !== 'undefined') return window.location.protocol + raw;
      return 'https:' + raw;
    }
    return 'http://' + raw.replace(/^\/+/, '');
  };

  const getSrc = (item) => normalizeImageSrc(item?.url ?? item);

  const openLightboxAt = (index) => {
    setCurrentIndex(index);
    setBasicExampleOpen(true);
  };

  if (!images.length) {
    return null;
  }

  const showFallbackCta = compactMobile || sideImages.length === 0;

  return (
    <div className={`${styles.gallery}${compactMobile ? ` ${styles.singleMobile}` : ''}`}>
      <div className={styles.grid}>
        <div
          className={`${styles.cell} ${styles.mainCell}`}
          onClick={() => openLightboxAt(0)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openLightboxAt(0);
          }}
        >
          <Image
            src={getSrc(mainImage)}
            alt="Hotel Image"
            fill
            sizes="(max-width: 767px) 100vw, 55vw"
            unoptimized
            className={styles.image}
            onError={(e) => { e.currentTarget.src = '/images/hotelloadimg.jpg'; }}
          />
          {showFallbackCta && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlemodalopenclose();
              }}
              className={styles.seeAllFallback}
            >
              View all photos
            </button>
          )}
        </div>

        {!compactMobile &&
          sideImages.map((item, index) => {
            const absoluteIndex = index + 1;
            const isLastVisible = index === lastSideIndex;

            return (
              <div
                key={absoluteIndex}
                className={`${styles.cell} ${THUMB_CLASS[index] || ''}`}
                onClick={() => {
                  if (isLastVisible) handlemodalopenclose();
                  else openLightboxAt(absoluteIndex);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (isLastVisible) handlemodalopenclose();
                    else openLightboxAt(absoluteIndex);
                  }
                }}
              >
                <Image
                  src={getSrc(item)}
                  alt={`Hotel image ${absoluteIndex + 1}`}
                  fill
                  sizes="(max-width: 767px) 50vw, 22vw"
                  unoptimized
                  className={styles.image}
                  onError={(e) => { e.currentTarget.src = '/images/hotelloadimg.jpg'; }}
                />
                {isLastVisible && (
                  <button
                    type="button"
                    className={styles.overlay}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlemodalopenclose();
                    }}
                    aria-label="View all photos"
                  >
                    <span className={styles.overlayText}>View all photos →</span>
                  </button>
                )}
              </div>
            );
          })}
      </div>

      <Modal
        lockScroll
        trapFocus
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        opened={modalOpen}
        onClose={handlemodalopenclose}
        size="70%"
        title="Hotel Images"
      >
        <Grid className="p-3" grow gutter="xs">
          <GridCol span={{ base: 12 }}>
            <Grid grow gutter="xs">
              {images.map((image, index) => {
                let spanValue;
                if (index === 0) {
                  spanValue = { base: 12, md: 6 };
                } else if (index === 1 || index === 2) {
                  spanValue = { base: 6, md: 3 };
                } else {
                  spanValue = { base: 6, md: 4 };
                }

                return (
                  <GridCol key={index} span={spanValue}>
                    <Image
                      height={200}
                      width={300}
                      unoptimized
                      onClick={() => openLightboxAt(index)}
                      className={styles.modalImage}
                      src={getSrc(image)}
                      alt={`Hotel image ${index + 1}`}
                      onError={(e) => { e.currentTarget.src = '/images/hotelloadimg.jpg'; }}
                    />
                  </GridCol>
                );
              })}
            </Grid>
          </GridCol>
        </Grid>
      </Modal>

      <Lightbox
        open={basicExampleOpen}
        close={() => setBasicExampleOpen(false)}
        slides={images.map((img) => ({ src: getSrc(img) }))}
        index={currentIndex}
      />
    </div>
  );
}
