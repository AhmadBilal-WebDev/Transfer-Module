"use client";

import Image from "next/image";
import React, { useState } from "react";
import { GoPerson } from "react-icons/go";
import { PiSuitcaseRolling } from "react-icons/pi";
import {
  FaCar,
  FaCheck,
  FaCalendarAlt,
  FaClock,
  FaAngleRight,
  FaRegCheckCircle,
} from "react-icons/fa";
import { Tooltip } from "@mantine/core";
import moment from "moment";
import { useTransferStore } from "@/components/Store/TransferStore";
import { useRouter } from "next/navigation";
import VehicleDetail from "./VehicleDetail";
import { usePackageMode } from "@/components/Store/PackageModeHelper";
import { useHolidayPackageStore } from "@/components/Store/HolidayPackageStore";
import PriceDisplay from "@/components/Currency/PriceDisplay";
import { playfair, inter } from "@/lib/fonts";
import styles from "./TransferCard.module.css";

const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatTripTypeLabel = (type) => {
  const key = String(type || "").toLowerCase().trim();
  if (!key) return "";
  const labels = {
    "one-way": "One Way",
    one_way: "One Way",
    oneway: "One Way",
    return: "Return",
    "round-trip": "Return",
    round_trip: "Return",
    "all-round": "All Round",
    all_round: "All Round",
  };
  if (labels[key]) return labels[key];
  return String(type)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const isTripTypeCode = (value) =>
  /one[\s_-]?way|return|round[\s_-]?trip|all[\s_-]?round/i.test(
    String(value || ""),
  );

const formatServiceType = (item, searchParams) => {
  const rawCode = item?.transfer_type_code || "";
  let service = "";

  if (rawCode && !isTripTypeCode(rawCode)) {
    service = String(rawCode)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  if (!service) service = "Private";

  const trip =
    formatTripTypeLabel(item?.trip_type) ||
    formatTripTypeLabel(searchParams?.transferType);

  if (service && trip) return `${service} · ${trip}`;
  return service || trip || "Private Chauffeur";
};

const formatTransferRoute = (location, searchParams) => {
  const pickup =
    location?.pickup_address?.trim() ||
    searchParams?.pickupLocation?.trim() ||
    "";
  const dropoff =
    location?.dropoff_address?.trim() ||
    searchParams?.dropoffLocation?.trim() ||
    "";
  if (pickup && dropoff) return `${pickup} → ${dropoff}`;
  return pickup || dropoff || "";
};

const buildVehicleTitle = (item) => {
  const name = capitalizeFirstLetter(item?.vehicle_details?.name);
  const category = capitalizeFirstLetter(
    item?.vehiclecategory?.name || item?.vehicle_details?.category || "",
  );
  if (name && category && !name.toLowerCase().includes(category.toLowerCase())) {
    return `${name} – ${category}`;
  }
  return name || category || "Transfer";
};

const formatPickupDateLabel = (raw) => {
  if (!raw) return "";
  const parsed = moment(raw);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : String(raw);
};

const formatPickupTimeLabel = (raw) => {
  if (!raw) return "";
  const parsed = moment(raw, ["HH:mm:ss", "HH:mm", moment.ISO_8601], true);
  if (parsed.isValid()) return parsed.format("hh:mm A");
  const fallback = moment(raw);
  return fallback.isValid() ? fallback.format("hh:mm A") : String(raw);
};

export default function TransferCard({
  transfers,
  searchParams,
  onSelectTransfer,
  selectedTransferId,
}) {
  const { setSelectedTransfer } = useTransferStore();
  const { selectedData } = useHolidayPackageStore();
  const [vehicleQuantity, setVehicleQuantity] = useState(1);
  const router = useRouter();
  const { isPackageMode, isEditMode, handleTransferSelection } =
    usePackageMode();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  if (
    (!transfers || transfers.length === 0) &&
    !(isPackageMode || isEditMode) &&
    !selectedData?.transfer
  ) {
    return (
      <div className={styles.emptyState} role="status" aria-live="polite">
        <div className={styles.emptyIcon} aria-hidden="true">
          <FaCar />
        </div>
        <p className={`${styles.emptyEyebrow} ${inter.className}`}>No matches</p>
        <h3 className={`${styles.emptyTitle} ${playfair.className}`}>No transfers found</h3>
        <p className={`${styles.emptyText} ${inter.className}`}>
          Nothing matches your current filters. Try a wider price range, another
          vehicle type, or reset filters to see all available transfers.
        </p>
      </div>
    );
  }

  const handleBooking = async (transfer) => {
    if (isSelecting || !transfer) return;
    const next = {
      ...transfer,
      searchParams,
      quantity: vehicleQuantity,
    };
    setSelectedTransfer(next);

    if (isPackageMode || isEditMode) {
      setIsSelecting(true);
      try {
        await handleTransferSelection(next, true);
      } finally {
        setIsSelecting(false);
      }
      return;
    }

    // Listing flow: select into summary first (checkout via Continue)
    if (typeof onSelectTransfer === "function") {
      onSelectTransfer(next, next._listIndex);
      setSelectedVehicle(null);
      return;
    }

    router.push("/transfers/checkout");
  };

  const handleViewDetail = (transfer) => {
    setSelectedVehicle(transfer);
    setVehicleQuantity(1);
  };

  const renderTransferCard = (
    item,
    key,
    { isIncluded = false, priceContent } = {},
  ) => {
    const firstLocation = item?.locations?.[0];
    const routeText = formatTransferRoute(firstLocation, searchParams);
    const title = buildVehicleTitle(item);
    const serviceType = formatServiceType(item, searchParams);
    const pax = item?.vehicle_details?.passenger_capacity;
    const bags = item?.vehicle_details?.luggage_capacity;
    const pickupDateRaw =
      searchParams?.pickupDate ||
      firstLocation?.pickup_date ||
      item?.pickup_date ||
      item?.booking_criteria?.pickup_date ||
      "";
    const pickupTimeRaw =
      searchParams?.pickupTime ||
      firstLocation?.pickup_time ||
      item?.pickup_time ||
      item?.booking_criteria?.pickup_time ||
      "";
    const dateLabel = formatPickupDateLabel(pickupDateRaw);
    const timeLabel = formatPickupTimeLabel(pickupTimeRaw);

    const featureItems = [
      pax != null && pax !== ""
        ? { key: "pax", icon: "person", label: `1-${pax} Pax` }
        : null,
      bags != null && bags !== ""
        ? { key: "bags", icon: "bags", label: `${bags} Bags` }
        : null,
      dateLabel ? { key: "date", icon: "date", label: dateLabel } : null,
      timeLabel ? { key: "time", icon: "time", label: timeLabel } : null,
    ].filter(Boolean);

    const itemKey =
      item?.id ??
      item?.transfer_id ??
      (item?._listIndex != null ? `idx-${item._listIndex}` : null) ??
      (typeof key === "number" ? `idx-${key}` : key);
    const isSelected =
      selectedTransferId != null &&
      (itemKey === selectedTransferId ||
        item?.id === selectedTransferId ||
        item?.transfer_id === selectedTransferId);

    const name = capitalizeFirstLetter(item?.vehicle_details?.name);
    const category = capitalizeFirstLetter(
      item?.vehiclecategory?.name || item?.vehicle_details?.category || "",
    );
    const mobileTitle = [name, category].filter(Boolean).join(" · ") || title;
    const mobileSubtitle =
      item?.vehicle_details?.vehicle_description ||
      item?.vehicle_details?.vehicle_type ||
      "";
    const amenities = Array.isArray(item?.vehicle_details?.amenities)
      ? item.vehicle_details.amenities
          .filter((a) => typeof a === "string" && a.trim())
          .slice(0, 3)
      : [];
    const currencyLabel = item?.convertedCurrency || item?.currency || "";
    const amountLabel =
      item?.convertedPrice != null
        ? Number(item.convertedPrice).toFixed(2)
        : item?.fare != null
          ? Number(item.fare).toFixed(2)
          : null;

    return (
      <article
        className={`${styles.transferCard} ${isIncluded ? styles.includedCard : ""} ${isSelected ? styles.selectedCard : ""} ${inter.className}`}
        key={key}
      >
        {/* Desktop layout */}
        <div className={styles.desktopOnly}>
          <div
            className={styles.mediaPanel}
            onClick={() => handleViewDetail(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleViewDetail(item);
              }
            }}
          >
            {item?.vehicle_image ? (
              <Image
                src={item.vehicle_image}
                alt={item?.vehicle_details?.name || "Transfer vehicle"}
                fill
                sizes="(max-width: 991px) 100vw, 50vw"
                quality={100}
                className={styles.cardImage}
              />
            ) : (
              <div className={styles.cardImagePlaceholder}>
                <FaCar />
              </div>
            )}
          </div>

          <div className={styles.cardBody}>
            <div className={styles.cardHeader}>
              <div className={styles.titleBlock}>
                <h3 className={`${styles.cardVehicleName} ${playfair.className}`}>
                  {title}
                </h3>
                <p className={styles.serviceType}>{serviceType}</p>
              </div>

              <div className={styles.priceBlock}>
                <span className={styles.priceLabel}>Total Fare</span>
                <p className={styles.priceValue}>{priceContent}</p>
                <span className={styles.priceVatNote}>VAT &amp; taxes included</span>
              </div>
            </div>

            {featureItems.length > 0 && (
              <div className={styles.featureBar}>
                {featureItems.map((feature, index) => (
                  <React.Fragment key={feature.key}>
                    {index > 0 && (
                      <span className={styles.featureDot} aria-hidden="true">
                        •
                      </span>
                    )}
                    <span className={styles.featureItem}>
                      {feature.icon === "person" && <GoPerson aria-hidden="true" />}
                      {feature.icon === "bags" && <PiSuitcaseRolling aria-hidden="true" />}
                      {feature.icon === "date" && <FaCalendarAlt aria-hidden="true" />}
                      {feature.icon === "time" && <FaClock aria-hidden="true" />}
                      {feature.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}

            {routeText && (
              <Tooltip
                label={routeText}
                position="top"
                withArrow
                fz="xs"
                multiline
                maw={320}
              >
                <p className={styles.routeText}>{routeText}</p>
              </Tooltip>
            )}

            <div className={styles.cardFooter}>
              <button
                type="button"
                onClick={() => handleViewDetail(item)}
                className={styles.detailBtn}
              >
                View Details
                <FaAngleRight aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleBooking(item)}
                className={`${styles.bookBtn} ${isSelected ? styles.bookBtnSelected : ""}`}
                disabled={isSelecting}
                aria-pressed={isSelected}
              >
                {isSelecting ? (
                  "Selecting…"
                ) : isSelected ? (
                  <>
                    <FaRegCheckCircle aria-hidden="true" />
                    Selected
                  </>
                ) : (
                  "Select"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile layout — matches design cards */}
        <div className={styles.mobileOnly}>
          {(serviceType || isSelected) && (
            <div className={styles.mobileTopRow}>
              <div className={styles.mobileTags}>
                {serviceType && (
                  <span className={styles.mobileTag}>{serviceType}</span>
                )}
                {category && (
                  <span className={styles.mobileTagMuted}>{category}</span>
                )}
              </div>
              {isSelected && (
                <span className={styles.mobileSelectedBadge}>
                  <FaCheck aria-hidden="true" /> Selected
                </span>
              )}
            </div>
          )}

          <div className={styles.mobileMain}>
            <button
              type="button"
              className={styles.mobileThumb}
              onClick={() => handleViewDetail(item)}
              aria-label="View vehicle details"
            >
              {item?.vehicle_image ? (
                <Image
                  src={item.vehicle_image}
                  alt={item?.vehicle_details?.name || "Transfer vehicle"}
                  fill
                  sizes="96px"
                  quality={100}
                  className={styles.mobileThumbImg}
                />
              ) : (
                <span className={styles.mobileThumbPlaceholder}>
                  <FaCar />
                </span>
              )}
            </button>

            <div className={styles.mobileInfo}>
              <h3 className={`${styles.mobileTitle} ${playfair.className}`}>
                {mobileTitle}
              </h3>
              {mobileSubtitle && (
                <p className={styles.mobileSubtitle}>{mobileSubtitle}</p>
              )}
            </div>
          </div>

          {featureItems.length > 0 && (
            <div className={styles.mobileSpecs}>
              {featureItems.map((feature) => (
                <span key={feature.key} className={styles.mobileSpec}>
                  {feature.icon === "person" && <GoPerson aria-hidden="true" />}
                  {feature.icon === "bags" && <PiSuitcaseRolling aria-hidden="true" />}
                  {feature.icon === "date" && <FaCalendarAlt aria-hidden="true" />}
                  {feature.icon === "time" && <FaClock aria-hidden="true" />}
                  {feature.label}
                </span>
              ))}
            </div>
          )}

          {amenities.length > 0 && (
            <div className={styles.mobileAmenityRow}>
              {amenities.map((label) => (
                <span key={label} className={styles.mobileAmenityPill}>
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className={styles.mobileFooter}>
            <div className={styles.mobilePriceBlock}>
              <span className={styles.mobileFareLabel}>Total Fare</span>
              <div className={styles.mobilePriceRow}>
                {currencyLabel && (
                  <span className={styles.mobileCurrency}>{currencyLabel}</span>
                )}
                <span className={`${styles.mobileAmount} ${playfair.className}`}>
                  {amountLabel ?? "—"}
                </span>
              </div>
              <span className={styles.mobilePriceNote}>
                VAT &amp; taxes included
              </span>
            </div>

            <div className={styles.mobileFooterActions}>
              <button
                type="button"
                className={styles.mobileDetailsLink}
                onClick={() => handleViewDetail(item)}
              >
                View Details
                <FaAngleRight aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.mobileSelectBtn} ${isSelected ? styles.mobileSelectBtnActive : ""}`}
                onClick={() => handleBooking(item)}
                disabled={isSelecting}
                aria-pressed={isSelected}
              >
                {isSelected ? (
                  <>
                    <FaRegCheckCircle aria-hidden="true" />
                    Selected
                  </>
                ) : (
                  "Select"
                )}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      <div className={styles.listWrap}>
        {(isPackageMode || isEditMode) && selectedData?.transfer && (
          <div className="mb-3">
            <div className={`alert alert-info ${styles.includedAlert}`}>
              <strong>✓ Transfer Included</strong> - You&apos;ve selected a
              different transfer from the available options.
            </div>

            {renderTransferCard(selectedData.transfer, "included-transfer", {
              isIncluded: true,
              priceContent: (
                <PriceDisplay
                  price={selectedData.transfer.price}
                  currency={selectedData.transfer.currency}
                />
              ),
            })}
          </div>
        )}

        <div className={styles.transferGrid}>
          {transfers.map((item, index) =>
            renderTransferCard(
              { ...item, _listIndex: index },
              index,
              {
                priceContent: (
                  <>
                    {item?.convertedCurrency} {item?.convertedPrice}
                  </>
                ),
              },
            ),
          )}
        </div>
      </div>

      <VehicleDetail
        showModal={!!selectedVehicle}
        handleCloseModal={() => setSelectedVehicle(null)}
        selectedTransferDetail={selectedVehicle}
        handleBookNow={() => handleBooking(selectedVehicle)}
        isPackageMode={isPackageMode}
        isEditMode={isEditMode}
        setVehicleQuantity={setVehicleQuantity}
        vehicleQuantity={vehicleQuantity}
        isSelecting={isSelecting}
        searchParams={searchParams}
      />
    </>
  );
}
