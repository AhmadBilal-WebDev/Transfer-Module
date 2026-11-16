'use client';
import Link from "next/link";
import React, { useState, useEffect, use, useRef } from "react";
import { BiPhone } from "react-icons/bi";
import PackageGalleryImages from "@/components/Package/Detail/PackageGalleryImages";
import { BsWhatsapp } from "react-icons/bs";
import { FaBus, FaCalendarAlt, FaCalendarCheck, FaCheckCircle, FaClock, FaMoon, FaStar, FaTimes, FaWhatsapp } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import moment from "moment";
import PackageDetailFaqs from "@/components/Package/Detail/PackageDetailFaqs";
import PackageDetailIteniry from "@/components/Package/Detail/PackageDetailIteniry";
import PriceDisplay from "@/components/Currency/PriceDisplay";
import BookNowButton from "@/components/Package/Detail/BookNowButton";
import PackageHotelDetail from "@/components/Package/Detail/PackageHotelDetail";
import PackageFlightDetail from "@/components/Package/Detail/PackageFlightDetail";
import { GiPassport } from "react-icons/gi";
import { playfair } from "@/lib/fonts";
import styles from "./PackageDetail.module.css";

const formatTripType = (type) => {
    const labels = {
        'one-way': 'One Way',
        return: 'Return',
        'all-round': 'All Round',
    };
    return labels[type] || type;
};

export default function page({ params }) {
    const { packageSlug: slug } = use(params);
    const [PackageDetail, setPackageDetail] = useState({});
    const [PriceDetail, setPriceDetail] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentURL, setCurrentURL] = useState("");
    const [descExpanded, setDescExpanded] = useState(false);
    const [showReadMore, setShowReadMore] = useState(false);
    const descriptionRef = useRef(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentURL(window.location.href);
        }
    }, []);

    useEffect(() => {
        const fetchPackageData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/${slug}`, {
                    cache: 'no-store',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const response = await res.json();
                if (response.Success) {
                    setPackageDetail(response?.Content?.package);
                    setPriceDetail(response?.Content?.package?.price_Details ? response?.Content?.package?.price_Details : []);
                }
            } catch (error) {
                console.error('Error fetching package:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPackageData();
        }
    }, [slug]);

    useEffect(() => {
        setDescExpanded(false);
    }, [PackageDetail?.id, PackageDetail?.description]);

    useEffect(() => {
        if (loading) return;

        const el = descriptionRef.current;
        if (!el || !PackageDetail?.description) {
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
    }, [PackageDetail?.description, descExpanded, loading]);

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>;
    }

    if (!PackageDetail || Object.keys(PackageDetail).length === 0) {
        return null;
    }

    const waMsg = encodeURIComponent(`Hello! I want to inquire about this package: ${currentURL}`);
    const waLink = `https://wa.me/+447309803307?text=${waMsg}`;

    const nights = moment(PackageDetail?.end_date).diff(moment(PackageDetail?.start_date), 'days');
    const days = nights > 0 ? nights + 1 : 1;
    const rating = Number(PackageDetail?.star_rating) || 0;
    const galleryImages = [
        ...(PackageDetail?.featured_image ? [PackageDetail.featured_image] : []),
        ...((PackageDetail?.gallery_images || []).filter(
            (img) => img && img !== PackageDetail?.featured_image
        )),
    ];
    const locationLabel =
        PackageDetail?.destination ||
        PackageDetail?.location ||
        PackageDetail?.category?.name ||
        'Saudi Arabia';
    const categoryBadge = PackageDetail?.category?.name
        ? String(PackageDetail.category.name).toUpperCase()
        : 'PACKAGE';

    return (
        <div className={`package-Detail ${styles.pageWrapper}`}>

            <section className={styles.heroSection}>
                <div className={`container ${styles.heroInner}`}>
                    <nav className={styles.heroCrumb} aria-label="breadcrumb">
                        <Link href="/">Home</Link>
                        <span className={styles.heroCrumbSep}>›</span>
                        <Link href={`/${PackageDetail?.category?.slug || 'umrah-packages'}`}>
                            Packages
                        </Link>
                        <span className={styles.heroCrumbSep}>›</span>
                        <span className={styles.heroCrumbCurrent}>
                            {PackageDetail?.title}
                        </span>
                    </nav>

                    <PackageGalleryImages
                        imageList={galleryImages.length ? galleryImages : (PackageDetail?.gallery_images || [])}
                        badgeLabel={categoryBadge}
                    />

                    <div className={styles.heroInfo}>
                        <span className={styles.heroTag}>✧ Signature Journey</span>
                        <h1 className={`${styles.heroTitle} ${playfair.className}`}>
                            {PackageDetail?.title}
                        </h1>

                        <div className={styles.heroMeta}>
                            <span className={styles.heroMetaItem}>
                                <FaLocationDot size={13} aria-hidden="true" />
                                {locationLabel}
                            </span>
                            <span className={styles.heroMetaItem}>
                                <FaClock size={12} aria-hidden="true" />
                                {days} Days - {nights} Night{nights !== 1 ? 's' : ''}
                            </span>
                            {rating > 0 && (
                                <span className={styles.heroMetaRating}>
                                    <FaStar size={13} aria-hidden="true" />
                                    {rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* <div className={styles.heroContactRow}>
                            <Link href="tel:01217772522" className={styles.heroBtnIcon} title="Call Us">
                                <BiPhone size={17} />
                            </Link>
                            <Link target="_blank" href={waLink} className={styles.heroBtnIconWa} title="WhatsApp Us">
                                <BsWhatsapp size={17} />
                            </Link>
                        </div> */}
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT */}
            <div className={`container ${styles.mainContent}`}>
                <div className="row g-4">
                    <div className="col-lg-8 col-md-12">

                        {/* About */}
                        {PackageDetail?.description && (
                            <section className={styles.aboutSection}>
                                <p className={styles.sectionEyebrow}>About This Package</p>
                                <h2 className={`${styles.sectionTitle}`}>
                                    A carefully planned spiritual journey
                                </h2>
                                <div
                                    ref={descriptionRef}
                                    className={`${styles.aboutBody}${
                                        descExpanded ? '' : ` ${styles.aboutBodyCollapsed}`
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: PackageDetail.description }}
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
                            </section>
                        )}

                        {/* Package Summary */}
                        <div className={`${styles.sectionCard} ${styles.summarySection}`}>
                            <p className={styles.sectionEyebrow}>Package Summary</p>
                            <h2 className={`${styles.sectionTitle} ${playfair.className}`}>
                                Trip essentials at a glance
                            </h2>
                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryItem}>
                                    <div className={styles.summaryLabel}><FaCalendarCheck size={11} /> Departure</div>
                                    <div className={styles.summaryValue}>{moment(PackageDetail?.start_date).format('DD MMM YYYY')}</div>
                                </div>
                                <div className={styles.summaryItem}>
                                    <div className={styles.summaryLabel}><FaCalendarAlt size={11} /> Return</div>
                                    <div className={styles.summaryValue}>{moment(PackageDetail?.end_date).format('DD MMM YYYY')}</div>
                                </div>
                                <div className={styles.summaryItem}>
                                    <div className={styles.summaryLabel}><FaMoon size={11} /> Duration</div>
                                    <div className={styles.summaryValue}>
                                        {moment(PackageDetail?.end_date).diff(moment(PackageDetail?.start_date), 'days')} Nights
                                    </div>
                                </div>
                                <div className={styles.summaryItem}>
                                    <div className={styles.summaryLabel}>Rating</div>
                                    <div className={`${styles.summaryValue} ${styles.starsWrap}`}>
                                        {Array(Math.floor(Number(PackageDetail?.star_rating) || 0))
                                            .fill(0)
                                            .map((_, index) => (
                                                <FaStar className="text-warning" key={index} size={15} />
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Itinerary */}
                        {!!PackageDetail?.itineraries?.length &&
                            <PackageDetailIteniry itinrList={PackageDetail?.itineraries || []} />
                        }

                        {/* Hotels */}
                        <PackageHotelDetail PackageDetail={PackageDetail} />

                        {/* Flights */}
                        {!!PackageDetail?.flights?.length &&
                            <PackageFlightDetail PackageDetail={PackageDetail} />
                        }

                        {/* Transfers */}
                        {!!PackageDetail?.transfers?.length && (
                            <section className={styles.transferCard}>
                                <div className={styles.detailCardHeader}>
                                    <FaBus className={styles.detailCardHeaderIcon} size={16} aria-hidden="true" />
                                    <h3 className={`${styles.detailCardTitle} ${playfair.className}`}>Ground Transfers</h3>
                                </div>
                                <div className={styles.transferList}>
                                    {PackageDetail.transfers.map((item, index) => (
                                        <div key={index} className={styles.transferGroup}>
                                            {item?.locations?.map((location, locIndex) => (
                                                <div key={locIndex} className={styles.transferRow}>
                                                    <div className={styles.transferEndpoint}>
                                                        <span className={styles.transferEndpointIcon} aria-hidden="true">
                                                            <FaBus size={12} />
                                                        </span>
                                                        <span className={styles.transferEndpointText}>
                                                            {location?.pickup_address}
                                                        </span>
                                                    </div>
                                                    <span className={styles.transferArrow} aria-hidden="true">→</span>
                                                    <div className={`${styles.transferEndpoint} ${styles.transferEndpointEnd}`}>
                                                        <span className={styles.transferEndpointText}>
                                                            {location?.dropoff_address}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(item?.vehicle || item?.trip_type) && (
                                                <p className={styles.transferFooter}>
                                                    {[
                                                        item?.vehicle ? `Vehicle: ${item.vehicle}` : null,
                                                        item?.trip_type ? `Trip Type: ${formatTripType(item.trip_type)}` : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join('  ·  ')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Visas */}
                        {!!PackageDetail?.visas?.length && (
                            <section className={styles.visaSection}>
                                <div className={styles.detailCardHeader}>
                                    <GiPassport className={styles.detailCardHeaderIcon} size={18} aria-hidden="true" />
                                    <h3 className={`${styles.detailCardTitle} ${playfair.className}`}>Visa Details</h3>
                                </div>
                                <div className={styles.visaList}>
                                    {PackageDetail.visas.map((item, index) => (
                                        <div key={index} className={styles.visaInnerCard}>
                                            <div className={styles.visaInnerIcon} aria-hidden="true">
                                                <GiPassport size={22} />
                                            </div>
                                            <div className={styles.visaInnerCopy}>
                                                <div className={styles.visaInnerTitle}>
                                                    {item?.visa_type || 'Visa Option Included'}
                                                </div>
                                                {item?.visa_description && (
                                                    <div className={styles.visaInnerDesc}>{item.visa_description}</div>
                                                )}
                                            </div>
                                            <span className={styles.visaIncludedPill}>Included</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Included / Excluded */}
                        {(PackageDetail?.included_items || PackageDetail?.excluded_items) && (
                            <section className={styles.finePrintSection}>
                                <p className={styles.sectionEyebrow}>Fine Print</p>
                                <h2 className={`${styles.sectionTitle} ${playfair.className}`}>
                                    What&apos;s included &amp; what&apos;s not
                                </h2>
                                <div className={styles.inclExclGrid}>
                                    {PackageDetail?.included_items && (
                                        <div className={styles.inclBox}>
                                            <div className={styles.inclExclHeading}>
                                                <FaCheckCircle size={16} className={styles.inclHeadingIcon} />
                                                What Is Included
                                            </div>
                                            <div
                                                className={`${styles.inclExclBody} ${styles.inclBody}`}
                                                dangerouslySetInnerHTML={{ __html: PackageDetail.included_items }}
                                            />
                                        </div>
                                    )}
                                    {PackageDetail?.excluded_items && (
                                        <div className={styles.exclBox}>
                                            <div className={styles.inclExclHeading}>
                                                <FaTimes size={15} className={styles.exclHeadingIcon} />
                                                Not Included
                                            </div>
                                            <div
                                                className={`${styles.inclExclBody} ${styles.exclBody}`}
                                                dangerouslySetInnerHTML={{ __html: PackageDetail.excluded_items }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* SIDEBAR */}
                    <div className="col-lg-4 col-md-12">
                        <aside className={styles.sidebar}>
                            <div className={styles.bookingCard}>
                                <div className={styles.bookingCardHeader}>
                                    <FaStar size={14} className={styles.bookingCardStar} aria-hidden="true" />
                                    <h3 className={styles.bookingCardTitle}>Book This Package</h3>
                                </div>

                                <div className={styles.bookingSummary}>
                                    {(PriceDetail || []).map((item, index) => (
                                        <div key={index} className={styles.bookingLine}>
                                            <span className={styles.bookingLineLabel}>
                                                {item?.type === 'without_beds'
                                                    ? 'Without Beds'
                                                    : String(item?.type || 'Rate')}
                                            </span>
                                            <span className={styles.bookingLinePrice}>
                                                <PriceDisplay
                                                    price={item?.sale_per_person}
                                                    currency={PackageDetail?.currency_code}
                                                />
                                                <span className={styles.bookingLinePp}>(pp)</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <p className={styles.bookingVatNote}>Inclusive of VAT and Taxes</p>

                                <BookNowButton
                                    PackageDetail={PackageDetail}
                                    className={styles.bookingCta}
                                    label="Secure Your Journey →"
                                />

                                <div className={styles.bookingTrust}>
                                    <p>
                                        <FaCheckCircle size={12} aria-hidden="true" />
                                        Best Price &amp; Luxury Experience Guaranteed
                                    </p>
                                    <p>
                                        <FaStar size={12} aria-hidden="true" />
                                        Flexible Booking — secure your space today, finalize later
                                    </p>
                                </div>
                            </div>

                            {PackageDetail?.cancellation_policy && (
                                <div
                                    className={`${styles.cancellationCard} ${
                                        PackageDetail.cancellation_policy.cancel_policy === 'refundable'
                                            ? styles.cancellationRefundable
                                            : styles.cancellationNonRefundable
                                    }`}
                                >
                                    <div className={styles.cancellationTitle}>
                                        {PackageDetail.cancellation_policy.cancel_policy === 'refundable' ? (
                                            <FaCheckCircle size={13} />
                                        ) : (
                                            <FaTimes size={12} />
                                        )}
                                        Cancellation Policy
                                    </div>
                                    {PackageDetail.cancellation_policy.cancel_policy === 'refundable' &&
                                        !!PackageDetail.cancellation_policy.cancellation_policies?.length && (
                                            <div className={styles.cancellationPolicyList}>
                                                {PackageDetail.cancellation_policy.cancellation_policies.map(
                                                    (policy, i) => (
                                                        <div key={i} className={styles.cancellationPolicyItem}>
                                                            <span className={styles.cancellationPolicyDot} />
                                                            <span>
                                                                If cancelled{' '}
                                                                <strong>{policy.time_duration} hours</strong> before
                                                                departure, a{' '}
                                                                {policy.type === 'percentage' ? (
                                                                    <>
                                                                        <strong>{policy.value}%</strong> cancellation
                                                                        charge
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        fixed cancellation charge of{' '}
                                                                        <strong>
                                                                            <PriceDisplay
                                                                                price={policy.value}
                                                                                currency={PackageDetail?.currency_code}
                                                                            />
                                                                        </strong>
                                                                    </>
                                                                )}{' '}
                                                                will apply.
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    {PackageDetail.cancellation_policy.cancel_policy !== 'refundable' && (
                                        <p className={styles.cancellationText}>
                                            This booking is non-refundable. No refund will be issued for
                                            cancellations.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className={styles.contactCard}>
                                <div className={styles.contactOverlay}></div>
                                <div className={styles.contactContent}>
                                    <h4 className={styles.contactTitle}>Got a Question?</h4>
                                    <p className={styles.contactSubtitle}>
                                        Speak with our team for dates, rooms, or custom requests.
                                    </p>
                                    <div className={styles.contactActions}>
                                        <a target="_blank" href={waLink} rel="noreferrer">
                                            <button type="button" className={styles.contactBtnWa}>
                                                <FaWhatsapp size={15} /> Whatsapp
                                            </button>
                                        </a>
                                        <a href="tel:01217772522">
                                            <button type="button" className={styles.contactBtnCall}>
                                                <BiPhone size={15} /> Call Us
                                            </button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>

                {/* FAQs */}
                {!!PackageDetail?.faqs?.length &&
                    <PackageDetailFaqs faqsList={PackageDetail?.faqs || []} />
                }
            </div>
        </div>
    );
}
