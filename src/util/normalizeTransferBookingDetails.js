import moment from "moment";

/**
 * Normalize transfer booking/details API payloads.
 * API may return `selected_transfers` (object or array) and/or `transfer`.
 */
export function normalizeTransferBookingDetails(detail = {}) {
  const rawTransfer = detail?.selected_transfers || detail?.transfer || {};
  const transfer = Array.isArray(rawTransfer) ? rawTransfer[0] || {} : rawTransfer;
  const criteria = detail?.booking_criteria || {};
  const vehicle = detail?.vehicle_details || {};
  const vehicleCategory =
    detail?.vehiclecategory || detail?.vehicle_category || {};
  const lead = detail?.lead_passenger || {};
  const pricing = detail?.pricing || {};
  const pax = transfer?.paxes_distribution || {};

  const getBookedExtras = () => {
    const lists = [
      detail?.selected_extras,
      transfer?.selected_extras,
      transfer?.extras,
    ];
    for (const list of lists) {
      if (!Array.isArray(list) || !list.length) continue;
      const withUnits = list.filter((extra) => Number(extra?.units || 0) > 0);
      if (withUnits.length) return withUnits;
      if (
        list === detail?.selected_extras ||
        list === transfer?.selected_extras
      ) {
        return list.map((extra) => ({ ...extra, units: extra?.units ?? 1 }));
      }
    }
    return [];
  };

  const bookedExtras = getBookedExtras();
  const extrasTotal = bookedExtras.reduce(
    (sum, extra) =>
      sum + Number(extra?.amount || 0) * Number(extra?.units || 1),
    0,
  );

  const tripType = transfer?.trip_type || criteria?.transfer_type || "";
  const pickupLocation =
    detail?.exact_pickup_point ||
    criteria?.pickup_location ||
    transfer?.from?.description ||
    "";
  const dropoffLocation =
    detail?.exact_dropoff_point ||
    criteria?.dropoff_location ||
    transfer?.to?.description ||
    "";
  const pickupDate = criteria?.pickup_date || transfer?.pickup_date || null;
  const pickupTime = criteria?.pickup_time || transfer?.pickup_time || null;
  const dropoffDate = criteria?.dropoff_date || transfer?.dropoff_date || null;
  const dropoffTime = criteria?.dropoff_time || transfer?.dropoff_time || null;

  const vehicleName =
    vehicle?.name ||
    transfer?.vehicle_name ||
    transfer?.vehicle?.name ||
    vehicleCategory?.name ||
    "";
  const vehicleCategoryName =
    vehicleCategory?.name ||
    transfer?.vehicle_category ||
    transfer?.vehicle?.category_name ||
    vehicle?.category ||
    "";
  const passengerCapacity =
    vehicle?.passenger_capacity ??
    vehicle?.max_pax ??
    vehicleCategory?.max_capacity ??
    transfer?.service_information?.find((s) => s.id === "MAXPAX")?.value ??
    "N/A";
  const luggageCapacity =
    vehicle?.luggage_capacity ??
    vehicleCategory?.luguage_capacity ??
    vehicleCategory?.luggage_capacity ??
    transfer?.service_information?.find((s) => s.id === "LUGGAGE")?.value ??
    "N/A";

  const bookedQty = detail?.booked_qty || 1;
  const totalPassengers =
    pax?.total ||
    criteria?.passengers ||
    Number(pax?.adults || 0) +
      Number(pax?.children || 0) +
      Number(pax?.infants || 0) ||
    (1 + (detail?.guest_details?.length || 0)) ||
    1;

  const displayAmount =
    pricing?.amount_in_display_currency ??
    pricing?.amount_after_exchange ??
    pricing?.final_amount ??
    transfer?.fare ??
    0;

  const displayCurrency =
    pricing?.display_currency ||
    pricing?.customer_currency ||
    pricing?.currency ||
    transfer?.currency ||
    "";

  const isMultiLocation =
    tripType === "all-around" ||
    tripType === "all-round" ||
    tripType === "return";

  const locations = Array.isArray(transfer?.locations) ? transfer.locations : [];

  return {
    transfer,
    criteria,
    vehicle,
    vehicleCategory,
    lead,
    pricing,
    pax,
    bookedExtras,
    extrasTotal,
    tripType,
    pickupLocation,
    dropoffLocation,
    pickupDate,
    pickupTime,
    dropoffDate,
    dropoffTime,
    vehicleName,
    vehicleCategoryName,
    passengerCapacity,
    luggageCapacity,
    bookedQty,
    totalPassengers,
    displayAmount,
    displayCurrency,
    isMultiLocation,
    locations,
  };
}

export function formatTransferTime(time) {
  if (!time) return "";
  const parsed = moment(time, ["HH:mm:ss", "HH:mm"], true);
  return parsed.isValid() ? parsed.format("hh:mm A") : time;
}
