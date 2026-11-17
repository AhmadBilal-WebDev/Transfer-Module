"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TransferCard from "./TransferCard";
import TransferRouteMap from "./TransferRouteMap";
import TransferSummary from "./TransferSummary";
import { useTransferList } from "./TransferListingContext";
import SearchBar from "./Filters/SearchBar";
import VehicleCategoryFilter from "./Filters/VehicleCategoryFilter";
import TransmissionFilter from "./Filters/TransmissionFilter";
import PassengerCapacityFilter from "./Filters/PassengerCapacityFilter";
import LuggageCapacityFilter from "./Filters/LuggageCapacityFilter";
import SortOption from "./Filters/SortOption";
import PriceRange from "./Filters/PriceRange";
import ResetFilter from "./Filters/ResetFilter";
import TransferPaginations from "./TransferListingPaginations";
import { LiaAngleDownSolid } from "react-icons/lia";
import { Drawer } from "@mantine/core";
import { playfair, inter } from "@/lib/fonts";
import { useTransferStore } from "@/components/Store/TransferStore";
import styles from "./TransferFilters.module.css";

const MOBILE_FILTERS = [
  { id: "price", label: "Price" },
  { id: "name", label: "Name" },
  { id: "category", label: "Category" },
  { id: "transmission", label: "Transmission" },
  { id: "capacity", label: "Capacity" },
  { id: "luggage", label: "Luggage" },
];

const DRAWER_TITLES = {
  price: "Price Range",
  name: "Search by Name",
  category: "Vehicle Category",
  transmission: "Transmission Type",
  capacity: "Passenger Capacity",
  luggage: "Luggage Capacity",
};

function TransferResultCount({ totalRawTransfers = 0 }) {
  const { totalTransfers } = useTransferList();
  const isFiltered = totalTransfers !== totalRawTransfers && totalRawTransfers > 0;

  let titleText = "No transfers found for your journey";
  if (totalTransfers > 0) {
    if (isFiltered) {
      titleText = `${totalTransfers} of ${totalRawTransfers} transfers found for your journey`;
    } else {
      titleText = `${totalTransfers} transfer${totalTransfers !== 1 ? "s" : ""} found for your journey`;
    }
  }

  return (
    <div className="transfer-results-header transfer-results-header--full" aria-live="polite">
      <div className="transfer-results-header__copy">
        <p className={`transfer-results-header__eyebrow ${inter.className}`}>
          Verified Executive Chauffeurs
        </p>
        <h2 className={`transfer-results-header__title ${playfair.className}`}>
          {titleText}
        </h2>
      </div>
      <SortOption variant="header" />
    </div>
  );
}

function FilterDrawer({ opened, onClose, title, onReset, children }) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position="bottom"
      size="auto"
      keepMounted
      overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
      transitionProps={{ duration: 200 }}
      withinPortal={true}
      lockScroll={true}
      removeScrollProps={{ removeScrollBar: false }}
      trapFocus={false}
      zIndex={11000}
      styles={{
        title: { fontWeight: 700, fontSize: "1rem", color: "#1a1a1a" },
        header: { borderBottom: "1px solid #eceae5", paddingBottom: "0.75rem" },
        body: { paddingTop: "1rem" },
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      {/* <button type="button" onClick={onReset} className={styles.drawerReset}>
        Reset filters
      </button> */}
      <button type="button" onClick={onReset} className={styles.applyBtn}>
          Reset All Filters
        </button>
      <div className={styles.drawerFooter}>
        <button type="button" className={styles.drawerDone} onClick={onClose}>
          Done
        </button>
      </div>
    </Drawer>
  );
}

export default function Index({ searchParams, totalRawTransfers = 0 }) {
  const router = useRouter();
  const { setSelectedTransfer } = useTransferStore();
  const {
    transfers,
    resetFilters,
    search,
    vehicleCategory,
    transmissionType,
    passengerCapacity,
    luggageCapacity,
    priceRange,
    minPrice,
    maxPrice,
    availableTransmissions,
    setCurrentPage,
  } = useTransferList();

  const [activeDrawer, setActiveDrawer] = useState(null);
  const [summaryTransfer, setSummaryTransfer] = useState(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const hasTransmissionOptions = availableTransmissions?.length > 0;
  const visibleMobileFilters = MOBILE_FILTERS.filter(
    ({ id }) => id !== "transmission" || hasTransmissionOptions
  );

  const handleResetFilters = () => {
    resetFilters();
    setActiveDrawer(null);
  };

  const handleSelectTransfer = (transfer, listIndex) => {
    const withKey = {
      ...transfer,
      _summaryKey:
        transfer?.id ??
        transfer?.transfer_id ??
        `idx-${listIndex}`,
    };
    setSummaryTransfer(withKey);
    setSelectedTransfer(withKey);
  };

  useEffect(() => {
    if (!summaryTransfer) return;
    const node = document.querySelector(".transfer-listing-summary");
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [summaryTransfer]);

  const handleContinueToCheckout = () => {
    if (!summaryTransfer || isContinuing) return;
    setIsContinuing(true);
    setSelectedTransfer(summaryTransfer);
    router.push("/transfers/checkout");
  };

  const selectedTransferId =
    summaryTransfer?.id ??
    summaryTransfer?.transfer_id ??
    summaryTransfer?._summaryKey ??
    null;

  const isPriceActive =
    Array.isArray(priceRange) &&
    (priceRange[0] > minPrice || priceRange[1] < maxPrice);

  const isFilterActive = {
    price: isPriceActive,
    name: Boolean(search),
    category: vehicleCategory.length > 0,
    transmission: transmissionType.length > 0,
    capacity: passengerCapacity.length > 0,
    luggage: luggageCapacity.length > 0,
  };

  return (
    <div>
      <div className="row transfer-listing-layout g-3">
        <div className="col-lg-3 col-md-4 col-12">
          {/* Mobile: Filter Pills */}
          <div
            className={`filter-scroll d-flex gap-2 d-md-none mb-3 ${styles.mobilePills}`}
          >
            {visibleMobileFilters.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveDrawer(id)}
                className={`${styles.filterPill} ${
                  isFilterActive[id] ? styles.filterPillActive : ""
                }`}
              >
                {label}
                <span className={styles.arrow}>
                  <LiaAngleDownSolid />
                </span>
              </button>
            ))}
          </div>

          {/* Desktop: Map + filters */}
          <div className="d-none d-md-block transfer-listing-sidebar-stack">
            <TransferRouteMap
              searchParams={searchParams}
              transferCount={totalRawTransfers}
            />
            <aside className={`${styles.sidebar} mt-3`}>
              {/* <div className={styles.sidebarHeader}>
                <p className={styles.sidebarTitle}>Filters</p>
                <button
                  type="button"
                  className={styles.sidebarReset}
                  onClick={() => {
                    resetFilters();
                    setCurrentPage?.(1);
                  }}
                >
                  Reset
                </button>
              </div> */}

              <SearchBar />
              <VehicleCategoryFilter />
              <TransmissionFilter />
              <PassengerCapacityFilter />
              <LuggageCapacityFilter />
              <PriceRange />
              <ResetFilter variant="apply" />
            </aside>
          </div>

          {summaryTransfer && (
            <div className="mt-3 transfer-listing-summary">
              <TransferSummary
                transfer={summaryTransfer}
                searchParams={searchParams}
                onContinue={handleContinueToCheckout}
                isContinuing={isContinuing}
              />
            </div>
          )}

          {/* Mobile: Filter Drawers */}
          {visibleMobileFilters.map(({ id }) => (
            <FilterDrawer
              key={id}
              opened={activeDrawer === id}
              onClose={() => setActiveDrawer(null)}
              title={DRAWER_TITLES[id]}
              onReset={handleResetFilters}
            >
              {id === "price" && <PriceRange />}
              {id === "name" && <SearchBar />}
              {id === "category" && <VehicleCategoryFilter />}
              {id === "transmission" && hasTransmissionOptions && <TransmissionFilter />}
              {id === "capacity" && <PassengerCapacityFilter />}
              {id === "luggage" && <LuggageCapacityFilter />}
            </FilterDrawer>
          ))}
        </div>

        <div className="col-lg-9 col-md-8 col-12">
          <TransferResultCount totalRawTransfers={totalRawTransfers} />
          <TransferCard
            transfers={transfers}
            searchParams={searchParams}
            onSelectTransfer={handleSelectTransfer}
            selectedTransferId={selectedTransferId}
          />
          <TransferPaginations />
        </div>
      </div>
    </div>
  );
}
