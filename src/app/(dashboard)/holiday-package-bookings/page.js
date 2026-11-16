"use client";
import React, { useState, useEffect } from "react";
import styles from "../Bookings.module.css";
import {
  FaRegFileAlt,
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
import { FiSearch } from "react-icons/fi";
import { HiOutlineFunnel } from "react-icons/hi2";
import moment from "moment";
import { useSession } from "next-auth/react";
import CancelBookingModal from "@/dashboard_components/CancelBookingModal/CancelBookingModal";
import { useRouter } from "next/navigation";
import { RiDeleteBin6Line } from "react-icons/ri";

const SERVICE_LABELS = {
  stay: "Stay",
  hotel: "Hotel",
  flight: "Flight",
  transfer: "Transfer",
  visa: "Visa",
  activity: "Activity",
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "needs_revision", label: "Needs Revision" },
  { value: "cancelled", label: "Cancelled" },
];

function formatServiceLabel(key) {
  return (
    SERVICE_LABELS[key] ||
    String(key)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getLeadName(booking) {
  if (booking?.lead_name) {
    return [booking?.lead_title, booking.lead_name].filter(Boolean).join(" ");
  }
  if (booking?.lead_first_name || booking?.lead_last_name) {
    return [booking?.lead_title, booking?.lead_first_name, booking?.lead_last_name]
      .filter(Boolean)
      .join(" ");
  }
  const lead = booking?.lead_details;
  if (lead) {
    return [lead?.title, lead?.firstName, lead?.lastName].filter(Boolean).join(" ");
  }
  return "-";
}

function getLeadEmail(booking) {
  return booking?.lead_email || booking?.lead_details?.email || "-";
}

function getBookedServices(booking) {
  const services =
    booking?.services ||
    booking?.package_context?.services ||
    booking?.package_snapshot?.services ||
    [];
  if (!Array.isArray(services)) return [];
  return services.map((key) => formatServiceLabel(key));
}

function getStartDate(booking) {
  return (
    booking?.start_date ||
    booking?.check_in ||
    booking?.package_details?.startDate ||
    null
  );
}

function getEndDate(booking) {
  return (
    booking?.end_date ||
    booking?.check_out ||
    booking?.package_details?.endDate ||
    null
  );
}

export default function HolidayPackageBookingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cancelModal, setCancelModal] = useState({
    opened: false,
    bookingReference: "",
    packageId: "",
  });
  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [activePage, setActivePage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [calendarColumns, setCalendarColumns] = useState(2);

  useEffect(() => {
    const update = () => setCalendarColumns(window.innerWidth < 768 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const { email, otp } = session?.user || {};
    if (!email || !otp) return;
    fetchBookings();
  }, []);

  async function fetchBookings() {
    const { email, otp } = session?.user || {};
    if (!email || !otp) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/holiday-package/bookings`,
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
    const leadName = getLeadName(booking).toLowerCase();
    const leadEmail = getLeadEmail(booking).toLowerCase();
    const q = searchQuery.toLowerCase();
    const servicesText = getBookedServices(booking).join(" ").toLowerCase();

    const matchesSearch =
      searchQuery === "" ||
      booking?.booking_reference?.toLowerCase().includes(q) ||
      leadName.includes(q) ||
      leadEmail.includes(q) ||
      servicesText.includes(q);

    const bookingStatus = booking?.booking_status?.toLowerCase() || "";
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "pending"
        ? ["pending", "incomplete"].includes(bookingStatus)
        : bookingStatus === selectedStatus.toLowerCase());

    let matchesDateRange = true;
    if (dateRange[0] && dateRange[1]) {
      const bookingStartDate = moment(getStartDate(booking));
      const startDate = moment(dateRange[0]);
      const endDate = moment(dateRange[1]);
      matchesDateRange =
        bookingStartDate.isValid() &&
        bookingStartDate.isSameOrAfter(startDate, "day") &&
        bookingStartDate.isSameOrBefore(endDate, "day");
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, selectedStatus, dateRange]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE,
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
      label: "Incomplete",
      value: meta?.incomplete_count,
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
    paid: "bk-badge-confirmed",
    tentative: "bk-badge-tentative",
    pending: "bk-badge-pending",
    incomplete: "bk-badge-pending",
    needs_revision: "bk-badge-pending",
    cancelled: "bk-badge-cancelled",
  };

  return (
    <>
      <CancelBookingModal
        opened={cancelModal.opened}
        onClose={() =>
          setCancelModal({
            opened: false,
            bookingReference: "",
            packageId: "",
          })
        }
        bookingReference={cancelModal.bookingReference}
        packageId={cancelModal.packageId}
        email={session?.user?.email}
        otp={session?.user?.otp}
        type="holiday-package"
        endPoint="/api/b2c/dashboard/holiday-package/cancel-booking"
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
            <h2 className="royalane-bk-title">Holiday Package Bookings</h2>
            <div className="royalane-bk-tools">
              <div className="royalane-bk-search">
                <FiSearch aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by name, email or invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search holiday package bookings"
                />
              </div>
              <Menu shadow="md" position="bottom-end" width={200}>
                <Menu.Target>
                  <button type="button" className="royalane-filter-btn">
                    <HiOutlineFunnel />
                    {STATUS_FILTER_OPTIONS.find((o) => o.value === selectedStatus)
                      ?.label || "Filters"}
                    <LiaAngleDownSolid />
                  </button>
                </Menu.Target>
                <Menu.Dropdown>
                  {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
                    <Menu.Item
                      key={value}
                      leftSection={
                        selectedStatus === value ? (
                          <IoMdCheckmark size={14} />
                        ) : (
                          <span style={{ width: 14, display: "inline-block" }} />
                        )
                      }
                      onClick={() => setSelectedStatus(value)}
                    >
                      {label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <Popover width="auto" position="bottom-end" withArrow shadow="md">
                <Popover.Target>
                  <button
                    type="button"
                    className={`royalane-filter-btn ${dateRange[0] && dateRange[1] ? "" : "royalane-filter-btn-muted"}`}
                    title="Filter by travel start date"
                  >
                    <CgCalendar size={15} />
                    {dateRange[0] && dateRange[1]
                      ? `${moment(dateRange[0]).format("MMM DD")} – ${moment(dateRange[1]).format("MMM DD")}`
                      : "Travel Date"}
                  </button>
                </Popover.Target>
                <Popover.Dropdown className="royalane-datepicker-dropdown">
                  <div className="royalane-datepicker-label">Travel Date</div>
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
                    "Invoice No.",
                    "Guest",
                    "Booked Services",
                    "Issued Date",
                    "Status",
                    "Amount",
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
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}>
                          <div
                            className={`mp-skeleton-bar${j === 6 ? " mp-skeleton-bar-short" : ""}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="bk-empty-state">
                      No bookings found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking, index) => {
                    const st = booking?.booking_status?.toLowerCase();
                    const badgeClass = statusBadgeClass[st] || "bk-badge-default";
                    const paymentBadgeClass =
                      statusBadgeClass[booking?.payment_status?.toLowerCase()] ||
                      "bk-badge-default";
                    const amount =
                      booking?.amount ??
                      booking?.customer_amount ??
                      booking?.booking_amount;
                    const currency =
                      booking?.customer_currency || booking?.display_currency || "";
                    const bookedServices = getBookedServices(booking);
                    const startDate = getStartDate(booking);
                    const endDate = getEndDate(booking);

                    return (
                      <tr key={index} className="bk-tr">
                        <td className="bk-td-ref">{booking?.booking_reference}</td>
                        <td className="bk-td-guest">
                          <div className="bk-guest-name">{getLeadName(booking)}</div>
                          <div className="bk-guest-email">{getLeadEmail(booking)}</div>
                        </td>
                        <td className="bk-td-detail">
                          <div className="bk-detail-primary">
                            {bookedServices.length > 0
                              ? bookedServices.join(", ")
                              : "-"}
                          </div>
                          {(startDate || endDate) && (
                            <div className="bk-guest-email">
                              {startDate && moment(startDate).format("DD MMM YYYY")}
                              {startDate && endDate && " – "}
                              {endDate && moment(endDate).format("DD MMM YYYY")}
                            </div>
                          )}
                        </td>
                        <td className="bk-td-text-nowrap">
                          {booking?.created_at
                            ? moment(booking.created_at).format("DD MMM YYYY")
                            : "-"}
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
                        <td className="bk-td-amount">
                          {currency} {amount ?? "-"}
                        </td>
                        <td className="bk-td-actions">
                          <button className={styles.actionsBtn}>
                            <Menu shadow="md" position="bottom-end" width={190}>
                              <Menu.Target>
                                <span className="bk-menu-dots">...</span>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<FaRegFileAlt size={13} />}
                                  component="a"
                                  href={`/holiday-packages/invoice/${booking?.booking_reference}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View Invoice
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<FaRegFileAlt size={13} />}
                                  component="a"
                                  href={`/holiday-packages/voucher/${booking?.booking_reference}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View Voucher
                                </Menu.Item>
                                {booking?.booking_status?.toLowerCase() !== "cancelled" &&
                                  startDate &&
                                  moment(startDate).isAfter(moment(), "day") && (
                                    <Menu.Item
                                      leftSection={
                                        <RiDeleteBin6Line color="red" size={13} />
                                      }
                                      color="red"
                                      onClick={() =>
                                        setCancelModal({
                                          opened: true,
                                          bookingReference: booking?.booking_reference,
                                          packageId:
                                            booking?.package_id ||
                                            booking?.package_context?.package_id ||
                                            booking?.id ||
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
              <span
                className="text-muted"
                style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}
              >
                Showing{" "}
                {filteredBookings.length === 0
                  ? 0
                  : (activePage - 1) * ITEMS_PER_PAGE + 1}
                –{Math.min(activePage * ITEMS_PER_PAGE, filteredBookings.length)} out
                of {filteredBookings.length}
              </span>
              {filteredBookings.length > ITEMS_PER_PAGE && (
                <Pagination
                  total={totalPages}
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
