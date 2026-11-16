'use client'
import React, { useState, useEffect } from 'react'
import { Select } from "@mantine/core";
import { buildCountryOptions, resolvePhoneAutofill, matchCountryOption, applyCountrySelection } from '@/util/phoneAutofill';
import { DUPLICATE_NAME_MESSAGE, findDuplicateNameIndices } from '@/util/guestNameValidation';
import { TiDeleteOutline } from "react-icons/ti";
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader';
import { useCurrency } from '@/util/currency';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { IoShieldCheckmarkOutline, IoCopyOutline, IoCheckmarkCircleOutline, IoInformationCircleOutline, IoTicketOutline } from 'react-icons/io5';
import { FaUniversity, FaCreditCard, FaLock, FaShieldAlt, FaPlaneDeparture, FaHotel, FaBed, FaSuitcase, FaWheelchair, FaBabyCarriage, FaBicycle, FaWalking, FaGolfBall, FaUsers, FaPlus } from 'react-icons/fa';
import { FiGitBranch } from 'react-icons/fi';
import { MdNavigation } from 'react-icons/md';
import { PiSuitcaseRolling } from 'react-icons/pi';
import Link from 'next/link';
import LeadDetail from '@/components/LeadDetail/LeadDetail';
import Autocomplete from "react-google-autocomplete";
import LocationPicker from './LocationPicker';
import LocationMapModal from './LocationMapModal';
import { useJsApiLoader } from '@react-google-maps/api';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { formatTransferServiceValue } from '@/util/formatTransferServiceValue';
import { isTransferProvider } from '@/util/transferProviders';
import { playfair, inter } from '@/lib/fonts';
import styles from "./CheckoutTransfer.module.css";

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

export default function CheckoutTransfer({ transferDetail, selectedExtras = [], onSelectedExtrasChange }) {
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const { currency, rates } = useCurrency();
    const [totalPersons, setTotalPersons] = useState({ adults: 0 });
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
        flightNumber: "",
    });
    const [bookingOptionDetails, setBookingOptionDetails] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(null); // 'bank_transfer' | 'stripe'
    const [copiedField, setCopiedField] = useState(null);

    // Reset bank_transfer selection if provider is not custom (name or code)
    useEffect(() => {
        if (paymentMethod === 'bank_transfer' && !isTransferProvider(transferDetail?.provider, 'custom')) {
            setPaymentMethod(null);
        }
    }, [transferDetail?.provider]);

    // Location states
    const [pickupLocation, setPickupLocation] = useState({
        address: transferDetail?.searchParams?.pickupLocation || '',
        lat: Number(transferDetail?.searchParams?.pickupLatitude ?? transferDetail?.searchParams?.fromLat) || null,
        lng: Number(transferDetail?.searchParams?.pickupLongitude ?? transferDetail?.searchParams?.fromLng) || null,
    });
    const [dropoffLocation, setDropoffLocation] = useState({
        address: transferDetail?.searchParams?.dropoffLocation || '',
        lat: Number(transferDetail?.searchParams?.dropoffLatitude ?? transferDetail?.searchParams?.toLat) || null,
        lng: Number(transferDetail?.searchParams?.dropoffLongitude ?? transferDetail?.searchParams?.toLng) || null,
    });
    const [mapModal, setMapModal] = useState({
        isOpen: false,
        type: null, // 'pickup' or 'dropoff'
        initialLocation: null
    });

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
    });

    // Check if pickup or dropoff is an airport (selected location or original search)
    const isAirportTransfer = () => {
        const locations = [
            pickupLocation?.address,
            dropoffLocation?.address,
            transferDetail?.searchParams?.pickupLocation,
            transferDetail?.searchParams?.dropoffLocation,
        ];
        return locations.some((loc) => (loc || '').toLowerCase().includes('airport'));
    };

    const bankInfo = {
        accountName: "Royalane travel Ltd",
        accountNumber: "58516868",
        // iban: "GB29NWBK60161331926819",
        sortcode: "309950",
        // branch: "London Branch",
    };

    useEffect(() => {
        setTotalPersons({
            adults: Math.max((transferDetail?.vehicle_details?.passenger_capacity || 0) - 1, 0),
        });

        // Initialize location states from transferDetail
        if (transferDetail?.searchParams) {
            const sp = transferDetail.searchParams;
            setPickupLocation({
                address: sp.pickupLocation || '',
                lat: Number(sp.pickupLatitude ?? sp.fromLat) || null,
                lng: Number(sp.pickupLongitude ?? sp.fromLng) || null,
            });
            setDropoffLocation({
                address: sp.dropoffLocation || '',
                lat: Number(sp.dropoffLatitude ?? sp.toLat) || null,
                lng: Number(sp.dropoffLongitude ?? sp.toLng) || null,
            });
        }
    }, [transferDetail]);

    useEffect(() => {
        const callCurrencyAPI = async () => {
            if (!transferDetail?.id) return;
            var APiCurrency = currency;
            if (Object.keys(rates).length === 1) {
                APiCurrency = transferDetail?.currency;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/checkout/currency`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model_id: transferDetail?.id,
                        type: "transfer",
                        display_currency: APiCurrency,
                        model_currency: transferDetail?.currency,
                    }),
                });
                const data = await response.json();
                if (data?.success) {
                    setCurrencyKey(data?.data?.uuid);
                }
            } catch (error) {
                console.error("Error calling currency API:", error);
            }
        };

        callCurrencyAPI();
    }, [currency, transferDetail?.id]);

    const countryOptions = buildCountryOptions();
    // ---- Handle field change ----
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === "checkbox" ? checked : value;

        if (name === "phone" && typeof finalValue === "string") {
            const resolved = resolvePhoneAutofill(finalValue, countryOptions, {
                country: formData.country,
                phoneCode: formData.phoneCode,
            });
            setFormData((prev) => ({
                ...prev,
                phone: resolved.phone || "",
                ...(resolved.phoneCode ? { phoneCode: resolved.phoneCode } : {}),
                ...(resolved.country ? { country: resolved.country } : {}),
            }));
        } else {
            setFormData({
                ...formData,
                [name]: finalValue,
            });
        }

        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
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

    // ---- Handle country selection ----
    const handleCountryChange = (value) => {
        const applied = applyCountrySelection(value, countryOptions, formData.phone);
        setFormData({
            ...formData,
            country: applied.country,
            phoneCode: applied.phoneCode,
            phone: applied.phone,
        });

        if (errors.country) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated.country;
                return updated;
            });
        }
    };

    const handleCountryAutofillBlur = (e) => {
        const typed = e?.target?.value;
        if (!typed || formData.country === typed) return;
        const matched = matchCountryOption(typed, countryOptions);
        if (matched) handleCountryChange(matched.value);
    };

    // ---- Validation ----
    const validateForm = () => {
        const newErrors = {};
        const otherGuestErrors = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.title) newErrors.title = "Please select a title.";
        if (!formData.firstName) newErrors.firstName = "First name is required.";
        if (!formData.lastName) newErrors.lastName = "Last name is required.";
        if (!formData.email) {
            newErrors.email = "Email is required.";
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
        if (!pickupLocation.address || !pickupLocation.address.trim()) {
            newErrors.pickupLocation = "Pickup location is required.";
        }
        if (!dropoffLocation.address || !dropoffLocation.address.trim()) {
            if (transferDetail?.searchParams?.transferType !== 'all-round') {
                newErrors.dropoffLocation = "Dropoff location is required.";
            }
        }
        if (isAirportTransfer() && !formData.flightNumber.trim()) {
            newErrors.flightNumber = "Flight number is required for airport transfers.";
        }
        // if (!formData.cardNumber) newErrors.cardNumber = "Card number is required.";
        // if (!formData.expiry) newErrors.expiry = "Expiry date is required.";
        // if (!formData.cvv) newErrors.cvv = "CVV is required.";
        if (!formData.terms) newErrors.terms = "You must agree to terms.";

        const allGuests = [
            { firstName: formData.firstName, lastName: formData.lastName },
            ...otherGuestDetail,
        ];
        const duplicateIndices = findDuplicateNameIndices(allGuests);
        if (duplicateIndices.has(0)) {
            newErrors.firstName = DUPLICATE_NAME_MESSAGE;
            newErrors.lastName = DUPLICATE_NAME_MESSAGE;
        }

        if (otherGuestDetail.length > 0) {
            otherGuestDetail.forEach((guest, index) => {
                const guestErrors = {};
                if (!guest.firstName.trim()) {
                    guestErrors.firstName = "First name is required";
                }
                if (!guest.lastName.trim()) {
                    guestErrors.lastName = "Last name is required";
                }
                if (duplicateIndices.has(index + 1)) {
                    guestErrors.firstName = DUPLICATE_NAME_MESSAGE;
                    guestErrors.lastName = DUPLICATE_NAME_MESSAGE;
                }
                otherGuestErrors[index] = guestErrors;
            });

            setOtherGuestError(otherGuestErrors);
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
        const value = e.target.value;

        // Normalize gender field
        if (field.startsWith("gender_")) {
            field = "gender";
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
        if (!paymentMethod) {
            notifications.show({ title: 'Payment Method Required', message: 'Please select a payment method to continue.', autoClose: 3000, color: 'yellow' });
            return;
        }
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
        const packageCurrency = transferDetail?.currency || 'GBP';
        const extrasTotal = (selectedExtras || []).reduce(
            (sum, extra) => sum + Number(extra?.amount || 0) * Number(extra?.units || 1),
            0
        );
        const grandTotal =
            Number(transferDetail?.fare || 0) * Number(transferDetail?.quantity || 1) + extrasTotal;

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
        const searchParams = transferDetail?.searchParams || {};
        const searchCriteria = transferDetail?.search_criteria || {};
        const location = transferDetail?.locations?.[0] || {};
        const direction = transferDetail?.direction ;

        const selectedTransfer = {
            id: transferDetail?.id,
            rate_key: transferDetail?.id,
            fare: transferDetail?.fare,
            origin_fare: transferDetail?.origin_fare,
            currency: transferDetail?.currency,
            direction,
            trip_type: transferDetail?.trip_type || searchParams?.transferType,
            provider: transferDetail?.provider,
            vehicle: transferDetail?.vehicle || transferDetail?.vehicle_details?.name,
            search_criteria: searchCriteria,
            locations: transferDetail?.locations || [],
            selected_extras: selectedExtras || [],
            cancel_policy: transferDetail?.cancel_policy ,
            cancellation_policies: transferDetail?.cancellation_policies,
        };

        const request = {
            provider: transferDetail?.provider,
            payment_method: paymentMethod,
            currency_uuid: currencyKey,
            lead_title: formData?.title,
            lead_first_name: formData?.firstName,
            lead_last_name: formData?.lastName,
            email: formData?.email,
            phone_number: `${formData?.phoneCode || ''}${formData?.phone || ''}`,
            country: formData?.country,
            address: formData?.address,
            gender: formData?.gender,
            flight_number: formData.flightNumber || '',
            transfer_detail_direction: direction,
            special_request: formData.requests || '',
            passengers: Number(
                searchParams?.passengers ||
                searchCriteria?.passengers ||
                transferDetail?.paxes_distribution?.total ||
                1
            ),
            transfer_type: searchParams?.transferType || transferDetail?.trip_type || 'one-way',
            pickup_date: searchParams?.pickupDate || searchCriteria?.pickup_date,
            pickup_time: searchParams?.pickupTime || searchCriteria?.pickup_time,
            pickup_location: pickupLocation.address || searchParams?.pickupLocation || searchCriteria?.pickup_location,
            dropoff_location: dropoffLocation.address || searchParams?.dropoffLocation || searchCriteria?.dropoff_location,
            booked_qty: transferDetail?.quantity || 1,
            exact_pickup_point: pickupLocation.address || '',
            exact_dropoff_point: dropoffLocation.address || '',
            guest_details: NewOtherPassenger,
            selected_transfers: [selectedTransfer],
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            if (response?.success) {
                await new Promise(resolve => setTimeout(resolve, 800));
                setConfirmStatus("reserve");
                if (paymentMethod === 'bank_transfer') {
                    setConfirmStatus("success");
                    setTimeout(() => {
                        setLoading(false);
                        router.push(`/transfers/voucher/${response?.data?.invoice_number}`);
                    }, 800);
                } else {
                    await handlePayment(response?.data);
                }
            } else {
                setLoaderError(response?.Description);
                setConfirmStatus("error");
                setTimeout(() => {
                    setLoading(false);
                    notifications.show({
                        title: response.Title,
                        message: response?.Description,
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
            'invoice_number': data?.invoice_number,
            'success_url': `${domain}/transfers/voucher/${data?.invoice_number}`,
            'cancel_url': `${checkoutUrl}`
        }
        localStorage.setItem('lead_details_fill', JSON.stringify(formData));
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify(request),
            });
            const response = await res.json();
            if (response?.success) {
                setConfirmStatus("payment");
                setTimeout(() => {
                    setLoading(false);
                    router.push(response?.data?.checkout_url);
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

    const copyToClipboard = (text, field) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedField(field);
                setTimeout(() => setCopiedField(null), 2000);
            }).catch(() => fallbackCopy(text, field));
        } else {
            fallbackCopy(text, field);
        }
    };

    const fallbackCopy = (text, field) => {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        try {
            document.execCommand('copy');
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
        document.body.removeChild(el);
    };

    const convertPassengers = (list) => {
        return list.map((item) => ({
            first_name: item.firstName,
            last_name: item.lastName,
            gender: item.gender,
        }));
    };
    // Handle location picker changes
    const handlePickupLocationChange = (locationData) => {
        setPickupLocation(locationData);
        if (errors.pickupLocation) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated.pickupLocation;
                return updated;
            });
        }
    };

    const handleDropoffLocationChange = (locationData) => {
        setDropoffLocation(locationData);
        if (errors.dropoffLocation) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated.dropoffLocation;
                return updated;
            });
        }
    };

    // Handle map modal
    const handleOpenMap = (type, currentLocation) => {
        setMapModal({
            isOpen: true,
            type,
            initialLocation: currentLocation
        });
    };

    const handleMapSelectLocation = (locationData) => {
        if (mapModal.type === 'pickup') {
            handlePickupLocationChange(locationData);
        } else if (mapModal.type === 'dropoff') {
            handleDropoffLocationChange(locationData);
        }
    };

    const handleCloseMap = () => {
        setMapModal({
            isOpen: false,
            type: null,
            initialLocation: null
        });
    };

    const availableExtras = Array.isArray(transferDetail?.extras) ? transferDetail.extras : [];
    // Each extra service is capped individually by the vehicle's max passenger capacity
    const maxExtraUnits = Math.max(
        Number(transferDetail?.vehicle_details?.passenger_capacity || 0),
        1
    );

    const getExtraMetaParts = (extra) => {
        const parts = [];
        if (extra?.weight_kg) parts.push(extra.weight_kg);
        if (extra?.age) parts.push(extra.age);
        if (extra?.description) parts.push(extra.description);
        return parts;
    };

    const getExtraIcon = (extra) => {
        const key = `${extra?.name || ''} ${extra?.type || ''} ${extra?.code || ''}`.toLowerCase();
        if (/suit|bag|luggage|case/.test(key) && !/bike|golf/.test(key)) return PiSuitcaseRolling;
        if (/wheel/.test(key)) return FaWheelchair;
        if (/push|pram|stroller|baby/.test(key)) return FaBabyCarriage;
        if (/bike|bicycle/.test(key)) return FaBicycle;
        if (/golf/.test(key)) return FaGolfBall;
        if (/walk|frame|mobility/.test(key)) return FaWalking;
        return FaSuitcase;
    };

    const getSelectedExtra = (code) =>
        (selectedExtras || []).find((item) => item.code === code);

    const setExtraUnits = (extra, nextUnits) => {
        if (!onSelectedExtrasChange) return;
        const code = extra?.code;
        const units = Math.max(0, Math.min(Number(nextUnits) || 0, maxExtraUnits));
        const withoutCurrent = (selectedExtras || []).filter((item) => item.code !== code);

        if (units <= 0) {
            onSelectedExtrasChange(withoutCurrent);
            return;
        }

        onSelectedExtrasChange([
            ...withoutCurrent,
            {
                ...extra,
                units,
            },
        ]);
    };

    // Render map modal component
    const renderMapModal = () => {
        const params = transferDetail?.searchParams || {};
        const isPickup = mapModal.type === 'pickup';
        const restrictCity = isPickup
            ? (params.pickupLocation || '')
            : (params.dropoffLocation || '');
        const restrictLat = Number(
            isPickup
                ? (params.pickupLatitude ?? params.fromLat)
                : (params.dropoffLatitude ?? params.toLat)
        ) || null;
        const restrictLng = Number(
            isPickup
                ? (params.pickupLongitude ?? params.fromLng)
                : (params.dropoffLongitude ?? params.toLng)
        ) || null;

        return (
            <LocationMapModal
                isOpen={mapModal.isOpen}
                onClose={handleCloseMap}
                locationdata={params}
                onSelectLocation={handleMapSelectLocation}
                initialLocation={mapModal.initialLocation}
                title={isPickup ? 'Select Pickup Location' : 'Select Dropoff Location'}
                restrictCity={restrictCity}
                restrictLat={restrictLat}
                restrictLng={restrictLng}
            />
        );
    };

    return (

        <div className={styles.formWrapper}>
            <LeadDetail setFormData={setFormData} />
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Transfer"
                />
            )}

            {/* Map Modal + Route locations */}
            {isLoaded ? (
                <>
                    {renderMapModal()}
                    {(() => {
                        const params = transferDetail?.searchParams || {};
                        const pickupParts = splitPlace(pickupLocation.address || params.pickupLocation);
                        const dropoffParts = splitPlace(dropoffLocation.address || params.dropoffLocation);
                        const services = Array.isArray(transferDetail?.service_information)
                            ? transferDetail.service_information
                            : [];
                        const timeService = services.find((s) =>
                            /time|duration|trftime/i.test(`${s?.id || ''} ${s?.name || ''}`),
                        );
                        const distanceService = services.find((s) =>
                            /distance|km|mileage/i.test(`${s?.id || ''} ${s?.name || ''}`),
                        );
                        const journeyMeta = [
                            distanceService ? `approx. ${formatTransferServiceValue(distanceService)}` : null,
                            timeService ? `${formatTransferServiceValue(timeService)} non-stop` : null,
                        ].filter(Boolean).join(' · ');

                        const pickupPickerProps = {
                            value: pickupLocation.address,
                            onChange: handlePickupLocationChange,
                            error: errors.pickupLocation,
                            placeholder: params.pickupLocation
                                ? `Search in ${params.pickupLocation}…`
                                : 'Enter pickup location',
                            onOpenMap: (name, location) => handleOpenMap('pickup', location),
                            name: 'pickup',
                            restrictCity: params.pickupLocation || '',
                            restrictLat: Number(params.pickupLatitude ?? params.fromLat) || null,
                            restrictLng: Number(params.pickupLongitude ?? params.fromLng) || null,
                        };

                        const dropoffPickerProps = {
                            value: dropoffLocation.address,
                            onChange: handleDropoffLocationChange,
                            error: errors.dropoffLocation,
                            placeholder: params.dropoffLocation
                                ? `Search in ${params.dropoffLocation}…`
                                : 'Enter dropoff location',
                            onOpenMap: (name, location) => handleOpenMap('dropoff', location),
                            name: 'dropoff',
                            restrictCity: params.dropoffLocation || '',
                            restrictLat: Number(params.dropoffLatitude ?? params.toLat) || null,
                            restrictLng: Number(params.dropoffLongitude ?? params.toLng) || null,
                        };

                        return (
                            <>
                                {/* Desktop: Route & Flight Protocol */}
                                <div className={`${styles.formCard} ${styles.locationFormCard} ${styles.protocolCard} ${styles.desktopOnly} ${inter.className}`}>
                                    <section className={`${styles.section} ${styles.locationSection}`}>
                                        <div className={styles.protocolHeader}>
                                            <div className={styles.protocolHeaderLeft}>
                                                <span className={styles.protocolHeaderIcon} aria-hidden="true">
                                                    <FiGitBranch />
                                                </span>
                                                <h2 className={`${styles.protocolTitle} ${playfair.className}`}>
                                                    Route &amp; Flight Protocol
                                                </h2>
                                            </div>
                                            <span className={styles.protocolBadge}>Direct Transit</span>
                                        </div>

                                        <div className={styles.protocolNotice}>
                                            <IoInformationCircleOutline size={18} aria-hidden="true" />
                                            <p>
                                                <strong>Dispatch Notice:</strong> Enter your exact airport
                                                terminal or hotel tower. Real-time driver allocation links
                                                directly to specified gates within searched route jurisdiction.
                                            </p>
                                        </div>

                                        <div className={styles.protocolFields}>
                                            <LocationPicker
                                                {...pickupPickerProps}
                                                variant="protocol"
                                                tone="pickup"
                                                label="Pickup Point (Origin)"
                                                leadingIcon={<FaPlaneDeparture />}
                                            />
                                            <LocationPicker
                                                {...dropoffPickerProps}
                                                variant="protocol"
                                                tone="dropoff"
                                                label="Dropoff Sanctuary (Destination)"
                                                leadingIcon={<FaHotel />}
                                            />

                                            {isAirportTransfer() && (
                                                <div className={styles.protocolFlight}>
                                                    <label className={styles.protocolFlightLabel} htmlFor="flightNumber">
                                                        Inbound Flight Number (Optional — for automated radar tracking)
                                                        <span className={styles.required}>*</span>
                                                    </label>
                                                    <div className={styles.protocolFlightRow}>
                                                        <span className={styles.protocolFlightIcon} aria-hidden="true">
                                                            <IoTicketOutline />
                                                        </span>
                                                        <input
                                                            id="flightNumber"
                                                            type="text"
                                                            name="flightNumber"
                                                            value={formData.flightNumber}
                                                            onChange={handleChange}
                                                            className={`${styles.protocolFlightInput} ${errors.flightNumber ? styles.inputError : ""}`}
                                                            placeholder="e.g., SV 124, BA123"
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                    {errors.flightNumber && (
                                                        <p className={styles.errorText}>{errors.flightNumber}</p>
                                                    )}
                                                    <p className={styles.protocolFlightHint}>
                                                        Complimentary flight delay buffer applies automatically.
                                                        Chauffeurs adjust pickup to touchdown time.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* Mobile: Terminal Coordinates */}
                                <div className={`${styles.formCard} ${styles.terminalCard} ${styles.mobileOnly} ${inter.className}`}>
                                    <div className={styles.terminalHeader}>
                                        <h2 className={styles.terminalTitle}>Terminal Coordinates</h2>
                                        <span className={styles.terminalNavIcon} aria-hidden="true">
                                            <MdNavigation />
                                        </span>
                                    </div>

                                    <div className={styles.terminalBlock}>
                                        <div className={styles.terminalMetaRow}>
                                            <span className={`${styles.terminalDot} ${styles.terminalDotPickup}`} aria-hidden="true">
                                                <FaPlaneDeparture />
                                            </span>
                                            <div className={styles.terminalMetaText}>
                                                <span className={styles.terminalMetaLabel}>Pickup Origin</span>
                                                <p className={styles.terminalMetaTitle}>
                                                    {pickupParts.title || 'Pickup location'}
                                                </p>
                                                {pickupParts.subtitle && (
                                                    <p className={styles.terminalMetaSub}>{pickupParts.subtitle}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.terminalEdit}>
                                            <LocationPicker
                                                {...pickupPickerProps}
                                                hideLabel
                                                showActions
                                                variant="protocol"
                                                tone="pickup"
                                                label="Pickup"
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.terminalConnector}>
                                        <span className={styles.terminalConnectorLine} aria-hidden="true" />
                                        {journeyMeta && (
                                            <p className={styles.terminalConnectorText}>{journeyMeta}</p>
                                        )}
                                    </div>

                                    <div className={styles.terminalBlock}>
                                        <div className={styles.terminalMetaRow}>
                                            <span className={`${styles.terminalDot} ${styles.terminalDotDrop}`} aria-hidden="true">
                                                <FaBed />
                                            </span>
                                            <div className={styles.terminalMetaText}>
                                                <span className={styles.terminalMetaLabel}>Dropoff Destination</span>
                                                <p className={styles.terminalMetaTitle}>
                                                    {dropoffParts.title || 'Dropoff location'}
                                                </p>
                                                {dropoffParts.subtitle && (
                                                    <p className={styles.terminalMetaSub}>{dropoffParts.subtitle}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.terminalEdit}>
                                            <LocationPicker
                                                {...dropoffPickerProps}
                                                hideLabel
                                                showActions
                                                variant="protocol"
                                                tone="dropoff"
                                                label="Dropoff"
                                            />
                                        </div>
                                    </div>

                                    {isAirportTransfer() && (
                                        <div className={styles.protocolFlight}>
                                            <label className={styles.protocolFlightLabel} htmlFor="flightNumberMobile">
                                                Inbound Flight Number
                                                <span className={styles.required}>*</span>
                                            </label>
                                            <div className={styles.protocolFlightRow}>
                                                <span className={styles.protocolFlightIcon} aria-hidden="true">
                                                    <IoTicketOutline />
                                                </span>
                                                <input
                                                    id="flightNumberMobile"
                                                    type="text"
                                                    name="flightNumber"
                                                    value={formData.flightNumber}
                                                    onChange={handleChange}
                                                    className={`${styles.protocolFlightInput} ${errors.flightNumber ? styles.inputError : ""}`}
                                                    placeholder="e.g., SV 124"
                                                    autoComplete="off"
                                                />
                                            </div>
                                            {errors.flightNumber && (
                                                <p className={styles.errorText}>{errors.flightNumber}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </>
            ) : (
                <div className={`${styles.formCard} ${styles.locationFormCard}`}>
                    <section className={`${styles.section} ${styles.locationSection}`}>
                        <h2 className={`${styles.protocolTitle} ${playfair.className}`}>
                            Route &amp; Flight Protocol
                        </h2>
                        <div className={styles.loadingLocations}>
                            <div className="spinner-border spinner-border-sm text-primary" role="status" />
                            <span>Loading map services...</span>
                        </div>
                    </section>
                </div>
            )}

            {/* Extra Services */}
            {availableExtras.length > 0 && (
                <div className={`${styles.formCard} ${styles.extrasCard} ${inter.className}`}>
                    <section className={`${styles.section} ${styles.extrasSection}`}>
                        <div className={styles.extrasHeader}>
                            <div className={styles.extrasHeaderText}>
                                <h2 className={`${styles.extrasTitle} ${playfair.className}`}>
                                    <span className={styles.extrasTitleDesktop}>
                                        Tailored Luggage &amp; Mobility Extras
                                    </span>
                                    <span className={styles.extrasTitleMobile}>
                                        Mobility &amp; Extras
                                    </span>
                                </h2>
                                <p className={styles.extrasDesc}>
                                    <span className={styles.extrasDescDesktop}>
                                        Personalize your journey. All items handled with care by your private chauffeur.
                                    </span>
                                    <span className={styles.extrasDescMobile}>
                                        Selected items are guaranteed in the luggage bay.
                                    </span>
                                </p>
                            </div>
                            <span className={styles.extrasCapacityBadge}>
                                <span className={styles.extrasBadgeDesktop}>Max Capacity: {maxExtraUnits}</span>
                                <span className={styles.extrasBadgeMobile}>Bespoke</span>
                            </span>
                        </div>

                        <div className={styles.extrasList}>
                            {availableExtras.map((extra) => {
                                const selected = getSelectedExtra(extra.code);
                                const units = Number(selected?.units || 0);
                                const isSelected = units > 0;
                                const metaParts = getExtraMetaParts(extra);
                                const unitPrice = Number(extra.amount || 0);
                                const Icon = getExtraIcon(extra);
                                const isFree = !unitPrice;
                                const metaLabel = metaParts[0] || null;

                                return (
                                    <div
                                        key={extra.code}
                                        className={`${styles.extraItem} ${isSelected ? styles.extraItemActive : ''}`}
                                    >
                                        {/* Desktop card layout */}
                                        <div className={styles.extraDesktop}>
                                            <div className={styles.extraTopRow}>
                                                <span className={styles.extraIconWrap} aria-hidden="true">
                                                    <Icon />
                                                </span>
                                                {isSelected && (
                                                    <span className={styles.extraSelectedTag}>Selected</span>
                                                )}
                                            </div>
                                            <div className={styles.extraBody}>
                                                <p className={styles.extraName}>
                                                    {extra.name || extra.type}
                                                </p>
                                                <p className={styles.extraPriceLine}>
                                                    {isFree ? (
                                                        'Free'
                                                    ) : (
                                                        <>
                                                            <PriceDisplay
                                                                price={unitPrice}
                                                                currency={transferDetail?.currency}
                                                            />{' '}
                                                            per unit
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <div className={styles.extraFooter}>
                                                <span className={styles.extraQtyLabel}>Quantity</span>
                                                <div className={styles.extraStepper}>
                                                    <button
                                                        type="button"
                                                        className={styles.extraStepperBtn}
                                                        onClick={() => setExtraUnits(extra, units - 1)}
                                                        disabled={units <= 0}
                                                        aria-label={`Decrease ${extra.name || 'extra'} units`}
                                                    >
                                                        −
                                                    </button>
                                                    <span className={styles.extraStepperValue}>{units}</span>
                                                    <button
                                                        type="button"
                                                        className={`${styles.extraStepperBtn} ${styles.extraStepperBtnPlus}`}
                                                        onClick={() => setExtraUnits(extra, units + 1)}
                                                        disabled={units >= maxExtraUnits}
                                                        aria-label={`Increase ${extra.name || 'extra'} units`}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mobile card layout */}
                                        <div className={styles.extraMobile}>
                                            <div className={styles.extraMobileTop}>
                                                <span className={styles.extraIconWrap} aria-hidden="true">
                                                    <Icon />
                                                </span>
                                                <span className={`${styles.extraMobilePrice} ${isFree ? styles.extraMobilePriceFree : ''}`}>
                                                    {isFree ? (
                                                        'Free'
                                                    ) : (
                                                        <>
                                                            +
                                                            <PriceDisplay
                                                                price={unitPrice}
                                                                currency={transferDetail?.currency}
                                                            />
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                            <div className={styles.extraBody}>
                                                <p className={styles.extraName}>
                                                    {extra.name || extra.type}
                                                </p>
                                                {metaLabel && (
                                                    <p className={styles.extraMetaText}>{metaLabel}</p>
                                                )}
                                            </div>
                                            <div className={styles.extraStepperPill}>
                                                <button
                                                    type="button"
                                                    className={styles.extraStepperBtn}
                                                    onClick={() => setExtraUnits(extra, units - 1)}
                                                    disabled={units <= 0}
                                                    aria-label={`Decrease ${extra.name || 'extra'} units`}
                                                >
                                                    −
                                                </button>
                                                <span className={styles.extraStepperValue}>{units}</span>
                                                <button
                                                    type="button"
                                                    className={`${styles.extraStepperBtn} ${styles.extraStepperBtnPlus}`}
                                                    onClick={() => setExtraUnits(extra, units + 1)}
                                                    disabled={units >= maxExtraUnits}
                                                    aria-label={`Increase ${extra.name || 'extra'} units`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}

            {/* Lead Guest Info */}
            <div className={`${styles.formCard} ${styles.leadCard} ${inter.className}`}>
                <section className={`${styles.section} ${styles.leadSection}`}>
                    <div className={styles.leadHeader}>
                        <div className={styles.leadHeaderText}>
                            <h2 className={`${styles.leadTitle} ${playfair.className}`}>
                                <span className={styles.leadTitleDesktop}>Lead Passenger Identification</span>
                                <span className={styles.leadTitleMobile}>Lead Passenger</span>
                            </h2>
                            <p className={styles.leadDesc}>
                                Official travel manifesto data. Must match passport or government ID
                                presented upon greeting.
                            </p>
                        </div>
                        <span className={styles.leadBadge}>Primary Contact</span>
                    </div>

                    {(() => {
                        const selectedCountry = countryOptions.find(
                            (c) => c.value === formData.country || c.label === formData.country,
                        );
                        const flagEmoji = selectedCountry?.cca2
                            ? selectedCountry.cca2
                                .toUpperCase()
                                .replace(/./g, (char) =>
                                    String.fromCodePoint(127397 + char.charCodeAt()),
                                )
                            : '';

                        return (
                            <div className={styles.leadGrid}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Title <span className={styles.required}>*</span>
                                    </label>
                                    <select
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`${styles.leadInput} ${styles.leadSelect} ${errors.title ? styles.inputError : ''}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="MR">Mr</option>
                                        <option value="MRS">Mrs</option>
                                    </select>
                                    {errors.title && <p className={styles.errorText}>{errors.title}</p>}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Gender <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.leadGenderGroup} role="radiogroup" aria-label="Gender">
                                        <label
                                            className={`${styles.leadGenderOption} ${formData.gender === 'male' ? styles.leadGenderActive : ''}`}
                                            htmlFor="leadRadio1"
                                        >
                                            <input
                                                checked={formData.gender === 'male'}
                                                type="radio"
                                                onChange={handleChange}
                                                name="gender"
                                                id="leadRadio1"
                                                value="male"
                                            />
                                            Male
                                        </label>
                                        <label
                                            className={`${styles.leadGenderOption} ${formData.gender === 'female' ? styles.leadGenderActive : ''}`}
                                            htmlFor="leadRadio2"
                                        >
                                            <input
                                                checked={formData.gender === 'female'}
                                                type="radio"
                                                onChange={handleChange}
                                                name="gender"
                                                id="leadRadio2"
                                                value="female"
                                            />
                                            Female
                                        </label>
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        First Name <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={`${styles.leadInput} ${errors.firstName ? styles.inputError : ''}`}
                                        placeholder="First Name"
                                        autoComplete="off"
                                    />
                                    {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Last Name <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={`${styles.leadInput} ${errors.lastName ? styles.inputError : ''}`}
                                        placeholder="Last Name"
                                        autoComplete="off"
                                    />
                                    {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Email <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`${styles.leadInput} ${errors.email ? styles.inputError : ''}`}
                                        placeholder="you@example.com"
                                        autoComplete="off"
                                    />
                                    {errors.email && <p className={styles.errorText}>{errors.email}</p>}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Phone Number <span className={styles.required}>*</span>
                                    </label>
                                    <div className={`${styles.leadPhoneGroup} ${errors.phone ? styles.phoneGroupError : ''}`}>
                                        <span className={styles.leadPhoneCode}>
                                            {flagEmoji && <span aria-hidden="true">{flagEmoji}</span>}
                                            <span>{formData.phoneCode || '+__'}</span>
                                        </span>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            onKeyDown={(e) => {
                                                if (e.ctrlKey || e.metaKey || e.altKey) return;
                                                if (
                                                    !/[0-9+]/.test(e.key) &&
                                                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className={`${styles.leadInput} ${styles.leadPhoneInput} ${errors.phone ? styles.inputError : ''}`}
                                            placeholder="123456789"
                                            autoComplete="tel"
                                            inputMode="tel"
                                        />
                                    </div>
                                    {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Address <span className={styles.required}>*</span>
                                    </label>
                                    <Autocomplete
                                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                                        placeholder="House No. / Street "
                                        className={`${styles.leadInput} ${errors.address ? styles.inputError : ''}`}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        onPlaceSelected={handlePlaceSelected}
                                        options={{
                                            types: ['geocode', 'establishment'],
                                        }}
                                    />
                                    {errors.address && <p className={styles.errorText}>{errors.address}</p>}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Country <span className={styles.required}>*</span>
                                    </label>
                                    <Select
                                        placeholder="Select Country"
                                        searchable
                                        data={countryOptions}
                                        value={formData.country || null}
                                        limit={50}
                                        onChange={handleCountryChange}
                                        onBlur={handleCountryAutofillBlur}
                                        inputProps={{
                                            autoComplete: 'country-name',
                                            name: 'country',
                                        }}
                                        error={errors.country}
                                        classNames={{
                                            root: styles.leadSelectRoot,
                                            input: styles.leadMantineInput,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </section>
            </div>
            
            <div className={`${styles.formCard} ${styles.guestCard} ${inter.className}`}>
                <div className={styles.guestSection}>
                    <div className={styles.guestSectionHeader}>
                        <div className={styles.guestHeaderText}>
                            <h2 className={`${styles.guestMainTitle} ${playfair.className}`}>
                                Additional Guests Traveling
                            </h2>
                            <p className={styles.guestMainDesc}>
                                Register accompanying companions for pilgrimage border clearance &amp; group hotel reception.
                            </p>
                        </div>
                        <button type="button" onClick={handleGuestAdd} className={styles.addGuestBtn}>
                            <FaPlus size={12} aria-hidden="true" />
                            Add Companion
                        </button>
                    </div>
                    {otherGuestDetail.map((item, index) => (
                        <div key={index} className={styles.guestBlock}>
                            <div className={styles.guestHeader}>
                                <div className={styles.guestTitleRow}>
                                    <span className={styles.guestPeopleIcon} aria-hidden="true">
                                        <FaUsers />
                                    </span>
                                    <h3 className={styles.guestTitle}>Passenger {index + 2} Details</h3>
                                    {(item.type === 'CH' || item.type === 'IN') && (
                                        <span className={styles.guestBadge}>{item.type === 'CH' ? 'Child' : 'Infant'}</span>
                                    )}
                                </div>
                                <span className={styles.guestFareNote}>Standard Fare Included</span>
                                <button
                                    type="button"
                                    onClick={() => handleGuestRemove(index)}
                                    className={styles.removeGuestBtn}
                                    aria-label={`Remove passenger ${index + 2}`}
                                >
                                    <TiDeleteOutline size={20} />
                                </button>
                            </div>
                            <div className={styles.fieldGridThree}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        First Name <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        onChange={(e) => handleGuestChange(e, index)}
                                        value={item.firstName}
                                        placeholder="First Name"
                                        className={`${styles.guestInput} ${otherGuestError[index]?.firstName ? styles.inputError : ""}`}
                                    />
                                    {otherGuestError[index]?.firstName && (
                                        <p className={styles.errorText}>{otherGuestError[index]?.firstName}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Last Name <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        onChange={(e) => handleGuestChange(e, index)}
                                        value={item.lastName}
                                        placeholder="Last Name"
                                        className={`${styles.guestInput} ${otherGuestError[index]?.lastName ? styles.inputError : ""}`}
                                    />
                                    {otherGuestError[index]?.lastName && (
                                        <p className={styles.errorText}>{otherGuestError[index]?.lastName}</p>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.leadLabel}>
                                        Gender <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.leadGenderGroup}>
                                        <label
                                            className={`${styles.leadGenderOption} ${item.gender === "male" ? styles.leadGenderActive : ""}`}
                                            htmlFor={`male_${index}`}
                                        >
                                            <input
                                                checked={item.gender === "male"}
                                                type="radio"
                                                onChange={(e) => handleGuestChange(e, index)}
                                                name={`gender_${index}`}
                                                id={`male_${index}`}
                                                value="male"
                                            />
                                            Male
                                        </label>
                                        <label
                                            className={`${styles.leadGenderOption} ${item.gender === "female" ? styles.leadGenderActive : ""}`}
                                            htmlFor={`female_${index}`}
                                        >
                                            <input
                                                checked={item.gender === "female"}
                                                type="radio"
                                                onChange={(e) => handleGuestChange(e, index)}
                                                name={`gender_${index}`}
                                                id={`female_${index}`}
                                                value="female"
                                            />
                                            Female
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Special Requests */}
            <div className={`${styles.formCard} ${styles.protocolRequestCard} ${inter.className}`}>
                <section className={`${styles.section} ${styles.protocolRequestSection}`}>
                    <div className={styles.protocolRequestHeader}>
                        <div>
                            <h2 className={`${styles.protocolRequestTitle} ${playfair.className}`}>
                                <span className={styles.protocolRequestTitleDesktop}>
                                    Chauffeur Special Protocol Instructions
                                </span>
                                <span className={styles.protocolRequestTitleMobile}>
                                    Chauffeur Protocol
                                </span>
                            </h2>
                            <p className={styles.protocolRequestDesc}>
                                <span className={styles.protocolRequestDescDesktop}>
                                    Custom preferences provided to your assigned driver prior to terminal dispatch.
                                </span>
                                <span className={styles.protocolRequestDescMobile}>
                                    Specify silent cabin preference, interior ambient climate, or private meeting signs.
                                </span>
                            </p>
                        </div>
                        <span className={styles.protocolRequestBadge}>Optional</span>
                    </div>
                    <textarea
                        className={styles.protocolRequestTextarea}
                        rows={4}
                        name="requests"
                        value={formData.requests}
                        onChange={handleChange}
                        placeholder="Please write your requests in English (optional, e.g. child seat preferences, quiet ride, meet inside terminal)"
                    />
                    <p className={styles.protocolRequestNote}>
                        <IoInformationCircleOutline size={14} aria-hidden="true" />
                        Special requests cannot be guaranteed unconditionally, but our concierge protocol will make every attempt to accommodate.
                    </p>
                </section>
            </div>

            {/* Payment Method Selection */}
            {(() => {
                const extrasTotalPay = (selectedExtras || []).reduce(
                    (sum, extra) => sum + Number(extra?.amount || 0) * Number(extra?.units || 1),
                    0,
                );
                const totalPay =
                    Number(transferDetail?.fare || 0) * Number(transferDetail?.quantity || 1) + extrasTotalPay;
                const payCurrency = transferDetail?.currency;

                return (
                    <div className={`${styles.formCard} ${styles.payCard} ${inter.className}`}>
                        <section className={`${styles.section} ${styles.paySection}`}>
                            <div className={styles.payHeader}>
                                <div className={styles.payHeaderLeft}>
                                    <span className={styles.payHeaderIcon} aria-hidden="true">
                                        <FaCreditCard />
                                    </span>
                                    <div>
                                        <h2 className={`${styles.payTitle} ${playfair.className}`}>Payment Method</h2>
                                        <p className={styles.paySubtitleMobile}>Stripe 256-bit Encrypted Vault</p>
                                    </div>
                                </div>
                                <span className={styles.paySslBadge}>
                                    <FaLock size={11} aria-hidden="true" />
                                    <span className={styles.paySslDesktop}>256-Bit SSL Encrypted</span>
                                    <span className={styles.paySslMobile} aria-hidden="true" />
                                </span>
                            </div>

                            <div className={`${styles.paymentOptions} ${!isTransferProvider(transferDetail?.provider, 'custom') ? styles.paymentOptionsSingle : ''}`}>
                                {isTransferProvider(transferDetail?.provider, 'custom') && (
                                    <div
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`${styles.paymentOption} ${paymentMethod === 'bank_transfer' ? styles.paymentOptionActive : ''}`}
                                    >
                                        <div className={styles.paymentOptionRow}>
                                            <span className={`${styles.payRadio} ${paymentMethod === 'bank_transfer' ? styles.payRadioActive : ''}`} />
                                            <div className={`${styles.paymentIcon} ${paymentMethod === 'bank_transfer' ? styles.paymentIconActive : styles.paymentIconInactive}`}>
                                                <FaUniversity size={18} />
                                            </div>
                                            <div>
                                                <div className={styles.paymentOptionTitle}>Bank Transfer</div>
                                                <div className={styles.paymentOptionDesc}>Pay directly to our bank account</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div
                                    onClick={() => setPaymentMethod('stripe')}
                                    className={`${styles.paymentOption} ${paymentMethod === 'stripe' ? styles.paymentOptionActive : ''}`}
                                >
                                    <div className={styles.paymentOptionRow}>
                                        <span className={`${styles.payRadio} ${paymentMethod === 'stripe' ? styles.payRadioActive : ''}`} />
                                        <div>
                                            <div className={styles.paymentOptionTitle}>Debit / Credit Card</div>
                                            <div className={styles.paymentOptionDesc}>Instant dispatch authorization via Stripe</div>
                                        </div>
                                        <div className={styles.payBrandRow} aria-hidden="true">
                                            <span className={styles.payBrand}>VISA</span>
                                            <span className={styles.payBrand}>MC</span>
                                            <span className={styles.payBrand}>AMEX</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {paymentMethod === 'bank_transfer' && (
                                <div className={styles.paymentDetailBox}>
                                    <div className={styles.paymentDetailHeader}>
                                        <FaUniversity size={16} className={styles.paymentDetailHeaderIcon} />
                                        <span>Bank Account Details</span>
                                    </div>
                                    <div className={styles.bankGrid}>
                                        <div>
                                            <div className={styles.bankFieldLabel}>Account Name</div>
                                            <div className={styles.bankFieldValue}>
                                                <span>{bankInfo.accountName}</span>
                                                <button type="button" className={styles.copyBtn} onClick={() => copyToClipboard(bankInfo.accountName, 'accountName')} title="Copy">
                                                    {copiedField === 'accountName' ? <IoCheckmarkCircleOutline size={16} className={styles.copySuccess} /> : <IoCopyOutline size={15} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <div className={styles.bankFieldLabel}>Account Number</div>
                                            <div className={styles.bankFieldValue}>
                                                <span>{bankInfo.accountNumber}</span>
                                                <button type="button" className={styles.copyBtn} onClick={() => copyToClipboard(bankInfo.accountNumber, 'accountNumber')} title="Copy">
                                                    {copiedField === 'accountNumber' ? <IoCheckmarkCircleOutline size={16} className={styles.copySuccess} /> : <IoCopyOutline size={15} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <div className={styles.bankFieldLabel}>Sort Code</div>
                                            <div className={styles.bankFieldValue}>
                                                <span>{bankInfo.sortcode}</span>
                                                <button type="button" className={styles.copyBtn} onClick={() => copyToClipboard(bankInfo.sortcode, 'sortcode')} title="Copy">
                                                    {copiedField === 'sortcode' ? <IoCheckmarkCircleOutline size={16} className={styles.copySuccess} /> : <IoCopyOutline size={15} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.paymentAlert}>
                                        <strong>Important:</strong> After completing your bank transfer, please send the payment proof to our support team. Your booking will be confirmed once payment is verified.
                                    </div>
                                    <div className={styles.termsRow}>
                                        <input
                                            className={`${styles.termsCheckbox} ${errors.terms ? "is-invalid" : ""}`}
                                            type="checkbox"
                                            name="terms"
                                            checked={formData.terms}
                                            onChange={handleChange}
                                            id="transfer-terms-bank"
                                        />
                                        <label className={styles.termsLabel} htmlFor="transfer-terms-bank">
                                            I agree to the <Link target='_blank' href="/terms-and-conditions" className={styles.termsLink}>terms and conditions</Link>.
                                        </label>
                                    </div>
                                    {errors.terms && <p className={styles.errorText}>{errors.terms}</p>}
                                    <div className={styles.submitBtnWrap}>
                                        <button type="button" onClick={handleCheckout} className={styles.paySubmitBtn} disabled={loading}>
                                            <FaUniversity />
                                            {loading ? 'Processing...' : 'Reserve Now'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'stripe' && (
                                <div className={styles.paymentDetailBox}>
                                    <div className={styles.payPreauthNote}>
                                        <IoShieldCheckmarkOutline size={16} aria-hidden="true" />
                                        <span>Funds pre-authorized only. Settled upon terminal pickup. You will be redirected to Stripe to enter card details.</span>
                                    </div>
                                    <div className={styles.termsRow}>
                                        <input
                                            className={`${styles.termsCheckbox} ${errors.terms ? "is-invalid" : ""}`}
                                            type="checkbox"
                                            name="terms"
                                            checked={formData.terms}
                                            onChange={handleChange}
                                            id="transfer-terms-stripe"
                                        />
                                        <label className={styles.termsLabel} htmlFor="transfer-terms-stripe">
                                            I agree to the <Link target='_blank' href="/terms-and-conditions" className={styles.termsLink}>terms and conditions</Link>.
                                        </label>
                                    </div>
                                    {errors.terms && <p className={styles.errorText}>{errors.terms}</p>}

                                    {/* <div className={styles.payTotalRow}>
                                        <div>
                                            <span className={styles.payTotalLabel}>Total Payable</span>
                                            <p className={styles.payTotalHint}>VAT &amp; taxes included</p>
                                        </div>
                                        <p className={`${styles.payTotalValue} ${playfair.className}`}>
                                            <PriceDisplay price={totalPay} currency={payCurrency} />
                                        </p>
                                    </div> */}

                                    <div className={styles.submitBtnWrap}>
                                        <button type="button" onClick={handleCheckout} className={styles.paySubmitBtn} disabled={loading}>
                                            <FaLock />
                                            {loading ? 'Processing...' : (
                                                <>
                                                    Confirm &amp; Pay{' '}
                                                    <PriceDisplay price={totalPay} currency={payCurrency} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className={styles.payLegalNote}>
                                        By confirming, you authorize the designated transfer reservation under protected booking terms.
                                    </p>
                                </div>
                            )}

                            {!paymentMethod && (
                                <p className={styles.paymentHint}>
                                    Please select a payment method above to continue.
                                </p>
                            )}
                        </section>
                    </div>
                );
            })()}
        </div>

    )
}
