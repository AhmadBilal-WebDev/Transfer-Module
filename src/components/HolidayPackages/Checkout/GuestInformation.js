'use client'
import React, { useState, useEffect } from 'react'
import { Select } from '@mantine/core';
import { buildCountryOptions, resolvePhoneAutofill, matchCountryOption, applyCountrySelection } from '@/util/phoneAutofill';
import { DUPLICATE_NAME_MESSAGE, findDuplicateNameIndices } from '@/util/guestNameValidation';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useCurrency } from "@/util/currency";
import { DateInput } from '@mantine/dates';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useRouter } from 'next/navigation';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { FaArrowLeft } from 'react-icons/fa';
import styles from './GuestInformation.module.css';

export default function GuestInformation({ packageConfig, Selectedcurrency, calculatedTotal, selectedData, packagePricing, onBack }) {
    const { currency, rates } = useCurrency();
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaderError, setLoaderError] = useState("");
    const [currencyKey, setCurrencyKey] = useState("");
    const [confirmStatus, setConfirmStatus] = useState("pending");
    const router = useRouter();
    const [leadPassenger, setLeadPassenger] = useState({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        dob: null,
        gender: 'male',
        country: '',
        phoneCode: '',
        phone: '',
        // passportNumber: '',
        // passportExpiry: '',
        type: 'adult'
    });
    const [errors, setErrors] = useState({});
    const [termsAccepted, setTermsAccepted] = useState(false);

    const countryOptions = buildCountryOptions();
    useEffect(() => {
        if (packageConfig?.searchData?.totalGuests) {
            const passengerList = [];
            let passengerId = 1;
            const { adults, children } = packageConfig?.searchData?.totalGuests;
            // Count passenger types
            const counts = { adult: adults || 0, child: children || 0, infant: 0 };

            // Skip first adult as it's the lead passenger
            if (counts.adult > 0) {
                for (let i = 1; i < counts.adult; i++) {
                    passengerList.push({
                        id: passengerId++,
                        type: 'adult',
                        title: '',
                        firstName: '',
                        lastName: '',
                        gender: 'male',
                        dob: '',
                    });
                }
            }

            // Add children
            if (counts.child > 0) {
                for (let i = 0; i < counts.child; i++) {
                    passengerList.push({
                        id: passengerId++,
                        type: 'child',
                        title: '',
                        firstName: '',
                        lastName: '',
                        gender: 'male',
                        dob: '',
                    });
                }
            }

            // Add infants
            if (counts.infant > 0) {
                for (let i = 0; i < counts.infant; i++) {
                    passengerList.push({
                        id: passengerId++,
                        type: 'infant_without_seat',
                        title: '',
                        firstName: '',
                        lastName: '',
                        gender: 'male',
                        dob: '',
                    });
                }
            }

            setPassengers(passengerList);
        }
    }, [packageConfig]);

    useEffect(() => {
        const callCurrencyAPI = async () => {
            if (!selectedData?.packageInfo?.package_id) return;
            var APiCurrency = currency;
            if (Object.keys(rates).length === 1) {
                APiCurrency = selectedData?.packageInfo?.currency;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/holiday-packages/checkout/currency`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model_id: selectedData?.packageInfo?.package_id,
                        type: "holiday-packages",
                        display_currency: APiCurrency,
                        model_currency: selectedData?.packageInfo?.currency,
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
    }, [currency, selectedData]);


    const getPassengerTypeLabel = (type) => {
        if (type === 'adult') return 'Adult';
        if (type === 'child') return 'Child';
        if (type === 'infant_without_seat') return 'Infant';
        return type;
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validateField = (name, value, isLeadPassenger = true, passengerData = null) => {
        if (!value || value.trim() === '') {
            return `${name.replace(/([A-Z])/g, ' $1').trim()} is required`;
        }

        if (name === 'email' && isLeadPassenger && !validateEmail(value)) {
            return 'Please enter a valid email address';
        }

        if (name === 'phone') {
            const phoneCode = isLeadPassenger ? leadPassenger.phoneCode : passengerData?.phoneCode;
            const phone = isLeadPassenger ? leadPassenger.phone : passengerData?.phone;

            if (phoneCode && phone) {
                const phoneNumber = isValidPhoneNumber(phoneCode + phone);
                if (!phoneNumber) {
                    return 'Please enter a valid phone number';
                }
            }
        }

        if (name === 'passportNumber' && value.length < 6) {
            return 'Passport number must be at least 6 characters';
        }

        return '';
    };

    const handleLeadPassengerChange = (field, value) => {
        // Only allow alphabets and spaces for name fields
        let finalValue = value;
        if (field === 'firstName' || field === 'lastName') {
            finalValue = value.replace(/[^a-zA-Z\s]/g, '');
        }

        setLeadPassenger(prev => ({ ...prev, [field]: finalValue }));

        // Clear error for this field
        if (errors[`lead_${field}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`lead_${field}`];
                return newErrors;
            });
        }
    };

    const handleLeadCountryChange = (value) => {
        const applied = applyCountrySelection(value, countryOptions, leadPassenger.phone);
        setLeadPassenger(prev => ({
            ...prev,
            country: applied.country,
            phoneCode: applied.phoneCode,
            phone: applied.phone,
        }));

        if (errors['lead_country']) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors['lead_country'];
                return newErrors;
            });
        }
    };

    const handleLeadCountryAutofillBlur = (e) => {
        const typed = e?.target?.value;
        if (!typed || leadPassenger.country === typed) return;
        const matched = matchCountryOption(typed, countryOptions);
        if (matched) handleLeadCountryChange(matched.value);
    };

    const handleLeadPhoneChange = (value) => {
        const resolved = resolvePhoneAutofill(value, countryOptions, {
            country: leadPassenger.country,
            phoneCode: leadPassenger.phoneCode,
        });
        setLeadPassenger(prev => ({
            ...prev,
            phone: resolved.phone || '',
            ...(resolved.phoneCode ? { phoneCode: resolved.phoneCode } : {}),
            ...(resolved.country ? { country: resolved.country } : {}),
        }));

        if (errors['lead_phone']) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors['lead_phone'];
                return newErrors;
            });
        }
    };

    const handlePassengerChange = (id, field, value) => {
        // Only allow numbers for phone field
        let finalValue = value;
        if (field === 'phone') {
            finalValue = value.replace(/[^0-9]/g, '');
        } else if (field === 'firstName' || field === 'lastName') {
            // Only allow alphabets and spaces for name fields
            finalValue = value.replace(/[^a-zA-Z\s]/g, '');
        }

        setPassengers(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: finalValue } : p
        ));

        // Clear error for this field
        if (errors[`passenger_${id}_${field}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`passenger_${id}_${field}`];
                return newErrors;
            });
        }
    };

    const handlePassengerCountryChange = (id, value) => {
        setPassengers(prev => prev.map(p => {
            if (p.id !== id) return p;
            const applied = applyCountrySelection(value, countryOptions, p.phone);
            return {
                ...p,
                country: applied.country,
                phoneCode: applied.phoneCode,
                phone: applied.phone,
            };
        }));

        if (errors[`passenger_${id}_country`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`passenger_${id}_country`];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate lead passenger
        const leadFields = ['title', 'firstName', 'lastName', 'email', 'dob', 'gender', 'country', 'phone'];
        leadFields.forEach(field => {
            const error = validateField(field, leadPassenger[field], true);
            if (error) {
                newErrors[`lead_${field}`] = error;
            }
        });

        // Validate other passengers
        passengers.forEach(passenger => {
            const passengerFields = ['title', 'firstName', 'lastName', 'gender', 'dob'];
            passengerFields.forEach(field => {
                const error = validateField(field, passenger[field], false, passenger);
                if (error) {
                    newErrors[`passenger_${passenger.id}_${field}`] = error;
                }
            });
        });

        const allGuests = [leadPassenger, ...passengers];
        const duplicateIndices = findDuplicateNameIndices(allGuests);
        if (duplicateIndices.has(0)) {
            newErrors.lead_firstName = DUPLICATE_NAME_MESSAGE;
            newErrors.lead_lastName = DUPLICATE_NAME_MESSAGE;
        }
        passengers.forEach((passenger, index) => {
            if (duplicateIndices.has(index + 1)) {
                newErrors[`passenger_${passenger.id}_firstName`] = DUPLICATE_NAME_MESSAGE;
                newErrors[`passenger_${passenger.id}_lastName`] = DUPLICATE_NAME_MESSAGE;
            }
        });

        // Validate terms
        if (!termsAccepted) {
            newErrors['terms'] = 'You must accept the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setLoaderError("");
        setLoading(true);
        setConfirmStatus("pending");
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConfirmStatus("validate");
        const otherAdults = passengers.filter(item => item.type === 'adult');
        const otherChilds = passengers.filter(item => item.type === 'child');
        const services = [];
        if (packageConfig?.selectedServices?.hotel) services.push("stay");
        if (packageConfig?.selectedServices?.flight) services.push("flight");
        if (packageConfig?.selectedServices?.transfer) services.push("car");
        var Hotelprice = 0;
        var hotelCurrency = "";
        var Flightprice = 0;
        var flightCurrency = "";
        var Transferprice = 0;
        var transferCurrency = "";

        if (packagePricing?.hotelPrice) {
            const NewPrice = ConvertPrice(packagePricing.hotelPrice, packagePricing.hotelCurrency, currency, rates);
            Hotelprice = parseFloat(NewPrice.newprice);
            hotelCurrency = NewPrice.newcurrency;
        }
        if (packagePricing?.flightPrice) {
            const NewPrice = ConvertPrice(packagePricing.flightPrice, packagePricing.flightCurrency, currency, rates);
            Flightprice = parseFloat(NewPrice.newprice);
            flightCurrency = NewPrice.newcurrency;
        }
        if (packagePricing?.transferPrice) {
            const NewPrice = ConvertPrice(packagePricing.transferPrice, packagePricing.transferCurrency, currency, rates);
            Transferprice = parseFloat(NewPrice.newprice);
            transferCurrency = NewPrice.newcurrency;
        }
        const newroomlist = selectedData?.hotel?.hotelData?.rooms
            ?.filter(item =>
                selectedData?.hotel?.selectedRoom?.some(room => room?.roomId === item.id)
            )
            ?.flatMap(item =>
                item?.rates
                    ?.filter(rate =>
                        selectedData?.hotel?.selectedRoom?.some(
                            room => room?.ratekey === rate.rate_key
                        )
                    )
                    ?.map(rateItem => ({
                        rateKey: rateItem.rate_key,
                        quantity:
                            selectedData?.hotel?.selectedRoom?.find(
                                room => room?.ratekey === rateItem.rate_key
                            )?.qty || 1,
                        price: rateItem.price,
                        currency: rateItem.currency,
                        displayPrice: rateItem.price,
                        displayCurrency: rateItem.currency,
                        roomType: item.name,
                        boardName: rateItem.board_name,
                        adults: rateItem?.adults,
                        children: rateItem?.children,
                    }))
            );
        const domain = window.location.origin;
        const checkoutUrl = window.location;
        const request = {
            "package_id": selectedData?.packageInfo?.package_id,
            "package_context": {
                "package_id": selectedData?.packageInfo?.package_id,
                "services": services,
                "hotel": packageConfig?.selectedServices?.hotel
                    ? {
                        "id": selectedData?.hotel?.hotelData?.hotel_code,
                        "name": selectedData?.hotel?.hotelData?.hotel_name,
                        "city": selectedData?.hotel?.hotelData?.city,
                        "address": selectedData?.hotel?.hotelData?.address,
                        "checkIn": selectedData?.hotel?.hotelData?.checkIn,
                        "provider": selectedData?.hotel?.hotelData?.provider,
                        "checkOut": selectedData?.hotel?.hotelData?.checkOut,
                        "currency": hotelCurrency,
                    }
                    : null,
                "flight": packageConfig?.selectedServices?.flight
                    ? selectedData?.flight || null
                    : null,
                "transfer": packageConfig?.selectedServices?.transfer
                    ? selectedData?.transfer || null
                    : null,
                "searchData": {
                    "leavingFrom": {
                        "city": packageConfig?.selectedServices.flight ? packageConfig?.searchData?.flight?.from : packageConfig?.searchData?.hotel?.location,
                        "countryCode": packageConfig?.selectedServices.flight ? packageConfig?.searchData?.flight?.fromLocation?.countryCode : packageConfig?.searchData?.hotel?.countryCode,
                        "airportCode": packageConfig?.searchData?.flight?.from,
                        "location": packageConfig?.searchData?.flight?.fromLocation?.airportName,
                        "latitude": packageConfig?.searchData?.flight?.fromLocation?.lat,
                        "longitude": packageConfig?.searchData?.flight?.fromLocation?.lng,


                    },
                    "goingTo": {
                        "city": packageConfig?.selectedServices.flight ? packageConfig?.searchData?.flight?.to : packageConfig?.searchData?.hotel?.location,
                        "countryCode": packageConfig?.selectedServices.flight ? packageConfig?.searchData?.flight?.toLocation?.countryCode : packageConfig?.searchData?.hotel?.countryCode,
                        "airportCode": packageConfig?.searchData?.flight?.to,
                        "location": packageConfig?.searchData?.flight?.toLocation?.airportName,
                        "latitude": packageConfig?.searchData?.flight?.toLocation?.lat,
                        "longitude": packageConfig?.searchData?.flight?.toLocation?.lng,
                    },
                    "hotelDestination": {
                        "city": packageConfig?.searchData?.hotel?.city ?? packageConfig?.searchData?.flight?.toLocation?.city,
                        "countryCode": packageConfig?.searchData?.hotel?.countryCode ?? packageConfig?.searchData?.flight?.toLocation?.countryCode,
                        "location": packageConfig?.searchData?.hotel?.location ?? packageConfig?.searchData?.flight?.toLocation?.formattedAddress,
                        "latitude": packageConfig?.searchData?.hotel?.lat ?? packageConfig?.searchData?.flight?.toLocation?.lat,
                        "longitude": packageConfig?.searchData?.hotel?.lng ?? packageConfig?.searchData?.flight?.toLocation?.lng
                    },
                    "hotelDestinationLabel": packageConfig?.searchData?.hotel?.location ?? packageConfig?.searchData?.flight?.toLocation?.formattedAddress,
                    "dates": {
                        "checkIn": packageConfig?.searchData?.dates?.checkIn,
                        "checkOut": packageConfig?.searchData?.dates?.checkOut
                    },
                    "stayDates": {
                        "checkIn": selectedData?.hotel?.hotelData?.checkIn
                            || packageConfig?.searchData?.hotel?.dates?.checkIn
                            || packageConfig?.searchData?.hotel?.dates?.check_in
                            || packageConfig?.searchData?.dates?.checkIn,
                        "checkOut": selectedData?.hotel?.hotelData?.checkOut
                            || packageConfig?.searchData?.hotel?.dates?.checkOut
                            || packageConfig?.searchData?.hotel?.dates?.check_out
                            || packageConfig?.searchData?.dates?.checkOut
                    },
                    "travelers": (() => {
                        const guests = packageConfig?.searchData?.totalGuests || {};
                        const adultCount = Number(guests.adults) || 1;
                        const childCount = Number(guests.children) || 0;
                        const infantCount = Number(guests.infants) || 0;
                        // Prefer totalGuests so flight+transfer (no stay) is not validated
                        // against the default hotel rooms occupancy (2 adults).
                        const roomsFromGuests = [{
                            adults: adultCount,
                            children: childCount,
                            childrenAges: [],
                        }];
                        if (packageConfig?.selectedServices?.hotel) {
                            return {
                                rooms: packageConfig?.searchData?.rooms?.length
                                    ? packageConfig.searchData.rooms
                                    : roomsFromGuests,
                            };
                        }
                        return {
                            simple: {
                                adults: adultCount,
                                children: childCount,
                                childrenAges: [],
                                infantsLap: infantCount,
                                infantAgesLap: [],
                                infantsSeat: 0,
                                infantAgesSeat: [],
                            },
                            rooms: roomsFromGuests,
                        };
                    })(),
                    "economyClass": packageConfig?.searchData?.flight?.cabinClassName,
                    "transferPickup": {
                        "city": selectedData?.transfer?.searchParams?.pickupLocation,
                        "countryCode": packageConfig?.searchData?.flight?.toLocation?.countryCode,
                        "location": selectedData?.transfer?.searchParams?.pickupLocation + ' ' + selectedData?.transfer?.searchParams?.fromCountry,
                        "latitude": selectedData?.transfer?.searchParams?.fromLat,
                        "longitude": selectedData?.transfer?.searchParams?.fromLng,
                        "airportCode": packageConfig?.searchData?.flight?.toLocation?.airportCode
                    },
                    "transferDropoff": {
                        "city": selectedData?.transfer?.searchParams?.pickupLocation,
                        "countryCode": packageConfig?.searchData?.flight?.toLocation?.countryCode,
                        "location": selectedData?.transfer?.searchParams?.pickupLocation + ' ' + selectedData?.transfer?.searchParams?.fromCountry,
                        "latitude": selectedData?.transfer?.searchParams?.fromLat,
                        "longitude": selectedData?.transfer?.searchParams?.fromLng,
                        "airportCode": packageConfig?.searchData?.flight?.toLocation?.airportCode
                    },
                    "transferDates": {
                        "checkIn": packageConfig?.searchData?.transfer?.dates?.pickup
                            || packageConfig?.searchData?.transfer?.dates?.check_in
                            || packageConfig?.searchData?.dates?.checkIn,
                        "checkOut": packageConfig?.searchData?.transfer?.dates?.dropoff
                            || packageConfig?.searchData?.transfer?.dates?.check_out
                            || packageConfig?.searchData?.dates?.checkOut
                    },
                    "currency": Selectedcurrency
                },
                "selectedHotelRooms": packageConfig?.selectedServices?.hotel
                    ? (newroomlist || [])
                    : null,
                "isFromPackageFlow": true,
                "pricing": {
                    "hotel_price": Hotelprice,
                    "flight_price": Flightprice,
                    "transfer_price": Transferprice,
                    "total_price": calculatedTotal,
                    "currency": Selectedcurrency
                },
                "selectedCurrency": Selectedcurrency
            },
            "lead_person": {
                "title": leadPassenger.title,
                "firstName": leadPassenger.firstName,
                "lastName": leadPassenger.lastName,
                "email": leadPassenger.email,
                "dob": leadPassenger.dob,
                "gender": leadPassenger.gender,
                "country": leadPassenger.country,
                "phoneCode": leadPassenger.phoneCode,
                "phone": leadPassenger.phone
            },
            "other_passengers": {
                "additional_adults": otherAdults,
                "children_details": otherChilds
            },
            "booking_source": "website",
            "type": "confirm",
            "booking_type": 1,
            "contact_id": null,
            "success_url": `${domain}/holiday-packages/${selectedData?.packageInfo?.package_id}`,
            "cancel_url": `${checkoutUrl}`,
            "currency_uuid": currencyKey,
            "markup": {
                "enabled": false,
                "type": null,
                "value": 0,
                "amount": 0,
                "price_after_markup": calculatedTotal
            },
        };
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/holiday-packages/booking/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            const data = await response.json();
            if (data?.Success) {
                localStorage.setItem('lead_details_fill', JSON.stringify(leadPassenger));
                await new Promise(resolve => setTimeout(resolve, 800));
                setConfirmStatus("payment");
                router.push(data?.Content?.checkout_url);
            } else {
                setConfirmStatus("error");
                setLoaderError(data?.Description || "Booking failed. Please try again.");
                setTimeout(() => {
                    setLoading(false);
                    notifications.show({
                        title: data?.Title || 'Error',
                        message: data?.Description || "Booking failed. Please try again.",
                        autoClose: 3500,
                        color: 'red'
                    });
                }, 1000);
            }
        } catch (error) {
            setConfirmStatus('error');
            setLoaderError('Something went wrong. Please try again.');
            setTimeout(() => {
                setLoading(false);
                notifications.show({
                    title: 'Error',
                    message: 'Something went wrong. Please try again.',
                    autoClose: 3500,
                    color: 'red'
                });
            }, 1000);
        }
    };

    const handleLoaderComplete = () => {
    };

    return (
        <div className={styles.formWrapper}>
            <LeadDetail setFormData={setLeadPassenger} module="flight" />
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Package"
                />
            )}

            {onBack && (
                <button type="button" onClick={onBack} className={styles.backLink}>
                    <FaArrowLeft />
                    Back to trip review
                </button>
            )}

            <div className={styles.formCard}>
                <div className={styles.passportBanner}>
                    Enter the names exactly as they appear in your passport/ID to avoid check-in complications.
                </div>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Enter Your Information</h2>
                    <p className={styles.sectionDesc}>
                        Please provide correct contact information so we can send booking details and updates.
                    </p>

                    <div className={styles.fieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadTitle" className={styles.label}>
                                Title <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="leadTitle"
                                value={leadPassenger.title}
                                onChange={(e) => handleLeadPassengerChange('title', e.target.value)}
                                className={`${styles.select} ${errors.lead_title ? styles.inputError : ''}`}
                            >
                                <option value="">Select</option>
                                <option value="MR">Mr</option>
                                <option value="MRS">Mrs</option>
                                <option value="MISS">Miss</option>
                                <option value="DR">Dr</option>
                            </select>
                            {errors.lead_title && <p className={styles.errorText}>{errors.lead_title}</p>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadFirstName" className={styles.label}>
                                First Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="leadFirstName"
                                value={leadPassenger.firstName}
                                onChange={(e) => handleLeadPassengerChange('firstName', e.target.value)}
                                className={`${styles.input} ${errors.lead_firstName ? styles.inputError : ''}`}
                                placeholder="First Name"
                            />
                            {errors.lead_firstName && <p className={styles.errorText}>{errors.lead_firstName}</p>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadLastName" className={styles.label}>
                                Last Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="leadLastName"
                                value={leadPassenger.lastName}
                                onChange={(e) => handleLeadPassengerChange('lastName', e.target.value)}
                                className={`${styles.input} ${errors.lead_lastName ? styles.inputError : ''}`}
                                placeholder="Last Name"
                            />
                            {errors.lead_lastName && <p className={styles.errorText}>{errors.lead_lastName}</p>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadEmail" className={styles.label}>
                                Email <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="email"
                                id="leadEmail"
                                value={leadPassenger.email}
                                onChange={(e) => handleLeadPassengerChange('email', e.target.value)}
                                className={`${styles.input} ${errors.lead_email ? styles.inputError : ''}`}
                                placeholder="you@example.com"
                            />
                            {errors.lead_email && <p className={styles.errorText}>{errors.lead_email}</p>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadDob" className={styles.label}>
                                Date of Birth <span className={styles.required}>*</span>
                            </label>
                            <DateInput
                                maxDate={new Date()}
                                placeholder="Date of Birth"
                                clearable="true"
                                error={errors.lead_dob}
                                value={leadPassenger.dob}
                                onChange={(date) => handleLeadPassengerChange('dob', date)}
                                classNames={{ root: styles.dateInput }}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <span className={styles.label}>
                                Gender <span className={styles.required}>*</span>
                            </span>
                            <div className={styles.genderGroup}>
                                <label className={styles.radioLabel} htmlFor="leadMale">
                                    <input
                                        className={styles.radioInput}
                                        type="radio"
                                        name="leadGender"
                                        id="leadMale"
                                        value="male"
                                        checked={leadPassenger.gender === 'male'}
                                        onChange={(e) => handleLeadPassengerChange('gender', e.target.value)}
                                    />
                                    Male
                                </label>
                                <label className={styles.radioLabel} htmlFor="leadFemale">
                                    <input
                                        className={styles.radioInput}
                                        type="radio"
                                        name="leadGender"
                                        id="leadFemale"
                                        value="female"
                                        checked={leadPassenger.gender === 'female'}
                                        onChange={(e) => handleLeadPassengerChange('gender', e.target.value)}
                                    />
                                    Female
                                </label>
                            </div>
                            {errors.lead_gender && <p className={styles.errorText}>{errors.lead_gender}</p>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadCountry" className={styles.label}>
                                Country <span className={styles.required}>*</span>
                            </label>
                            <Select
                                id="leadCountry"
                                placeholder="Select Country"
                                searchable
                                value={leadPassenger.country || null}
                                onChange={handleLeadCountryChange}
                                onBlur={handleLeadCountryAutofillBlur}
                                inputProps={{
                                    autoComplete: "country-name",
                                    name: "country",
                                }}
                                data={countryOptions}
                                limit={50}
                                error={errors.lead_country}
                                classNames={{ root: styles.selectInput }}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="leadPhone" className={styles.label}>
                                Phone Number <span className={styles.required}>*</span>
                            </label>
                            <div className={`${styles.phoneGroup} ${errors.lead_phone ? styles.phoneGroupError : ''}`}>
                                <span className={styles.phonePrefix}>
                                    {leadPassenger.phoneCode || "+__"}
                                </span>
                                <input
                                    type="tel"
                                    id="leadPhone"
                                    name="phone"
                                    value={leadPassenger.phone}
                                    onChange={(e) => handleLeadPhoneChange(e.target.value)}
                                    className={styles.phoneInput}
                                    placeholder="1234567890"
                                    autoComplete="tel"
                                    inputMode="tel"
                                />
                            </div>
                            {errors.lead_phone && <p className={styles.errorText}>{errors.lead_phone}</p>}
                        </div>
                    </div>

                    <p className={styles.sectionNote}>
                        This information will be used for booking confirmations and communications.
                        Ensure the name matches travel documents.
                    </p>
                </section>
            </div>

            {passengers.length > 0 && (
                <div className={styles.formCard}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Other Passengers</h2>
                        <p className={styles.sectionDesc}>
                            {passengers.length} {passengers.length === 1 ? 'passenger' : 'passengers'} on this booking
                        </p>

                        {passengers.map((passenger, index) => (
                            <div key={passenger.id} className={styles.passengerBlock}>
                                <div className={styles.passengerHeader}>
                                    <h3 className={styles.passengerTitle}>Passenger {index + 2}</h3>
                                    <span className={styles.passengerBadge}>{getPassengerTypeLabel(passenger.type)}</span>
                                </div>

                                <div className={styles.fieldGrid}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label}>
                                            Title <span className={styles.required}>*</span>
                                        </label>
                                        <select
                                            value={passenger.title}
                                            onChange={(e) => handlePassengerChange(passenger.id, 'title', e.target.value)}
                                            className={`${styles.select} ${errors[`passenger_${passenger.id}_title`] ? styles.inputError : ''}`}
                                        >
                                            <option value="">Select</option>
                                            <option value="MR">Mr</option>
                                            <option value="MRS">Mrs</option>
                                            <option value="MISS">Miss</option>
                                            <option value="DR">Dr</option>
                                        </select>
                                        {errors[`passenger_${passenger.id}_title`] && (
                                            <p className={styles.errorText}>{errors[`passenger_${passenger.id}_title`]}</p>
                                        )}
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label}>
                                            First Name <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={passenger.firstName}
                                            onChange={(e) => handlePassengerChange(passenger.id, 'firstName', e.target.value)}
                                            placeholder="First Name"
                                            className={`${styles.input} ${errors[`passenger_${passenger.id}_firstName`] ? styles.inputError : ''}`}
                                        />
                                        {errors[`passenger_${passenger.id}_firstName`] && (
                                            <p className={styles.errorText}>{errors[`passenger_${passenger.id}_firstName`]}</p>
                                        )}
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label}>
                                            Last Name <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={passenger.lastName}
                                            onChange={(e) => handlePassengerChange(passenger.id, 'lastName', e.target.value)}
                                            placeholder="Last Name"
                                            className={`${styles.input} ${errors[`passenger_${passenger.id}_lastName`] ? styles.inputError : ''}`}
                                        />
                                        {errors[`passenger_${passenger.id}_lastName`] && (
                                            <p className={styles.errorText}>{errors[`passenger_${passenger.id}_lastName`]}</p>
                                        )}
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label}>
                                            Date of Birth <span className={styles.required}>*</span>
                                        </label>
                                        <DateInput
                                            maxDate={new Date()}
                                            placeholder="Date of Birth"
                                            clearable="true"
                                            error={errors[`passenger_${passenger.id}_dob`]}
                                            value={passenger.dob}
                                            onChange={(date) => handlePassengerChange(passenger.id, 'dob', date)}
                                            classNames={{ root: styles.dateInput }}
                                        />
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <span className={styles.label}>
                                            Gender <span className={styles.required}>*</span>
                                        </span>
                                        <div className={styles.genderGroup}>
                                            <label className={styles.radioLabel} htmlFor={`male_${passenger.id}`}>
                                                <input
                                                    className={styles.radioInput}
                                                    type="radio"
                                                    name={`gender_${passenger.id}`}
                                                    id={`male_${passenger.id}`}
                                                    value="male"
                                                    checked={passenger.gender === 'male'}
                                                    onChange={(e) => handlePassengerChange(passenger.id, 'gender', e.target.value)}
                                                />
                                                Male
                                            </label>
                                            <label className={styles.radioLabel} htmlFor={`female_${passenger.id}`}>
                                                <input
                                                    className={styles.radioInput}
                                                    type="radio"
                                                    name={`gender_${passenger.id}`}
                                                    id={`female_${passenger.id}`}
                                                    value="female"
                                                    checked={passenger.gender === 'female'}
                                                    onChange={(e) => handlePassengerChange(passenger.id, 'gender', e.target.value)}
                                                />
                                                Female
                                            </label>
                                        </div>
                                        {errors[`passenger_${passenger.id}_gender`] && (
                                            <p className={styles.errorText}>{errors[`passenger_${passenger.id}_gender`]}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>
                </div>
            )}

            {packageConfig?.selectedServices?.flight && (
                <div className={styles.formCard}>
                    <div className={styles.importantSection}>
                        <h3 className={styles.importantTitle}>Flight Information</h3>
                        <ul className={styles.importantList}>
                            <li>Arrive at the airport at least 3 hours before international flights.</li>
                            <li>Valid passport and visa (if required) must be presented at check-in.</li>
                            <li>Check-in closes 60 minutes before departure.</li>
                            <li>Baggage allowance is subject to airline terms and conditions.</li>
                            <li>Flight timings may change — confirm with the airline 24 hours before departure.</li>
                        </ul>
                    </div>
                </div>
            )}

            <div className={styles.formCard}>
                <div className={styles.footer}>
                    <div className={styles.termsRow}>
                        <input
                            className={styles.termsCheckbox}
                            type="checkbox"
                            id="terms"
                            checked={termsAccepted}
                            onChange={(e) => {
                                setTermsAccepted(e.target.checked);
                                if (e.target.checked && errors.terms) {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.terms;
                                        return newErrors;
                                    });
                                }
                            }}
                        />
                        <label className={styles.termsLabel} htmlFor="terms">
                            I agree to the{' '}
                            <Link href="/terms-and-conditions" target="_blank" className={styles.termsLink}>
                                terms and conditions
                            </Link>
                            . <span className={styles.required}>*</span>
                        </label>
                    </div>
                    {errors.terms && <p className={styles.errorText}>{errors.terms}</p>}

                    <button onClick={handleSubmit} type="button" className={styles.submitBtn}>
                        Confirm Booking
                    </button>
                </div>
            </div>
        </div>
    )
}
