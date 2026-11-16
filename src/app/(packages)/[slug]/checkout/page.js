'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import GuestForm from '@/components/Package/Checkout/GuestForm'
import { usePackageStore } from '@/components/Store/PackageStore'
import { LuCalendarCheck2, LuCalendarX2, LuMapPin } from 'react-icons/lu'
import { IoMoonOutline } from 'react-icons/io5'
import { BiUser } from 'react-icons/bi'
import moment from 'moment'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import { FaCheckCircle, FaTimes } from 'react-icons/fa'
import { FiChevronLeft } from 'react-icons/fi'
import styles from './PackageCheckout.module.css'

export const dynamic = 'force-dynamic'

export default function page() {
    const { selectedPackage } = usePackageStore();
    const [packageDetail, setPackageDetail] = useState({});
    const [servicesTotal, setServicesTotal] = useState(0);
    const [selectedServices, setsetSelectedServices] = useState([]);
    const [roomList, setRoomList] = useState([]);
    const [expandedRooms, setExpandedRooms] = useState([]);

    useEffect(() => {
        setPackageDetail(selectedPackage);
        setRoomList(selectedPackage?.selected_rooms || []);
    }, [selectedPackage]);

    useEffect(() => {
        if (!roomList.length) return;
        const expanded = [];
        roomList.forEach((room) => {
            const numRooms = Number(room.rooms) || 1;
            let remAdults = Number(room.adults) || 0;
            let remChildren = Number(room.children) || 0;
            let remInfants = Number(room.infants) || 0;
            let remAdultsWB = Number(room.adults_without_bed) || 0;
            let remChildrenWB = Number(room.children_without_bed) || 0;
            let remInfantsWB = Number(room.infants_without_bed) || 0;
            for (let i = 0; i < numRooms; i++) {
                const remaining = numRooms - i;
                const adultsInRoom = i === numRooms - 1 ? remAdults : Math.ceil(remAdults / remaining);
                const childrenInRoom = i === numRooms - 1 ? remChildren : Math.ceil(remChildren / remaining);
                const infantsInRoom = i === numRooms - 1 ? remInfants : Math.ceil(remInfants / remaining);
                remAdults -= adultsInRoom;
                remChildren -= childrenInRoom;
                remInfants -= infantsInRoom;
                const adultsWB = Math.min(remAdultsWB, 1);
                remAdultsWB -= adultsWB;
                const maxChildWB = adultsWB > 0 ? 1 : 2;
                const childrenWB = Math.min(remChildrenWB, maxChildWB);
                remChildrenWB -= childrenWB;
                const infantsWB = Math.min(remInfantsWB, 1);
                remInfantsWB -= infantsWB;
                expanded.push({ ...room, roomIndex: i + 1, adultsInRoom, childrenInRoom, infantsInRoom, adultsWB, childrenWB, infantsWB });
            }
        });
        setExpandedRooms(expanded);
    }, [roomList]);

    const handleServiceToggle = (service) => {
        const isSelected = selectedServices.find((r) => r.id === service.id);
        if (isSelected) {
            const updatedServices = selectedServices.filter((r) => r.id !== service.id);
            const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
            setServicesTotal(Total);
            setsetSelectedServices(updatedServices);
        } else {
            const updatedServices = [...selectedServices, { "id": service.id, "name": service.name, "price_per_person": service.price, "quantity": 1, "total": service.price }];
            const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
            setServicesTotal(Total);
            setsetSelectedServices(updatedServices);
        }
    };

    const withoutBedTotal = expandedRooms.filter(r => r.adultsInRoom > 0 || r.childrenInRoom > 0 || r.infantsInRoom > 0).reduce((acc, room) => (
        acc + room.adultsWB * Number(room.adult_without_bed_price || 0)
        + room.childrenWB * Number(room.child_without_bed_price || 0)
        + room.infantsWB * Number(room.infant_without_bed_price || 0)
    ), 0);

    const handleQuantityChange = (id, type) => {
        const updatedServices = selectedServices.map((service) => {
            if (service.id === id) {
                if (type === 'plus') {
                    const newQty = service.quantity + 1;
                    return { ...service, quantity: newQty, total: newQty * Number(service.price_per_person) };
                } else if (type === 'minus' && service.quantity > 1) {
                    const newQty = service.quantity - 1;
                    return { ...service, quantity: newQty, total: newQty * Number(service.price_per_person) };
                }
            }
            return service;
        });
        const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
        setServicesTotal(Total);
        setsetSelectedServices(updatedServices);
    };

    const nights = useMemo(() => {
        if (!packageDetail?.start_date || !packageDetail?.end_date) return 0;
        return moment(packageDetail.end_date).diff(moment(packageDetail.start_date), 'days');
    }, [packageDetail?.start_date, packageDetail?.end_date]);

    const travelerSummary = useMemo(() => {
        const rooms = packageDetail?.selected_rooms || [];
        const totals = rooms.reduce(
            (acc, room) => {
                acc.adults += Number(room.adults) || 0;
                acc.children += Number(room.children) || 0;
                acc.infants += Number(room.infants) || 0;
                return acc;
            },
            { adults: 0, children: 0, infants: 0 }
        );
        const parts = [];
        if (totals.adults) parts.push(`${totals.adults} Adult${totals.adults > 1 ? 's' : ''}`);
        if (totals.children) parts.push(`${totals.children} Child${totals.children > 1 ? 'ren' : ''}`);
        if (totals.infants) parts.push(`${totals.infants} Infant${totals.infants > 1 ? 's' : ''}`);
        return parts.length ? parts.join(', ') : '—';
    }, [packageDetail?.selected_rooms]);

    const packageImage =
        packageDetail?.featured_image ||
        packageDetail?.gallery_images?.[0] ||
        packageDetail?.image ||
        '';

    const backHref = packageDetail?.category?.slug && packageDetail?.slug
        ? `/${packageDetail.category.slug}/${packageDetail.slug}`
        : packageDetail?.category?.slug
            ? `/${packageDetail.category.slug}`
            : '/';

    const grandTotal = Number(packageDetail?.total_amount || 0) + servicesTotal;
    const isRefundable = packageDetail?.cancellation_policy?.cancel_policy === 'refundable';
    const activeRooms = expandedRooms.filter(
        (room) => room.adultsInRoom > 0 || room.childrenInRoom > 0 || room.infantsInRoom > 0
    );

    return (
        <div className={styles.page}>
            <div className="container">
                <Link href={backHref} className={styles.back}>
                    <FiChevronLeft size={16} aria-hidden="true" />
                    Return to Package Details
                </Link>

                <div className="row g-4">
                    <div className="col-lg-8 col-12 order-2 order-lg-1">
                        <section className={`${styles.card} mb-3`}>
                            <div className={styles.stepHeader}>
                                <h2 className={styles.stepTitle}>Your Booking Details</h2>
                                <p className={styles.stepSub}>
                                    Please review your selected travel arrangement before proceeding to secure checkout.
                                </p>
                            </div>
                            <div className={styles.reviewBody}>
                                <div className={styles.reviewTop}>
                                    {packageImage ? (
                                        <Image
                                            src={packageImage}
                                            alt={packageDetail?.title || 'Package'}
                                            width={280}
                                            height={400}
                                            className={styles.reviewImage}
                                            unoptimized
                                        />
                                    ) : (
                                        <div className={styles.reviewImage} aria-hidden="true" />
                                    )}
                                    <div>
                                        <p className={styles.reviewEyebrow}>
                                            {packageDetail?.category?.name || 'Package Journey'}
                                        </p>
                                        <h3 className={styles.reviewTitle}>{packageDetail?.title || 'Selected Package'}</h3>
                                        <div className={styles.metaGrid}>
                                            <div className={styles.metaItem}>
                                                <LuMapPin className={styles.metaIcon} size={16} />
                                                <div>
                                                    <span className={styles.metaLabel}>Package Category</span>
                                                    <span className={styles.metaValue}>
                                                        {packageDetail?.destination ||
                                                            packageDetail?.location ||
                                                            packageDetail?.category?.name ||
                                                            '—'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <LuCalendarCheck2 className={styles.metaIcon} size={16} />
                                                <div>
                                                    <span className={styles.metaLabel}>Departure Date</span>
                                                    <span className={styles.metaValue}>
                                                        {packageDetail?.start_date
                                                            ? moment(packageDetail.start_date).format('YYYY-MM-DD')
                                                            : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <IoMoonOutline className={styles.metaIcon} size={16} />
                                                <div>
                                                    <span className={styles.metaLabel}>Duration</span>
                                                    <span className={styles.metaValue}>
                                                        {nights > 0
                                                            ? `${nights + 1} Days – ${nights} Nights`
                                                            : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <BiUser className={styles.metaIcon} size={16} />
                                                <div>
                                                    <span className={styles.metaLabel}>Travelers</span>
                                                    <span className={styles.metaValue}>{travelerSummary}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.baseBar}>
                                            <span className={styles.baseLabel}>Package Price</span>
                                            <span className={styles.baseValue}>
                                                <PriceDisplay
                                                    price={Number(packageDetail?.total_amount || 0)}
                                                    currency={packageDetail?.currency_code}
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </section>

                        <GuestForm
                            packageDetail={packageDetail}
                            servicesTotal={servicesTotal}
                            selectedServices={selectedServices}
                            expandedRooms={expandedRooms}
                            withoutBedTotal={withoutBedTotal}
                            formId="package-checkout-form"
                            styles={styles}
                        />
                    </div>

                    <div className="col-lg-4 col-12 order-1 order-lg-2">
                        <aside className={styles.sidebar}>
                        {(packageDetail?.additional_services && packageDetail?.additional_services.length > 0) && (
                                <div className={styles.serviceCard}>
                                    <h5>Additional Services</h5>
                                    <p>Enhance your journey with our optional services</p>
                                    {packageDetail.additional_services.map((service, index) => (
                                        <div key={index} className={styles.serviceRow}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="form-check form-switch mb-0">
                                                    <input
                                                        onChange={() => handleServiceToggle(service)}
                                                        checked={selectedServices.some(s => s.id === service.id)}
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        id={`pkg-service-${service.id || index}`}
                                                    />
                                                    <label className="form-check-label" htmlFor={`pkg-service-${service.id || index}`}>
                                                        {service?.name}
                                                    </label>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-semibold" style={{ color: '#e31c23' }}>
                                                        <PriceDisplay price={service.price} currency={packageDetail?.currency_code} />
                                                    </div>
                                                    <div className="small text-muted">per unit</div>
                                                </div>
                                            </div>
                                            {selectedServices.some(s => s.id === service.id) && (
                                                <div className={styles.qtyBox}>
                                                    <button type="button" onClick={() => handleQuantityChange(service.id, 'minus')} className={styles.qtyBtn}>−</button>
                                                    <span>{selectedServices.find(s => s.id === service.id)?.quantity}</span>
                                                    <button type="button" onClick={() => handleQuantityChange(service.id, 'plus')} className={styles.qtyBtn}>+</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className={styles.card}>
                                <div className={styles.stepHeader}>
                                    <span className={styles.stepEyebrow}>Final Summary</span>
                                    <h2 className={styles.stepTitle}>Your Package Booking</h2>
                                </div>
                                <div className={styles.summaryBody}>
                                    {activeRooms.map((room, index) => (
                                        <div key={index} className={styles.roomBlock}>
                                            <h6 className={styles.roomTitle}>
                                                Room {room.roomIndex} – {room.type}
                                            </h6>
                                            {room.adultsInRoom > 0 && (
                                                <div className={styles.priceRow}>
                                                    <span>Adult × {room.adultsInRoom}</span>
                                                    <span>
                                                        <PriceDisplay
                                                            price={Number(room.sale_per_person) * room.adultsInRoom}
                                                            currency={packageDetail?.currency_code}
                                                        />
                                                    </span>
                                                </div>
                                            )}
                                            {room.childrenInRoom > 0 && (
                                                <div className={styles.priceRow}>
                                                    <span>Child × {room.childrenInRoom}</span>
                                                    <span>
                                                        <PriceDisplay
                                                            price={Number(room.child_sale_per_person) * room.childrenInRoom}
                                                            currency={packageDetail?.currency_code}
                                                        />
                                                    </span>
                                                </div>
                                            )}
                                            {room.infantsInRoom > 0 && (
                                                <div className={styles.priceRow}>
                                                    <span>Infant × {room.infantsInRoom}</span>
                                                    <span>
                                                        <PriceDisplay
                                                            price={Number(room.infant_sale_per_person) * room.infantsInRoom}
                                                            currency={packageDetail?.currency_code}
                                                        />
                                                    </span>
                                                </div>
                                            )}
                                            {(room.adultsWB > 0 || room.childrenWB > 0 || room.infantsWB > 0) && (
                                                <div className="mt-2 pt-2 border-top">
                                                    <small className="text-muted fw-semibold d-block mb-1">Without Bed</small>
                                                    {room.adultsWB > 0 && (
                                                        <div className={styles.priceRow}>
                                                            <small>Adult × {room.adultsWB}</small>
                                                            <small>
                                                                <PriceDisplay
                                                                    price={Number(room.adult_without_bed_price) * room.adultsWB}
                                                                    currency={packageDetail?.currency_code}
                                                                />
                                                            </small>
                                                        </div>
                                                    )}
                                                    {room.childrenWB > 0 && (
                                                        <div className={styles.priceRow}>
                                                            <small>Child × {room.childrenWB}</small>
                                                            <small>
                                                                <PriceDisplay
                                                                    price={Number(room.child_without_bed_price) * room.childrenWB}
                                                                    currency={packageDetail?.currency_code}
                                                                />
                                                            </small>
                                                        </div>
                                                    )}
                                                    {room.infantsWB > 0 && (
                                                        <div className={styles.priceRow}>
                                                            <small>Infant × {room.infantsWB}</small>
                                                            <small>
                                                                <PriceDisplay
                                                                    price={Number(room.infant_without_bed_price) * room.infantsWB}
                                                                    currency={packageDetail?.currency_code}
                                                                />
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {selectedServices.length > 0 && (
                                        <div className="mb-2">
                                            <h6 className="mb-2 fw-bold" style={{ fontSize: '0.9rem' }}>Selected Services</h6>
                                            {selectedServices.map((service, index) => (
                                                <div key={index} className={styles.priceRow}>
                                                    <span>{service?.name} × {service?.quantity}</span>
                                                    <span>
                                                        <PriceDisplay
                                                            price={Number(service?.total)}
                                                            currency={packageDetail?.currency_code}
                                                        />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {withoutBedTotal > 0 && (
                                        <div className={styles.priceRow}>
                                            <span>Without Bed</span>
                                            <span>
                                                <PriceDisplay
                                                    price={withoutBedTotal}
                                                    currency={packageDetail?.currency_code}
                                                />
                                            </span>
                                        </div>
                                    )}

                                    <div className={styles.priceRow}>
                                        <span>Subtotal</span>
                                        <span>
                                            <PriceDisplay
                                                price={grandTotal}
                                                currency={packageDetail?.currency_code}
                                            />
                                        </span>
                                    </div>

                                    <div className={styles.priceTotal}>
                                        <span>Total Secure Payment</span>
                                        <span>
                                            <PriceDisplay
                                                price={grandTotal}
                                                currency={packageDetail?.currency_code}
                                            />
                                        </span>
                                    </div>
                                    <p className={styles.vatNote}>VAT And Taxes Included</p>

                                    {packageDetail?.cancellation_policy && (
                                        <div className={`${styles.cancelBox} ${isRefundable ? styles.cancelBoxRefundable : ''}`}>
                                            {isRefundable ? <FaCheckCircle size={14} /> : <FaTimes size={14} />}
                                            <div>
                                                <strong className="d-block mb-1">Cancellation Policy</strong>
                                                {isRefundable && !!packageDetail.cancellation_policy.cancellation_policies?.length ? (
                                                    <ul className="ps-3 mb-0" style={{ listStyle: 'disc' }}>
                                                        {packageDetail.cancellation_policy.cancellation_policies.map((policy, i) => (
                                                            <li key={i} className="mb-1">
                                                                If cancelled <strong>{policy.time_duration} hours</strong> before departure, a{' '}
                                                                {policy.type === 'percentage'
                                                                    ? <><strong>{policy.value}%</strong> cancellation charge</>
                                                                    : <>fixed cancellation charge of <strong><PriceDisplay price={policy.value} currency={packageDetail?.currency_code} /></strong></>
                                                                } will apply.
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span>This booking is non-refundable. No refund will be issued for cancellations.</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </aside>
                    </div>
                </div>
            </div>
        </div>
    )
}
