"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaCloudUploadAlt,
  FaTimesCircle,
  FaCheckCircle,
  FaRegFileAlt,
  FaComments,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import { Select } from "@mantine/core";
import moment from "moment";
import { DateInput } from "@mantine/dates";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CgCalendar } from "react-icons/cg";
import { plusJakarta } from "@/lib/fonts";
import { useCurrency } from "@/util/currency";

function getBookingPickup(booking) {
  return (
    booking?.pickup_location ||
    booking?.booking_criteria?.pickup_location ||
    booking?.from ||
    ""
  );
}

function getBookingDropoff(booking) {
  return (
    booking?.dropoff_location ||
    booking?.booking_criteria?.dropoff_location ||
    booking?.to ||
    ""
  );
}

function getBookingVehicle(booking) {
  return (
    booking?.transfer?.vehicle_name ||
    booking?.vehicle_name ||
    booking?.vehicle ||
    ""
  );
}

function getBookingPax(booking) {
  return (
    booking?.booking_criteria?.pax ||
    booking?.pax ||
    booking?.passengers ||
    booking?.transfer?.max_passenger ||
    ""
  );
}

function getBookingAmount(booking) {
  const currency =
    booking?.pricing?.display_currency ||
    booking?.client_currency ||
    booking?.currency ||
    "";
  const amount =
    booking?.pricing?.booking_amount ??
    booking?.pricing?.display_amount ??
    booking?.total_amount ??
    booking?.amount ??
    null;
  if (amount == null || amount === "") return null;
  const num = Number(amount);
  const formatted = Number.isFinite(num)
    ? num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : String(amount);
  return currency ? `${currency} ${formatted}` : formatted;
}

function getBookingPickupMeta(booking) {
  const dateRaw =
    booking?.booking_criteria?.pickup_date ||
    booking?.pickup_date ||
    booking?.travel_date ||
    booking?.date;
  const timeRaw =
    booking?.booking_criteria?.pickup_time ||
    booking?.pickup_time ||
    booking?.time;
  const datePart = dateRaw ? moment(dateRaw).format("MMM DD") : "";
  const timePart = timeRaw
    ? moment(timeRaw, ["HH:mm:ss", "HH:mm", moment.ISO_8601], true).isValid()
      ? moment(timeRaw, ["HH:mm:ss", "HH:mm", moment.ISO_8601]).format("hh:mm A")
      : String(timeRaw)
    : "";
  if (datePart && timePart) return `${datePart} • ${timePart}`;
  return datePart || timePart || "";
}

export default function MakePaymentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { rates, currency: defaultCurrency } = useCurrency();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [bookingref, setBookingRef] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [currency, setCurrency] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [image, setImage] = useState(null);
  const [date, setDate] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [successSummary, setSuccessSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingids, setBookingIds] = useState([]);
  const [selectedInvoiceLabel, setSelectedInvoiceLabel] = useState(null);
  const fileRef = useRef(null);

  const selectedBooking = useMemo(
    () =>
      bookingids?.find((item) => item.invoice_number === selectedInvoiceLabel) ||
      null,
    [bookingids, selectedInvoiceLabel],
  );

  const currencyOptions = useMemo(
    () =>
      Object.keys(rates || {})
        .sort()
        .map((code) => ({
          value: code,
          label: code,
        })),
    [rates],
  );

  useEffect(() => {
    if (!currency && defaultCurrency) {
      setCurrency(defaultCurrency);
    }
  }, [defaultCurrency, currency]);

  useEffect(() => {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    fetchinvoice();
  }, [session?.user?.email, session?.user?.otp]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const resetFormFields = () => {
    setInvoiceNo("");
    setServiceType("");
    setBookingRef("");
    setTransactionId("");
    setCurrency(defaultCurrency || "");
    setPaymentAmount("");
    setDate(null);
    setSelectedInvoiceLabel(null);
    handleRemoveImage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!invoiceNo) {
      setErrorMessage("Please select an Invoice No.");
      return;
    }
    if (!transactionId) {
      setErrorMessage("Please enter a Transaction ID.");
      return;
    }
    if (!currency) {
      setErrorMessage("Please select a currency.");
      return;
    }
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setErrorMessage("Please enter a valid payment amount.");
      return;
    }
    if (!date) {
      setErrorMessage("Please select a payment date.");
      return;
    }
    if (!image) {
      setErrorMessage("Please upload payment proof before submitting.");
      return;
    }
    setIsSubmitting(true);
    const { email, otp } = session.user;
    try {
      const formtoSendData = new FormData();
      formtoSendData.append("service_id", invoiceNo);
      formtoSendData.append("service_type", serviceType);
      formtoSendData.append("booking_reference", bookingref);
      formtoSendData.append("transaction_id", transactionId);
      formtoSendData.append("currency", currency);
      formtoSendData.append("payment_amount", paymentAmount);
      formtoSendData.append("invoice_snapshot", image);
      formtoSendData.append("payment_date", moment(date).format("YYYY-MM-DD"));
      formtoSendData.append("email", email);
      formtoSendData.append("otp", otp);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/payment-request/create`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formtoSendData,
        },
      );
      const data = await response.json();

      if (!data?.success && data?.message?.toLowerCase().includes("otp")) {
        router.push("/login?expired=1");
        return;
      }

      if (response.ok) {
        setSuccessSummary({
          invoice: bookingref || selectedInvoiceLabel || "—",
          transactionId,
          currency,
          amount: paymentAmount,
          date: date ? moment(date).format("MMM DD, YYYY") : "—",
        });
        setSubmitted(true);
        resetFormFields();
        fetchinvoice();
      } else {
        setErrorMessage(data?.message || "Failed to submit payment. Please try again.");
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingSelect = (value) => {
    if (!value) {
      setInvoiceNo("");
      setBookingRef("");
      setServiceType("");
      setSelectedInvoiceLabel(null);
      return;
    }
    const selected = bookingids?.find((item) => item.invoice_number === value);
    if (!selected) return;
    setInvoiceNo(selected.id);
    setBookingRef(selected?.invoice_number || "");
    setServiceType(selected?.type || "");
    setSelectedInvoiceLabel(value);

    const due = getBookingAmount(selected);
    if (due) {
      const amountOnly =
        selected?.pricing?.booking_amount ??
        selected?.pricing?.display_amount ??
        selected?.total_amount ??
        selected?.amount;
      if (amountOnly != null && amountOnly !== "") {
        setPaymentAmount(String(amountOnly));
      }
      const bookingCurrency =
        selected?.pricing?.display_currency ||
        selected?.client_currency ||
        selected?.currency;
      if (bookingCurrency) setCurrency(bookingCurrency);
    }
  };

  const fetchinvoice = async () => {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/pending-bookings-ids`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        },
      );
      const data = await response.json();
      if (!data?.success && data?.message?.toLowerCase().includes("otp")) {
        router.push("/login?expired=1");
        return;
      }

      setBookingIds(data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const invoiceOptions =
    bookingids
      ?.filter((item) => item.invoice_number)
      .map((item) => {
        const pickup = getBookingPickup(item);
        const dropoff = getBookingDropoff(item);
        const route =
          pickup && dropoff
            ? `${pickup} → ${dropoff}`
            : item.type
              ? String(item.type).replace(/_/g, " ")
              : "";
        return {
          value: item.invoice_number,
          label: route
            ? `${item.invoice_number} — ${route}`
            : `${item.invoice_number}`,
        };
      }) || [];

  const pickup = getBookingPickup(selectedBooking);
  const dropoff = getBookingDropoff(selectedBooking);
  const vehicle = getBookingVehicle(selectedBooking);
  const pax = getBookingPax(selectedBooking);
  const pickupMeta = getBookingPickupMeta(selectedBooking);
  const amountDue = getBookingAmount(selectedBooking);
  const vehicleMeta = [vehicle, pax ? `${pax} pax` : ""].filter(Boolean).join(" • ");

  return (
    <div className={`royalane-pay-page ${plusJakarta.className}`}>
      {!submitted ? (
        <div className="royalane-pay-hero">
          <p className="royalane-pay-eyebrow">Billing</p>
          <h1 className="royalane-pay-title">Make a payment</h1>
          <p className="royalane-pay-subtitle">
            Submit your bank transfer details and a receipt. We&apos;ll confirm it
            against your transfer booking.
          </p>
        </div>
      ) : null}

      {submitted ? (
        <div className="royalane-pay-success" role="status" aria-live="polite">
          <div className="royalane-pay-success-badge" aria-hidden="true">
            <FaCheckCircle size={28} />
          </div>
          <h3>Payment submitted</h3>
          <p>
            Your payment details have been received and are under review. You can
            track status anytime from My payments.
          </p>

          {successSummary ? (
            <dl className="royalane-pay-success-summary">
              <div>
                <dt>Invoice</dt>
                <dd>{successSummary.invoice}</dd>
              </div>
              <div>
                <dt>Transaction ID</dt>
                <dd>{successSummary.transactionId}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>
                  {successSummary.currency}{" "}
                  {Number(successSummary.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
              </div>
              <div>
                <dt>Payment date</dt>
                <dd>{successSummary.date}</dd>
              </div>
            </dl>
          ) : null}

          <div className="royalane-pay-success-actions">
            <button
              type="button"
              className="royalane-pay-submit"
              onClick={() => {
                setSubmitted(false);
                setSuccessSummary(null);
                resetFormFields();
              }}
            >
              Submit another
            </button>
            <Link href="/my-payments" className="royalane-pay-link-btn">
              View my payments
            </Link>
          </div>
        </div>
      ) : (
        <div className="royalane-pay-layout">
          <div className="royalane-pay-card">
            <div className="royalane-pay-card-head">
              <span className="royalane-pay-card-icon" aria-hidden="true">
                <FaRegFileAlt size={16} />
              </span>
              <h2>Payment details</h2>
            </div>

            <form onSubmit={handleSubmit} className="royalane-pay-form">
              <div className="royalane-pay-field">
                <label className="royalane-pay-label" htmlFor="invoice-no">
                  Transfer invoice <span className="royalane-pay-required">*</span>
                </label>
                <Select
                  id="invoice-no"
                  placeholder="Select a transfer invoice..."
                  value={selectedInvoiceLabel}
                  onChange={handleBookingSelect}
                  autoSelectOnBlur
                  searchable
                  clearable
                  size="md"
                  data={invoiceOptions}
                  classNames={{ input: "royalane-pay-mantine-input" }}
                />
              </div>

              <div className="royalane-pay-field">
                <label className="royalane-pay-label" htmlFor="transaction-id">
                  Transaction ID <span className="royalane-pay-required">*</span>
                </label>
                <input
                  id="transaction-id"
                  className="royalane-pay-input"
                  type="text"
                  name="transaction_id"
                  placeholder="e.g. TXN-20261106-00123"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>

              <div className="royalane-pay-row">
                <div className="royalane-pay-field">
                  <label className="royalane-pay-label" htmlFor="currency">
                    Currency <span className="royalane-pay-required">*</span>
                  </label>
                  <Select
                    id="currency"
                    placeholder="Select currency"
                    value={currency || null}
                    onChange={(value) => setCurrency(value || "")}
                    searchable
                    clearable
                    nothingFoundMessage="No currency found"
                    size="md"
                    data={currencyOptions}
                    classNames={{ input: "royalane-pay-mantine-input" }}
                  />
                </div>

                <div className="royalane-pay-field">
                  <label className="royalane-pay-label" htmlFor="payment-amount">
                    Amount <span className="royalane-pay-required">*</span>
                  </label>
                  <input
                    id="payment-amount"
                    className="royalane-pay-input"
                    type="number"
                    name="payment_amount"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="royalane-pay-field">
                  <label className="royalane-pay-label" htmlFor="payment-date">
                    Payment date <span className="royalane-pay-required">*</span>
                  </label>
                  <div className="royalane-pay-date-wrap">
                    <DateInput
                      id="payment-date"
                      value={date}
                      name="date"
                      onChange={setDate}
                      valueFormat="MM/DD/YYYY"
                      placeholder="mm/dd/yyyy"
                      size="md"
                      rightSection={<CgCalendar size={16} color="#94a3b8" />}
                      classNames={{ input: "royalane-pay-mantine-input" }}
                    />
                  </div>
                </div>
              </div>

              <div className="royalane-pay-field">
                <label className="royalane-pay-label">
                  Payment proof <span className="royalane-pay-required">*</span>
                </label>
                {!preview ? (
                  <div
                    className="royalane-pay-upload"
                    onClick={() => fileRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileRef.current?.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="royalane-pay-upload-icon-wrap" aria-hidden="true">
                      <FaCloudUploadAlt />
                    </span>
                    <p className="royalane-pay-upload-title">
                      Click to upload a receipt or screenshot
                    </p>
                    <p className="royalane-pay-upload-sub">
                      PNG, JPG or JPEG, up to 5 MB
                    </p>
                  </div>
                ) : (
                  <div className="royalane-pay-preview">
                    <img src={preview} alt="Payment proof" />
                    <button
                      type="button"
                      className="royalane-pay-preview-remove"
                      onClick={handleRemoveImage}
                      aria-label="Remove uploaded file"
                    >
                      <FaTimesCircle size={16} color="#e31c23" />
                    </button>
                    <div className="royalane-pay-preview-name">{image?.name}</div>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  name="transaction_image"
                />
              </div>

              {errorMessage ? (
                <div className="royalane-pay-error" role="alert">
                  {errorMessage}
                  <button
                    type="button"
                    className="royalane-pay-error-close"
                    onClick={() => setErrorMessage("")}
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                className="royalane-pay-submit royalane-pay-submit-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Submitting...
                  </>
                ) : (
                  "Submit payment"
                )}
              </button>
            </form>
          </div>

          <aside className="royalane-pay-sidebar">
            <div className="royalane-pay-summary">
              <div className="royalane-pay-summary-top">
                <span className="royalane-pay-summary-kicker">Paying for</span>
                {selectedBooking?.invoice_number ? (
                  <span className="royalane-pay-summary-badge">
                    {selectedBooking.invoice_number}
                  </span>
                ) : (
                  <span className="royalane-pay-summary-badge is-muted">—</span>
                )}
              </div>

              {pickup || dropoff ? (
                <div className="royalane-pay-route">
                  {pickup ? (
                    <div className="royalane-pay-route-item">
                      <span className="royalane-pay-route-dot" />
                      <span>{pickup}</span>
                    </div>
                  ) : null}
                  {dropoff ? (
                    <div className="royalane-pay-route-item">
                      <span className="royalane-pay-route-dot is-end" />
                      <span>{dropoff}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="royalane-pay-summary-empty">
                  {selectedBooking
                    ? selectedBooking.type
                      ? String(selectedBooking.type).replace(/_/g, " ")
                      : "Selected transfer booking"
                    : "Select a transfer invoice to see booking details."}
                </p>
              )}

              {(pickupMeta || vehicleMeta) && (
                <div className="royalane-pay-summary-meta">
                  {pickupMeta ? <span>Pickup: {pickupMeta}</span> : null}
                  {vehicleMeta ? <span>Vehicle: {vehicleMeta}</span> : null}
                </div>
              )}

              <div className="royalane-pay-amount-box">
                <span>Amount due</span>
                <strong>
                  {amountDue ||
                    (currency && paymentAmount
                      ? `${currency} ${Number(paymentAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "—")}
                </strong>
              </div>
            </div>

            <div className="royalane-pay-next">
              <h3>What happens next</h3>
              <ol>
                <li>
                  <span>1</span>
                  Our team matches your receipt to the invoice.
                </li>
                <li>
                  <span>2</span>
                  Status moves from Pending to Confirmed in My payments.
                </li>
                <li>
                  <span>3</span>
                  Driver details are shared before your pickup.
                </li>
              </ol>
            </div>

            <div className="royalane-pay-help">
              <span className="royalane-pay-help-icon" aria-hidden="true">
                <FaComments size={14} />
              </span>
              <p>
                Need help with a payment?{" "}
                <a href="mailto:example@royalane.com">Contact support</a>
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
