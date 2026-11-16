'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import Link from 'next/link'
import { GoPerson } from "react-icons/go";
import { useTransferStore } from '@/components/Store/TransferStore';
import { PiSuitcaseRolling } from 'react-icons/pi';
import { GiGearStickPattern } from 'react-icons/gi';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import CheckoutTransfer from '@/components/Transfer/Checkout/CheckoutTransfer.js';
import { formatTransferServiceValue } from '@/util/formatTransferServiceValue';
import moment from 'moment';
import VehicleDetail from '@/components/Transfer/Listing/VehicleDetail';
import { IoArrowBack, IoTimeOutline, IoNotificationsOutline, IoShieldCheckmarkOutline, IoLockClosedOutline } from 'react-icons/io5';
import { FaCheck, FaCalendarAlt } from 'react-icons/fa';
import { MdPhoneInTalk } from 'react-icons/md';
import { playfair, inter } from '@/lib/fonts';
import './checkout.css';

const splitPlace = (value) => {
    const text = String(value || '').trim();
    if (!text) return { title: '', subtitle: '' };
    const comma = text.indexOf(',');
    if (comma === -1) return { title: text, subtitle: '' };
    return {
        title: text.slice(0, comma).trim(),
        subtitle: text.slice(comma + 1).trim(),
    };
};

/** Rebuild listing URL so "Choose Vehicle" returns to the same search results. */
const buildTransfersListingHref = (searchParams) => {
    if (!searchParams || typeof searchParams !== 'object') return '/transfers';

    const query = new URLSearchParams();
    const setIfPresent = (key, value) => {
        if (value == null || value === '') return;
        query.set(key, String(value));
    };

    const pickupLat = searchParams.pickupLatitude ?? searchParams.fromLat;
    const pickupLng = searchParams.pickupLongitude ?? searchParams.fromLng;
    const dropoffLat = searchParams.dropoffLatitude ?? searchParams.toLat;
    const dropoffLng = searchParams.dropoffLongitude ?? searchParams.toLng;

    setIfPresent('transferType', searchParams.transferType);
    setIfPresent('pickupLocation', searchParams.pickupLocation);
    setIfPresent('pickupLatitude', pickupLat);
    setIfPresent('pickupLongitude', pickupLng);
    setIfPresent('fromLat', pickupLat);
    setIfPresent('fromLng', pickupLng);
    setIfPresent('fromCountry', searchParams.fromCountry);
    setIfPresent('dropoffLocation', searchParams.dropoffLocation);
    setIfPresent('dropoffLatitude', dropoffLat);
    setIfPresent('dropoffLongitude', dropoffLng);
    setIfPresent('toLat', dropoffLat);
    setIfPresent('toLng', dropoffLng);
    setIfPresent('toCountry', searchParams.toCountry);
    setIfPresent('pickupDate', searchParams.pickupDate);
    setIfPresent('pickupTime', searchParams.pickupTime);
    setIfPresent('dropoffDate', searchParams.dropoffDate);
    setIfPresent('dropoffTime', searchParams.dropoffTime);
    setIfPresent('adults', searchParams.adults);
    setIfPresent('children', searchParams.children);
    setIfPresent('infants', searchParams.infants);
    setIfPresent('passengers', searchParams.passengers);
    setIfPresent('packageMode', searchParams.packageMode);
    setIfPresent('edit', searchParams.edit);
    query.set('r', String(Date.now()));

    const qs = query.toString();
    return qs ? `/transfers?${qs}` : '/transfers';
};

export const dynamic = 'force-dynamic';

export default function Page() {
    const { selectedtransfer } = useTransferStore();
    const [showModal, setShowModal] = useState(false);
    const [selectedExtras, setSelectedExtras] = useState([]);

    const listingHref = buildTransfersListingHref(selectedtransfer?.searchParams);

    if (!selectedtransfer || !selectedtransfer.searchParams) {
        return (
            <div className='transfer-checkout-container'>
                <div className='container'>
                    <div className='tc-form-card'>
                        <h2 className='tc-form-title'>No transfer selected</h2>
                        <p className='tc-form-subtitle mb-0'>Please select a transfer from the search page.</p>
                        <Link href={listingHref} className='transfer-checkout-back-link mt-3'>
                            <IoArrowBack aria-hidden="true" />
                            Back to Transfers
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const vehicle = selectedtransfer.vehicle_details;
    const params = selectedtransfer.searchParams;
    const qty = Math.max(1, Number(selectedtransfer.quantity) || 1);
    const unitPrice = Number(selectedtransfer?.fare || 0);
    const baseTotal = Number((unitPrice * qty).toFixed(2));
    const extrasTotal = selectedExtras.reduce(
        (sum, extra) => sum + Number(extra?.amount || 0) * Number(extra?.units || 1),
        0
    );
    const totalPrice = baseTotal + extrasTotal;
    const tripLabel = String(params?.transferType || '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .trim();

    const serviceInfo = Array.isArray(selectedtransfer?.service_information)
        ? selectedtransfer.service_information
        : [];

    const pickupParts = splitPlace(params?.pickupLocation);
    const dropoffParts = splitPlace(params?.dropoffLocation);
    const passengers =
        Number(params?.passengers) ||
        Number(params?.adults || 0) + Number(params?.children || 0) + Number(params?.infants || 0) ||
        1;

    const transferTime = serviceInfo.find((s) =>
        /time|duration|trftime/i.test(`${s?.id || ''} ${s?.name || ''}`),
    );
    const extrasLabel =
        selectedExtras.length > 0
            ? `Selected Extras (${selectedExtras
                .map((e) => `${e.units || 1}x ${e.name || e.type || 'Extra'}`)
                .join(', ')})`
            : null;

    return (
        <div className={`transfer-checkout-container ${inter.className}`}>
            <div className="container">
                <div className="tc-checkout-banner" aria-label="Checkout progress">
                    <ol className="tc-stepper">
                        <li className="tc-step tc-step--done">
                            <Link href={listingHref} className="tc-step-link">
                                <span className="tc-step-icon" aria-hidden="true">
                                    <FaCheck />
                                </span>
                                <span className="tc-step-label">
                                    <span className="tc-step-label-desktop">1. Choose Vehicle</span>
                                    <span className="tc-step-label-mobile">1. Vehicle</span>
                                </span>
                            </Link>
                        </li>
                        <li className="tc-step tc-step--active" aria-current="step">
                            <span className="tc-step-icon" aria-hidden="true">2</span>
                            <span className="tc-step-label">
                                <span className="tc-step-label-desktop">2. Review &amp; Details</span>
                                <span className="tc-step-label-mobile">2. Review</span>
                            </span>
                        </li>
                        <li className="tc-step tc-step--todo">
                            <span className="tc-step-icon" aria-hidden="true">3</span>
                            <span className="tc-step-label">
                                <span className="tc-step-label-desktop">3. Payment</span>
                                <span className="tc-step-label-mobile">3. Payment</span>
                            </span>
                        </li>
                    </ol>

                    <div className="tc-checkout-hero">
                        <h1 className={`tc-checkout-title ${playfair.className}`}>
                            Review Your Booking
                        </h1>
                        <p className="tc-checkout-subtitle">
                            Confirm precision terminal coordinates, optional executive services,
                            and lead guest travel credentials.
                        </p>
                    </div>
                </div>

                <div className="row g-4 transfer-checkout-row">
                    {/* Right — Form */}
                    <div className='col-lg-8 col-12'>
                        <CheckoutTransfer
                            transferDetail={selectedtransfer}
                            selectedExtras={selectedExtras}
                            onSelectedExtrasChange={setSelectedExtras}
                        />
                    </div>

                    {/* Summary sidebar */}
                    <div className='col-lg-4 col-12'>
                        <div className='transfer-checkout-sidebar'>
                            <div className='tc-info-card'>
                                <div className='tc-info-header'>
                                    <h2 className={`tc-info-title ${playfair.className}`}>Your Transfer Info</h2>
                                    {tripLabel && (
                                        <span className='tc-info-trip-badge'>{tripLabel}</span>
                                    )}
                                </div>

                                <div className='tc-route-timeline'>
                                    {pickupParts.title && (
                                        <div className='tc-route-item'>
                                            <div className='tc-route-rail'>
                                                <span className='tc-route-dot tc-route-dot-start' />
                                                {dropoffParts.title && <span className='tc-route-line' aria-hidden="true" />}
                                            </div>
                                            <div className='tc-route-body'>
                                                <span className='tc-route-label'>Pickup</span>
                                                <p className='tc-route-name'>{pickupParts.title}</p>
                                                {pickupParts.subtitle && (
                                                    <p className='tc-route-sub'>{pickupParts.subtitle}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {params?.transferType !== 'all-round' && dropoffParts.title && (
                                        <div className='tc-route-item'>
                                            <div className='tc-route-rail'>
                                                <span className='tc-route-dot tc-route-dot-end' />
                                            </div>
                                            <div className='tc-route-body'>
                                                <span className='tc-route-label'>Dropoff</span>
                                                <p className='tc-route-name'>{dropoffParts.title}</p>
                                                {dropoffParts.subtitle && (
                                                    <p className='tc-route-sub'>{dropoffParts.subtitle}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='tc-meta-row'>
                                    {params?.pickupDate && (
                                        <span className='tc-meta-chip'>
                                            <FaCalendarAlt aria-hidden="true" />
                                            {moment(params.pickupDate).format('DD MMM YYYY')}
                                        </span>
                                    )}
                                    {params?.pickupTime && (
                                        <span className='tc-meta-chip'>
                                            <IoTimeOutline aria-hidden="true" />
                                            {moment(params.pickupTime, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')}
                                        </span>
                                    )}
                                    <span className='tc-meta-chip'>
                                        <GoPerson aria-hidden="true" />
                                        {passengers} Pax
                                    </span>
                                </div>

                                <div className='tc-vehicle-panel'>
                                    <div className='tc-vehicle-top'>
                                        {selectedtransfer?.vehicle_image && (
                                            <div className='tc-vehicle-thumb'>
                                                <Image
                                                    src={selectedtransfer.vehicle_image}
                                                    height={72}
                                                    width={96}
                                                    className='tc-vehicle-image'
                                                    alt={vehicle?.name || 'Transfer vehicle'}
                                                />
                                            </div>
                                        )}
                                        <div className='tc-vehicle-copy'>
                                            <div className='tc-vehicle-name-row'>
                                                <h3 className='tc-vehicle-name'>{vehicle?.name || 'Transfer'}</h3>
                                                {(vehicle?.category || selectedtransfer?.vehiclecategory?.name) && (
                                                    <span className='tc-vehicle-tag'>
                                                        {vehicle?.category || selectedtransfer?.vehiclecategory?.name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className='tc-vehicle-desc'>
                                                {vehicle?.vehicle_type || vehicle?.vehicle_description || 'Private chauffeur transfer'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className='tc-vehicle-specs'>
                                        {transferTime && (
                                            <span>
                                                <IoTimeOutline aria-hidden="true" />
                                                Transit: {formatTransferServiceValue(transferTime)}
                                            </span>
                                        )}
                                        {vehicle?.luggage_capacity != null && vehicle.luggage_capacity !== '' && (
                                            <span>
                                                <PiSuitcaseRolling aria-hidden="true" />
                                                Luggage: {vehicle.luggage_capacity} Piece{Number(vehicle.luggage_capacity) !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {vehicle?.passenger_capacity != null && vehicle.passenger_capacity !== '' && (
                                            <span>
                                                <GoPerson aria-hidden="true" />
                                                Max Pax: {vehicle.passenger_capacity}
                                            </span>
                                        )}
                                        {vehicle?.transmission_type && (
                                            <span>
                                                <GiGearStickPattern aria-hidden="true" />
                                                {vehicle.transmission_type}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className='tc-view-details'
                                        onClick={() => setShowModal(true)}
                                    >
                                        View Vehicle Details
                                    </button>
                                </div>

                                <div className='tc-cancel-box'>
                                    <IoNotificationsOutline size={18} aria-hidden="true" />
                                    <div>
                                        {selectedtransfer?.cancel_policy === 'refundable' ? (
                                            <>
                                                <strong>Cancellation Policy:</strong> Free cancellation may apply based on policy dates.
                                                {selectedtransfer.cancellation_policies?.length > 0 && (
                                                    <div className='tc-cancel-fees'>
                                                        {selectedtransfer.cancellation_policies.map((policy, idx) => (
                                                            <p key={idx} className='tc-cancel-fee'>
                                                                From <strong>{moment(policy.from).format('DD MMM YYYY')}</strong>: fee of{' '}
                                                                <strong>
                                                                    <PriceDisplay
                                                                        price={qty * Number(policy.amount)}
                                                                        currency={selectedtransfer?.currency}
                                                                    />
                                                                </strong>
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : selectedtransfer?.cancel_policy ? (
                                            <>
                                                <strong>Cancellation Policy:</strong> This transfer is non-refundable.
                                            </>
                                        ) : (
                                            <>
                                                <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours prior to pickup.
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className='tc-price-block'>
                                    <div className='tc-price-row'>
                                        <span>Base Transfer Rate{qty > 1 ? ` (×${qty})` : ''}</span>
                                        <span>
                                            <PriceDisplay price={baseTotal} currency={selectedtransfer?.currency} />
                                        </span>
                                    </div>
                                    {selectedExtras.length > 0 && (
                                        <div className='tc-price-row'>
                                            <span>{extrasLabel}</span>
                                            <span>
                                                <PriceDisplay price={extrasTotal} currency={selectedtransfer?.currency} />
                                            </span>
                                        </div>
                                    )}
                                    {/* <div className='tc-price-row'>
                                        <span>VAT &amp; Saudi Municipal Taxes</span>
                                        <span className='tc-price-included'>Included</span>
                                    </div> */}

                                    <div className='tc-price-total'>
                                        <div>
                                            <span className='tc-price-total-label'>Total Payable</span>
                                            <p className='tc-price-total-sub'>Guaranteed fixed rate</p>
                                        </div>
                                        <div className='tc-price-total-right'>
                                            <span className='tc-price-total-value'>
                                                <PriceDisplay price={totalPrice} currency={selectedtransfer?.currency} />
                                            </span>
                                            <p className='tc-price-note'>VAT &amp; taxes included</p>
                                        </div>
                                    </div>
                                </div>

                                <ul className='tc-trust-list'>
                                    <li>
                                        <IoLockClosedOutline aria-hidden="true" />
                                        Bank-Grade 256-Bit SSL Checkout
                                    </li>
                                    <li>
                                        <IoTimeOutline aria-hidden="true" />
                                        Complimentary 60 Min Flight Delay Buffer
                                    </li>
                                    <li>
                                        <IoShieldCheckmarkOutline aria-hidden="true" />
                                        24/7 Dedicated Chauffeur Dispatch
                                    </li>
                                </ul>
                            </div>

                            <div className='tc-help-bar'>
                                <div className='tc-help-left'>
                                    <span className='tc-help-icon' aria-hidden="true">
                                        <MdPhoneInTalk />
                                    </span>
                                    <div>
                                        <p className='tc-help-title'>Need Booking Help?</p>
                                        <a href="tel:+442033972000" className='tc-help-phone'>+44 20 3397 2000</a>
                                    </div>
                                </div>
                                <a href="tel:+442033972000" className='tc-help-btn'>Call Dispatch</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <VehicleDetail
                selectedTransferDetail={selectedtransfer}
                showModal={showModal}
                handleCloseModal={() => setShowModal(false)}
                type='checkout'
                vehicleQuantity={qty}
            />
        </div>
    )
}
