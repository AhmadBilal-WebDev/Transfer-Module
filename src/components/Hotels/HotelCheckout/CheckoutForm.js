"use client";

import React, { useState, useEffect } from "react";
import { Select } from "@mantine/core";
import { countryListLocal } from "@/util/CountryList"; // your country data
import PackageBookingLoader from "@/components/Loader/PackageBookingLoader";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { TiDeleteOutline } from "react-icons/ti";
import { BiCreditCard, BiLock } from "react-icons/bi";
import { BsBank, BsCheckCircleFill } from "react-icons/bs";
import { GoCheckCircle } from "react-icons/go";
import { FaUser, FaUserPlus } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import Link from "next/link";
import moment from "moment";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";

const MAX_NAME_LENGTH = 35;
const MAX_EMAIL_LENGTH = 200;

export default function CheckoutForm({ data, currency, rates }) {
    const [showLoader, setShowLoader] = useState(false);
    const [loaderError, setLoaderError] = useState("");
    const [currencyKey, setCurrencyKey] = useState("");
    const [otherGuestDetail, setOtherGuestDetail] = useState([]);
    const [otherGuestError, setOtherGuestError] = useState([]);
    const [roomOnRequest, setRoomOnRequest] = useState(false);
    const [confirmStatus, setConfirmStatus] = useState("pending");
    const [searchData, setSearchData] = useState({});
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [bookingFor, setBookingFor] = useState("self");
    const router = useRouter();
    // console.log("Checkout Data:", data);
    useEffect(() => {
        if (!data?.rooms) return;
        const totals = data?.rooms ? data?.rooms.reduce(
            (acc, room) => {
                room.rates.forEach(rate => {
                    acc.adults += rate.adults || 0;
                    acc.children += rate.children || 0;
                });
                return acc;
            },
            { adults: 0, children: 0 }
        ) : [];
        const adjustedTotals = {
            ...totals,
            adults: Math.max(totals.adults - 1, 0),
        };
        setSearchData(adjustedTotals);
        const isAnyRoomOnRequest = data.rooms.some(room =>
            room.rates.some(rate => rate.on_request === true)
        );
        setRoomOnRequest(isAnyRoomOnRequest);
    }, [data]);

    useEffect(() => {
        const callCurrencyAPI = async () => {
            if (!data?.hotel_code) return;
            var APiCurrency = currency;
            if (Object.keys(rates).length === 1) {
                APiCurrency = data?.currency;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/checkout/currency`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model_id: data?.hotel_code,
                        type: "hotel",
                        display_currency: APiCurrency,
                        model_currency: data?.currency,
                    }),
                });
                const result = await response.json();
                if (result?.success) {
                    setCurrencyKey(result?.data?.uuid);
                }
            } catch (error) {
                console.error("Error calling currency API:", error);
            }
        };

        callCurrencyAPI();
    }, [currency, data]);
    // ---- Create country list array ----
    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }));

    // ---- Form state ----
    const [formData, setFormData] = useState({
        title: "",
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        phoneCode: "",
        phone: "",
        requests: "",
        cardNumber: "",
        expiry: "",
        cvv: "",
        terms: false,
    });

    // ---- Validation errors ----
    const [errors, setErrors] = useState({});

    // ---- Handle field change ----
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let nextValue = type === "checkbox" ? checked : value;
        if (name === "firstName" || name === "lastName") {
            nextValue = nextValue.slice(0, MAX_NAME_LENGTH);
        } else if (name === "email") {
            nextValue = nextValue.slice(0, MAX_EMAIL_LENGTH);
        }
        setFormData({
            ...formData,
            [name]: nextValue,
        });

        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    // ---- Handle country selection ----
    const handleCountryChange = (value) => {
        const selected = countryOptions.find((c) => c.value === value);
        setFormData({
            ...formData,
            country: value,
            phoneCode: selected?.code || "",
        });

        if (errors.country) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated.country;
                return updated;
            });
        }
    };
    // ---- Validation ----
    const normalizeNamePart = (value) =>
        String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    const getFullNameKey = (firstName, lastName) =>
        `${normalizeNamePart(firstName)}|${normalizeNamePart(lastName)}`;

    const validateForm = () => {
        const newErrors = {};
        const otherGuestErrors = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.title) newErrors.title = "Please select a title.";
        if (!formData.firstName) {
            newErrors.firstName = "First name is required.";
        } else if (formData.firstName.length > MAX_NAME_LENGTH) {
            newErrors.firstName = `First name must not exceed ${MAX_NAME_LENGTH} characters.`;
        }
        if (!formData.lastName) {
            newErrors.lastName = "Last name is required.";
        } else if (formData.lastName.length > MAX_NAME_LENGTH) {
            newErrors.lastName = `Last name must not exceed ${MAX_NAME_LENGTH} characters.`;
        }
        if (!formData.email) {
            newErrors.email = "Email is required.";
        } else if (formData.email.length > MAX_EMAIL_LENGTH) {
            newErrors.email = `Email must not exceed ${MAX_EMAIL_LENGTH} characters.`;
        } else if (emailRegex.test(formData.email) === false) {
            newErrors.email = "Please enter a valid email address.";
        }
        if (!formData.country) newErrors.country = "Please select a country.";
        if (!formData.phone) newErrors.phone = "Phone number is required.";
        // if (!formData.cardNumber) newErrors.cardNumber = "Card number is required.";
        // if (!formData.expiry) newErrors.expiry = "Expiry date is required.";
        // if (!formData.cvv) newErrors.cvv = "CVV is required.";
        if (!formData.terms) newErrors.terms = "You must agree to terms.";

        const leadFirst = normalizeNamePart(formData.firstName);
        const leadLast = normalizeNamePart(formData.lastName);
        const leadFullKey =
            leadFirst && leadLast ? getFullNameKey(formData.firstName, formData.lastName) : "";
        const seenGuestNames = new Map();

        if (otherGuestDetail.length > 0) {
            otherGuestDetail.forEach((guest, index) => {
                const guestErrors = {};
                const guestFirst = normalizeNamePart(guest.firstName);
                const guestLast = normalizeNamePart(guest.lastName);

                if (!guestFirst) {
                    guestErrors.firstName = "First name is required";
                } else if (guest.firstName.length > MAX_NAME_LENGTH) {
                    guestErrors.firstName = `First name must not exceed ${MAX_NAME_LENGTH} characters`;
                }
                if (!guestLast) {
                    guestErrors.lastName = "Last name is required";
                } else if (guest.lastName.length > MAX_NAME_LENGTH) {
                    guestErrors.lastName = `Last name must not exceed ${MAX_NAME_LENGTH} characters`;
                }

                if (guestFirst && guestLast) {
                    const guestFullKey = getFullNameKey(guest.firstName, guest.lastName);

                    // Same first + last as lead passenger
                    if (leadFullKey && guestFullKey === leadFullKey) {
                        guestErrors.firstName =
                            "Guest name cannot match the lead passenger";
                        guestErrors.lastName =
                            "Guest name cannot match the lead passenger";
                        newErrors.firstName =
                            "Lead passenger name cannot match an added guest";
                        newErrors.lastName =
                            "Lead passenger name cannot match an added guest";
                    }

                    // Duplicate among additional guests
                    if (seenGuestNames.has(guestFullKey)) {
                        guestErrors.firstName =
                            "This guest name is already used by another guest";
                        guestErrors.lastName =
                            "This guest name is already used by another guest";
                    } else {
                        seenGuestNames.set(guestFullKey, index);
                    }
                }

                otherGuestErrors[index] = guestErrors;
            });

            setOtherGuestError(otherGuestErrors);
        } else {
            setOtherGuestError([]);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 && otherGuestErrors.every(err => Object.keys(err).length === 0);
    };
    // ---- Submit handler ----
    const handleCheckout = async () => {
        if (!validateForm()) return;
        setLoaderError("");
        setConfirmStatus("pending");
        setShowLoader(true);

        // Wait for first two steps (2 seconds each)
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConfirmStatus("validate");

        const otherAdults = otherGuestDetail.filter(item => item.type === 'AD');
        const otherChilds = otherGuestDetail.filter(item => item.type === 'CH');
        let selectedPaymentMethod = 'stripe';
        if (paymentMethod === 'bank') {
            selectedPaymentMethod = 'bank_transfer';
        }
        // Calculate currency conversion
        const hotelCurrency = data?.currency;
        const grandTotal = Number(data?.total_net);

        let customerCurrency = currency;
        let customerExchangeRate = 1;
        let customerTotalAfterDiscount = grandTotal;
        if (currency !== hotelCurrency && rates[hotelCurrency] && rates[currency]) {
            const conversion = ConvertPrice(data?.total_net, data?.currency, currency, rates);
            customerCurrency = conversion.newcurrency;
            customerTotalAfterDiscount = parseFloat(conversion.newprice);

            // Calculate exchange rate
            customerExchangeRate = (rates[currency] / rates[hotelCurrency]);
        } else {
            customerCurrency = hotelCurrency;
            customerExchangeRate = 1;
            customerTotalAfterDiscount = grandTotal;
        }
        // Now make the API call
        const domain = window.location.origin;
        const checkoutUrl = window.location;
        const request = {
            "provider": data?.provider,
            "currency_uuid": currencyKey,
            "holder_title": formData?.title,
            "holder_email": formData?.email,
            "checkIn": data?.check_in,
            "checkOut": data?.check_out,
            "holder_phone": formData?.phoneCode + formData?.phone,
            "holder_country": formData?.country,
            "remark": formData?.requests,
            "otherAdults": otherAdults,
            "otherChilds": otherChilds,
            "payment_method": selectedPaymentMethod,
            "holder": {
                "name": formData.firstName,
                "surname": formData.lastName,
            },
            "rooms": data.rooms.map(item => ({
                code: item.code,
                name: item.name,
                status: item.status,
                rates: item.rates.map(rate => ({
                    rate_key: rate.rate_key,
                    rate_type: rate.rate_type,
                    prebook_id: item?.metadata?.prebook_id || '',
                    rate_id: item?.metadata?.rate_id || '',
                    adults: rate.adults,
                    children: rate.children,
                    rooms: rate.rooms,
                })),
            })),
            "clientReference": `ref_${Date.now()}`,
            "currency": data?.currency,
            "booking_amount": data?.total_net,
            "converted_price": customerTotalAfterDiscount,
            "exchange_rate": customerExchangeRate,
            "converted_currency": customerCurrency,
            "success_url": `${domain}/hotels/voucher`,
            "cancel_url": `${checkoutUrl}`,

            "check_rates_request": {
                "data": data,
            }
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/create-booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true', 
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            if (response?.success) {
                setConfirmStatus("reserve");
                if (roomOnRequest || selectedPaymentMethod === 'bank_transfer') {
                    setShowLoader(false);
                    router.push(`/hotels/voucher/${response?.data?.invoice_number}`);
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 800));
                setConfirmStatus("payment");
                setTimeout(() => {
                    setShowLoader(false);
                    router.push(`${response?.data?.checkout_url}`);
                }, 800);
            } else {
                setLoaderError(response?.error?.message || "Booking failed. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setShowLoader(false);
                    notifications.show({
                        title: 'Error',
                        message: response?.error?.message,
                        autoClose: 3500,
                        color: 'red'
                    })
                }, 1000);

            }
        } catch (err) {
            setLoaderError("A network error occurred. Please try again.");
            setConfirmStatus("error");
            setTimeout(() => setShowLoader(false), 1000);
        }
    };
    const handleGuestAdd = () => {
        const totalAllowed = searchData?.adults + searchData?.children;
        const currentAdults = otherGuestDetail.filter(g => g.type === 'AD').length;
        const currentChildren = otherGuestDetail.filter(g => g.type === 'CH').length;
        if (otherGuestDetail.length >= totalAllowed) {
            return;
        }
        setOtherGuestError([])
        if (currentAdults < searchData?.adults) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', type: 'AD' }]);
        } else if (currentChildren < searchData?.children) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', type: 'CH' }]);
        }

    };
    const handleGuestRemove = (index) => {
        const updatedGuests = otherGuestDetail.filter((_, i) => i !== index);
        setOtherGuestDetail(updatedGuests);
    };
    const handleGuestChange = (e, index) => {
        const { name, value } = e.target;
        let nextValue = value;
        if (name === "firstName" || name === "lastName") {
            nextValue = value.slice(0, MAX_NAME_LENGTH);
        }
        const updatedGuests = [...otherGuestDetail];
        updatedGuests[index][name] = nextValue;
        setOtherGuestDetail(updatedGuests);

        const updatedErrors = [...otherGuestError];
        if (updatedErrors[index]?.[name]) {
            updatedErrors[index][name] = "";
            setOtherGuestError(updatedErrors);
        }
    };
    const applyLeadDetails = (data) => {
        setFormData({
            ...data,
            firstName: String(data.firstName || "").slice(0, MAX_NAME_LENGTH),
            lastName: String(data.lastName || "").slice(0, MAX_NAME_LENGTH),
            email: String(data.email || "").slice(0, MAX_EMAIL_LENGTH),
        });
    };

    const handleLoaderComplete = () => {

    }
    return (
        <div>
            <LeadDetail setFormData={applyLeadDetails} />
            {showLoader && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={showLoader}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Room"
                />
            )}

            <div className="hc-alert">
                <GoCheckCircle size={18} /> Almost done! Just fill in the required info
            </div>

            <div className="hc-form-card">
                <h3 className="hc-form-title">Who Are We Welcoming?</h3>
                <p className="hc-form-subtitle">Tell us who this stay is for.</p>
                <div className="hc-welcome-grid">
                    <button
                        type="button"
                        className={`hc-welcome-option${bookingFor === "self" ? " hc-welcome-option--active" : ""}`}
                        onClick={() => setBookingFor("self")}
                    >
                        <span className="hc-welcome-option__icon" aria-hidden="true">
                            <FaUser size={16} />
                        </span>
                        <span className="hc-welcome-option__content">
                            <strong>I&apos;m the main guest</strong>
                            <span>Booking for myself</span>
                        </span>
                    </button>
                    <button
                        type="button"
                        className={`hc-welcome-option${bookingFor === "other" ? " hc-welcome-option--active" : ""}`}
                        onClick={() => setBookingFor("other")}
                    >
                        <span className="hc-welcome-option__icon" aria-hidden="true">
                            <FaUserPlus size={16} />
                        </span>
                        <span className="hc-welcome-option__content">
                            <strong>Booking for someone else</strong>
                            <span>You&apos;re arranging this trip</span>
                        </span>
                    </button>
                </div>
            </div>

            <div className="hc-form-card">
                <h3 className="hc-form-title">Enter Your Information</h3>
                <p className="hc-form-subtitle">
                    {bookingFor === "self"
                        ? "Details you've saved in your profile pre-fill here."
                        : "Enter the lead guest details for this reservation."}
                </p>

                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="hc-form-label">Title*</label>
                        <select
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`form-select ${errors.title ? "is-invalid" : ""}`}
                        >
                            <option value="">Select</option>
                            <option value="MR">Mr</option>
                            <option value="MRS">Mrs</option>
                            <option value="MISS">Miss</option>
                            <option value="DR">Dr</option>
                        </select>
                        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>

                    <div className="col-md-6">
                        <label className="hc-form-label">First Name*</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                            placeholder="First Name"
                            autoComplete="off"
                            maxLength={MAX_NAME_LENGTH}
                        />
                        {errors.firstName && (
                            <div className="invalid-feedback">{errors.firstName}</div>
                        )}
                    </div>

                    <div className="col-md-6">
                        <label className="hc-form-label">Last Name*</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                            placeholder="Last Name"
                            autoComplete="off"
                            maxLength={MAX_NAME_LENGTH}
                        />
                        {errors.lastName && (
                            <div className="invalid-feedback">{errors.lastName}</div>
                        )}
                    </div>

                    <div className="col-md-6">
                        <label className="hc-form-label">Email Address*</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            placeholder="you@example.com"
                            autoComplete="off"
                            maxLength={MAX_EMAIL_LENGTH}
                        />
                        {errors.email && (
                            <div className="invalid-feedback">{errors.email}</div>
                        )}
                    </div>

                    <div className="col-md-6">
                        <label className="hc-form-label">Country*</label>
                        <Select
                            placeholder="Select Country"
                            searchable
                            data={countryOptions}
                            value={formData.country}
                            limit={50}
                            onChange={handleCountryChange}
                            className={errors.country ? "is-invalid" : ""}
                        />
                        {errors.country && (
                            <div className="text-danger small mt-1">{errors.country}</div>
                        )}
                    </div>

                    <div className="col-md-6">
                        <label className="hc-form-label">Phone Number*</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light">
                                {formData.phoneCode || "+__"}
                            </span>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (
                                        !/[0-9]/.test(e.key) &&
                                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                                placeholder="123456789"
                                autoComplete="off"
                            />
                        </div>
                        {errors.phone && (
                            <div className="invalid-feedback d-block">{errors.phone}</div>
                        )}
                    </div>
                </div>

                <p className="hc-form-subtitle mb-0 mt-3">
                    This information will be used for booking confirmations. Ensure the name matches travel documents.
                </p>
            </div>

            <div className="hc-form-card">
                <button type="button" onClick={handleGuestAdd} className="hc-add-guest">+ Add New Guest</button>
                {otherGuestDetail.map((item, index) => (
                    <div key={index} className="hc-guest-block">
                        <div className="hc-guest-block__head">
                            <h6>
                                Guest {index + 2}{" "}
                                {item.type === 'CH' && (
                                    <span style={{ fontSize: '12px' }} className="small bg-secondary-subtle rounded px-1 py-1">Child</span>
                                )}
                            </h6>
                            <TiDeleteOutline onClick={() => handleGuestRemove(index)} className="text-danger cursor-pointer" size={20} />
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="hc-form-label">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    onChange={(e) => handleGuestChange(e, index)}
                                    value={item.firstName}
                                    placeholder="First Name"
                                    className={`form-control ${otherGuestError[index]?.firstName ? "is-invalid" : ""}`}
                                    maxLength={MAX_NAME_LENGTH}
                                />
                                {otherGuestError[index]?.firstName && (
                                    <div className="invalid-feedback">{otherGuestError[index]?.firstName}</div>
                                )}
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="hc-form-label">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    onChange={(e) => handleGuestChange(e, index)}
                                    value={item.lastName}
                                    placeholder="Last Name"
                                    className={`form-control ${otherGuestError[index]?.lastName ? "is-invalid" : ""}`}
                                    maxLength={MAX_NAME_LENGTH}
                                />
                                {otherGuestError[index]?.lastName && (
                                    <div className="invalid-feedback">{otherGuestError[index]?.lastName}</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hc-form-card">
                <h3 className="hc-form-title">Special Requests</h3>
                <p className="hc-form-subtitle">
                    Special requests cannot be guaranteed – but the property will do its best to meet your needs.
                </p>
                <textarea
                    className="form-control w-100"
                    rows={5}
                    name="requests"
                    value={formData.requests}
                    onChange={handleChange}
                    placeholder="Please write your requests in English (optional)"
                />
            </div>

            <div className="hc-form-card">
                <h3 className="hc-form-title">
                    <BiLock size={18} style={{ color: '#e31c23', marginRight: 8, verticalAlign: 'middle' }} />
                    Secure Payment Method
                </h3>
                <p className="hc-form-subtitle">Select your preferred payment method.</p>

                {roomOnRequest ? (
                    <div className="hc-onrequest-note">
                        An On Request room is not instantly confirmed and requires approval from the hotel before the booking can be finalized. Payment cannot be processed during checkout. Once confirmed, you will be notified to complete payment.
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            className={`hc-pay-option${paymentMethod === "card" ? " hc-pay-option--active" : ""}`}
                            onClick={() => setPaymentMethod("card")}
                        >
                            <div className="hc-pay-option__icon">
                                <BiCreditCard size={20} />
                            </div>
                            <div>
                                <strong>Credit / Debit Card</strong>
                                <span>Visa, Mastercard, Amex &amp; more</span>
                            </div>
                            <div className="hc-pay-brands">
                                <span className="hc-pay-brand">VISA</span>
                                <span className="hc-pay-brand">MC</span>
                                <span className="hc-pay-brand">AMEX</span>
                            </div>
                        </button>

                        {(moment(data?.check_in).isAfter(moment().add(3, 'days')) && data.provider === 'custom') && (
                            <button
                                type="button"
                                className={`hc-pay-option${paymentMethod === "bank" ? " hc-pay-option--active" : ""}`}
                                onClick={() => setPaymentMethod("bank")}
                            >
                                <div className="hc-pay-option__icon">
                                    <BsBank size={18} />
                                </div>
                                <div>
                                    <strong>Bank Transfer</strong>
                                    <span>Direct deposit to our account</span>
                                </div>
                            </button>
                        )}

                        {paymentMethod === "card" && (
                            <div className="hc-stripe-bar">
                                <div className="d-flex align-items-center gap-2">
                                    <BiLock size={16} />
                                    Secured &amp; powered by <strong style={{ color: '#e31c23' }}>Stripe</strong>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    <span className="small"><BsCheckCircleFill size={11} color="#e31c23" /> 256-bit SSL</span>
                                    <span className="small"><BsCheckCircleFill size={11} color="#e31c23" /> PCI DSS</span>
                                    <span className="small"><BsCheckCircleFill size={11} color="#e31c23" /> 3D Secure</span>
                                </div>
                            </div>
                        )}

                        {paymentMethod === "bank" && (
                            <div className="hc-bank-card">
                                <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#e31c23' }}>
                                    <BsBank size={18} />
                                    <strong>Our Bank Account Details</strong>
                                </div>
                                <div className="hc-bank-row">
                                    <span>Account Title</span>
                                    <strong>Royalane Ltd</strong>
                                </div>
                                <div className="hc-bank-row">
                                    <span>Account Number</span>
                                    <strong>58516868</strong>
                                </div>
                                <div className="hc-bank-row">
                                    <span>Sort Code</span>
                                    <strong>309950</strong>
                                </div>
                                <div className="hc-bank-note">
                                    <MdVerified size={15} />
                                    <span>
                                        After completing the bank transfer, please send the payment receipt to{" "}
                                        <strong>example@royalane.com</strong> with your booking reference.
                                        Your booking will be confirmed within <strong>24 hours</strong> of payment verification.
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="hc-form-card">
                <div className="hc-terms">
                    <input
                        className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
                        type="checkbox"
                        name="terms"
                        id="hotel-checkout-terms"
                        checked={formData.terms}
                        onChange={handleChange}
                    />
                    <label htmlFor="hotel-checkout-terms">
                        I agree to the <Link href="/terms-and-conditions" target="_blank">terms and conditions</Link>.
                    </label>
                </div>
                {errors.terms && (
                    <div className="text-danger small mt-2">{errors.terms}</div>
                )}

                <button
                    onClick={handleCheckout}
                    type="button"
                    className="hc-submit"
                >
                    {paymentMethod === "card" && !roomOnRequest
                        ? "Complete Secure Payment"
                        : "Confirm Booking"}
                </button>
            </div>
        </div>
    );
}

