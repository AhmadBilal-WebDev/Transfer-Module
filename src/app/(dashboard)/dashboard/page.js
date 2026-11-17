"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FaRegFileAlt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaBus,
} from "react-icons/fa";
import { plusJakarta } from "@/lib/fonts";
import { Menu, Popover } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { CgCalendar } from "react-icons/cg";
import { FiSearch } from "react-icons/fi";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useRouter as useNextRouter } from "next/navigation";
import Link from "next/link";
import { RiDeleteBin6Line } from "react-icons/ri";
import CancelBookingModal from "@/dashboard_components/CancelBookingModal/CancelBookingModal";
import TransfersHubHero from "@/dashboard_components/TransfersHubHero/TransfersHubHero";

const getTransferCancellationPolicy = (booking) => {
  if (!booking) return null;

  const nested = booking?.cancellation_policies;
  if (nested?.cancel_policy) {
    return {
      cancel_policy: nested.cancel_policy,
      cancellation_policies: nested.policies || nested.cancellation_policies || [],
    };
  }

  if (Array.isArray(nested) && nested.length > 0) {
    return {
      cancel_policy: booking?.cancel_policy || booking?.transfer?.cancel_policy || "refundable",
      cancellation_policies: nested,
    };
  }

  if (booking?.transfer?.cancel_policy) {
    return {
      cancel_policy: booking.transfer.cancel_policy,
      cancellation_policies: Array.isArray(booking.transfer.cancellation_policies)
        ? booking.transfer.cancellation_policies
        : Array.isArray(booking?.cancellation_policies)
          ? booking.cancellation_policies
          : [],
    };
  }

  if (booking?.cancel_policy) {
    return {
      cancel_policy: booking.cancel_policy,
      cancellation_policies: Array.isArray(booking?.cancellation_policies)
        ? booking.cancellation_policies
        : [],
    };
  }

  return null;
};

function formatTripType(value) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRouteLabel(booking) {
  const pickup = booking?.booking_criteria?.pickup_location;
  const dropoff = booking?.booking_criteria?.dropoff_location;
  if (pickup && dropoff) {
    const arrow =
      booking?.transfer?.trip_type?.toLowerCase()?.includes("return") ||
      booking?.booking_criteria?.transfer_type?.toLowerCase()?.includes("return")
        ? " ⇌ "
        : " → ";
    return `${pickup}${arrow}${dropoff}`;
  }
  return pickup || dropoff || "-";
}

function getServiceTypeLabel(booking) {
  return (
    formatTripType(booking?.transfer?.trip_type) ||
    formatTripType(booking?.booking_criteria?.transfer_type) ||
    "—"
  );
}

function getVehicleLabel(booking) {
  const transfer = booking?.transfer || {};
  const vehicleDetails =
    booking?.vehicle_details || transfer?.vehicle_details || transfer?.vehicle || {};
  const vehicleCategory =
    booking?.vehiclecategory ||
    booking?.vehicle_category ||
    transfer?.vehicle_category ||
    {};

  return (
    vehicleDetails?.name ||
    transfer?.vehicle_name ||
    booking?.vehicle_name ||
    transfer?.vehicle_type ||
    vehicleDetails?.type ||
    (typeof vehicleCategory === "string" ? vehicleCategory : vehicleCategory?.name) ||
    transfer?.name ||
    ""
  );
}

function getBookingPax(booking) {
  const criteria = booking?.booking_criteria || {};
  const paxDist = booking?.transfer?.paxes_distribution || {};
  const fromDist =
    Number(paxDist?.total) ||
    Number(paxDist?.adults || 0) +
      Number(paxDist?.children || 0) +
      Number(paxDist?.infants || 0);
  if (fromDist > 0) return fromDist;

  const adults = Number(criteria.adults ?? criteria.passengers ?? criteria.pax ?? 0);
  const children = Number(criteria.children ?? 0);
  const infants = Number(criteria.infants ?? 0);
  const total = adults + children + infants;
  if (total > 0) return total;

  const fallback =
    booking?.pax ||
    booking?.passengers ||
    booking?.transfer?.max_passenger ||
    booking?.vehicle_details?.passenger_capacity ||
    booking?.transfer?.vehicle_details?.passenger_capacity;
  const num = Number(fallback);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function getPickupDateLabel(booking) {
  const dateRaw =
    booking?.booking_criteria?.pickup_date ||
    booking?.pickup_date ||
    booking?.travel_date ||
    booking?.transfer?.pickup_date;

  if (!dateRaw) return "—";
  return moment(dateRaw).format("MMM DD, YYYY");
}

export default function TransferBookingsPage() {
  const { data: session } = useSession();
  const router = useNextRouter();
  const [cancelModal, setCancelModal] = useState({
    opened: false,
    bookingReference: "",
    provider: "",
    cancellationPolicy: null,
    currency: "",
    travelDate: null,
    exchangeRate: null,
    baseCurrency: "",
  });
  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const PAGE_SIZE = 10;
  const [calendarColumns, setCalendarColumns] = useState(2);
  const loadMoreSentinelRef = useRef(null);

  useEffect(() => {
    const update = () => setCalendarColumns(window.innerWidth < 768 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setShowLoadMore(false);
  }, [searchQuery, selectedStatus, dateRange]);

  useEffect(() => {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    fetchBookings();
  }, [session?.user?.email, session?.user?.otp]);

  async function fetchBookings() {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/transfer/bookings`,
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

      setBookings(data?.data || []);
      setMeta(data?.meta || {});
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      searchQuery === "" ||
      booking?.invoice_number
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking?.lead_passenger?.first_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking?.lead_passenger?.last_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking?.lead_passenger?.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking?.transfer?.vehicle_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const status = booking?.booking_status?.toLowerCase() || "";
    const matchesStatus =
      selectedStatus === "all" ||
      status === selectedStatus.toLowerCase() ||
      (selectedStatus === "pending" &&
        (status === "pending" || status === "tentative"));

    let matchesDateRange = true;
    if (dateRange[0] && dateRange[1]) {
      const bookingDate = moment(booking?.booking_criteria?.pickup_date);
      const startDate = moment(dateRange[0]);
      const endDate = moment(dateRange[1]);
      matchesDateRange =
        bookingDate.isSameOrAfter(startDate, "day") &&
        bookingDate.isSameOrBefore(endDate, "day");
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const visibleBookings = filteredBookings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBookings.length;

  useEffect(() => {
    const node = loadMoreSentinelRef.current;
    if (!node || !hasMore || loading) {
      setShowLoadMore(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowLoadMore(entry.isIntersecting);
      },
      { root: null, rootMargin: "80px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, visibleCount, filteredBookings.length]);

  const nextPickup = useMemo(() => {
    const upcoming = (bookings || [])
      .filter((booking) => {
        const status = booking?.booking_status?.toLowerCase();
        if (status === "cancelled") return false;
        const date = moment(booking?.booking_criteria?.pickup_date);
        return date.isValid() && date.isSameOrAfter(moment(), "day");
      })
      .sort((a, b) =>
        moment(a?.booking_criteria?.pickup_date).diff(
          moment(b?.booking_criteria?.pickup_date),
        ),
      );
    return upcoming[0] || null;
  }, [bookings]);

  const totalCount = Number(meta?.total_count) || 0;
  const confirmedCount = Number(meta?.confirmed_count) || 0;
  const tentativeCount = Number(meta?.tentative_count) || 0;
  const cancelledCount = Number(meta?.cancelled_count) || 0;
  const pct = (value) =>
    totalCount > 0 ? Math.round((Number(value) / totalCount) * 100) : 0;

  const statCards = [
    {
      key: "total",
      label: "Total transfers",
      value: totalCount,
      tone: "primary",
      icon: <FaBus size={16} />,
      foot: "All bookings on your account",
    },
    {
      key: "confirmed",
      label: "Confirmed",
      value: confirmedCount,
      tone: "confirmed",
      icon: <FaCheckCircle size={16} />,
      percent: pct(confirmedCount),
      foot: `${pct(confirmedCount)}% of all transfers`,
    },
    {
      key: "tentative",
      label: "Tentative",
      value: tentativeCount,
      tone: "tentative",
      icon: <FaClock size={16} />,
      percent: pct(tentativeCount),
      foot: `${pct(tentativeCount)}% awaiting confirmation`,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: cancelledCount,
      tone: "cancelled",
      icon: <FaTimesCircle size={16} />,
      percent: pct(cancelledCount),
      foot: `${pct(cancelledCount)}% of all transfers`,
    },
  ];

  const statusBadgeClass = {
    confirmed: "bk-badge-confirmed",
    paid: "bk-badge-confirmed",
    tentative: "bk-badge-tentative",
    pending: "bk-badge-pending",
    cancelled: "bk-badge-cancelled",
  };

  const canCancelBooking = (booking) => {
    const status = booking?.booking_status?.toLowerCase() || "";
    if (status === "cancelled") return false;
    return moment(booking?.booking_criteria?.pickup_date).isAfter(moment(), "day");
  };

  const openCancelModal = (booking) => {
    setCancelModal({
      opened: true,
      bookingReference: booking?.booking_reference || booking?.invoice_number || "",
      provider: booking?.provider,
      cancellationPolicy: getTransferCancellationPolicy(booking),
      currency:
        booking?.pricing?.display_currency || booking?.client_currency || "",
      travelDate: booking?.booking_criteria?.pickup_date || null,
      exchangeRate:
        Number(
          booking?.pricing?.supplier_to_display_rate ||
            booking?.supplier_to_display_rate ||
            1,
        ) || 1,
      baseCurrency:
        booking?.pricing?.supplier_currency ||
        booking?.supplier_currency ||
        booking?.currency_code ||
        "",
    });
  };

  return (
    <>
      <CancelBookingModal
        opened={cancelModal.opened}
        onClose={() =>
          setCancelModal({
            opened: false,
            bookingReference: "",
            provider: "",
            cancellationPolicy: null,
            currency: "",
            travelDate: null,
            exchangeRate: null,
            baseCurrency: "",
          })
        }
        bookingReference={cancelModal.bookingReference}
        provider={cancelModal.provider}
        type="transfer"
        endPoint="/api/transfers/booking/cancel"
        cancellationPolicy={cancelModal.cancellationPolicy}
        currency={cancelModal.currency}
        travelDate={cancelModal.travelDate}
        exchangeRate={cancelModal.exchangeRate}
        baseCurrency={cancelModal.baseCurrency}
        onSuccess={() => fetchBookings()}
      />
      <div className="bk-page-wrapper royalane-bk">
        <TransfersHubHero session={session} nextPickup={nextPickup} />

        <div className={`royalane-stat-grid ${plusJakarta.className}`}>
          {statCards.map((s) => (
            <article
              key={s.key}
              className={`royalane-stat-card royalane-stat-card--${s.tone}`}
            >
              <div className="royalane-stat-head">
                <p className="royalane-stat-label">{s.label}</p>
                <span className="royalane-stat-icon" aria-hidden="true">
                  {s.icon}
                </span>
              </div>
              <p className="royalane-stat-value">{s.value ?? 0}</p>
              {typeof s.percent === "number" ? (
                <div
                  className="royalane-stat-bar"
                  role="progressbar"
                  aria-valuenow={s.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${s.percent}%` }} />
                </div>
              ) : null}
              <p className="royalane-stat-foot">{s.foot}</p>
            </article>
          ))}
        </div>

        <div className={`bk-table-card royalane-tb-card ${plusJakarta.className}`}>
          <div className="royalane-bk-toolbar">
            <h2 className="royalane-bk-title">Transfer bookings</h2>
            <div className="royalane-bk-tools">
              <div className="royalane-bk-search">
                <FiSearch aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by invoice number or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search bookings"
                />
              </div>
              <div className="royalane-status-chips" role="tablist" aria-label="Status filter">
                {["all", "confirmed", "pending", "cancelled"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={selectedStatus === s}
                    className={`royalane-status-chip ${selectedStatus === s ? "is-active" : ""}`}
                    onClick={() => setSelectedStatus(s)}
                  >
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <Popover width="auto" position="bottom-end" withArrow shadow="md">
                <Popover.Target>
                  <button
                    type="button"
                    className={`royalane-filter-btn ${dateRange[0] && dateRange[1] ? "is-active" : ""}`}
                    title="Filter by pickup date"
                  >
                    <CgCalendar size={15} />
                    {dateRange[0] && dateRange[1]
                      ? `${moment(dateRange[0]).format("MMM DD")} – ${moment(dateRange[1]).format("MMM DD")}`
                      : "Pickup date"}
                  </button>
                </Popover.Target>
                <Popover.Dropdown className="royalane-datepicker-dropdown">
                  <div className="royalane-datepicker-label">Pickup Date</div>
                  <DatePicker
                    type="range"
                    numberOfColumns={calendarColumns}
                    value={dateRange}
                    onChange={setDateRange}
                    allowSingleDateInRange
                    classNames={{
                      day: "royalane-datepicker-day",
                    }}
                  />
                  {dateRange[0] && dateRange[1] && (
                    <div className="bk-date-clear-wrapper">
                      <button
                        type="button"
                        className="bk-date-clear-btn"
                        onClick={() => setDateRange([null, null])}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </Popover.Dropdown>
              </Popover>
            </div>
          </div>

          <div className="table-responsive royalane-tb-desktop">
            <table className="bk-table">
              <thead>
                <tr className="bk-thead-tr">
                  {[
                    "Invoice",
                    "Guest",
                    "Route",
                    "Trip Type",
                    "Vehicle & Pickup",
                    "Price",
                    "Status",
                    "",
                  ].map((h, i) => (
                    <th key={`${h || "actions"}-${i}`} className="bk-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="mp-skeleton-row">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}>
                          <div className={`mp-skeleton-bar${j === 7 ? " mp-skeleton-bar-short" : ""}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="bk-empty-state">
                      No bookings found matching your filters.
                    </td>
                  </tr>
                ) : (
                  visibleBookings.map((booking, index) => {
                    const st = booking?.booking_status?.toLowerCase() || "";
                    const badgeClass = statusBadgeClass[st] || "bk-badge-default";
                    const paymentStatus = booking?.payment_status?.toLowerCase() || "";
                    const paymentBadgeClass =
                      statusBadgeClass[paymentStatus] || "bk-badge-default";
                    const code =
                      booking?.invoice_number || booking?.booking_reference || "—";
                    const guestName = [
                      booking?.lead_passenger?.first_name,
                      booking?.lead_passenger?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    const pickup = booking?.booking_criteria?.pickup_location || "—";
                    const dropoff = booking?.booking_criteria?.dropoff_location || "—";
                    const vehicle = getVehicleLabel(booking);
                    const pax = getBookingPax(booking);

                    return (
                      <tr key={booking?.booking_reference || booking?.invoice_number || index} className="bk-tr">
                        <td className="bk-td-ref">
                          <span className="royalane-tb-invoice">{code}</span>
                          <span className="royalane-tb-sub">
                            {booking?.created_at
                              ? moment(booking.created_at).format("MMM DD, YYYY")
                              : ""}
                          </span>
                        </td>
                        <td className="bk-td-guest">
                          <div className="bk-guest-name">{guestName || "—"}</div>
                          <div className="bk-guest-email">
                            {booking?.lead_passenger?.email || ""}
                          </div>
                        </td>
                        <td className="bk-td-detail">
                          <div className="royalane-tb-route">
                            <div className="royalane-tb-route-stop">
                              <span className="royalane-tb-route-dot" aria-hidden="true" />
                              <span className="royalane-tb-route-place">{pickup}</span>
                            </div>
                            <div className="royalane-tb-route-stop">
                              <span className="royalane-tb-route-dot is-end" aria-hidden="true" />
                              <span className="royalane-tb-route-place">{dropoff}</span>
                            </div>
                          </div>
                        </td>
                        <td className="bk-td-text-nowrap">{getServiceTypeLabel(booking)}</td>
                        <td className="bk-td-detail">
                          <div className="royalane-tb-vehicle-pickup">
                            <span className="royalane-tb-vehicle-pill">
                              {[vehicle || "", pax ? `${pax} pax` : ""]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                            <span className="royalane-tb-pickup-meta">
                              {getPickupDateLabel(booking)}
                            </span>
                          </div>
                        </td>
                        <td className="bk-td-amount">
                          {booking?.pricing?.display_currency}{" "}
                          {booking?.pricing?.amount_after_exchange ?? "—"}
                        </td>
                        <td className="bk-td-status">
                          <span className={`bk-status-badge ${badgeClass}`}>
                            {st ? st.charAt(0).toUpperCase() + st.slice(1) : "—"}
                          </span>
                          {paymentStatus ? (
                            <span className={`bk-status-badge ${paymentBadgeClass}`}>
                              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                            </span>
                          ) : null}
                        </td>
                        <td className="bk-td-actions">
                          <Menu shadow="md" position="bottom-end" width={190}>
                            <Menu.Target>
                              <button type="button" className="royalane-tb-more" aria-label="Actions">
                                ···
                              </button>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item leftSection={<FaRegFileAlt size={13} />}>
                                <Link
                                  href={`/transfers/invoice/${booking?.booking_reference || booking?.invoice_number}`}
                                  target="_blank"
                                  className="text-dark"
                                >
                                  View Invoice
                                </Link>
                              </Menu.Item>
                              <Menu.Item leftSection={<FaRegFileAlt size={13} />}>
                                <Link
                                  href={`/transfers/voucher/${booking?.booking_reference || booking?.invoice_number}`}
                                  target="_blank"
                                  className="text-dark"
                                >
                                  View Voucher
                                </Link>
                              </Menu.Item>
                              {canCancelBooking(booking) && (
                                  <Menu.Item
                                    leftSection={<RiDeleteBin6Line color="red" size={13} />}
                                    color="red"
                                    onClick={() => openCancelModal(booking)}
                                  >
                                    Cancel Booking
                                  </Menu.Item>
                                )}
                            </Menu.Dropdown>
                          </Menu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="royalane-tb-mobile">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="royalane-tb-mobile-card">
                  <div className="mp-skeleton-bar" />
                  <div className="mp-skeleton-bar" />
                </div>
              ))
            ) : filteredBookings.length === 0 ? (
              <p className="bk-empty-state">No bookings found matching your filters.</p>
            ) : (
              visibleBookings.map((booking, index) => {
                const st = booking?.booking_status?.toLowerCase() || "";
                const badgeClass = statusBadgeClass[st] || "bk-badge-default";
                const code = booking?.invoice_number || booking?.booking_reference || "—";
                const guestName = [
                  booking?.lead_passenger?.first_name,
                  booking?.lead_passenger?.last_name,
                ]
                  .filter(Boolean)
                  .join(" ");
                const pickup = booking?.booking_criteria?.pickup_location || "—";
                const dropoff = booking?.booking_criteria?.dropoff_location || "—";
                const vehicle = getVehicleLabel(booking);
                const pax = getBookingPax(booking);

                return (
                  <article
                    key={booking?.booking_reference || booking?.invoice_number || index}
                    className="royalane-tb-mobile-card"
                  >
                    <div className="royalane-tb-mobile-top">
                      <span className="royalane-tb-invoice">{code}</span>
                      <span className={`bk-status-badge ${badgeClass}`}>
                        {st ? st.charAt(0).toUpperCase() + st.slice(1) : "—"}
                      </span>
                    </div>
                    <p className="royalane-tb-mobile-guest">{guestName || "—"}</p>
                    <p className="royalane-tb-mobile-email">
                      {booking?.lead_passenger?.email || ""}
                    </p>
                    <div className="royalane-tb-route">
                      <div className="royalane-tb-route-stop">
                        <span className="royalane-tb-route-dot" aria-hidden="true" />
                        <span className="royalane-tb-route-place">{pickup}</span>
                      </div>
                      <div className="royalane-tb-route-stop">
                        <span className="royalane-tb-route-dot is-end" aria-hidden="true" />
                        <span className="royalane-tb-route-place">{dropoff}</span>
                      </div>
                    </div>
                    <div className="royalane-tb-vehicle-pickup">
                      <span className="royalane-tb-vehicle-pill">
                        {[vehicle || "Transfer", pax ? `${pax} pax` : ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="royalane-tb-pickup-meta">
                        {getPickupDateLabel(booking)}
                      </span>
                    </div>
                    <div className="royalane-tb-mobile-meta">
                      <span>{getServiceTypeLabel(booking)}</span>
                      <strong>
                        {booking?.pricing?.display_currency}{" "}
                        {booking?.pricing?.amount_after_exchange ?? "—"}
                      </strong>
                    </div>
                    <div className="royalane-tb-mobile-actions">
                      <Link
                        href={`/transfers/invoice/${booking?.booking_reference || booking?.invoice_number}`}
                        target="_blank"
                      >
                        Invoice
                      </Link>
                      <Link
                        href={`/transfers/voucher/${booking?.booking_reference || booking?.invoice_number}`}
                        target="_blank"
                      >
                        Voucher
                      </Link>
                      {canCancelBooking(booking) ? (
                        <button
                          type="button"
                          className="royalane-tb-mobile-cancel"
                          onClick={() => openCancelModal(booking)}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {!loading && filteredBookings.length > 0 && (
            <div className="royalane-tb-footer">
              <span className="royalane-tb-count">
                Showing {Math.min(visibleCount, filteredBookings.length)} of{" "}
                {filteredBookings.length}
              </span>
              <div ref={loadMoreSentinelRef} className="royalane-tb-load-sentinel" aria-hidden="true" />
              {hasMore && showLoadMore ? (
                <button
                  type="button"
                  className="royalane-tb-load-more"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  Load more
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
