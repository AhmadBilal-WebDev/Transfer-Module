"use client";
import styles from "./voucher.module.css";
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
  FaBus,
  FaFileInvoice,
  FaHotel,
  FaPlaneArrival,
  FaPlaneDeparture,
  FaUser,
  FaUserFriends,
  FaHome,
  FaStar,
  FaConciergeBell,
  FaPassport,
  FaMapMarkerAlt,
  FaCommentDots,
  FaInfoCircle,
} from "react-icons/fa";
import { MdFlight, MdOutlineFileDownload } from "react-icons/md";
import { IoWarningOutline } from "react-icons/io5";
import QRCode from "react-qr-code";
import Link from "next/link";

export default function Page() {
  const { id } = useParams();
  const ref = useRef();
  const [voucherDetail, setVoucherDetail] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [voucherUrl, setVoucherUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setVoucherUrl(window.location.href);
    document.body.style.backgroundColor = "#f6f1e9";
    fetchDetails();
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [id]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const responses = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/packages/booking/${id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const res = await responses.json();
      setIsLoading(false);
      if (res.Success) {
        const uniqueRooms = [
          ...new Map(
            res?.Content?.booking.room_selections_original.map((room) => [
              room.type,
              room,
            ]),
          ).values(),
        ];
        res.Content.booking.room_selections_original = uniqueRooms;
        setVoucherDetail(res?.Content?.booking);
      } else {
        setErrorMessage(res?.Description);
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error fetching package details:", err);
    }
  };

  function capitalize(text) {
    if (!text) return "";
    return String(text).charAt(0).toUpperCase() + String(text).slice(1);
  }

  function capitalizeString(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const EXCURSION_CITY_ORDER = ["Makkah", "Madinah"];

  function groupExcursionsByCity(excursions) {
    if (!Array.isArray(excursions) || excursions.length === 0) return {};
    const groups = {};
    excursions.forEach((exc) => {
      const city = exc?.city || "Other";
      if (!groups[city]) groups[city] = [];
      groups[city].push(exc);
    });
    const ordered = {};
    EXCURSION_CITY_ORDER.forEach((city) => {
      if (groups[city]) ordered[city] = groups[city];
    });
    Object.keys(groups)
      .filter((city) => !EXCURSION_CITY_ORDER.includes(city))
      .sort()
      .forEach((city) => {
        ordered[city] = groups[city];
      });
    return ordered;
  }

  function getTransferExcursions(transfer) {
    return transfer?.items?.data?.excursions ?? [];
  }

  const getTotalGuests = () => {
    const op = voucherDetail?.other_passengers || {};
    const adults = voucherDetail?.room_selections_original?.reduce(
      (sum, room) =>
        sum +
        (room?.adultsInRoom >= 0 ? room?.adultsInRoom : room.adults || 0) +
        (room.adults_without_bed || 0),
      0,
    );
    const children = voucherDetail?.room_selections_original?.reduce(
      (sum, room) =>
        sum +
        (room?.childrenInRoom >= 0
          ? room?.childrenInRoom
          : room.children || 0) +
        (room.children_without_bed || 0),
      0,
    );
    const infants = voucherDetail?.room_selections_original?.reduce(
      (sum, room) =>
        sum +
        (room?.infantsInRoom >= 0 ? room?.infantsInRoom : room.infants || 0) +
        (room.infants_without_bed || 0),
      0,
    );
    return [
      `${adults} Adult${adults !== 1 ? "s" : ""}`,
      children > 0 && `${children} Child${children !== 1 ? "ren" : ""}`,
      infants > 0 && `${infants} Infant${infants !== 1 ? "s" : ""}`,
    ]
      .filter(Boolean)
      .join(", ");
  };
  const CalculateWithoutBeds = (type) => {
    const RoomList =
      voucherDetail?.room_selections_original.filter(
        (room) => room.type === type,
      ) || [];

    const adults = RoomList.reduce(
      (sum, room) => sum + (room.adults_without_bed || 0),
      0,
    );
    const children = RoomList.reduce(
      (sum, room) => sum + (room.children_without_bed || 0),
      0,
    );
    const infants = RoomList.reduce(
      (sum, room) => sum + (room.infants_without_bed || 0),
      0,
    );

    // ✅ agar sab zero hain
    if (adults === 0 && children === 0 && infants === 0) {
      return "-";
    }

    return `${adults} Adult${adults !== 1 ? "s" : ""}, ${children} Child${children !== 1 ? "ren" : ""}, ${infants} Infant${infants !== 1 ? "s" : ""}`;
  };
  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail.customer_exchange_rate)
      return Number(price || 0).toFixed(2);
    if (voucherDetail.currency_code === voucherDetail.customer_currency) {
      return Number(price).toFixed(2);
    }
    const convertedPrice =
      Number(price) * Number(voucherDetail.customer_exchange_rate);
    return convertedPrice.toFixed(2);
  }
  return (
    <div className={styles.pageWrapper}>
      {isLoading ? (
        <div className={`container px-0 ${styles.confirmationWrapper}`}>
          <div className="bg-white rounded shadow p-3">
            <HotelInvoiceLoader />
          </div>
        </div>
      ) : (
        <div className={`container px-0 ${styles.confirmationWrapper}`}>
          {errorMessage ? (
            <div className="bg-white shadow text-center p-5 rounded">
              <IoWarningOutline className="text-warning" size={120} />
              <h5 className="mt-4">{errorMessage}</h5>
            </div>
          ) : (
            <div ref={ref} className={styles.voucherCard}>
              {/* ── Watermark ── */}
              <div className={styles.watermark}>
                <Image
                  src="/watermark.png"
                  width={450}
                  height={450}
                  style={{
                    objectFit: "contain",
                    width: "100%",
                    height: "100%",
                  }}
                  alt="Watermark"
                  quality={100}
                />
              </div>

              {/* ── Royalane Header ── */}
              <div className={styles.brandHeader}>
                <div className={styles.brandHeaderTop}>
                  <div className={styles.brandLogo} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={180} height={44} className={styles.brandLogoImg} />
                  </div>
                  <div className={styles.brandContact}>
                    <a href="tel:+966509736777" className={styles.brandPhone}>
                      +966 509 736777
                    </a>
                    <a href="mailto:info@example.com" className={styles.brandEmail}>
                      info@example.com
                    </a>
                  </div>
                </div>
                <div className={styles.brandHeaderDivider} />
                <div className={styles.brandHeaderBottom}>
                  <h1 className={styles.mainTitle}>Package Booking Voucher</h1>
                  <p className={styles.mainSubtitle}>
                  Generated on {moment(voucherDetail?.packageDetails?.created_at).format("DD MMM YYYY, h:mm A")}
                  </p>
                </div>
              </div>

              {/* ── Overview ── */}
              <div className={styles.voucherDetailsBand}>
                <div className={styles.voucherBandInner}>
                  <div className={styles.voucherDetailsRow}>
                    <div className={styles.voucherDetailsLeft}>
                      <p className={styles.voucherForLabel}>Voucher For</p>
                      <h2 className={styles.customerName}>
                        {voucherDetail?.lead_title}{" "}
                        {voucherDetail?.lead_first_name}{" "}
                        {voucherDetail?.lead_last_name}
                      </h2>
                      <p className={styles.customerMeta}>
                        {voucherDetail?.packageDetails?.title}
                      </p>
                      <div className={styles.badgeRow}>
                        <div className={styles.statusBadgeGroup}>
                          <span className={styles.bookingDetailSmallLabel}>Booking:</span>
                          <span
                            className={`${styles.confirmedBadge} ${voucherDetail?.booking_status === "cancelled" ? styles.cancelledBadge : voucherDetail?.booking_status === "tentative" || voucherDetail?.booking_status === "pending" ? styles.tentativeBadge : ""}`}
                          >
                            {voucherDetail?.booking_status?.toUpperCase() ||
                              "CONFIRMED"}
                          </span>
                        </div>
                        <div className={styles.statusBadgeGroup}>
                          <span className={styles.bookingDetailSmallLabel}>Payment:</span>
                          <span
                            className={`${styles.confirmedBadge} ${String(voucherDetail?.payment_status || "").toLowerCase() === "paid" ? styles.paidBadge : String(voucherDetail?.payment_status || "").toLowerCase() === "pending" ? styles.pendingBadge : ""}`}
                          >
                            {voucherDetail?.payment_status?.toUpperCase() ||
                              "PENDING"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.voucherDetailsRight}>
                      {voucherDetail?.booking_reference && <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>
                          Booking Ref
                        </span>
                        <span className={styles.bookingDetailValue}>
                          {voucherDetail?.booking_reference}
                        </span>
                      </div>}
                      {voucherDetail?.invoice_number && <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>
                          Invoice Number
                        </span>
                        <span className={styles.bookingDetailValue}>
                          {voucherDetail?.invoice_number}
                        </span>
                      </div>}
                      {(voucherDetail?.customer_total_after_discount ||
                        voucherDetail?.grand_total_after_discount) && (
                          <div className={styles.summaryLine}>
                            <span className={styles.bookingDetailLabel}>
                              Total Amount
                            </span>
                            <span className={styles.bookingDetailValue}>
                              {voucherDetail?.customer_currency ||
                                voucherDetail?.currency_code}{" "}
                              {voucherDetail?.customer_total_after_discount ||
                                voucherDetail?.grand_total_after_discount}
                            </span>
                          </div>
                        )}
                      <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>
                          Duration
                        </span>
                        <span className={styles.bookingDetailValue}>
                          {moment(voucherDetail?.packageDetails?.end_date).diff(
                            moment(voucherDetail?.packageDetails?.start_date),
                            "days",
                          )}{" "}
                          Nights
                        </span>
                      </div>
                      <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>
                          Total Guests
                        </span>
                        <span className={styles.bookingDetailValue}>
                          {getTotalGuests()}
                        </span>
                      </div>
                      {/* <div className={styles.qrInline}>
                        <QRCode
                          value={voucherUrl || " "}
                          size={64}
                          bgColor="#fcf8f7"
                          fgColor="#1a1a1a"
                        />
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════
                                PACKAGE DETAILS
                            ══════════════════════════════════ */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex align-items-center gap-2">
                    <span className={styles.sectionIconWrap}>
                      <FaStar size={12} />
                    </span>
                    PACKAGE DETAILS
                  </div>
                </div>
                <div className={styles.packageInfoGrid}>
                  <div className={styles.packageInfoMain}>
                    <h3 className={styles.packageTitle}>
                      {voucherDetail?.packageDetails?.title}
                    </h3>
                    {voucherDetail?.packageDetails?.star_rating && (
                      <div className={styles.starRow}>
                        {Array(
                          Math.floor(
                            Number(
                              voucherDetail?.packageDetails?.star_rating || 0,
                            ),
                          ),
                        )
                          .fill(0)
                          .map((_, i) => (
                            <FaStar key={i} size={13} color="#e31c23" />
                          ))}
                        <span className={styles.starLabel}>
                          {voucherDetail?.packageDetails?.star_rating} Star
                          Package
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={styles.packageInfoDates}>
                    <div className={styles.dateBox}>
                      <div className={styles.hotelDateRow}>
                        <span className={styles.hotelDateLabel}>From Date</span>
                        <span className={styles.hotelDateValue}>
                          {moment(
                            voucherDetail?.packageDetails?.start_date,
                          ).format("DD MMM YYYY")}
                        </span>
                      </div>
                    </div>
                    <div className={styles.dateBox}>
                      <div className={styles.hotelDateRow}>
                        <span className={styles.hotelDateLabel}>To Date</span>
                        <span className={styles.hotelDateValue}>
                          {moment(voucherDetail?.packageDetails?.end_date).format(
                            "DD MMM YYYY",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════
                                LEAD PASSENGER
                            ══════════════════════════════════ */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex align-items-center gap-2">
                    <span className={styles.sectionIconWrap}>
                      <FaUser size={12} />
                    </span>
                    PASSENGER DETAILS
                  </div>
                </div>
                <div className={styles.kvGrid}>
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Name</span>
                    <span className={styles.kvValue}>
                      {voucherDetail?.lead_title}{" "}
                      {voucherDetail?.lead_first_name}{" "}
                      {voucherDetail?.lead_last_name}
                    </span>
                  </div>
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Email</span>
                    <span className={styles.kvValue}>
                      {voucherDetail?.lead_email || "—"}
                    </span>
                  </div>
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Phone</span>
                    <span className={styles.kvValue}>
                      {voucherDetail?.lead_phone_code}
                      {voucherDetail?.lead_phone || "—"}
                    </span>
                  </div>
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Gender</span>
                    <span className={styles.kvValue}>
                      {capitalize(voucherDetail?.lead_gender) || "—"}
                    </span>
                  </div>
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Country</span>
                    <span className={styles.kvValue}>
                      {voucherDetail?.lead_country || "—"}
                    </span>
                  </div>
                  {voucherDetail?.lead_address && (
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Address</span>
                      <span className={styles.kvValue}>
                        {voucherDetail?.lead_address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ══════════════════════════════════
                                ADDITIONAL GUESTS
                            ══════════════════════════════════ */}
              {(voucherDetail?.other_passengers?.additional_adults?.length >
                0 ||
                voucherDetail?.other_passengers?.children_details?.length > 0 ||
                voucherDetail?.other_passengers?.infants_details?.length >
                0) && (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                      <div className="d-flex align-items-center gap-2">
                        <span className={styles.sectionIconWrap}>
                          <FaUserFriends size={12} />
                        </span>
                        ADDITIONAL GUESTS
                      </div>
                    </div>
                    <div className={styles.guestList}>
                      {voucherDetail?.other_passengers?.additional_adults?.map(
                        (adult, i) => (
                          <div key={`adult-${i}`} className={styles.guestRow}>
                            <span className={styles.guestIndex}>{i + 1}</span>
                            <span className={styles.guestName}>
                              {adult.first_name} {adult.last_name}
                            </span>
                            <span className={styles.guestMeta}>
                              {capitalize(adult.gender)}
                            </span>
                            <span className={styles.typeBadge}>Adult</span>
                          </div>
                        ),
                      )}
                      {voucherDetail?.other_passengers?.children_details?.map(
                        (child, i) => (
                          <div key={`child-${i}`} className={styles.guestRow}>
                            <span className={styles.guestIndex}>
                              {(voucherDetail?.other_passengers
                                ?.additional_adults?.length || 0) +
                                i +
                                1}
                            </span>
                            <span className={styles.guestName}>
                              {child.first_name} {child.last_name}
                              {child.age ? ` · ${child.age} yrs` : ""}
                            </span>
                            <span className={styles.guestMeta}>
                              {capitalize(child.gender)}
                            </span>
                            <span
                              className={`${styles.typeBadge} ${styles.typeBadgeChild}`}
                            >
                              Child
                            </span>
                          </div>
                        ),
                      )}
                      {voucherDetail?.other_passengers?.infants_details?.map(
                        (infant, i) => {
                          const offset =
                            (voucherDetail?.other_passengers
                              ?.additional_adults?.length || 0) +
                            (voucherDetail?.other_passengers?.children_details
                              ?.length || 0);
                          return (
                            <div key={`infant-${i}`} className={styles.guestRow}>
                              <span className={styles.guestIndex}>
                                {offset + i + 1}
                              </span>
                              <span className={styles.guestName}>
                                {infant.first_name} {infant.last_name}
                              </span>
                              <span className={styles.guestMeta}>
                                {capitalize(infant.gender)}
                              </span>
                              <span
                                className={`${styles.typeBadge} ${styles.typeBadgeInfant}`}
                              >
                                Infant
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

              {/* ══════════════════════════════════
                                ACCOMMODATION DETAILS
                            ══════════════════════════════════ */}
              {voucherDetail?.room_selections?.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}>
                        <FaHotel size={12} />
                      </span>
                      ACCOMMODATION
                    </div>
                  </div>
                  <div className={styles.segmentsWrapper}>
                    {voucherDetail.room_selections.map((item, index) => (
                      <div key={index} className={styles.flightSegmentCard}>
                        {/* Hotel header row */}
                        <div className={styles.airlineRow}>
                          <FaHotel size={22} color="#e31c23" />
                          <div>
                            <p className={styles.airlineNameText}>
                              {capitalizeString(item?.hotel?.name)}
                              <span className={styles.cityChip}>
                                {item?.hotel?.city}
                              </span>
                            </p>
                            <p className={styles.hotelMeta}>
                              <FaMapMarkerAlt size={12} />
                              {item?.hotel?.address}
                            </p>
                          </div>
                          <span className={styles.stayBadge}>Stay</span>
                        </div>
                        {/* Check-in / Check-out route */}
                        <div className={styles.routeFlex}>
                          <div className={styles.routeStation}>
                            <h4 className={styles.routeCity}>CHECK-IN</h4>
                            <p className={styles.routeTime}>
                              {moment(item?.hotel?.booked_from).format(
                                "DD MMM YYYY",
                              )}
                            </p>
                          </div>
                          <div
                            className={`${styles.routeStation} ${styles.routeStationRight}`}
                          >
                            <h4 className={styles.routeCity}>CHECK-OUT</h4>
                            <p className={styles.routeTime}>
                              {moment(item?.hotel?.booked_to).format(
                                "DD MMM YYYY",
                              )}
                            </p>
                          </div>

                          <div
                            className={`${styles.routeStation} ${styles.routeStationRight}`}
                          >
                            <h4 className={styles.routeCity}>Nights</h4>
                            <p className={styles.routeTime}>
                            {moment(item?.hotel?.booked_to).diff(
                                moment(item?.hotel?.booked_from),
                                "days",
                              )}{" "}
                            </p>
                          </div>
                        </div>
                        {/* Room table */}
                        <div className={styles.innerTableWrap}>
                          <table className={styles.premiumTable}>
                            <thead>
                              <tr>
                                <th className={styles.srCell}>#</th>
                                <th>Room Type</th>
                                <th>Meal / View</th>
                                <th>Adults</th>
                                <th>Children</th>
                                <th>Infant</th>
                                <th>Without Beds</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.rooms.map((room, rindex) => (
                                <tr key={rindex}>
                                  <td className={styles.srCell}>
                                    {rindex + 1}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>
                                    {room.selection.label === "without_beds"
                                      ? "Without Beds"
                                      : `${room.selection.label} × ${room.selection.rooms}`}
                                  </td>
                                  <td>
                                    {[
                                      room?.rooms?.items?.data?.meal,
                                      room?.rooms?.items?.data?.view,
                                    ]
                                      .filter(Boolean)
                                      .join(" + ") || "—"}
                                  </td>
                                  <td className="text-center">
                                    {room.selection.adults}
                                  </td>
                                  <td className="text-center">
                                    {room.selection.children}
                                  </td>
                                  <td className="text-center">
                                    {room.selection.infants}
                                  </td>
                                  <td className="text-center">
                                    {CalculateWithoutBeds(room.selection.type)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════
                                DEPARTURE FLIGHTS
                            ══════════════════════════════════ */}
              {voucherDetail?.flights?.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}>
                        <FaPlaneDeparture size={12} />
                      </span>
                      FLIGHT DETAILS
                    </div>
                  </div>
                  <div className={styles.segmentsWrapper}>
                    {voucherDetail.flights.map((item, index) =>
                      item.stops
                        ?.filter((s) => s.is_return === false)
                        .map((flight, fIndex) => (
                          <div
                            key={`dep-${index}-${fIndex}`}
                            className={styles.flightSegmentCard}
                          >
                            <div className={styles.airlineRow}>
                              <MdFlight size={26} color="#e31c23" />
                              <div>
                                <p className={styles.airlineNameText}>
                                  {flight.airline_name}
                                </p>
                                <p className={styles.flightNumberText}>
                                  {flight.flight_number}&nbsp;·&nbsp;
                                  {capitalize(flight.type)}
                                </p>
                              </div>
                            </div>
                            <div className={styles.routeGrid}>
                              <div className={styles.routeStation}>
                                <h4 className={styles.routeCity}>
                                  {flight?.departure_from}
                                </h4>
                                <p className={styles.routeAirport}>Departure</p>
                                <p className={styles.routeTime}>
                                  {moment
                                    .utc(flight.datetime_from)
                                    .format("DD MMM YYYY, LT")}
                                </p>
                              </div>
                              <div className={styles.routeArrow}>
                                <span className={styles.durationLabel}>
                                  {flight.duration}
                                </span>
                                <div className={styles.arrowLine}>
                                  <MdFlight className={styles.planeIcon} />
                                </div>
                              </div>
                              <div
                                className={`${styles.routeStation} ${styles.routeStationRight}`}
                              >
                                <h4 className={styles.routeCity}>
                                  {flight?.departure_to}
                                </h4>
                                <p className={styles.routeAirport}>Arrival</p>
                                <p className={styles.routeTime}>
                                  {moment
                                    .utc(flight.datetime_to)
                                    .format("DD MMM YYYY, LT")}
                                </p>
                              </div>
                            </div>
                          </div>
                        )),
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════
                                RETURN FLIGHTS
                            ══════════════════════════════════ */}
              {voucherDetail?.flights?.some((f) =>
                f.stops?.some((s) => s.is_return === true),
              ) && (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                      <div className="d-flex align-items-center gap-2">
                        <span className={styles.sectionIconWrap}>
                          <FaPlaneArrival size={12} />
                        </span>
                        RETURN FLIGHT
                      </div>
                    </div>
                    <div className={styles.segmentsWrapper}>
                      {voucherDetail.flights.map((item, index) =>
                        item.stops
                          ?.filter((s) => s.is_return === true)
                          .map((flight, fIndex) => (
                            <div
                              key={`ret-${index}-${fIndex}`}
                              className={styles.flightSegmentCard}
                            >
                              <div className={styles.airlineRow}>
                                <MdFlight size={26} color="#e31c23" />
                                <div>
                                  <p className={styles.airlineNameText}>
                                    {flight.airline_name}
                                  </p>
                                  <p className={styles.flightNumberText}>
                                    {flight.flight_number}&nbsp;·&nbsp;
                                    {capitalize(flight.type)}
                                  </p>
                                </div>
                              </div>
                              <div className={styles.routeGrid}>
                                <div className={styles.routeStation}>
                                  <h4 className={styles.routeCity}>
                                    {flight?.departure_from}
                                  </h4>
                                  <p className={styles.routeAirport}>Departure</p>
                                  <p className={styles.routeTime}>
                                    {moment
                                      .utc(flight.datetime_from)
                                      .format("DD MMM YYYY, LT")}
                                  </p>
                                </div>
                                <div className={styles.routeArrow}>
                                  <span className={styles.durationLabel}>
                                    {flight.duration}
                                  </span>
                                  <div className={styles.arrowLine}>
                                    <MdFlight className={styles.planeIcon} />
                                  </div>
                                </div>
                                <div
                                  className={`${styles.routeStation} ${styles.routeStationRight}`}
                                >
                                  <h4 className={styles.routeCity}>
                                    {flight?.departure_to}
                                  </h4>
                                  <p className={styles.routeAirport}>Arrival</p>
                                  <p className={styles.routeTime}>
                                    {moment
                                      .utc(flight.datetime_to)
                                      .format("DD MMM YYYY, LT")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )),
                      )}
                    </div>
                  </div>
                )}

              {/* ══════════════════════════════════
                                TRANSFER DETAILS
                            ══════════════════════════════════ */}
              {voucherDetail?.transfers?.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}>
                        <FaBus size={12} />
                      </span>
                      TRANSFER DETAILS
                    </div>
                  </div>
                  <div className={styles.segmentsWrapper}>
                    {voucherDetail.transfers.map((item, index) => (
                      <div key={index} className={styles.flightSegmentCard}>
                        <div className={styles.airlineRow}>
                          <FaBus size={22} color="#e31c23" />
                          <div>
                            <p className={styles.airlineNameText}>
                              {capitalize(item?.vehicle)}
                            </p>
                            <p className={styles.flightNumberText}>
                              {capitalize(item?.trip_type)}
                            </p>
                          </div>
                        </div>
                        {item.locations.map((loc, idx) => (
                          <div key={idx} className={styles.routeGrid}>
                            <div className={styles.routeStation}>
                              <h4 className={styles.routeCity}>PICKUP</h4>
                              <p className={styles.routeAirport}>
                                {loc.pickup_address}
                              </p>
                              <p className={styles.routeTime}>
                                {moment(loc.outbound).format(
                                  "DD MMM YYYY, HH:mm",
                                )}
                              </p>
                            </div>
                            <div className={styles.routeArrow}>
                              <span className={styles.durationLabel}>
                                {capitalize(item?.trip_type)}
                              </span>
                              <div className={styles.arrowLine}>
                                <FaBus className={styles.planeIcon} />
                              </div>
                            </div>
                            <div
                              className={`${styles.routeStation} ${styles.routeStationRight}`}
                            >
                              <h4 className={styles.routeCity}>DROPOFF</h4>
                              <p className={styles.routeAirport}>
                                {loc.dropoff_address}
                              </p>
                            </div>
                          </div>
                        ))}
                        {(() => {
                          const excursions = getTransferExcursions(item);
                          const byCity = groupExcursionsByCity(excursions);
                          const cities = Object.keys(byCity);
                          if (!cities.length) return null;
                          return (
                            <div className={styles.excursionsSection}>
                              <div className={styles.excursionsHeader}>
                                <FaMapMarkerAlt
                                  size={14}
                                  className={styles.excursionsHeaderIcon}
                                />
                                <span>Included Ziyarat &amp; Excursions</span>
                              </div>
                              <div className={styles.excursionsCityGrid}>
                                {cities.map((city) => (
                                  <div
                                    key={city}
                                    className={styles.excursionCityGroup}
                                  >
                                    <div className={styles.excursionCityHeader}>
                                      <span className={styles.excursionCityName}>
                                        {city}
                                      </span>
                                      {/* <span className={styles.excursionCityCount}>
                                        {byCity[city].length}{" "}
                                        {byCity[city].length === 1
                                          ? "site"
                                          : "sites"}
                                      </span> */}
                                    </div>
                                    <ul className={styles.excursionList}>
                                      {byCity[city].map((exc, i) => (
                                        <li
                                          key={exc.id ?? `${city}-${i}`}
                                          className={styles.excursionItem}
                                        >
                                          <span className={styles.excursionIndex}>
                                            {i + 1}
                                          </span>
                                          <span className={styles.excursionName}>
                                            {exc.name}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════
                                ADDITIONAL SERVICES
                            ══════════════════════════════════ */}
              {voucherDetail?.additional_services?.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}>
                        <FaConciergeBell size={12} />
                      </span>
                      ADDITIONAL SERVICES
                    </div>
                  </div>
                  <div className={styles.sectionBody}>
                    <table className={styles.premiumTable}>
                      <thead>
                        <tr>
                          <th className={styles.srCell}>#</th>
                          <th>Service Name</th>
                          <th className="text-center">Quantity / Pax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voucherDetail.additional_services.map(
                          (item, index) => (
                            <tr key={index}>
                              <td className={styles.srCell}>{index + 1}</td>
                              <td style={{ fontWeight: 600 }}>{item.name}</td>
                              <td className="text-center">{item.quantity}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════
                                VISA DETAILS
                            ══════════════════════════════════ */}
              {voucherDetail?.visas?.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}>
                        <FaPassport size={12} />
                      </span>
                      VISA DETAILS
                    </div>
                  </div>
                  <div className={styles.visaCard}>
                    <div>
                      {voucherDetail.visas.map((item, index) => (
                        <div key={index}>
                          <div className={styles.visaType}>
                            {item?.visa_type || "—"}
                          </div>
                          {item?.visa_description && (
                            <div className={styles.visaDesc}>
                              {item.visa_description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className={styles.confirmedBadge}>Included</span>
                  </div>
                </div>
              )}

              {/* CANCELLATION POLICY SECTION */}
              {voucherDetail?.packageDetails?.cancellation_policy && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex gap-2">
                      <span className={`${styles.sectionIconWrap} mt-1`}>
                        <IoWarningOutline size={13} />
                      </span>
                      CANCELLATION POLICY
                    </div>
                  </div>
                  <div>
                    {voucherDetail.packageDetails.cancellation_policy
                      .cancel_policy === "refundable" &&
                      !!voucherDetail.packageDetails.cancellation_policy
                        .cancellation_policies?.length ? (
                      <ul className={styles.policyList}>
                        {voucherDetail.packageDetails.cancellation_policy.cancellation_policies.map(
                          (policy, i) => (
                            <li key={i}>
                              If cancelled{" "}
                              <strong>{policy.time_duration} hours</strong>{" "}
                              before departure, a{" "}
                              {policy.type === "percentage" ? (
                                <>
                                  <strong>{policy.value}%</strong> cancellation
                                  charge
                                </>
                              ) : (
                                <>
                                  fixed cancellation charge of{" "}
                                  <strong>
                                    {voucherDetail.customer_currency}{" "}
                                    {convertToCustomerCurrency(policy.value)}
                                  </strong>
                                </>
                              )}{" "}
                              will apply.
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <div className={styles.nonRefundNote}>
                        This booking is non-refundable. No refund will be issued
                        for cancellations.
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* SPECIAL REQUEST SECTION */}
              {voucherDetail?.special_request && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}>
                        <FaCommentDots size={12} />
                      </span>
                      SPECIAL REQUEST
                    </div>
                  </div>
                  <div className={styles.requestBox}>
                    {voucherDetail.special_request}
                  </div>
                </div>
              )}
              {/* ── Important Information ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex gap-2">
                    <span className={`${styles.sectionIconWrap} mt-1`}>
                      <FaInfoCircle size={12} />
                    </span>
                    IMPORTANT INFORMATION
                  </div>
                </div>
                <ul className={styles.importantList}>
                  <li>
                    Please present this voucher at check-in for all included
                    services.
                  </li>
                  <li>
                    All passengers must carry valid photo identification at all
                    times.
                  </li>
                  <li>
                    Check-in times and service schedules are subject to operator
                    confirmation.
                  </li>
                  <li>
                    This package voucher covers only the services listed above.
                  </li>
                  <li>
                    This is a computer-generated receipt and does not require a
                    physical signature.
                  </li>
                </ul>
              </div>

              {/* ── Royalane Footer ── */}
              <div className={styles.voucherFooter}>
                <div className={styles.voucherFooterTop}>
                  <p className={styles.voucherFooterThanks}>
                    Thanks For Choosing Us
                  </p>
                  <p className={styles.voucherFooterBrand} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={140} height={34} className={styles.brandLogoImg} />
                  </p>
                </div>
                <div className={styles.voucherFooterDivider} />
                <div className={styles.voucherFooterBottom}>
                  <div className={styles.voucherFooterMeta}>
                    <a href="tel:+966509736777">+966509736777</a>
                    <a href="mailto:info@example.com">
                      info@example.com
                    </a>
                  </div>
                  <p className={styles.voucherFooterAddress}>
                    ABC Street, XYZ Country
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Action Buttons ── */}
      {!isLoading && !errorMessage && (
        <div className={`container mb-3 px-0 ${styles.confirmationWrapper}`}>
          <div className={styles.actionRow}>
            <button
              className={styles.btnPrimary}
              onClick={() => window.print()}
            >
              <MdOutlineFileDownload size={17} />
              Print / Download Voucher
            </button>
            <Link
              href={`/${voucherDetail?.packageDetails?.category?.slug}/invoice/${voucherDetail?.booking_reference}`}
              style={{ textDecoration: "none" }}
            >
              <button className={styles.btnGold}>
                <FaFileInvoice size={14} />
                View Invoice
              </button>
            </Link>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button className={styles.btnHome} type="button">
                <FaHome size={14} />
                Go to Home
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
