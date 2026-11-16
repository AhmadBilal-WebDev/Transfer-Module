'use client';
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import { IoLocationSharp } from "react-icons/io5";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { FiClock, FiUsers, FiGlobe, FiMapPin, FiZap, FiStar, FiTablet, FiAward } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import GalleryImages from "@/components/Activities/Detail/GalleryImages";
import "@mantine/dates/styles.css";
import WhatExpect from "@/components/Activities/Detail/WhatExpect";
import IncludedExcluded from "@/components/Activities/Detail/IncludedExcluded";
import Faqs from "@/components/Activities/Detail/Faqs";
import Selection from "@/components/Activities/Detail/Selection";
import ActivityDetailLoader from "@/components/Loader/ActivityDetailLoader";
import styles from "@/components/Activities/Detail/ActivityDetail.module.css";
import { htmlToPlainText } from "@/util/htmlPlainText";
import { buildListingReturnHref } from "@/util/activityListingParams";

const HIGHLIGHT_ICONS = [FiZap, FiStar, FiTablet, FiAward];

const GetActivityDetail = () => {
  const [packageDetail, setPackageDetail] = React.useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [descExpanded, setDescExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const descriptionRef = useRef(null);
  const params = useParams();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const language = searchParams.get('language');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/${params.slug}?from=${from}&to=${to}&language=${language}`, {
          method: 'GET', cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const response = await res.json();
        setIsLoading(false);
        if (response.Success) {
          setPackageDetail(response?.Content?.activity || {});
          setIsLoading(false);
        }
      } catch (error) {
        console.log("Error fetching activity detail:", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.slug, searchParams]);

  useEffect(() => {
    setDescExpanded(false);
  }, [packageDetail?.id, packageDetail?.content]);

  useEffect(() => {
    if (activeTab !== 'overview') return;

    const el = descriptionRef.current;
    if (!el || !packageDetail?.content) {
      setShowReadMore(false);
      return;
    }

    const measureOverflow = () => {
      if (descExpanded) return;
      const overflows = el.scrollHeight > el.clientHeight + 1;
      setShowReadMore(overflows);
    };

    measureOverflow();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measureOverflow)
        : null;
    resizeObserver?.observe(el);
    window.addEventListener('resize', measureOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureOverflow);
    };
  }, [packageDetail?.content, descExpanded, activeTab, isLoading]);

  const PackageDetail = packageDetail;
  if (isLoading) {
    return <ActivityDetailLoader />;
  }

  if (!PackageDetail || Object.keys(PackageDetail).length === 0) {
    return <div>
      <h2 className="text-center my-5">Activity detail not found.</h2>
    </div>;
  }

  const getYouTubeId = (url) => {
    const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const cityName = typeof PackageDetail?.city === 'object'
    ? PackageDetail?.city?.name
    : PackageDetail?.city;
  const countryName = typeof PackageDetail?.country === 'object'
    ? PackageDetail?.country?.name
    : PackageDetail?.country;
  const categoryName = typeof PackageDetail?.category === 'object'
    ? PackageDetail?.category?.name
    : PackageDetail?.category;
  const citySlug = typeof PackageDetail?.city === 'object'
    ? (PackageDetail?.city?.slug || PackageDetail?.city?.city_slug)
    : (PackageDetail?.city_slug || (typeof cityName === 'string'
      ? cityName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      : ''));
  const returnHref = buildListingReturnHref({
    city: searchParams.get('city') || citySlug,
    country: searchParams.get('country') || countryName || '',
    date: searchParams.get('date') || searchParams.get('from') || searchParams.get('to'),
  });
  const returnLabel = cityName ? `Return to ${cityName} Excursions` : 'Return to Activities';

  return (
    <div className={styles.detailPage}>
      <div className="container mt-4">
        <div className="my-3">
          <GalleryImages
            imageList={PackageDetail?.gallery_images || []}
            returnHref={returnHref}
            returnLabel={returnLabel}
          />
        </div>
        <div className="row">
          <div className="col-12">
            <div className={styles.detail_section}>
              <div className={styles.headerBadges}>
                {categoryName && (
                  <span className={styles.badge}>
                    <IoLocationSharp />
                    {categoryName}
                  </span>
                )}
              </div>

              <h1 className={styles.title}>{PackageDetail?.title}</h1>

              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <IoLocationSharp className={styles.metaIcon} />
                  <span>
                    {cityName && countryName
                      ? `${cityName}, ${countryName}`
                      : PackageDetail?.address || 'Location not specified'}
                  </span>
                </div>

                {PackageDetail?.activity_duration && (
                  <div className={styles.metaItem}>
                    <FiClock className={styles.metaIcon} />
                    <span>{PackageDetail?.activity_duration}</span>
                  </div>
                )}

                {PackageDetail?.max_guests && (
                  <div className={styles.metaItem}>
                    <FiUsers className={styles.metaIcon} />
                    <span>Max {PackageDetail?.max_guests} guests</span>
                  </div>
                )}

                {PackageDetail?.languages && (
                  <div className={styles.metaItem}>
                    <FiGlobe className={styles.metaIcon} />
                    <span>
                      {Array.isArray(PackageDetail?.languages)
                        ? PackageDetail?.languages.map(lang => typeof lang === 'object' ? lang.name : lang).join(', ')
                        : (typeof PackageDetail?.languages === 'object' ? PackageDetail?.languages?.name : PackageDetail?.languages)}
                    </span>
                  </div>
                )}

                {PackageDetail?.rating_stars && (
                  <div className={styles.metaItem}>
                    <div className="d-flex align-items-center">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const rating = Number(PackageDetail?.rating_stars);
                        const fullStars = Math.floor(rating);
                        const hasHalfStar = rating - fullStars >= 0.5;

                        if (index < fullStars) {
                          return <FaStar key={index} className={styles.metaStars} style={{ fontSize: '0.85rem' }} />;
                        } else if (index === fullStars && hasHalfStar) {
                          return <FaStarHalfAlt key={index} className={styles.metaStars} style={{ fontSize: '0.85rem' }} />;
                        }
                        return <FaRegStar key={index} className={styles.metaStars} style={{ fontSize: '0.85rem', opacity: 0.35 }} />;
                      })}
                    </div>
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      {PackageDetail?.rating_stars}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-8">
            <section id="overview" className="mb-5 mt-4">

              <ul className={styles.tabs}>
                <li className={styles.tabItem}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                </li>
                <li className={styles.tabItem}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${activeTab === 'itinerary' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('itinerary')}
                  >
                    Itinerary
                  </button>
                </li>
                <li className={styles.tabItem}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${activeTab === 'included' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('included')}
                  >
                    Included/Excluded
                  </button>
                </li>
              </ul>

              <div className="tab-content mb-4">
                {activeTab === 'overview' && (
                  <div>
                    <h5 className={styles.sectionTitle}>Description</h5>
                    <div
                      ref={descriptionRef}
                      className={`${styles.descriptionContent}${
                        descExpanded ? '' : ` ${styles.descriptionCollapsed}`
                      }`}
                      dangerouslySetInnerHTML={{ __html: PackageDetail?.content }}
                    />
                    {showReadMore && (
                      <button
                        type="button"
                        className={styles.descriptionToggle}
                        onClick={() => setDescExpanded((prev) => !prev)}
                      >
                        {descExpanded ? 'View less' : 'View more'}
                      </button>
                    )}
                    {PackageDetail?.youtube_video_link && getYouTubeId(PackageDetail?.youtube_video_link) && (
                      <div className="ratio ratio-16x9 my-5">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(PackageDetail?.youtube_video_link)}`}
                          title="YouTube video"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                    {PackageDetail?.what_to_expect?.length > 0 && (
                      <section className={styles.highlightsPanel}>
                        <h5 className={styles.panelTitle}>Experience Highlights</h5>
                        <div className={styles.highlightsGrid}>
                          {PackageDetail.what_to_expect.slice(0, 4).map((item, index) => {
                            const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
                            const text = htmlToPlainText(item.content || '');
                            const shortText = text.length > 140 ? `${text.slice(0, 140).trim()}…` : text;
                            return (
                              <article key={`highlight-${index}`} className={styles.highlightCard}>
                                <Icon className={styles.highlightIcon} aria-hidden="true" />
                                <h6 className={styles.highlightTitle}>{item.title}</h6>
                                {shortText ? <p className={styles.highlightText}>{shortText}</p> : null}
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {PackageDetail?.facilities?.length > 0 && (
                      <section className={styles.amenitiesPanel}>
                        <h5 className={styles.panelTitle}>Amenities &amp; Structural Features</h5>
                        <div className={styles.amenitiesGrid}>
                          {PackageDetail.facilities.map((item, index) => (
                            <span key={`amenity-${index}`} className={styles.amenityItem}>
                              <IoMdCheckmarkCircleOutline className={styles.amenityIcon} aria-hidden="true" />
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === 'itinerary' && (
                  <div>
                    {(PackageDetail?.what_to_expect && PackageDetail?.what_to_expect.length > 0) ? (
                      <WhatExpect expectData={PackageDetail?.what_to_expect} />
                    ) : (
                      <div className="text-center py-5 text-muted">
                        <p>No itinerary information available.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'included' && (
                  <div>
                    <IncludedExcluded
                      included={PackageDetail?.included_items || ""}
                      excluded={PackageDetail?.excluded_items || ""}
                    />
                  </div>
                )}
              </div>
            </section>

            <section className={styles.meetingSection}>
              <h4 className={styles.meetingTitle}>Arrival Information &amp; Meeting Point</h4>
              <div className={styles.meetingInner}>
                <div className={styles.meetingAddressRow}>
                  <FiMapPin className={styles.meetingIcon} aria-hidden="true" />
                  <p className={styles.meetingAddress}>
                    {PackageDetail?.meeting_and_pickup || 'Meeting details will be provided after booking.'}
                  </p>
                </div>
                <p className={styles.meetingNote}>
                  Please arrive 15 minutes before your scheduled slot. This activity ends back at the meeting point.
                </p>
              </div>
            </section>

            {(PackageDetail?.faqs && PackageDetail?.faqs.length > 0) &&
              <Faqs faqsList={PackageDetail?.faqs || []} />
            }
          </div>
          <div className="col-md-4">
            <Selection PackageDetail={PackageDetail} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GetActivityDetail;
