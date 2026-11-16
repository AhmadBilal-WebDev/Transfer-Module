"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "@mantine/core";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaExclamationTriangle } from "react-icons/fa";
import moment from "moment";
import { plusJakarta } from "@/lib/fonts";
import {
    hasBackendPenaltyData,
    getChangePenalty,
    getRefundPolicyDescription,
    getChangePolicyDescription,
} from "@/components/Flights/Checkout/flightHelpers";

const normalizeCancelPolicyValue = (value) => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/_/g, "-");
    if (normalized === "non-refundable" || normalized === "nonrefundable") {
        return "non-refundable";
    }
    if (normalized === "refundable") return "refundable";
    return normalized;
};

const parseCancellationPolicy = (raw) => {
    if (!raw) return null;

    if (typeof raw === "object" && !Array.isArray(raw)) {
        if (raw.plainText) return raw;
        if (raw.flightPenalties) {
            return { flightPenalties: raw.flightPenalties };
        }
        if (hasBackendPenaltyData(raw)) {
            return { flightPenalties: raw.penalties };
        }
        if (raw.cancel_policy) {
            return {
                ...raw,
                cancel_policy: normalizeCancelPolicyValue(raw.cancel_policy),
                cancellation_policies:
                    raw.cancellation_policies || raw.policies || [],
            };
        }
        if (raw.cancellation_policy) {
            return parseCancellationPolicy(raw.cancellation_policy);
        }
        return null;
    }

    if (typeof raw !== "string") return null;

    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            return parseCancellationPolicy(JSON.parse(trimmed));
        } catch {
            return { plainText: trimmed };
        }
    }

    const policyValue = normalizeCancelPolicyValue(trimmed);
    if (policyValue === "non-refundable" || policyValue === "refundable") {
        return { cancel_policy: policyValue };
    }

    return { plainText: trimmed };
};

const extractActivityBookingPolicy = (booking) => {
    if (!booking) return null;

    const candidates = [
        booking?.activity?.cancellation_policy,
        booking?.cancellation_policy,
        booking?.activity?.cancellation_policy_text,
        booking?.cancellation_policy_text,
    ];

    for (const candidate of candidates) {
        const parsed = parseCancellationPolicy(candidate);
        if (parsed) return parsed;
    }

    const cancelPolicy =
        booking?.activity?.cancel_policy || booking?.cancel_policy;
    if (cancelPolicy) {
        return { cancel_policy: normalizeCancelPolicyValue(cancelPolicy) };
    }

    if (
        booking?.activity?.is_refundable === false ||
        booking?.is_refundable === false
    ) {
        return { cancel_policy: "non-refundable" };
    }

    return null;
};

const extractPackageBookingPolicy = (booking) => {
    if (!booking) return null;

    const candidates = [
        booking?.package_details?.cancellation_policy,
        booking?.packageDetails?.cancellation_policy,
        booking?.cancellation_policy,
        booking?.cancellation_policy_text,
        booking?.package_details?.cancellation_policy_text,
        booking?.packageDetails?.cancellation_policy_text,
    ];

    for (const candidate of candidates) {
        const parsed = parseCancellationPolicy(candidate);
        if (parsed) return parsed;
    }

    const cancelPolicy =
        booking?.package_details?.cancel_policy ||
        booking?.packageDetails?.cancel_policy ||
        booking?.cancel_policy;
    if (cancelPolicy) {
        return { cancel_policy: normalizeCancelPolicyValue(cancelPolicy) };
    }

    if (
        booking?.is_refundable === false ||
        booking?.package_details?.is_refundable === false ||
        booking?.packageDetails?.is_refundable === false
    ) {
        return { cancel_policy: "non-refundable" };
    }

    return null;
};

const extractFlightBookingPolicy = (booking) => {
    if (!booking) return null;

    if (hasBackendPenaltyData(booking)) {
        return { flightPenalties: booking.penalties };
    }

    const candidates = [
        booking?.cancellation_policies,
        booking?.cancellation_policy,
    ];

    for (const candidate of candidates) {
        const parsed = parseCancellationPolicy(candidate);
        if (parsed) return parsed;
    }

    return null;
};

const collectHotelCancellationPolicies = (booking) => {
    const flatPolicies = [];
    const apiPolicies = Array.isArray(booking?.cancellation_policies)
        ? booking.cancellation_policies
        : [];

    apiPolicies.forEach((entry) => {
        if (Array.isArray(entry?.policies)) {
            flatPolicies.push(...entry.policies);
        } else if (entry?.from) {
            flatPolicies.push(entry);
        }
    });

    if (!flatPolicies.length && Array.isArray(booking?.rooms_details)) {
        booking.rooms_details.forEach((item) => {
            item?.rates?.forEach((rate) => {
                const ratePolicies =
                    rate?.cancellation_policies || rate?.cancellationPolicies || [];
                if (Array.isArray(ratePolicies)) {
                    flatPolicies.push(...ratePolicies);
                }
            });
        });
    }

    return flatPolicies;
};

const extractHotelBookingPolicy = (booking) => {
    if (!booking) return null;

    const candidates = [
        booking?.cancellation_policy,
        booking?.cancellation_policy_text,
    ];

    for (const candidate of candidates) {
        const parsed = parseCancellationPolicy(candidate);
        if (parsed) return parsed;
    }

    const cancelPolicy =
        booking?.cancel_policy ||
        booking?.cancellation_policy?.cancel_policy;
    if (cancelPolicy) {
        const normalized = normalizeCancelPolicyValue(cancelPolicy);
        if (normalized === "non-refundable") {
            return { cancel_policy: "non-refundable" };
        }
    }

    const flatPolicies = collectHotelCancellationPolicies(booking);
    if (flatPolicies.length) {
        return {
            cancel_policy: "refundable",
            cancellation_policies: flatPolicies,
        };
    }

    return { cancel_policy: "non-refundable" };
};

const normalizeTransferPolicySource = (source) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) return null;
    if (!source.cancel_policy) return null;

    const normalizedCancel = normalizeCancelPolicyValue(source.cancel_policy);
    const tiers = source.policies || source.cancellation_policies || [];
    const flatTiers = Array.isArray(tiers) ? tiers : [];

    if (normalizedCancel === "non-refundable") {
        return { cancel_policy: "non-refundable" };
    }

    if (flatTiers.length) {
        return {
            cancel_policy: "refundable",
            cancellation_policies: flatTiers,
        };
    }

    return { cancel_policy: "non-refundable" };
};

const extractTransferBookingPolicy = (booking) => {
    if (!booking) return null;

    const nestedPolicy = normalizeTransferPolicySource(booking?.cancellation_policies);
    if (nestedPolicy) return nestedPolicy;

    const candidates = [
        booking?.cancellation_policy,
        booking?.transfer?.cancellation_policies,
        booking?.transfer?.cancellation_policy,
        booking?.cancellation_policy_text,
    ];

    for (const candidate of candidates) {
        const nested = normalizeTransferPolicySource(candidate);
        if (nested) return nested;

        const parsed = parseCancellationPolicy(candidate);
        if (parsed) return parsed;
    }

    if (booking?.transfer?.cancel_policy) {
        const policies = Array.isArray(booking.transfer.cancellation_policies)
            ? booking.transfer.cancellation_policies
            : [];
        const normalized = normalizeTransferPolicySource({
            cancel_policy: booking.transfer.cancel_policy,
            policies,
        });
        if (normalized) return normalized;
    }

    if (booking?.cancel_policy) {
        const normalized = normalizeTransferPolicySource({
            cancel_policy: booking.cancel_policy,
            policies: Array.isArray(booking.cancellation_policies)
                ? booking.cancellation_policies
                : [],
        });
        if (normalized) return normalized;
    }

    return { cancel_policy: "non-refundable" };
};

const getPolicyFeeValue = (policy) => policy?.value ?? policy?.amount;

const convertToCustomerCurrency = (price, currency, baseCurrency, exchangeRate) => {
    if (!price) return "0.00";
    const amount = Number(price);
    if (!exchangeRate) return amount.toFixed(2);
    if (baseCurrency && currency === baseCurrency) return amount.toFixed(2);
    return (amount * Number(exchangeRate)).toFixed(2);
};

const formatPolicyDuration = (hours) => {
    const value = Number(hours);
    if (!value || Number.isNaN(value)) return null;
    if (value >= 24 && value % 24 === 0) {
        const days = value / 24;
        return `${days} day${days !== 1 ? "s" : ""}`;
    }
    return `${value} hour${value !== 1 ? "s" : ""}`;
};

const getActiveDateBasedPolicy = (policies) => {
    const dateBased = policies.filter((policy) => policy?.from);
    if (!dateBased.length) return null;

    const sorted = [...dateBased].sort(
        (a, b) => moment(a.from).valueOf() - moment(b.from).valueOf(),
    );
    const activeList = sorted.filter((policy) =>
        moment().isSameOrAfter(moment(policy.from), "day"),
    );
    return activeList.length ? activeList[activeList.length - 1] : sorted[0];
};

const getApplicableChargeText = (
    policy,
    travelDate,
    currency,
    baseCurrency,
    exchangeRate,
    bookingType,
) => {
    if (!policy || policy.plainText) return null;

    const cancelPolicy = policy.cancel_policy;
    if (cancelPolicy === "non-refundable" || cancelPolicy === "non_refundable") {
        return "Non-refundable — no refund will be issued if you cancel now.";
    }

    const policies = Array.isArray(policy.cancellation_policies)
        ? policy.cancellation_policies
        : [];
    if (!policies.length) {
        return bookingType === "flight"
            ? null
            : "This booking may be refundable. See the policy details below.";
    }

    const activeDatePolicy = getActiveDateBasedPolicy(policies);
    if (activeDatePolicy) {
        const feeValue = getPolicyFeeValue(activeDatePolicy);
        if (activeDatePolicy.type === "percentage") {
            const pct = Number(feeValue);
            if (pct >= 100) {
                return "Non-refundable — 100% cancellation charge applies.";
            }
            if (pct === 0) {
                return "Free cancellation — no charge if you cancel now.";
            }
            return `${pct}% cancellation charge may apply if you cancel now.`;
        }

        if (feeValue != null) {
            const fee = convertToCustomerCurrency(
                feeValue,
                currency,
                baseCurrency,
                exchangeRate,
            );
            return `A cancellation fee of ${currency ? `${currency} ` : ""}${fee} may apply if you cancel now.`;
        }
    }

    const sorted = [...policies].sort(
        (a, b) => Number(b.time_duration || 0) - Number(a.time_duration || 0),
    );
    const travelMoment = travelDate ? moment(travelDate).startOf("day") : null;
    if (!travelMoment?.isValid()) return null;

    const hoursUntil = travelMoment.diff(moment(), "hours", true);
    const freePolicy = sorted.find(
        (p) => p.type === "percentage" && Number(p.value) === 0,
    );
    if (freePolicy && hoursUntil >= Number(freePolicy.time_duration || 0)) {
        return "Free cancellation — no charge if you cancel now.";
    }

    const stillOpen = sorted.filter(
        (p) => hoursUntil >= Number(p.time_duration || 0),
    );
    const active =
        stillOpen.length > 0 ? stillOpen[stillOpen.length - 1] : sorted[sorted.length - 1];

    if (active.type === "percentage") {
        const pct = Number(active.value);
        if (pct >= 100) return "Non-refundable — 100% cancellation charge applies.";
        if (pct === 0) return "Free cancellation — no charge if you cancel now.";
        return `${pct}% cancellation charge may apply if you cancel now.`;
    }

    if (active.type === "fixed" || getPolicyFeeValue(active) != null) {
        const fee = convertToCustomerCurrency(
            getPolicyFeeValue(active),
            currency,
            baseCurrency,
            exchangeRate,
        );
        return `A fixed cancellation fee of ${currency ? `${currency} ` : ""}${fee} may apply if you cancel now.`;
    }

    return null;
};

const renderPolicyTierLabel = (policy, bookingType) => {
    if (policy?.from) {
        return `If cancelled from ${moment(policy.from).format("DD MMM YYYY")}: `;
    }

    const duration = formatPolicyDuration(policy.time_duration);
    const subject =
        bookingType === "flight"
            ? "departure"
            : bookingType === "hotel"
              ? "check-in"
              : bookingType === "package"
                ? "departure"
                : bookingType === "transfer"
                  ? "pickup"
                  : "activity";
    if (duration) return `If cancelled ${duration} before ${subject}: `;
    return `If cancelled before ${subject}: `;
};

const renderPolicyCharge = (policy, currency, baseCurrency, exchangeRate) => {
    const feeValue = getPolicyFeeValue(policy);

    if (policy?.from && feeValue != null && !policy.type) {
        const fee = convertToCustomerCurrency(
            feeValue,
            currency,
            baseCurrency,
            exchangeRate,
        );
        return `Cancellation fee of ${currency ? `${currency} ` : ""}${fee}`;
    }

    if (policy.type === "percentage") {
        const pct = Number(feeValue);
        if (pct === 0) return "Free cancellation";
        if (pct >= 100) return "Non-refundable (100% charge)";
        return `${pct}% cancellation charge`;
    }
    if (policy.type === "fixed" || feeValue != null) {
        const fee = convertToCustomerCurrency(
            feeValue,
            currency,
            baseCurrency,
            exchangeRate,
        );
        return `Fixed fee of ${currency ? `${currency} ` : ""}${fee}`;
    }
    return "Cancellation charge applies";
};

const extractBookingConversion = (booking, bookingType) => {
    if (!booking) return null;

    if (bookingType === "flight") {
        return {
            exchangeRate: booking?.pricing?.supplier_to_display_rate,
            baseCurrency:
                booking?.pricing?.supplier_currency ||
                booking?.pricing?.currency ||
                "",
        };
    }

    if (bookingType === "hotel") {
        return {
            exchangeRate:
                booking?.pricing?.supplier_to_display_rate ||
                booking?.customer_exchange_rate,
            baseCurrency:
                booking?.currency_code ||
                booking?.pricing?.supplier_currency ||
                "",
        };
    }

    if (bookingType === "transfer") {
        return {
            exchangeRate: booking?.pricing?.supplier_to_display_rate,
            baseCurrency: booking?.pricing?.supplier_currency || "",
        };
    }

    return {
        exchangeRate: booking?.customer_exchange_rate,
        baseCurrency: booking?.currency_code || "",
    };
};

const fetchBookingDetails = async (bookingReference, bookingType, invoiceNumber) => {
    if (bookingType === "activity") {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/activities/booking/${bookingReference}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            },
        );
        const data = await response.json();
        return {
            success: Boolean(data?.Success),
            booking: data?.Content?.booking,
        };
    }

    if (bookingType === "flight") {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking/details`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ booking_reference: bookingReference }),
            },
        );
        const data = await response.json();
        return {
            success: Boolean(data?.success),
            booking: data?.data,
        };
    }

    if (bookingType === "hotel") {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/hotel/booking/details`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoice_number: invoiceNumber || bookingReference,
                }),
            },
        );
        const data = await response.json();
        return {
            success: Boolean(data?.success),
            booking: data?.data,
        };
    }

    if (bookingType === "package") {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/packages/booking/${bookingReference}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            },
        );
        const data = await response.json();
        return {
            success: Boolean(data?.Success),
            booking: data?.Content?.booking,
        };
    }

    if (bookingType === "transfer") {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking/details`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ booking_reference: bookingReference }),
            },
        );
        const data = await response.json();
        return {
            success: Boolean(data?.success),
            booking: data?.data,
        };
    }

    return { success: false, booking: null };
};

const extractBookingPolicy = (booking, bookingType) => {
    if (bookingType === "flight") return extractFlightBookingPolicy(booking);
    if (bookingType === "activity") return extractActivityBookingPolicy(booking);
    if (bookingType === "hotel") return extractHotelBookingPolicy(booking);
    if (bookingType === "package") return extractPackageBookingPolicy(booking);
    if (bookingType === "transfer") return extractTransferBookingPolicy(booking);
    return parseCancellationPolicy(booking?.cancellation_policy);
};

export default function CancelBookingModal({
    opened,
    onClose,
    bookingReference,
    provider,
    bookingId,
    type,
    endPoint,
    onSuccess,
    cancellationPolicy,
    currency,
    travelDate,
    exchangeRate,
    baseCurrency,
    invoiceNumber,
    email,
    otp,
    packageId,
}) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [resolvedPolicy, setResolvedPolicy] = useState(null);
    const [policyLoading, setPolicyLoading] = useState(false);
    const [fetchedConversion, setFetchedConversion] = useState(null);
    const isDashboardOtpCancel = type === "holiday-package";

    useEffect(() => {
        if (!opened) {
            setResolvedPolicy(null);
            setPolicyLoading(false);
            setFetchedConversion(null);
            return;
        }

        const fromProps = parseCancellationPolicy(cancellationPolicy);
        if (fromProps) {
            setResolvedPolicy(fromProps);
        }

        if (
            (type !== "activity" &&
                type !== "flight" &&
                type !== "hotel" &&
                type !== "package" &&
                type !== "transfer") ||
            !bookingReference
        ) {
            setPolicyLoading(false);
            return;
        }

        let cancelled = false;
        setPolicyLoading(true);

        fetchBookingDetails(bookingReference, type, invoiceNumber)
            .then(({ success, booking }) => {
                if (cancelled) return;
                if (success && booking) {
                    if (!fromProps) {
                        setResolvedPolicy(extractBookingPolicy(booking, type));
                    }
                    setFetchedConversion(extractBookingConversion(booking, type));
                } else if (!fromProps) {
                    setResolvedPolicy(null);
                }
            })
            .catch(() => {
                if (!cancelled && !fromProps) setResolvedPolicy(null);
            })
            .finally(() => {
                if (!cancelled) setPolicyLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [opened, cancellationPolicy, bookingReference, type, invoiceNumber]);

    const handleClose = () => {
        setReason("");
        setError("");
        setLoading(false);
        setConfirmed(false);
        setResolvedPolicy(null);
        setPolicyLoading(false);
        setFetchedConversion(null);
        onClose();
    };
    const handleSubmit = async () => {
        if (!isDashboardOtpCancel && !reason.trim()) {
            setError("Please enter a reason for cancellation.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const body = isDashboardOtpCancel
                ? {
                      email,
                      otp,
                      booking_reference: bookingReference,
                      ...(packageId ? { package_id: packageId } : {}),
                  }
                : {
                      provider,
                      cancellation_reason: reason.trim(),
                      ...(type === "hotel"
                          ? { bookingReference: bookingReference, bookingId }
                          : type === "activity" || type === "package"
                            ? {
                                  booking_reference: bookingReference,
                                  booking_id: bookingId,
                              }
                            : { booking_reference: bookingReference }),
                  };

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}${endPoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(body),
                },
            );
          
            const data = await response.json();
            if (response.ok && (data?.success !== false)) {
                setConfirmed(true);
                if (onSuccess) onSuccess(bookingReference, bookingId);
            } else {
                setError(data?.message);
            }
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const parsedPolicy = resolvedPolicy;
    const isNonRefundable =
        parsedPolicy?.cancel_policy === "non-refundable" ||
        (!parsedPolicy?.plainText &&
            parsedPolicy?.cancel_policy !== "refundable");
    const effectiveExchangeRate =
        exchangeRate ?? fetchedConversion?.exchangeRate ?? null;
    const effectiveBaseCurrency =
        baseCurrency ?? fetchedConversion?.baseCurrency ?? "";
    const applicableCharge = getApplicableChargeText(
        parsedPolicy,
        travelDate,
        currency,
        effectiveBaseCurrency,
        effectiveExchangeRate,
        type,
    );
    const policyTiers = Array.isArray(parsedPolicy?.cancellation_policies)
        ? [...parsedPolicy.cancellation_policies].sort((a, b) => {
            if (a?.from && b?.from) {
                return moment(a.from).valueOf() - moment(b.from).valueOf();
            }
            return Number(b.time_duration || 0) - Number(a.time_duration || 0);
        })
        : [];
    const showFlightPolicyTiers =
        type === "flight" &&
        parsedPolicy?.cancel_policy === "refundable" &&
        policyTiers.length > 0;
    const flightPenalties = parsedPolicy?.flightPenalties;
    const showFlightPenaltyPolicies =
        type === "flight" &&
        flightPenalties &&
        hasBackendPenaltyData({ penalties: flightPenalties });

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <div className={`cbm-modal-title ${plusJakarta.className}`}>
                    <span className="cbm-modal-title-icon" aria-hidden="true">
                        <RiDeleteBin6Line size={16} />
                    </span>
                    <span>Cancel Booking</span>
                </div>
            }
            centered
            radius="lg"
            padding="lg"
            overlayProps={{ backgroundOpacity: 0.5, blur: 6, color: "#0c1c34" }}
            size="md"
            classNames={{
                content: `cbm-modal-content ${plusJakarta.className}`,
                header: "cbm-modal-header",
                body: "cbm-modal-body",
                title: "cbm-modal-title-wrap",
            }}
        >
            {confirmed ? (
                <div className="cbm-success">
                    <div className="cbm-success-icon">✓</div>
                    <h6 className="cbm-success-title">Booking Cancelled</h6>
                    <p className="cbm-success-msg">
                        Booking <strong>{bookingReference}</strong> has been successfully
                        cancelled.
                    </p>
                    <button type="button" className="cbm-btn-primary" onClick={handleClose}>
                        Close
                    </button>
                </div>
            ) : (
                <>
                    {/* Warning banner */}
                    <div className="cbm-warning-banner">
                        <span className="cbm-warning-icon" aria-hidden="true">
                            <FaExclamationTriangle size={14} />
                        </span>
                        <span>
                            This action cannot be undone. The booking{" "}
                            <strong>{bookingReference}</strong> will be permanently cancelled.
                        </span>
                    </div>

                    {policyLoading && (
                        <div className="cbm-policy-box cbm-policy-loading">
                            <h6 className="cbm-policy-title">Cancellation Policy</h6>
                            <p className="cbm-policy-text">Loading cancellation policy…</p>
                        </div>
                    )}

                    {!policyLoading && (parsedPolicy || type === "flight" || type === "hotel" || type === "transfer") && (
                        <div className="cbm-policy-box">
                            <h6 className="cbm-policy-title">Cancellation Policy</h6>

                            {parsedPolicy?.plainText ? (
                                <p className="cbm-policy-text">{parsedPolicy.plainText}</p>
                            ) : type === "flight" ? (
                                showFlightPenaltyPolicies ? (
                                    <ul className="cbm-policy-list">
                                        <li>
                                            <strong>Cancellation:</strong>{" "}
                                            {getRefundPolicyDescription({ penalties: flightPenalties })}
                                        </li>
                                        {getChangePenalty({ penalties: flightPenalties }) && (
                                            <li>
                                                <strong>Change/Exchange:</strong>{" "}
                                                {getChangePolicyDescription({ penalties: flightPenalties })}
                                            </li>
                                        )}
                                    </ul>
                                ) : showFlightPolicyTiers ? (
                                    <>
                                        <p className="cbm-policy-refund">
                                            This booking is <strong>refundable</strong> with the following
                                            terms:
                                        </p>
                                        <ul className="cbm-policy-list">
                                            {policyTiers.map((policy, index) => (
                                                <li key={index}>
                                                    {renderPolicyTierLabel(policy, type)}
                                                    <strong>
                                                        {renderPolicyCharge(
                                                            policy,
                                                            currency,
                                                            effectiveBaseCurrency,
                                                            effectiveExchangeRate,
                                                        )}
                                                    </strong>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <p className="cbm-policy-nonrefund">
                                        This ticket is <strong>non-refundable</strong>. Cancellations are not
                                        permitted.
                                    </p>
                                )
                            ) : isNonRefundable || ((type === "hotel" || type === "transfer") && !parsedPolicy) ? (
                                <p className="cbm-policy-nonrefund">
                                    This booking is <strong>non-refundable</strong>. No refund will be
                                    issued for cancellations.
                                </p>
                            ) : (
                                <>
                                    <p className="cbm-policy-refund">
                                        This booking is <strong>refundable</strong> with the following
                                        terms:
                                    </p>
                                    {policyTiers.length > 0 ? (
                                        <ul className="cbm-policy-list">
                                            {policyTiers.map((policy, index) => (
                                                <li key={index}>
                                                    {renderPolicyTierLabel(policy, type)}
                                                    <strong>
                                                        {renderPolicyCharge(
                                                            policy,
                                                            currency,
                                                            effectiveBaseCurrency,
                                                            effectiveExchangeRate,
                                                        )}
                                                    </strong>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="cbm-policy-text">
                                            Cancellation terms apply per supplier policy.
                                        </p>
                                    )}
                                </>
                            )}

                            {/* {applicableCharge && (type !== "flight" || showFlightPolicyTiers) && (
                                <p className="cbm-policy-current">
                                    <strong>If you cancel now:</strong> {applicableCharge}
                                </p>
                            )} */}
                        </div>
                    )}

                    {/* Reason textarea */}
                    {!isDashboardOtpCancel && (
                        <div className="cbm-field">
                            <label className="cbm-label">
                                Cancellation Reason <span className="cbm-required">*</span>
                            </label>
                            <textarea
                                className="cbm-textarea"
                                rows={4}
                                placeholder="Please describe your reason for cancellation..."
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    if (error) setError("");
                                }}
                                disabled={loading}
                            />
                            {error && <p className="cbm-error">{error}</p>}
                        </div>
                    )}
                    {isDashboardOtpCancel && error && (
                        <p className="cbm-error" style={{ marginTop: 12 }}>
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="cbm-actions">
                        <button
                            type="button"
                            className="cbm-btn-secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Keep Booking
                        </button>
                        <button
                            type="button"
                            className="cbm-btn-danger"
                            onClick={handleSubmit}
                            disabled={loading || (!isDashboardOtpCancel && !reason.trim())}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" />
                                    Cancelling…
                                </>
                            ) : (
                                <>
                                    <RiDeleteBin6Line size={14} />
                                    Confirm Cancellation
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
}
