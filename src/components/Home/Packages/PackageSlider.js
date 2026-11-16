"use client";
import React, { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";
import moment from "moment";
import { BsWhatsapp } from "react-icons/bs";
import { FaArrowLeft, FaArrowRight, FaStar, FaMapMarkerAlt, FaHeart, FaPlane, FaUtensils, FaHotel } from "react-icons/fa";
import PriceDisplay from "@/components/Currency/PriceDisplay";
import s from "./PackageSlider.module.css";

export default function PackageSlider({ packages }) {
    const [packagesList, setPackagesList] = React.useState(packages);

    useEffect(() => {
        setPackagesList(packages);
    }, [packages]);

    const getLowestPriceDetail = (priceDetails) => {
        if (!priceDetails || priceDetails.length === 0) return null;
        const filteredPrices = priceDetails.filter(p => p.type?.toLowerCase() !== "without_beds");
        if (filteredPrices.length === 0) return null;
        const sortedPrices = [...filteredPrices].sort((a, b) => Number(a.sale_per_person) - Number(b.sale_per_person));
        return sortedPrices[0];
    };

    return (
        <div className={s.sliderWrap}>
            {/* <div className={s.controls}>
                <button className={`${s.navBtn} custom-prevh`} aria-label="Previous" type="button">
                    <FaArrowLeft />
                </button>
                <button className={`${s.navBtn} custom-nexth`} aria-label="Next" type="button">
                    <FaArrowRight />
                </button>
            </div> */}

            <Swiper
                className={s.packageSwiper}
                modules={[Pagination, Navigation]}
                spaceBetween={24}
                slidesPerView={1}
                slidesPerGroup={1}
                loop={packagesList.length > 3}
                watchOverflow
                navigation={{ nextEl: ".custom-nexth", prevEl: ".custom-prevh" }}
                pagination={{ clickable: true }}
                breakpoints={{
                    320: { slidesPerView: 1, slidesPerGroup: 1 },
                    640: { slidesPerView: 2, slidesPerGroup: 2 },
                    992: { slidesPerView: 3, slidesPerGroup: 3 },
                }}
            >
                {packagesList.map((item, index) => {
                    const nights = moment(item.end_date).diff(moment(item.start_date), "days");
                    const days = nights + 1;
                    const priceDetail = getLowestPriceDetail(item?.price_Details);
                    const lowestPrice = priceDetail?.sale_per_person;
                    const comparePrice = priceDetail?.cost_per_person || priceDetail?.original_price || priceDetail?.was_price;
                    const primaryHotel = item.hotels?.[0]?.hotel;
                    const locationLabel = primaryHotel?.city
                        ? `${primaryHotel.city}${primaryHotel?.country ? `, ${primaryHotel.country}` : ""}`
                        : (item?.category?.name || "Holiday Package");
                    const hotelName = primaryHotel?.name || primaryHotel?.hotel_name || "";
                    const hotelStars = primaryHotel?.star_rating || item?.star_rating;
                    const ratingValue = Number(item?.star_rating) || 0;
                    const hasFlight = item?.flights?.length > 0;
                    const packageHref = `/${item?.category?.slug}/${item.slug}`;

                    return (
                        <SwiperSlide key={index}>
                            <article className={s.card}>
                                <div className={s.imgWrap}>
                                    <Link href={packageHref} className={s.imgLink} aria-label={item.title}>
                                        <Image
                                            fill
                                            src={item.featured_image}
                                            alt={item.title}
                                            className={s.cardImg}
                                            quality={60}
                                            sizes="(max-width: 640px) 100vw, (max-width: 992px) 50vw, 33vw"
                                        />
                                    </Link>
                                    <Link
                                        href="/login"
                                        className={s.wishBtn}
                                        aria-label="Save package"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FaHeart />
                                    </Link>
                                </div>

                                <div className={s.body}>
                                    <div className={s.metaRow}>
                                        <span className={s.location}>
                                            <FaMapMarkerAlt className={s.locationIcon} />
                                            {locationLabel}
                                        </span>
                                        {ratingValue > 0 && (
                                            <span className={s.rating}>
                                                <FaStar className={s.ratingStar} />
                                                {ratingValue.toFixed(1)}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className={s.title}>
                                        {item.title}
                                    </h3>

                                    <p className={s.hotelLine}>
                                        {hotelName ? `${hotelName} · ` : ""}
                                        {nights}N / {days}D
                                        {item?.start_date ? ` · ${moment(item.start_date).format("D MMM")}–${moment(item.end_date).format("D MMM")}` : ""}
                                    </p>

                                    <div className={s.badges}>
                                        {hasFlight && (
                                            <span className={s.badge}>
                                                <FaPlane /> Flight Included
                                            </span>
                                        )}
                                        <span className={s.badge}>
                                            <FaUtensils /> Meals
                                        </span>
                                        {hotelStars ? (
                                            <span className={s.badge}>
                                                <FaHotel /> {hotelStars}★ Hotel
                                            </span>
                                        ) : (
                                            <span className={s.badge}>
                                                <FaHotel /> Hotel
                                            </span>
                                        )}
                                    </div>

                                    <div className={s.bottomRow}>
                                        <div className={s.priceBlock}>
                                            {comparePrice && Number(comparePrice) > Number(lowestPrice) && (
                                                <span className={s.priceWas}>
                                                    <PriceDisplay price={Number(comparePrice)} currency={item?.currency_code} />
                                                </span>
                                            )}
                                            {lowestPrice && (
                                                <div className={s.priceNow}>
                                                    <span className={s.priceValue}>
                                                        <PriceDisplay price={Number(lowestPrice)} currency={item?.currency_code} />
                                                    </span>
                                                    <span className={s.pricePer}>/person</span>
                                                </div>
                                            )}
                                            <span className={s.priceNote}>Vat and Taxes included</span>
                                        </div>

                                        <div className={s.ctaGroup}>
                                            {/* <a
                                                href={`https://wa.me/+447309803307?text=I'm%20interested%20in%20the%20package:%20${encodeURIComponent(item.title)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={s.btnWa}
                                                aria-label="WhatsApp enquiry"
                                            >
                                                <BsWhatsapp />
                                            </a> */}
                                            <Link href={packageHref} className={s.btnBook}>
                                                Book Now
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </div>
    );
}
