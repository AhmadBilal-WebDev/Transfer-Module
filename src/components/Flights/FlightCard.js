import React from "react";
import FlightDetail from "./FlightDetail";
import { useFlightList } from "./FlightListingContext";
import moment from "moment";
import airline from "@/util/airlines.json";
import { useFlightStore } from "../Store/FlightStore";
import { useRouter } from "next/navigation";
import PriceDisplay from '@/components/Currency/PriceDisplay';
import Image from "next/image";
import { FaPlane, FaSuitcase, FaClock } from "react-icons/fa";
import { usePackageMode } from "../Store/PackageModeHelper";
import { useHolidayPackageStore } from "../Store/HolidayPackageStore";
import { AirportList } from '@/util/AirportList';
import styles from "./FlightCard.module.css";

const PROMO_BADGES = ['Save 15%', 'Best Value', 'Premium Pick', 'AI-Optimized'];
const PROMO_VARIANTS = ['save', 'value', 'premium', 'ai'];

function getAmenities(group) {
  const items = [];
  const bagSeg = (group.segments || []).find((s) => s?.baggage_info) || group.segments?.[0];
  const info = bagSeg?.baggage_info;
  if (!info) return items;

  const adultBag = info.adult || Object.values(info).find(Boolean);
  if (!adultBag) return items;

  const checked = adultBag.checked != null ? String(adultBag.checked).trim() : '';
  const cabin = adultBag.cabin != null ? String(adultBag.cabin).trim() : '';

  if (checked) {
    items.push({ icon: FaSuitcase, label: checked });
  }
  if (cabin) {
    items.push({ icon: FaSuitcase, label: cabin });
  }

  return items.slice(0, 3);
}

function groupSegments(flight) {
  if (!flight || !flight.segments) return [];
  if (flight.trip_type === 'return') {
    const midpoint = Math.ceil(flight.segments.length / 2);
    return [
      { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
      { segments: flight.segments.slice(midpoint), label: 'Return' }
    ];
  } else if (flight.trip_type === 'multicity') {
    const legs = flight.search_criteria?.legs || [];
    if (legs.length === 0) {
      return flight.segments.map((segment, idx) => ({
        segments: [segment],
        label: `Flight ${idx + 1}`
      }));
    }

    const groupedLegs = [];
    let currentSegmentIndex = 0;

    legs.forEach((leg, legIndex) => {
      const legSegments = [];
      const destination = leg.destination;

      while (currentSegmentIndex < flight.segments.length) {
        const segment = flight.segments[currentSegmentIndex];
        legSegments.push(segment);
        currentSegmentIndex++;

        if (segment.arrival.airport_code === destination) {
          break;
        }
      }

      if (legSegments.length > 0) {
        groupedLegs.push({
          segments: legSegments,
          label: `Flight ${legIndex + 1}`
        });
      }
    });

    return groupedLegs;
  }
  return [{ segments: flight.segments, label: 'Departure' }];
}

function getAirportLabel(segment, type) {
  const code = segment?.[type]?.airport_code;
  const city = segment?.[type]?.city;
  const airport = AirportList.find((a) => a.airportCode === code);
  return {
    code: code || '—',
    name: airport?.airportName || city || code || '—',
  };
}

function getLegDuration(group) {
  return group.segments.reduce((acc, seg, segIdx) => {
    let time = acc + seg.duration;
    const nextSeg = group.segments[segIdx + 1];
    if (nextSeg) {
      time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
    }
    return time;
  }, 0);
}

function LegRoute({ group }) {
  const firstSegment = group.segments[0];
  const lastSegment = group.segments[group.segments.length - 1];
  const totalTime = getLegDuration(group);
  const dayDiff = moment(lastSegment?.arrival?.datetime).startOf('day').diff(
    moment(firstSegment?.departure?.datetime).startOf('day'), 'days'
  );
  const durationLabel = `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`;
  const stopCount = group.segments.length - 1;
  const stopLabel = stopCount === 0
    ? 'Direct'
    : `${stopCount} ${stopCount === 1 ? 'Stop' : 'Stops'}`;
  const stopDetail = stopCount === 1
    ? group.segments[0]?.arrival?.city || group.segments[0]?.arrival?.airport_code
    : null;
  const dep = getAirportLabel(firstSegment, 'departure');
  const arr = getAirportLabel(lastSegment, 'arrival');

  return (
    <div className={styles.legRoute}>
      {group.label !== 'Departure' && (
        <span className={styles.legRouteLabel}>{group.label}</span>
      )}
      <div className={styles.routeTop}>
        <div className={styles.routeTimeBlock}>
          <span className={styles.routeTime}>{moment(firstSegment.departure.datetime).format('h:mm A')}</span>
          <span className={styles.routeCode}>{dep.code}</span>
          <span className={styles.routeAirport}>{dep.name}</span>
          <span className={styles.routeDate}>{moment(firstSegment.departure.datetime).format('MMM D, ddd')}</span>
        </div>

        <div className={styles.routeMiddle}>
          <span className={styles.routeDuration}>{durationLabel}</span>
          <div className={styles.routeLineWrap}>
            <div className={styles.routeLine} />
            <FaPlane className={styles.routePlane} size={16} />
          </div>
          <span className={styles.routeStops}>
            {stopLabel}{stopDetail ? ` • ${stopDetail}` : ''}
          </span>
        </div>

        <div className={`${styles.routeTimeBlock} ${styles.routeTimeBlockRight}`}>
          <span className={styles.routeTime}>
            {moment(lastSegment.arrival.datetime).format('h:mm A')}
            {dayDiff > 0 && <sup className={styles.dayOffset}>+{dayDiff}</sup>}
          </span>
          <span className={styles.routeCode}>{arr.code}</span>
          <span className={styles.routeAirport}>{arr.name}</span>
          <span className={styles.routeDate}>{moment(lastSegment.arrival.datetime).format('MMM D, ddd')}</span>
        </div>
      </div>
    </div>
  );
}

function FlightCardItem({ flight, onSelect, includedBanner, cardIndex = 0 }) {
  const segmentGroups = groupSegments(flight);
  const primaryGroup = segmentGroups[0];
  const firstSegment = primaryGroup?.segments?.[0];
  const airlineData = airline.find((a) => a.iata === firstSegment?.airline?.code);
  const logoSrc = firstSegment?.airline?.logo_url || airlineData?.logo;
  const airlineName = firstSegment?.airline?.name || airlineData?.name || firstSegment?.airline?.code;
  const cabinClass = firstSegment?.cabin_class?.name || 'Economy';
  const amenities = primaryGroup ? getAmenities(primaryGroup) : [];

  return (
    <div className={styles.flightCard}>
      {includedBanner && (
        <div className={styles.includedBanner}>
          <strong>✓ Flight Included</strong> — You&apos;ve selected a different flight from the available options.
        </div>
      )}

      <div className={styles.cardLayout}>
        <div className={styles.airlinePanel}>
          <div className={styles.airlinePanelInner}>
            <div className={styles.airlineLogoWrapper}>
              {logoSrc && (
                <Image
                  src={logoSrc}
                  height={36}
                  width={36}
                  quality={50}
                  alt={airlineName}
                  className={styles.airlineLogo}
                />
              )}
            </div>
            <div className={styles.airlineMetaBlock}>
              <div className="d-flex flex-column gap-2">
                <span className={styles.airlineName}>{airlineName}</span>
                <span className={styles.airlineClass}>{cabinClass}</span>
              </div>
              <FlightDetail flightdata={flight} />
            </div>
          </div>

        </div>

        <div className={styles.routePanel}>
          {segmentGroups.map((group, idx) => (
            <LegRoute key={idx} group={group} />
          ))}
          {amenities.length > 0 && (
            <div className={styles.amenitiesRow}>
              {amenities.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <span key={idx} className={styles.amenityPill}>
                    <Icon aria-hidden="true" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.pricePanel}>
          <div className={styles.priceBlock}>
            <span className={styles.priceSuffix}>Total Price</span>
            <p className={styles.priceMain}>
              <PriceDisplay price={flight?.pricing?.total_amount} currency={flight?.pricing?.currency} />
            </p>
            <span className={styles.priceNote}>Vat and Taxes included</span>
          </div>

          <div className={styles.actionStack}>

            <button type="button" onClick={onSelect} className={styles.selectBtn}>
              Select Flight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlightCard() {
  const { flights } = useFlightList();
  const { setSelectedFlight } = useFlightStore();
  const { selectedData } = useHolidayPackageStore();
  const router = useRouter();

  const { isPackageMode, isEditMode, handleFlightSelection } = usePackageMode();

  const handleFlightSelect = (index) => {
    const selectedFlightData = flights[index];
    if (isPackageMode || isEditMode) {
      handleFlightSelection(selectedFlightData, true);
      return;
    }
    setSelectedFlight(selectedFlightData);
    router.push("/flights/checkout");
  };

  const handleSameFlightSelect = (flight) => {
    if (isPackageMode || isEditMode) {
      handleFlightSelection(flight, true);
    }
  };

  return (
    <div className={styles.flightList}>
      {flights.length === 0 && (
        <div className={styles.emptyState}>
          <Image src="/images/search-not-found.svg" alt="No Flights Found" width={150} height={200} />
          <h4 className={styles.emptyStateTitle}>No Flights Found</h4>
          <p className={styles.emptyStateText}>
            We couldn&apos;t find any flights that match your search details. Try adjusting your dates, destination, or filters to see more options.
          </p>
        </div>
      )}

      {(isPackageMode || isEditMode) && selectedData?.flight && (
        <FlightCardItem
          flight={selectedData.flight}
          onSelect={() => handleSameFlightSelect(selectedData.flight)}
          includedBanner
          cardIndex={0}
        />
      )}

      {flights.map((item, index) => (
        <FlightCardItem
          key={index}
          flight={item}
          onSelect={() => handleFlightSelect(index)}
          cardIndex={index}
        />
      ))}
    </div>
  );
}
