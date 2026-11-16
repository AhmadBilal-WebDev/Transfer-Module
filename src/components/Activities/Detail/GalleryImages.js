'use client'
import React, { useState } from 'react'
import { Modal, Grid, GridCol } from '@mantine/core';
import Image from "next/image";
import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";
import Lightbox from "yet-another-react-lightbox";
import styles from './GalleryImages.module.css';

export default function GalleryImages({ imageList = [], returnHref, returnLabel }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [basicExampleOpen, setBasicExampleOpen] = useState(false);

  const images = Array.isArray(imageList) ? imageList.filter(Boolean) : [];
  const mainImage = images[0];
  const sideImages = images.slice(1, 5);
  const remainingCount = Math.max(images.length - 5, 0);
  const lastSideIndex = sideImages.length - 1;

  const handlemodalopenclose = () => {
    setModalOpen(!modalOpen)
  };

  const openLightboxAt = (index) => {
    setCurrentIndex(index);
    setBasicExampleOpen(true);
  };

  if (!images.length) {
    return null;
  }

  return (
    <div className={styles.gallery}>
      {returnHref && (
        <Link href={returnHref} className={styles.returnLink}>
          <FiChevronLeft size={16} aria-hidden="true" />
          {returnLabel || 'Return to Activities'}
        </Link>
      )}

      <div className={styles.grid}>
        <div
          className={styles.mainCell}
          onClick={() => openLightboxAt(0)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openLightboxAt(0);
          }}
        >
          <Image
            src={mainImage}
            alt="Activity image"
            width={800}
            height={600}
            className={styles.image}
            priority
          />
          {/* {remainingCount <= 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlemodalopenclose();
              }}
              className={styles.seeAllFallback}
            >
              See All Photos
            </button>
          )} */}
        </div>

        {sideImages.length > 0 && (
          <div className={styles.sideGrid}>
            {sideImages.map((src, index) => {
              const absoluteIndex = index + 1;
              const isLastVisible = index === lastSideIndex;
              const showMoreOverlay = isLastVisible && remainingCount > 0;

              return (
                <div
                  key={`${src}-${index}`}
                  className={styles.thumbCell}
                  onClick={() => {
                    if (showMoreOverlay) {
                      handlemodalopenclose();
                    } else {
                      openLightboxAt(absoluteIndex);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (showMoreOverlay) handlemodalopenclose();
                      else openLightboxAt(absoluteIndex);
                    }
                  }}
                >
                  <Image
                    src={src}
                    alt={`Activity image ${absoluteIndex + 1}`}
                    width={400}
                    height={300}
                    className={styles.image}
                  />
                  {showMoreOverlay && (
                    <button
                      type="button"
                      className={styles.overlay}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlemodalopenclose();
                      }}
                      aria-label={`View ${remainingCount} more photos`}
                    >
                      <span className={styles.overlayText}>+{remainingCount} Photos</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        opened={modalOpen}
        onClose={handlemodalopenclose}
        size="auto"
        title="Activity Images"
      >
        <Grid className="p-3" grow gutter="xs">
          <GridCol span={{ base: 12, md: 12, lg: 8 }}>
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
                      onClick={() => openLightboxAt(index)}
                      className={styles.modalImage}
                      src={image}
                      alt={`Activity image ${index + 1}`}
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
        slides={images.map((img) => ({ src: img }))}
        index={currentIndex}
      />
    </div>
  )
}
