"use client";
import React, { useState, useEffect } from "react";
import styles from "../Bookings.module.css";
import {
  FaRegFileAlt,
  FaBell,
  FaUser,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";
import { Menu, Pagination, Popover } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { CgCalendar } from "react-icons/cg";
import { LiaAngleDownSolid } from "react-icons/lia";
import { IoMdCheckmark } from "react-icons/io";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import { HiOutlineFunnel } from "react-icons/hi2";
import moment from "moment";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RiDeleteBin6Line } from "react-icons/ri";
import CancelBookingModal from "@/dashboard_components/CancelBookingModal/CancelBookingModal";
import { hasBackendPenaltyData } from "@/components/Flights/Checkout/flightHelpers";

const getFlightCancellationPolicy = (booking) => {
  if (!booking) return null;
  if (hasBackendPenaltyData(booking)) {
    return { flightPenalties: booking.penalties };
  }
  return booking?.cancellation_policies || booking?.cancellation_policy || null;
};

const getFlightTravelDate = (booking) =>
  booking?.flight_details?.departure_date ||
  booking?.segments?.[0]?.departing_at ||
  null;

function formatFlightDuration(segments) {
  if (!segments?.length) return "-";
  const totalMinutes = segments.reduce((sum, seg) => sum + (seg.duration || 0), 0);
  if (totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (first?.departing_at && last?.arriving_at) {
    const diff = moment(last.arriving_at).diff(moment(first.departing_at), "minutes");
    if (diff > 0) {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
  }
  return "-";
}

function getAirlineFlightLabel(booking) {
  const firstSeg = booking?.segments?.[0];
  const lastSeg = booking?.segments?.[booking?.segments?.length - 1];
  const dep =
    booking?.flight_details?.departure_code ||
    firstSeg?.origin?.iata_code ||
    firstSeg?.departure?.iata_code ||
    "";
  const arr =
    booking?.flight_details?.arrival_code ||
    lastSeg?.destination?.iata_code ||
    lastSeg?.arrival?.iata_code ||
    "";
  const route = dep && arr ? ` (${dep} - ${arr})` : "";

  if (firstSeg?.airline) {
    const airline =
      firstSeg.airline.name ||
      firstSeg.airline.iata_code ||
      "";
    const flightNo = firstSeg.flight_number ? ` ${firstSeg.flight_number}` : "";
    return `${airline}${flightNo}${route}`.trim() || "-";
  }
  if (dep && arr) return `${dep} - ${arr}`;
  return dep || "-";
}

function isReturnTrip(booking) {
  const tripType = String(booking?.flight_details?.trip_type || "").toLowerCase();
  return (
    tripType === "return" ||
    tripType === "roundtrip" ||
    tripType === "round_trip" ||
    tripType === "round-trip" ||
    tripType === "rt"
  );
}

/** Resolve return departure date from API fields or outbound/return segments. */
function resolveReturnDate(booking) {
  const details = booking?.flight_details || {};
  if (details.return_date) return details.return_date;

  const segs = booking?.segments || [];
  if (segs.length < 2) return null;

  const arrivalCode = details.arrival_code;
  // Return leg usually starts from the outbound arrival airport
  if (arrivalCode) {
    const returnSeg = segs.find(
      (seg, i) => i > 0 && seg?.origin?.iata_code === arrivalCode,
    );
    if (returnSeg?.departing_at) return returnSeg.departing_at;
  }

  const firstOrigin = segs[0]?.origin?.iata_code;
  const lastDest = segs[segs.length - 1]?.destination?.iata_code;
  const looksLikeReturn =
    isReturnTrip(booking) ||
    (firstOrigin && lastDest && firstOrigin === lastDest);

  if (!looksLikeReturn) return null;

  // Same approach as flight listing: first half outbound, second half return
  const midpoint = Math.ceil(segs.length / 2);
  return segs[midpoint]?.departing_at || null;
}

function formatFlightTravelDates(booking) {
  const firstSeg = booking?.segments?.[0];
  const depDate =
    booking?.flight_details?.departure_date || firstSeg?.departing_at || null;
  const retDate = resolveReturnDate(booking);

  if (!depDate) return "-";

  if (retDate && !moment(depDate).isSame(moment(retDate), "day")) {
    return `${moment(depDate).format("MMM DD")} - ${moment(retDate).format("MMM DD, YYYY")}`;
  }

  // One-way or same-day: single date only
  return moment(depDate).format("MMM DD, YYYY");
}

export default function FlightBookingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
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
  const [activePage, setActivePage] = useState(1);
  const PAGE_SIZE = 10;
  const [calendarColumns, setCalendarColumns] = useState(2);

  useEffect(() => {
    const update = () => setCalendarColumns(window.innerWidth < 768 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const { email, otp } = session.user;
    if (!email || !otp) return;
    fetchBookings();
  }, []);

  async function fetchBookings() {
    const { email, otp } = session.user;
    if (!email || !otp) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/flight/bookings`,
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
      booking?.booking_reference
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking?.holder_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking?.holder_surname
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking?.holder_email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking?.hotel?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" ||
      booking?.booking_status?.toLowerCase() === selectedStatus.toLowerCase();

    let matchesDateRange = true;
    if (dateRange[0] && dateRange[1]) {
      const travelDate = moment(booking?.flight_details?.departure_date);
      const startDate = moment(dateRange[0]);
      const endDate = moment(dateRange[1]);
      matchesDateRange =
        travelDate.isSameOrAfter(startDate, "day") &&
        travelDate.isSameOrBefore(endDate, "day");
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, selectedStatus, dateRange]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const paginatedBookings = filteredBookings.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  );

  const userEmail = session?.user?.email || "";
  const userName =
    session?.user?.name ||
    (userEmail.includes("@") ? userEmail.split("@")[0] : "Traveler");

  const statCards = [
    {
      label: "Total Bookings",
      value: meta?.total_count,
      icon: <FaCalendarAlt size={16} />,
    },
    {
      label: "Confirmed",
      value: meta?.confirmed_count,
      icon: <FaCheckCircle size={16} />,
    },
    {
      label: "Tentative",
      value: meta?.tentative_count,
      icon: <FaClock size={16} />,
    },
    {
      label: "Cancelled",
      value: meta?.cancelled_count,
      icon: <FaTimesCircle size={16} />,
    },
  ];

  const statusBadgeClass = {
    confirmed: "bk-badge-confirmed",
    tentative: "bk-badge-tentative",
    pending: "bk-badge-pending",
    cancelled: "bk-badge-cancelled",
    paid: "bk-badge-confirmed",
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
        type="flight"
        endPoint="/api/flights/booking/cancel"
        cancellationPolicy={cancelModal.cancellationPolicy}
        currency={cancelModal.currency}
        travelDate={cancelModal.travelDate}
        exchangeRate={cancelModal.exchangeRate}
        baseCurrency={cancelModal.baseCurrency}
        onSuccess={() => fetchBookings()}
      />
      <div className="bk-page-wrapper royalane-bk">
        <div className="db-topbar">
          <div className="db-topbar-right">
            <div className="db-user">
              <span className="db-avatar" aria-hidden="true">
                <FaUser />
              </span>
              <div className="db-user-copy">
                <strong>{userName}</strong>
                <span>{userEmail}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {statCards.map((s) => (
            <div className="col-12 col-sm-6 col-lg-3" key={s.label}>
              <article className="db-stat-card">
                <div className="db-stat-head">
                  <span className="db-stat-icon">{s.icon}</span>
                </div>
                <p className="db-stat-label">{s.label}</p>
                <p className="db-stat-value">{s.value ?? "-"}</p>
              </article>
            </div>
          ))}
        </div>

        <div className="bk-table-card bg-white rounded-3">
          <div className="royalane-bk-toolbar">
            <h2 className="royalane-bk-title">Flight Bookings</h2>
            <div className="royalane-bk-tools">
              <div className="royalane-bk-search">
                <FiSearch aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search bookings"
                />
              </div>
              <Menu shadow="md" position="bottom-end" width={180}>
                <Menu.Target>
                  <button type="button" className="royalane-filter-btn">
                    <HiOutlineFunnel />
                    {selectedStatus === "all"
                      ? "Filters"
                      : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                    <LiaAngleDownSolid />
                  </button>
                </Menu.Target>
                <Menu.Dropdown>
                  {["all", "confirmed", "tentative", "cancelled"].map((s) => (
                    <Menu.Item
                      key={s}
                      leftSection={
                        selectedStatus === s ? (
                          <IoMdCheckmark size={14} />
                        ) : (
                          <span style={{ width: 14, display: "inline-block" }} />
                        )
                      }
                      onClick={() => setSelectedStatus(s)}
                    >
                      {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <Popover width="auto" position="bottom-end" withArrow shadow="md">
                <Popover.Target>
                  <button
                    type="button"
                    className={`royalane-filter-btn ${dateRange[0] && dateRange[1] ? "" : "royalane-filter-btn-muted"}`}
                    title="Filter by departure date"
                  >
                    <CgCalendar size={15} />
                    {dateRange[0] && dateRange[1]
                      ? `Departure: ${moment(dateRange[0]).format("MMM DD")} – ${moment(dateRange[1]).format("MMM DD")}`
                      : "Departure Date"}
                  </button>
                </Popover.Target>
                <Popover.Dropdown className="royalane-datepicker-dropdown">
                  <div className="royalane-datepicker-label">Departure</div>
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

          <div className="table-responsive">
            <table className="bk-table">
              <thead>
                <tr className="bk-thead-tr">
                  {[
                    "Booking Code",
                    "Booking Date",
                    "Passenger Name",
                    "Airline / Flight",
                    "Departure / Return",
                    "Price",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="bk-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="mp-skeleton-row">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j}>
                          <div className={`mp-skeleton-bar${j === 8 ? " mp-skeleton-bar-short" : ""}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="bk-empty-state">
                      No bookings found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking, index) => {
                    const st = booking?.booking_status?.toLowerCase();
                    const badgeClass = statusBadgeClass[st] || "bk-badge-default";
                    const paymentBadgeClass =
                      statusBadgeClass[booking?.payment_status?.toLowerCase()] || "bk-badge-default";
                    const passenger = booking?.passenger_details?.[0];
                    return (
                      <tr key={index} className="bk-tr">
                        <td className="bk-td-ref">{booking?.booking_reference}</td>
                        <td className="bk-td-text-nowrap">
                          {moment(booking?.created_at).format("MMM DD, YYYY")}
                        </td>
                        <td className="bk-td-guest">
                          <div className="bk-guest-name">
                            {passenger?.firstName} {passenger?.lastName}
                          </div>
                          <div className="bk-guest-email">{passenger?.email}</div>
                        </td>
                        <td className="bk-td-guest">
                          <div className="bk-guest-name">
                            {getAirlineFlightLabel(booking)}
                          </div>
                          <div className="bk-guest-email">
                            {formatFlightDuration(booking?.segments)}
                          </div>
                        </td>
                        <td className="bk-td-text-nowrap">
                          {formatFlightTravelDates(booking)}
                        </td>
                        <td className="bk-td-amount">
                          {booking?.pricing?.display_currency} {booking?.pricing?.amount}
                        </td>
                        <td className="bk-td-status">
                          <span className={`bk-status-badge ${badgeClass}`}>
                            {st ? st.charAt(0).toUpperCase() + st.slice(1) : "-"}
                          </span>
                          <span className={`bk-status-badge mt-1 ${paymentBadgeClass}`}>
                            {booking?.payment_status
                              ? booking.payment_status.charAt(0).toUpperCase() +
                              booking.payment_status.slice(1)
                              : "-"}
                          </span>
                        </td>
                        <td className="bk-td-actions">
                          <button className={styles.actionsBtn}>
                            <Menu shadow="md" position="bottom-end" width={190}>
                              <Menu.Target>
                                <span className="bk-menu-dots">...</span>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item leftSection={<FaRegFileAlt size={13} />}>
                                  <Link
                                    href={`/flights/invoice/${booking?.booking_reference}`}
                                    target="_blank"
                                    className="text-dark"
                                  >
                                    View Invoice
                                  </Link>
                                </Menu.Item>
                                <Menu.Item leftSection={<FaRegFileAlt size={13} />}>
                                  <Link
                                    href={`/flights/voucher/${booking?.booking_reference}`}
                                    target="_blank"
                                    className="text-dark"
                                  >
                                    View Voucher
                                  </Link>
                                </Menu.Item>
                                {booking?.booking_status?.toLowerCase() === "confirmed" &&
                                  booking?.payment_status?.toLowerCase() === "paid" &&
                                  moment(booking?.flight_details?.departure_date).isAfter(
                                    moment(),
                                    "day",
                                  ) && (
                                    <Menu.Item
                                      leftSection={<RiDeleteBin6Line color="red" size={13} />}
                                      color="red"
                                      onClick={() =>
                                        setCancelModal({
                                          opened: true,
                                          bookingReference: booking?.booking_reference,
                                          provider: booking?.provider,
                                          cancellationPolicy: getFlightCancellationPolicy(booking),
                                          currency: booking?.pricing?.display_currency || "",
                                          travelDate: getFlightTravelDate(booking),
                                          exchangeRate:
                                            booking?.pricing?.supplier_to_display_rate || null,
                                          baseCurrency:
                                            booking?.pricing?.supplier_currency ||
                                            booking?.pricing?.currency ||
                                            "",
                                        })
                                      }
                                    >
                                      Cancel Booking
                                    </Menu.Item>
                                  )}
                              </Menu.Dropdown>
                            </Menu>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="bk-pagination-wrapper d-flex flex-wrap justify-content-between align-items-center gap-2 py-3 px-3">
              <span className="text-muted" style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                Showing{" "}
                {filteredBookings.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1}–
                {Math.min(activePage * PAGE_SIZE, filteredBookings.length)} out of{" "}
                {filteredBookings.length}
              </span>
              {filteredBookings.length > 0 && (
                <Pagination
                  total={Math.max(totalPages, 1)}
                  value={activePage}
                  onChange={setActivePage}
                  size="sm"
                  color="#e31c23"
                  withEdges
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
