'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useActivityStore } from '@/components/Store/ActivityStore';
import { LuCalendarCheck2 } from "react-icons/lu";
import { IoTimerOutline, IoArrowBack } from "react-icons/io5";
import moment from 'moment'
import { HiUserGroup } from "react-icons/hi";
import { MdLocationOn } from "react-icons/md";
import PriceDisplay from '@/components/Currency/PriceDisplay';
import Summery from '@/components/Activities/Checkout/Summery';
import DetailForm from '@/components/Activities/Checkout/DetailForm';
import './checkout.css';

export const dynamic = 'force-dynamic';

export default function page() {
    const { slug } = useParams();
    const { selectedActivity } = useActivityStore();
    const [activityDetail, setActivityDetail] = useState({});

    useEffect(() => {
        setActivityDetail(selectedActivity);
    }, [selectedActivity]);

    const totalGuests = (activityDetail?.adults || 0) + (activityDetail?.children || 0);

    const guestLabel = () => {
        const adults = activityDetail?.adults || 0;
        const children = activityDetail?.children || 0;
        const parts = [];
        if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
        if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
        return parts.join(', ') || '0 Guests';
    };

    const perGuestPrice = Number(activityDetail?.price_per_adult || 0);
    const imageUrl = activityDetail?.featured_image || activityDetail?.banner_image;

    const travelDateTimeLabel = () => {
        if (!activityDetail?.travel_date) return 'Not selected';
        const dateLabel = moment(activityDetail.travel_date).format('MMMM D, YYYY');
        const { activity_start_time: start, activity_end_time: end } = activityDetail;
        if (start && end) return `${dateLabel} · ${start} - ${end}`;
        return dateLabel;
    };

    const activitySlug = activityDetail?.slug || slug;
    const travelDate = activityDetail?.travel_date
        ? moment(activityDetail.travel_date).format('YYYY-MM-DD')
        : null;
    const detailBackHref = travelDate
        ? `/activities/${activitySlug}?from=${travelDate}&to=${travelDate}&language=en`
        : `/activities/${activitySlug}?language=en`;

    return (
        <div className='activity-checkout-container'>
            <div className='container'>

                <Link href={detailBackHref} className='checkout-back-link'>
                    <IoArrowBack aria-hidden="true" />
                    Return to Activity Details
                </Link>

                {/* Top — Your Booking Details */}
                <div className='booking-details-card'>
                    <div className='booking-details-header'>
                        <h2>Your Booking Details</h2>
                        <p className='booking-details-subtitle'>Review your complete experiential package</p>
                    </div>
                    <div className='booking-details-body'>
                        <div className='booking-details-layout'>
                            {imageUrl && (
                                <div className='booking-details-thumb'>
                                    <img src={imageUrl} alt={activityDetail?.title || 'Activity'} />
                                </div>
                            )}
                            <div className='booking-details-info'>
                                <span className='booking-details-label'>Booking Summary</span>
                                <h3 className='booking-details-title'>{activityDetail?.title}</h3>
                                {(activityDetail?.city || activityDetail?.country) && (
                                    <p className='booking-details-location'>
                                        {[activityDetail?.city, activityDetail?.country].filter(Boolean).join(', ')}
                                    </p>
                                )}

                                <div className='booking-details-grid'>
                                    <div className='booking-detail-item'>
                                        <LuCalendarCheck2 className='booking-detail-icon' aria-hidden="true" />
                                        <div>
                                            <span className='booking-detail-key'>Date &amp; Time</span>
                                            <span className='booking-detail-val'>
                                                {travelDateTimeLabel()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className='booking-detail-item'>
                                        <IoTimerOutline className='booking-detail-icon' aria-hidden="true" />
                                        <div>
                                            <span className='booking-detail-key'>Duration</span>
                                            <span className='booking-detail-val'>{activityDetail?.duration || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className='booking-detail-item'>
                                        <HiUserGroup className='booking-detail-icon' aria-hidden="true" />
                                        <div>
                                            <span className='booking-detail-key'>Participants</span>
                                            <span className='booking-detail-val'>{guestLabel()}</span>
                                        </div>
                                    </div>
                                    <div className='booking-detail-item'>
                                        <MdLocationOn className='booking-detail-icon' aria-hidden="true" />
                                        <div>
                                            <span className='booking-detail-key'>Meeting Point</span>
                                            <span className='booking-detail-val'>
                                                {activityDetail?.meeting_and_pickup || 'Provided after booking'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row g-4 checkout-main-row'>
                    <div className='col-lg-8 col-12'>
                        <DetailForm activityDetail={activityDetail} />
                    </div>

                    <div className='col-lg-4 col-12'>
                        <div className='checkout-sidebar'>
                            <Summery activityDetail={activityDetail} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
