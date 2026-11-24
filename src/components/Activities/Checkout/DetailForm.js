'use client'
import React, { useState, useEffect } from 'react'
import { countryListLocal } from '@/util/CountryList';
import { Select } from "@mantine/core";
import { TiDeleteOutline } from "react-icons/ti";
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useCurrency } from '@/util/currency';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { IoPersonAddOutline, IoShieldCheckmarkOutline, IoPersonOutline, IoPeopleOutline, IoLockClosedOutline, IoCardOutline } from 'react-icons/io5';
import { BsBank2 } from 'react-icons/bs';
import { MdVerified } from 'react-icons/md';
import Link from 'next/link';
import Autocomplete from "react-google-autocomplete";
import LeadDetail from '@/components/LeadDetail/LeadDetail';

const MAX_NAME_LENGTH = 35;
const MAX_EMAIL_LENGTH = 200;

export default function DetailForm({ activityDetail }) {
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const { currency, rates } = useCurrency();
    const [totalPersons, setTotalPersons] = useState({ adults: 0, children: 0 });
    const [otherGuestDetail, setOtherGuestDetail] = useState([]);
    const [otherGuestError, setOtherGuestError] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaderError, setLoaderError] = useState("");
    const [currencyKey, setCurrencyKey] = useState("");
    const [confirmStatus, setConfirmStatus] = useState("pending"); // "pending" | "booking" | "payment" | "success" | "error"
    const [formData, setFormData] = useState({
        title: "",
        address: "",
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        phoneCode: "",
        phone: "",
        requests: "",
        gender: "male",
        terms: false,
    });
    const [bookingOptionDetails, setBookingOptionDetails] = useState('self');
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'bank'

    const bankInfo = {
        accountName: "Royalane Ltd",
        accountNumber: "58516868",
        // iban: "GB29NWBK60161331926819",
        sortcode: "309950",
        // branch: "London Branch",
    };

    useEffect(() => {
        setTotalPersons({
            adults: Math.max((activityDetail?.adults || 0) - 1, 0),
            children: activityDetail?.children || 0,
        });
    }, [activityDetail]);

    useEffect(() => {
        const callCurrencyAPI = async () => {
            if (!activityDetail?.id) return;
            var APiCurrency = currency;
            if (Object.keys(rates).length === 1) {
                APiCurrency = activityDetail?.currency;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/checkout/currency`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model_id: activityDetail?.id,
                        type: "activity",
                        display_currency: APiCurrency,
                        model_currency: activityDetail?.currency,
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
    }, [currency, activityDetail]);

    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }));
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

    // ---- Handle address autocomplete selection ----
    const handlePlaceSelected = (place) => {
        if (!place || !place.formatted_address) return;

        // Get formatted address
        const address = place.formatted_address;

        // Extract country from address components
        const countryComponent = place.address_components?.find(
            (component) => component.types.includes("country")
        );

        if (countryComponent) {
            // Find matching country in our country list
            const countryName = countryComponent.long_name;
            const matchedCountry = countryOptions.find(
                (c) => c.value === countryName || c.label === countryName
            );

            if (matchedCountry) {
                setFormData({
                    ...formData,
                    address: address,
                    country: matchedCountry.value,
                    phoneCode: matchedCountry.code || "",
                });

                // Clear errors
                setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.address;
                    delete updated.country;
                    return updated;
                });
            } else {
                // Country not found in our list, just set address
                setFormData({
                    ...formData,
                    address: address,
                });

                if (errors.address) {
                    setErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.address;
                        return updated;
                    });
                }
            }
        } else {
            // No country component, just set address
            setFormData({
                ...formData,
                address: address,
            });

            if (errors.address) {
                setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.address;
                    return updated;
                });
            }
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
        if (formData.phone) {
            if (formData.phone.length > 15 || formData.phone.length < 6) {
                newErrors.phone = "Phone number must be between 6 and 15 digits.";
            }
        }
        if (!formData.address) newErrors.address = "Address is required.";
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

    const handleGuestAdd = () => {
        const totalAllowed = totalPersons?.adults + totalPersons?.children;
        const currentAdults = otherGuestDetail.filter(g => g.type === 'AD').length;
        const currentChildren = otherGuestDetail.filter(g => g.type === 'CH').length;
        if (otherGuestDetail.length >= totalAllowed) {
            return;
        }
        setOtherGuestError([])
        if (currentAdults < totalPersons?.adults) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', gender: 'male', type: 'AD' }]);
        } else if (currentChildren < totalPersons?.children) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', gender: 'male', type: 'CH' }]);
        }

    };

    const handleGuestRemove = (index) => {
        const updatedGuests = otherGuestDetail.filter((_, i) => i !== index);
        setOtherGuestDetail(updatedGuests);
    };

    const handleGuestChange = (e, index) => {
        let field = e.target.name;
        let value = e.target.value;

        // Normalize gender field
        if (field.startsWith("gender_")) {
            field = "gender";
        } else if (field === "firstName" || field === "lastName") {
            value = value.slice(0, MAX_NAME_LENGTH);
        }

        const updatedGuests = [...otherGuestDetail];
        updatedGuests[index][field] = value;
        setOtherGuestDetail(updatedGuests);

        // Clear error if exists
        const updatedErrors = [...otherGuestError];
        if (updatedErrors[index]?.[field]) {
            updatedErrors[index][field] = "";
            setOtherGuestError(updatedErrors);
        }
    };

    // ---- Submit handler ----
    const handleCheckout = async () => {
        if (!validateForm()) return;
        setConfirmStatus("pending");
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConfirmStatus("validate");
        var NewOtherPassenger = {};
        if (otherGuestDetail.length > 0) {
            NewOtherPassenger = convertPassengers(otherGuestDetail);
        }

        // Calculate currency conversion
        const packageCurrency = activityDetail?.currency;
        const grandTotal = Number(activityDetail?.grand_total);

        let customerCurrency = currency;
        let customerExchangeRate = 1;
        let customerTotalAfterDiscount = grandTotal;

        // If currencies are different, convert the price
        if (currency !== packageCurrency && rates[packageCurrency] && rates[currency]) {
            const conversion = ConvertPrice(grandTotal, packageCurrency, currency, rates);
            customerCurrency = conversion.newcurrency;
            customerTotalAfterDiscount = parseFloat(conversion.newprice);

            // Calculate exchange rate
            customerExchangeRate = (rates[currency] / rates[packageCurrency]);
        } else {
            // Same currency, use original values
            customerCurrency = packageCurrency;
            customerExchangeRate = 1;
            customerTotalAfterDiscount = grandTotal;
        }

        const request = {
            activity_id: activityDetail?.id,
            currency_uuid: currencyKey,
            special_request: formData.requests,
            lead_title: formData?.title,
            lead_first_name: formData?.firstName,
            lead_last_name: formData?.lastName,
            lead_email: formData?.email,
            lead_address: formData?.address,
            lead_country: formData?.country,
            lead_phone_code: formData?.phoneCode,
            lead_phone: formData?.phone,
            lead_gender: formData?.gender,
            travel_date: activityDetail?.travel_date,
            adults: activityDetail?.adults,
            adult_price: (Number(activityDetail?.adults) * Number(activityDetail?.price_per_adult)).toFixed(2),
            children: activityDetail?.children,
            child_price: (Number(activityDetail?.children) * Number(activityDetail?.price_per_child)).toFixed(2),
            grand_total: grandTotal,
            other_passengers: NewOtherPassenger,
            customer_currency: customerCurrency,
            customer_exchange_rate: customerExchangeRate,
            customer_total: customerTotalAfterDiscount,
            additional_services: activityDetail?.selected_services || [],
            payment_method: paymentMethod === 'bank' ? 'bank_transfer' : 'stripe',
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true', 
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            if (response?.Success) {
                await new Promise(resolve => setTimeout(resolve, 800));
                setConfirmStatus("reserve");
                localStorage.setItem('lead_details_fill', JSON.stringify(formData));
                if (paymentMethod === 'bank') {
                    setConfirmStatus("success");
                    setTimeout(() => {
                        setLoading(false);
                        router.push(`/activities/voucher/${response?.Content?.booking?.booking_reference}`);
                    }, 800);
                    return;
                }
                await handlePayment(response?.Content);
            } else {
                setLoaderError(response?.error?.message || "Booking failed. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setLoading(false);
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
            setTimeout(() => setLoading(false), 1000);
        }
    };

    const handlePayment = async (data) => {
        const domain = window.location.origin;
        const checkoutUrl = window.location;
        const request = {
            'booking_reference': data?.booking?.booking_reference,
            'success_url': `${domain}/activities/voucher/${data?.booking?.booking_reference}`,
            'cancel_url': `${checkoutUrl}`
        }
        localStorage.setItem('lead_details_fill', JSON.stringify(formData));
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/payment/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true', 
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            if (response?.Success) {
                setConfirmStatus("payment");
                setTimeout(() => {
                    setLoading(false);
                    router.push(response?.Content?.checkout_url);
                }, 800);

            } else {
                setLoaderError(response?.error?.message || "Booking failed. Please try again.");
                setConfirmStatus("error");
                setTimeout(() => {
                    setLoading(false);
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
            setTimeout(() => setLoading(false), 1000);
        }
    };

    const handleLoaderComplete = () => {
    };

    const convertPassengers = (list) => {
        const result = {
            additional_adults: [],
            children_details: [],
        };

        let adultIndex = 2;  // adult count starts from 2
        let childIndex = 1;  // child starts from 1

        list.forEach((item) => {
            const formatted = {
                index: null,
                gender: item.gender,
                last_name: item.lastName,
                first_name: item.firstName,
            };

            if (item.type === "AD") {
                formatted.index = adultIndex++;
                result.additional_adults.push(formatted);
            }

            if (item.type === "CH") {
                formatted.index = childIndex++;
                result.children_details.push(formatted);
            }
        });

        return result;
    };

    const applyLeadDetails = (data) => {
        setFormData({
            ...data,
            firstName: String(data.firstName || "").slice(0, MAX_NAME_LENGTH),
            lastName: String(data.lastName || "").slice(0, MAX_NAME_LENGTH),
            email: String(data.email || "").slice(0, MAX_EMAIL_LENGTH),
        });
    };

    return (
        <div>
            <LeadDetail setFormData={applyLeadDetails} />
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Activity"
                />
            )}
            {/* Who Are We Welcoming */}
            <div className="checkout-form-card">
                <h5 className="checkout-section-title">Who Are We Welcoming?</h5>
                <div className="welcome-options">
                    <button
                        type="button"
                        className={`welcome-option ${bookingOptionDetails === 'self' ? 'active' : ''}`}
                        onClick={() => setBookingOptionDetails('self')}
                    >
                        <span className="welcome-option-icon-container">
                            <IoPersonOutline className="welcome-option-icon" aria-hidden="true" />
                        </span>
                        <div className="welcome-option-content">
                            <span className="welcome-option-title">I&apos;m the main guest</span>
                            <span className="welcome-option-desc">My details will match the booking</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        className={`welcome-option ${bookingOptionDetails === 'other' ? 'active' : ''}`}
                        onClick={() => setBookingOptionDetails('other')}
                    >
                        <span className="welcome-option-icon-container">
                            <IoPeopleOutline className="welcome-option-icon" aria-hidden="true" />
                        </span>
                        <div className="welcome-option-content">
                            <span className="welcome-option-title">Booking for someone else</span>
                            <span className="welcome-option-desc">I&apos;m booking on behalf of another guest</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Lead Guest Info */}
            <div className="checkout-form-card">
                <h5 className="checkout-section-title">Enter Your Information</h5>
                <p className="checkout-section-subtitle">Primary contact for booking confirmations and communications</p>

                <div className="row mb-3 g-3">
                    {/* Title */}
                    <div className="col-md-4">
                        <label className="form-label">Title*</label>
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
                            <option value="MS">Ms</option>
                            <option value="DR">Dr</option>
                        </select>
                        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>

                    {/* First Name */}
                    <div className="col-md-4">
                        <label className="form-label">First Name*</label>
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

                    {/* Last Name */}
                    <div className="col-md-4">
                        <label className="form-label">Last Name*</label>
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

                    {/* Email */}
                    <div className="col-md-6">
                        <label className="form-label">Email*</label>
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
                    {/* Address */}
                    <div className="col-md-6">
                        <label className="form-label">Address*</label>
                        {/* <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={`form-control ${errors.address ? "is-invalid" : ""}`}
                            placeholder="House No. / Street / Area"
                            autoComplete="off"
                        /> */}
                        <Autocomplete
                            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                            placeholder="House No. / Street "
                            className={`form-control ${errors.address ? "is-invalid" : ""}`}
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            onPlaceSelected={handlePlaceSelected}
                            options={{
                                types: ["address"],
                            }}
                        />
                        {errors.address && (
                            <div className="invalid-feedback">{errors.address}</div>
                        )}
                    </div>

                    {/* Country */}
                    <div className="col-md-4">
                        <label className="form-label">Country*</label>
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

                    {/* Phone */}
                    <div className="col-md-4">
                        <label className="form-label">Phone Number*</label>
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
                                        e.preventDefault(); // 👈 yahin block hota hai
                                    }
                                }}
                                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                                placeholder="123456789"
                                autoComplete="off"
                            />
                        </div>
                        {errors.phone && (
                            <div className="invalid-feedback d-block small">{errors.phone}</div>
                        )}
                    </div>

                    {/* Gender */}
                    <div className="col-md-4">
                        <label className="form-label">Gender*</label>
                        <div className="">
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" checked={formData.gender === "male"} type="radio" onChange={handleChange} name="gender" id="leadRadio1" value="male" />
                                <label className="form-check-label" htmlFor="leadRadio1">Male</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" checked={formData.gender === "female"} type="radio" onChange={handleChange} name="gender" id="leadRadio2" value="female" />
                                <label className="form-check-label" htmlFor="leadRadio2">Female</label>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="checkout-form-note">
                    Ensure the name matches travel documents. This information will be used for all booking confirmations.
                </p>
            </div>

            {/* Other Guest Info */}
            {(totalPersons?.adults + totalPersons?.children) > 0 && (
                <div className="checkout-form-card">
                    <h5 className="checkout-section-title">Additional Travelers</h5>
                    <p className="checkout-section-subtitle">Add details for other guests in your group (optional)</p>

                    <button type="button" onClick={handleGuestAdd} className="btn-add-guest">
                        <IoPersonAddOutline size={16} /> Add New Guest
                    </button>

                    {otherGuestDetail.map((item, index) => (
                        <div key={index} className="guest-card">
                            <div className="guest-card-header">
                                <h6>
                                    Traveler {index + 2}
                                    {(item.type === 'CH' || item.type === 'IN') && (
                                        <span className="guest-type-badge">
                                            {item.type === 'CH' ? 'Child' : 'Infant'}
                                        </span>
                                    )}
                                </h6>
                                <TiDeleteOutline onClick={() => handleGuestRemove(index)} className="text-danger cursor-pointer" size={20} />
                            </div>
                            <div className="row g-3">
                                <div className="col-12 col-md-4">
                                    <label className="form-label">First Name</label>
                                    <input type="text" name="firstName" onChange={(e) => handleGuestChange(e, index)} value={item.firstName} placeholder="First Name" className={`form-control ${otherGuestError[index]?.firstName ? "is-invalid" : ""}`} maxLength={MAX_NAME_LENGTH} />
                                    {otherGuestError[index]?.firstName && <div className="invalid-feedback">{otherGuestError[index]?.firstName}</div>}
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label">Last Name</label>
                                    <input type="text" name="lastName" onChange={(e) => handleGuestChange(e, index)} value={item.lastName} placeholder="Last Name" className={`form-control ${otherGuestError[index]?.lastName ? "is-invalid" : ""}`} maxLength={MAX_NAME_LENGTH} />
                                    {otherGuestError[index]?.lastName && <div className="invalid-feedback">{otherGuestError[index]?.lastName}</div>}
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label">Gender</label>
                                    <div>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" checked={item.gender === "male"} type="radio" onChange={(e) => handleGuestChange(e, index)} name={`gender_${index}`} id={`male_${index}`} value="male" />
                                            <label className="form-check-label" htmlFor={`male_${index}`}>Male</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" checked={item.gender === "female"} type="radio" onChange={(e) => handleGuestChange(e, index)} name={`gender_${index}`} id={`female_${index}`} value="female" />
                                            <label className="form-check-label" htmlFor={`female_${index}`}>Female</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Special Requests */}
            <div className="checkout-form-card">
                <h5 className="checkout-section-title">Special Requests</h5>
                <p className="checkout-section-subtitle">Let us know if you have any preferences (optional)</p>
                <p className="small text-muted mb-2">
                    Special requests cannot be guaranteed — we&apos;ll do our best to fulfill them.
                </p>
                <textarea
                    className="form-control w-100"
                    rows={4}
                    name="requests"
                    value={formData.requests}
                    onChange={handleChange}
                    placeholder="Please write your requests in English..."
                ></textarea>
            </div>

            {/* Secure Payment */}
            <div className="checkout-form-card payment-info-card">
                <h5 className="checkout-section-title checkout-section-title-accent">
                    <IoLockClosedOutline className="checkout-title-icon" aria-hidden="true" />
                    Secure Payment Method
                </h5>
                <p className="checkout-section-subtitle">
                    {paymentMethod === 'bank'
                        ? 'Pay via direct bank transfer using the account details below.'
                        : 'Pay safely with your debit or credit card via our secure gateway.'}
                </p>

                <div className="payment-method-options">
                    <button
                        type="button"
                        className={`payment-method-option ${paymentMethod === 'bank' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('bank')}
                    >
                        <span className="payment-method-icon-container">
                            <BsBank2 className="payment-method-icon" aria-hidden="true" />
                        </span>
                        <div className="payment-method-option-content">
                            <span className="payment-method-option-title">Bank Transfer</span>
                            <span className="payment-method-option-desc">Direct wire</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        className={`payment-method-option ${paymentMethod === 'card' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                    >
                        <span className="payment-method-icon-container">
                            <IoCardOutline className="payment-method-icon" aria-hidden="true" />
                        </span>
                        <div className="payment-method-option-content">
                            <span className="payment-method-option-title">Credit / Debit Card</span>
                            <span className="payment-method-option-desc">Visa · MC · Amex</span>
                        </div>
                    </button>
                </div>

                {paymentMethod === 'card' && (
                    <p className="payment-info-note">
                        <IoShieldCheckmarkOutline aria-hidden="true" />
                        All card details are encrypted and processed through a secure payment gateway.
                    </p>
                )}

                {paymentMethod === 'bank' && (
                    <div className="bank-details-card">
                        <div className="bank-details-heading">
                            <BsBank2 aria-hidden="true" />
                            <strong>Our Bank Account Details</strong>
                        </div>
                        <div className="bank-details-row">
                            <span>Account Title</span>
                            <strong>{bankInfo.accountName}</strong>
                        </div>
                        <div className="bank-details-row">
                            <span>Account Number</span>
                            <strong>{bankInfo.accountNumber}</strong>
                        </div>
                        <div className="bank-details-row">
                            <span>Sort Code</span>
                            <strong>{bankInfo.sortcode}</strong>
                        </div>
                        <div className="bank-details-note">
                            <MdVerified aria-hidden="true" />
                            <span>
                                After completing the bank transfer, please send the payment receipt to{' '}
                                <strong>info@example.com</strong> with your booking reference.
                                Your booking will be confirmed within <strong>24 hours</strong> of payment verification.
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Terms & Confirm */}
            <div className="checkout-form-card checkout-submit-card">
                <div className="terms-check">
                    <div className="form-check">
                        <input
                            className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
                            type="checkbox"
                            name="terms"
                            id="terms"
                            checked={formData.terms}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="terms">
                            I agree to the <Link target='_blank' href="/terms-and-conditions">terms and conditions</Link>.
                        </label>
                        {errors.terms && (
                            <div className="text-danger small mt-1">{errors.terms}</div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCheckout}
                    className="btn-confirm-booking"
                    disabled={loading}
                >
                    <IoLockClosedOutline aria-hidden="true" />
                    {loading ? 'Processing...' : 'Confirm & Secure Booking'}
                </button>
            </div>

        </div>
    )
}
