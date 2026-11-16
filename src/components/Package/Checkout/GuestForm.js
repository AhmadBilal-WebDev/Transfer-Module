'use client'
import React, { useState, useEffect } from 'react'
import { countryListLocal } from '@/util/CountryList'
import { Select } from "@mantine/core"
import { TiDeleteOutline } from "react-icons/ti"
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import PackageBookingLoader from '@/components/Loader/PackageBookingLoader'
import { useCurrency } from '@/util/currency'
import { ConvertPrice } from '@/components/Currency/ConvertPrice'
import LeadDetail from '@/components/LeadDetail/LeadDetail'
import Autocomplete from "react-google-autocomplete"
import { BiUser, BiUserPlus, BiCreditCard, BiLock } from 'react-icons/bi'
import { BsBank } from 'react-icons/bs'
import { MdVerified, MdOutlineCalendarMonth } from 'react-icons/md'
import Link from 'next/link'

const MAX_NAME_LENGTH = 35
const MAX_EMAIL_LENGTH = 200

export default function GuestForm({
    packageDetail,
    servicesTotal,
    selectedServices,
    expandedRooms,
    withoutBedTotal,
    hideSubmit = false,
    formId = 'package-checkout-form',
    styles: s = {},
    onLoadingChange,
}) {
    const [errors, setErrors] = useState({})
    const router = useRouter()
    const { currency, rates } = useCurrency()
    const [totalPersons, setTotalPersons] = useState({ adults: 0, children: 0, infants: 0 })
    const [otherGuestDetail, setOtherGuestDetail] = useState([])
    const [otherGuestError, setOtherGuestError] = useState([])
    const [loading, setLoading] = useState(false)
    const [loaderError, setLoaderError] = useState("")
    const [confirmStatus, setConfirmStatus] = useState("pending")
    const [bookingForMyself, setBookingForMyself] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState('card')
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
    })

    const bankInfo = {
        accountName: "Royalane Ltd",
        accountNumber: "58516868",
        sortcode: "309950",
    }

    useEffect(() => {
        onLoadingChange?.(loading)
    }, [loading, onLoadingChange])

    useEffect(() => {
        const totals = packageDetail?.selected_rooms ? packageDetail?.selected_rooms.reduce(
            (acc, item) => {
                acc.adults += Number(item.adults)
                acc.children += Number(item.children)
                acc.infants += Number(item.infants)
                return acc
            },
            { adults: 0, children: 0, infants: 0 }
        ) : [{ adults: 0, children: 0, infants: 0 }]
        const updatedTotals = {
            ...totals,
            adults: Math.max(totals.adults - 1, 0)
        }

        setTotalPersons(updatedTotals)
    }, [packageDetail])

    const countryOptions = countryListLocal.item.map((item) => ({
        label: item.name.common,
        value: item.name.common,
        code: item.idd?.root && item.idd?.suffixes?.length
            ? item.idd.root + item.idd.suffixes[0]
            : item.idd?.root,
    }))

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        let nextValue = type === "checkbox" ? checked : value
        if (name === "firstName" || name === "lastName") {
            nextValue = nextValue.slice(0, MAX_NAME_LENGTH)
        } else if (name === "email") {
            nextValue = nextValue.slice(0, MAX_EMAIL_LENGTH)
        }
        setFormData({
            ...formData,
            [name]: nextValue,
        })

        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev }
                delete updated[name]
                return updated
            })
        }
    }

    const handleCountryChange = (value) => {
        const selected = countryOptions.find((c) => c.value === value)
        setFormData({
            ...formData,
            country: value,
            phoneCode: selected?.code || "",
        })

        if (errors.country) {
            setErrors((prev) => {
                const updated = { ...prev }
                delete updated.country
                return updated
            })
        }
    }

    const handlePlaceSelected = (place) => {
        if (!place || !place.formatted_address) return

        const address = place.formatted_address
        const countryComponent = place.address_components?.find(
            (component) => component.types.includes("country")
        )

        if (countryComponent) {
            const countryName = countryComponent.long_name
            const matchedCountry = countryOptions.find(
                (c) => c.value === countryName || c.label === countryName
            )

            if (matchedCountry) {
                setFormData({
                    ...formData,
                    address: address,
                    country: matchedCountry.value,
                    phoneCode: matchedCountry.code || "",
                })

                setErrors((prev) => {
                    const updated = { ...prev }
                    delete updated.address
                    delete updated.country
                    return updated
                })
            } else {
                setFormData({
                    ...formData,
                    address: address,
                })

                if (errors.address) {
                    setErrors((prev) => {
                        const updated = { ...prev }
                        delete updated.address
                        return updated
                    })
                }
            }
        } else {
            setFormData({
                ...formData,
                address: address,
            })

            if (errors.address) {
                setErrors((prev) => {
                    const updated = { ...prev }
                    delete updated.address
                    return updated
                })
            }
        }
    }

    // ---- Validation ----
    const normalizeNamePart = (value) =>
        String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ")

    const getFullNameKey = (firstName, lastName) =>
        `${normalizeNamePart(firstName)}|${normalizeNamePart(lastName)}`

    const validateForm = () => {
        const newErrors = {}
        const otherGuestErrors = []
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!formData.title) newErrors.title = "Please select a title."
        if (!formData.firstName) {
            newErrors.firstName = "First name is required."
        } else if (formData.firstName.length > MAX_NAME_LENGTH) {
            newErrors.firstName = `First name must not exceed ${MAX_NAME_LENGTH} characters.`
        }
        if (!formData.lastName) {
            newErrors.lastName = "Last name is required."
        } else if (formData.lastName.length > MAX_NAME_LENGTH) {
            newErrors.lastName = `Last name must not exceed ${MAX_NAME_LENGTH} characters.`
        }
        if (!formData.email) {
            newErrors.email = "Email is required."
        } else if (formData.email.length > MAX_EMAIL_LENGTH) {
            newErrors.email = `Email must not exceed ${MAX_EMAIL_LENGTH} characters.`
        } else if (emailRegex.test(formData.email) === false) {
            newErrors.email = "Please enter a valid email address."
        }
        if (!formData.country) newErrors.country = "Please select a country."
        if (!formData.phone) newErrors.phone = "Phone number is required."
        if (formData.phone) {
            if (formData.phone.length > 15 || formData.phone.length < 6) {
                newErrors.phone = "Phone number must be between 6 and 15 digits."
            }
        }
        if (!formData.address) newErrors.address = "Address is required."
        if (!formData.terms) newErrors.terms = "You must agree to terms."

        const leadFirst = normalizeNamePart(formData.firstName)
        const leadLast = normalizeNamePart(formData.lastName)
        const leadFullKey =
            leadFirst && leadLast ? getFullNameKey(formData.firstName, formData.lastName) : ""
        const seenGuestNames = new Map()

        if (otherGuestDetail.length > 0) {
            otherGuestDetail.forEach((guest, index) => {
                const guestErrors = {}
                const guestFirst = normalizeNamePart(guest.firstName)
                const guestLast = normalizeNamePart(guest.lastName)

                if (!guestFirst) {
                    guestErrors.firstName = "First name is required"
                } else if (guest.firstName.length > MAX_NAME_LENGTH) {
                    guestErrors.firstName = `First name must not exceed ${MAX_NAME_LENGTH} characters`
                }
                if (!guestLast) {
                    guestErrors.lastName = "Last name is required"
                } else if (guest.lastName.length > MAX_NAME_LENGTH) {
                    guestErrors.lastName = `Last name must not exceed ${MAX_NAME_LENGTH} characters`
                }

                if (guestFirst && guestLast) {
                    const guestFullKey = getFullNameKey(guest.firstName, guest.lastName)

                    if (leadFullKey && guestFullKey === leadFullKey) {
                        guestErrors.firstName =
                            "Guest name cannot match the lead passenger"
                        guestErrors.lastName =
                            "Guest name cannot match the lead passenger"
                        newErrors.firstName =
                            "Lead passenger name cannot match an added guest"
                        newErrors.lastName =
                            "Lead passenger name cannot match an added guest"
                    }

                    if (seenGuestNames.has(guestFullKey)) {
                        guestErrors.firstName =
                            "This guest name is already used by another guest"
                        guestErrors.lastName =
                            "This guest name is already used by another guest"
                    } else {
                        seenGuestNames.set(guestFullKey, index)
                    }
                }

                otherGuestErrors[index] = guestErrors
            })

            setOtherGuestError(otherGuestErrors)
        } else {
            setOtherGuestError([])
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0 && otherGuestErrors.every(err => Object.keys(err).length === 0)
    }

    const handleGuestAdd = () => {
        const totalAllowed = totalPersons?.adults + totalPersons?.children + totalPersons?.infants
        const currentAdults = otherGuestDetail.filter(g => g.type === 'AD').length
        const currentChildren = otherGuestDetail.filter(g => g.type === 'CH').length
        const currentInfant = otherGuestDetail.filter(g => g.type === 'IN').length
        if (otherGuestDetail.length >= totalAllowed) {
            return
        }
        setOtherGuestError([])
        if (currentAdults < totalPersons?.adults) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', gender: 'male', type: 'AD' }])
        } else if (currentChildren < totalPersons?.children) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', gender: 'male', type: 'CH' }])
        } else if (currentInfant < totalPersons?.infants) {
            setOtherGuestDetail([...otherGuestDetail, { firstName: '', lastName: '', gender: 'male', type: 'IN' }])
        }
    }

    const handleGuestRemove = (index) => {
        const updatedGuests = otherGuestDetail.filter((_, i) => i !== index)
        setOtherGuestDetail(updatedGuests)
    }

    const handleGuestChange = (e, index) => {
        let field = e.target.name
        let value = e.target.value

        if (field.startsWith("gender_")) {
            field = "gender"
        } else if (field === "firstName" || field === "lastName") {
            value = value.slice(0, MAX_NAME_LENGTH)
        }

        const updatedGuests = [...otherGuestDetail]
        updatedGuests[index][field] = value
        setOtherGuestDetail(updatedGuests)

        const updatedErrors = [...otherGuestError]
        if (updatedErrors[index]?.[field]) {
            updatedErrors[index][field] = ""
            setOtherGuestError(updatedErrors)
        }
    }

    const handleCheckout = async () => {
        if (!validateForm()) return
        setConfirmStatus("pending")
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setConfirmStatus("validate")
        var NewOtherPassenger = {}
        if (otherGuestDetail.length > 0) {
            NewOtherPassenger = convertPassengers(otherGuestDetail)
        }

        const packageCurrency = packageDetail?.currency_code || 'GBP'
        const grandTotal = Number(packageDetail?.total_amount) + servicesTotal

        let customerCurrency = currency
        let customerExchangeRate = 1
        let customerTotalAfterDiscount = grandTotal

        if (currency !== packageCurrency && rates[packageCurrency] && rates[currency]) {
            const conversion = ConvertPrice(grandTotal, packageCurrency, currency, rates)
            customerCurrency = conversion.newcurrency
            customerTotalAfterDiscount = parseFloat(conversion.newprice)
            customerExchangeRate = (rates[currency] / rates[packageCurrency])
        } else {
            customerCurrency = packageCurrency
            customerExchangeRate = 1
            customerTotalAfterDiscount = grandTotal
        }

        const updatedRooms = expandedRooms.map(({ adultsWB, childrenWB, infantsWB, ...rest }) => ({
            ...rest,
            adults_without_bed: adultsWB,
            children_without_bed: childrenWB,
            infants_without_bed: infantsWB
        }))
        const request = {
            package_id: packageDetail?.id,
            lead_title: formData?.title,
            lead_first_name: formData?.firstName,
            lead_last_name: formData?.lastName,
            lead_email: formData?.email,
            lead_address: formData?.address,
            lead_country: formData?.country,
            lead_phone_code: formData?.phoneCode,
            lead_phone: formData?.phone,
            lead_gender: formData?.gender,
            other_passengers: NewOtherPassenger,
            special_request: formData.requests,
            customer_currency: customerCurrency,
            customer_exchange_rate: customerExchangeRate,
            customer_total_after_discount: customerTotalAfterDiscount,
            room_selections: expandedRooms?.length ? updatedRooms : (packageDetail?.selected_rooms || []),
            additional_services: selectedServices || [],
            grand_total_after_discount: customerTotalAfterDiscount,
            payment_method: paymentMethod === 'bank' ? 'bank_transfer' : 'stripe',
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            })
            const response = await res.json()
            if (response?.Success) {
                await new Promise(resolve => setTimeout(resolve, 800))
                setConfirmStatus("reserve")
                localStorage.setItem('lead_details_fill', JSON.stringify(formData))
                if (paymentMethod === 'bank') {
                    setConfirmStatus("success")
                    setTimeout(() => {
                        setLoading(false)
                        router.push(`/${packageDetail?.category?.slug}/voucher/${response?.Content?.booking?.booking_reference}`)
                    }, 800)
                    return
                }
                await handlePayment(response?.Content)
            } else {
                setLoaderError(response?.error?.message || "Booking failed. Please try again.")
                setConfirmStatus("error")
                setTimeout(() => {
                    setLoading(false)
                    notifications.show({
                        title: 'Error',
                        message: response?.error?.message,
                        autoClose: 3500,
                        color: 'red'
                    })
                }, 1000)
            }
        } catch (err) {
            setLoaderError("A network error occurred. Please try again.")
            setConfirmStatus("error")
            setTimeout(() => setLoading(false), 1000)
        }
    }

    const handlePayment = async (data) => {
        const domain = window.location.origin
        const checkoutUrl = window.location
        const request = {
            'booking_reference': data?.booking?.booking_reference,
            'success_url': `${domain}/${packageDetail?.category?.slug}/voucher/${data?.booking?.booking_reference}`,
            'cancel_url': `${checkoutUrl}`
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/payment/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            })
            const response = await res.json()
            if (response?.Success) {
                setConfirmStatus("payment")
                setTimeout(() => {
                    setLoading(false)
                    router.push(response?.Content?.checkout_url)
                }, 800)
            } else {
                setLoaderError(response?.error?.message || "Booking failed. Please try again.")
                setConfirmStatus("error")
                setTimeout(() => {
                    setLoading(false)
                    notifications.show({
                        title: 'Error',
                        message: response?.error?.message,
                        autoClose: 3500,
                        color: 'red'
                    })
                }, 1000)
            }
        } catch (err) {
            setLoaderError("A network error occurred. Please try again.")
            setConfirmStatus("error")
            setTimeout(() => setLoading(false), 1000)
        }
    }

    const handleLoaderComplete = () => {}

    const convertPassengers = (list) => {
        const result = {
            additional_adults: [],
            children_details: [],
            infants_details: [],
        }

        let adultIndex = 2
        let childIndex = 1
        let infantIndex = 1

        list.forEach((item) => {
            const formatted = {
                index: null,
                gender: item.gender,
                last_name: item.lastName,
                first_name: item.firstName,
            }

            if (item.type === "AD") {
                formatted.index = adultIndex++
                result.additional_adults.push(formatted)
            }

            if (item.type === "CH") {
                formatted.index = childIndex++
                result.children_details.push(formatted)
            }

            if (item.type === "IN") {
                formatted.index = infantIndex++
                result.infants_details.push(formatted)
            }
        })

        return result
    }

    const applyLeadDetails = (data) => {
        setFormData({
            ...data,
            firstName: String(data.firstName || "").slice(0, MAX_NAME_LENGTH),
            lastName: String(data.lastName || "").slice(0, MAX_NAME_LENGTH),
            email: String(data.email || "").slice(0, MAX_EMAIL_LENGTH),
        })
    }

    const labelClass = s.formLabel || 'form-label'
    const cardClass = s.formCard || 'rounded border mt-3 p-3'
    const addGuestClass = s.addGuest || 'btn btn-primary btn-sm'
    const termsClass = s.terms || 'form-check mt-4'
    const submitClass = s.submit || 'btn btn-success'

    return (
        <div>
            <LeadDetail setFormData={applyLeadDetails} />
            {loading && (
                <PackageBookingLoader
                    errorMessage={loaderError}
                    showLoader={loading}
                    onComplete={handleLoaderComplete}
                    confirmStatus={confirmStatus}
                    componentName="Package"
                />
            )}

            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault()
                    handleCheckout()
                }}
            >
                <div className={cardClass}>
                    <h5 className={s.formTitle || 'mb-3'}>Who Are We Welcoming?</h5>
                    <p className={s.formSubtitle || 'text-muted small mb-3'}>
                        Tell us who this booking is for.
                    </p>
                    <div className={s.welcomeGrid || 'row g-2'}>
                        <button
                            type="button"
                            className={`${s.welcomeOption || 'btn border text-start'} ${bookingForMyself ? (s.welcomeActive || '') : ''}`}
                            onClick={() => setBookingForMyself(true)}
                        >
                            <BiUser size={22} aria-hidden="true" />
                            <div>
                                <strong>I&apos;m the main guest</strong>
                                <span>Booking for myself</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            className={`${s.welcomeOption || 'btn border text-start'} ${!bookingForMyself ? (s.welcomeActive || '') : ''}`}
                            onClick={() => setBookingForMyself(false)}
                        >
                            <BiUserPlus size={22} aria-hidden="true" />
                            <div>
                                <strong>Booking for someone else</strong>
                                <span>You&apos;re arranging this trip</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className={cardClass}>
                    <h5 className={s.formTitle || 'mb-1'}>Enter Your Information</h5>
                    <p className={s.formSubtitle || 'text-muted small mb-3'}>
                        Details you&apos;ve saved in your profile pre-fill here.
                    </p>

                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className={labelClass}>Title*</label>
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

                        <div className="col-md-4">
                            <label className={labelClass}>First Name*</label>
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

                        <div className="col-md-4">
                            <label className={labelClass}>Last Name*</label>
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
                            <label className={labelClass}>Email Address*</label>
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
                            <label className={labelClass}>Address*</label>
                            <Autocomplete
                                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                                placeholder="House No. / Street / Area"
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
                                <div className="invalid-feedback d-block">{errors.address}</div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className={labelClass}>Select Country*</label>
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

                        <div className="col-md-3">
                            <label className={labelClass}>Code</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.phoneCode || ""}
                                readOnly
                                placeholder="+__"
                            />
                        </div>

                        <div className="col-md-3">
                            <label className={labelClass}>Phone Number*</label>
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
                                        e.preventDefault()
                                    }
                                }}
                                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                                placeholder="123456789"
                                autoComplete="off"
                            />
                            {errors.phone && (
                                <div className="invalid-feedback d-block">{errors.phone}</div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className={labelClass}>Gender*</label>
                            <div>
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

                    <p className="text-muted small mt-3 mb-0">
                        This information will be used for all booking confirmations and
                        communications. Ensure that the name matches travel documents.
                    </p>
                </div>

                <div className={cardClass}>
                    <button type="button" onClick={handleGuestAdd} className={addGuestClass}>
                        + Add New Guest
                    </button>
                    {otherGuestDetail.map((item, index) => (
                        <div key={index} className={s.guestBlock || 'row my-4'}>
                            <div className={s.guestBlockHead || 'col-12 d-flex justify-content-between align-items-center mb-2'}>
                                <h6>
                                    Guest {index + 2}{' '}
                                    {(item.type === 'CH' || item.type === 'IN') && (
                                        <span style={{ fontSize: '12px' }} className="small bg-secondary-subtle rounded px-1 py-1">
                                            {item.type === 'CH' ? 'Child' : 'Infant'}
                                        </span>
                                    )}
                                </h6>
                                <button
                                    type="button"
                                    className={s.removeGuest || 'btn btn-link p-0'}
                                    onClick={() => handleGuestRemove(index)}
                                    aria-label={`Remove guest ${index + 2}`}
                                >
                                    <TiDeleteOutline className="text-danger" size={20} />
                                </button>
                            </div>
                            <div className="row g-3">
                                <div className="col-12 col-md-4">
                                    <label className={labelClass}>First Name</label>
                                    <input type="text" name="firstName" onChange={(e) => handleGuestChange(e, index)} value={item.firstName} placeholder="First Name" className={`form-control ${otherGuestError[index]?.firstName ? "is-invalid" : ""} `} maxLength={MAX_NAME_LENGTH} />
                                    {otherGuestError[index]?.firstName && <div className="invalid-feedback">{otherGuestError[index]?.firstName}</div>}
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className={labelClass}>Last Name</label>
                                    <input type="text" name="lastName" onChange={(e) => handleGuestChange(e, index)} value={item.lastName} placeholder="Last Name" className={`form-control ${otherGuestError[index]?.lastName ? "is-invalid" : ""} `} maxLength={MAX_NAME_LENGTH} />
                                    {otherGuestError[index]?.lastName && <div className="invalid-feedback">{otherGuestError[index]?.lastName}</div>}
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className={labelClass}>Gender*</label>
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

                <div className={cardClass}>
                    <h5 className={s.formTitle || 'mb-1'}>Special Requests</h5>
                    <p className={s.formSubtitle || 'small text-muted mb-3'}>
                        List any operational requirements — we&apos;ll do our best to fulfill them. Special requests cannot be guaranteed.
                    </p>
                    <textarea
                        className="form-control w-100"
                        rows={5}
                        name="requests"
                        value={formData.requests}
                        onChange={handleChange}
                        placeholder="Write your customized request here..."
                    />
                </div>

                <div className={cardClass}>
                    <h5 className={s.formTitle || 'mb-1'}>
                        <BiLock size={18} style={{ color: '#e31c23', marginRight: 8, verticalAlign: 'middle' }} />
                        Secure Payment Method
                    </h5>
                    <p className={s.formSubtitle || 'small text-muted mb-3'}>
                        {paymentMethod === 'bank'
                            ? 'Pay via direct bank transfer using the account details below.'
                            : 'Pay safely with your debit or credit card via our secure gateway.'}
                    </p>

                    <div className={s.payOptionGrid || ''}>
                        <button
                            type="button"
                            className={`${s.payOption || ''} ${paymentMethod === 'card' ? (s.payOptionActive || '') : ''}`}
                            onClick={() => setPaymentMethod('card')}
                        >
                            <div className={s.payOptionIcon || ''}>
                                <BiCreditCard size={20} />
                            </div>
                            <div>
                                <strong>Credit / Debit Card</strong>
                                <span>Visa, Mastercard, Amex &amp; more</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            className={`${s.payOption || ''} ${paymentMethod === 'bank' ? (s.payOptionActive || '') : ''}`}
                            onClick={() => setPaymentMethod('bank')}
                        >
                            <div className={s.payOptionIcon || ''}>
                                <BsBank size={18} />
                            </div>
                            <div>
                                <strong>Bank Transfer</strong>
                                <span>Direct deposit to our account</span>
                            </div>
                        </button>
                    </div>

                    {paymentMethod === 'card' && (
                        <div className={s.stripeBar || 'mt-3 small text-muted'}>
                            <BiLock size={16} />
                            {' '}Secured &amp; powered by <strong style={{ color: '#e31c23' }}>Stripe</strong>
                        </div>
                    )}

                    {paymentMethod === 'bank' && (
                        <div className={s.bankDetails || 'mt-3'}>
                            <div className={s.bankDetailsHead || 'fw-semibold mb-2'}>
                                <BsBank size={16} className="me-2" />
                                Our Bank Account Details
                            </div>
                            <div className={s.bankDetailsRow || 'd-flex justify-content-between mb-1'}>
                                <span>Account Title</span>
                                <strong>{bankInfo.accountName}</strong>
                            </div>
                            <div className={s.bankDetailsRow || 'd-flex justify-content-between mb-1'}>
                                <span>Account Number</span>
                                <strong>{bankInfo.accountNumber}</strong>
                            </div>
                            <div className={s.bankDetailsRow || 'd-flex justify-content-between mb-2'}>
                                <span>Sort Code</span>
                                <strong>{bankInfo.sortcode}</strong>
                            </div>
                            <div className={s.bankDetailsNote || 'small text-muted'}>
                                <MdVerified size={16} className={s.bankDetailsNoteIcon || ''} aria-hidden="true" />
                                <p className={s.bankDetailsNoteText || 'mb-0'}>
                                    After completing the bank transfer, please send the payment receipt to{' '}
                                    <strong>example@royalane.com</strong> with your booking reference.
                                    Your booking will be confirmed within <strong>24 hours</strong> of payment verification.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={s.payTrustList || ''}>
                        <div className={s.trustItem || 'd-flex gap-2 small text-muted mt-3'}>
                            <BiLock size={14} aria-hidden="true" />
                            <span>
                                Encrypted 256-Bit Secure Transaction. Your travel data is protected under strict privacy protocols.
                            </span>
                        </div>
                        <div className={s.trustItem || 'd-flex gap-2 small text-muted mt-2'}>
                            <MdOutlineCalendarMonth size={16} aria-hidden="true" />
                            <span>
                                Review your dates carefully before confirming. Changes may be subject to package terms.
                            </span>
                        </div>
                    </div>
                </div>

                <div className={cardClass}>
                    <div className={termsClass}>
                        <input
                            className={`${errors.terms ? "is-invalid" : ""}`}
                            type="checkbox"
                            name="terms"
                            id="package-terms"
                            checked={formData.terms}
                            onChange={handleChange}
                        />
                        <label htmlFor="package-terms">
                            I agree to the <Link target="_blank" href="/terms-and-conditions">terms and conditions</Link>.
                        </label>
                    </div>
                    {errors.terms && (
                        <div className="text-danger small mt-1">{errors.terms}</div>
                    )}

                    {!hideSubmit && (
                        <button
                            type="submit"
                            disabled={loading}
                            className={submitClass}
                        >
                            <BiLock size={14} aria-hidden="true" />
                            {loading ? 'Processing...' : 'Confirm & Secure Booking'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}
