'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from "./RoomSelection.module.css";
import { usePackageStore } from '@/components/Store/PackageStore';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import PriceDisplay from '@/components/Currency/PriceDisplay';
export default function Page() {
  const [roomList, setRoomList] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { selectedPackage, setSelectedPackage } = usePackageStore();
  const router = useRouter();
  const [guestDistribution, setGuestDistribution] = useState({});
  const [withoutBedGuests, setWithoutBedGuests] = useState({});

  useEffect(() => {
    if (selectedPackage?.price_Details) {
      const roomsWithIds = selectedPackage.price_Details.map((r, i) => ({
        ...r,
        _id: r.type || `without_beds_${i}`, // fallback id for without_beds
      }));

      setRoomList(roomsWithIds);

      // Check if there are already selected rooms to restore from previous checkout attempt
      if (selectedPackage.selected_rooms && selectedPackage.selected_rooms.length > 0) {
        // Restore from selected_rooms
        const restoredQuantities = {};
        const restoredGuests = {};
        const restoredWithoutBed = {};

        roomsWithIds.forEach(room => {
          // Find if this room was previously selected
          const selectedRoom = selectedPackage.selected_rooms.find(sr => sr._id === room._id);

          if (selectedRoom) {
            restoredQuantities[room._id] = selectedRoom.rooms;
            restoredGuests[room._id] = {
              adult: selectedRoom.adults || 0,
              child: selectedRoom.children || 0,
              infant: selectedRoom.infants || 0,
            };
          } else {
            restoredQuantities[room._id] = 0;
            restoredGuests[room._id] = { adult: 0, child: 0, infant: 0 };
          }

          if (room.type !== 'without_beds') {
            restoredWithoutBed[room._id] = {
              adult: selectedRoom?.adults_without_bed || 0,
              child: selectedRoom?.children_without_bed || 0,
              infant: selectedRoom?.infants_without_bed || 0,
            };
          }
        });

        setQuantities(restoredQuantities);
        setGuestDistribution(restoredGuests);
        setWithoutBedGuests(restoredWithoutBed);
      } else {
        // Initialize fresh if no previous selections
        const initialQuantities = {};
        const initialGuests = {};
        const initialWithoutBed = {};
        roomsWithIds.forEach(room => {
          initialQuantities[room._id] = 0;
          initialGuests[room._id] = { adult: 0, child: 0, infant: 0 };
          if (room.type !== 'without_beds') {
            initialWithoutBed[room._id] = { adult: 0, child: 0, infant: 0 };
          }
        });
        setQuantities(initialQuantities);
        setGuestDistribution(initialGuests);
        setWithoutBedGuests(initialWithoutBed);
      }
    }
  }, [selectedPackage]);

  // --- Quantity handlers ---
  const handleIncrease = (roomId) => {
    const newQuantities = { ...quantities };
    newQuantities[roomId] = (newQuantities[roomId] || 0) + 1;
    const totalCapacity = Object.keys(newQuantities).reduce((sum, key) => {
      const room = roomList.find(r => r._id === key);
      return sum + (newQuantities[key] * (room?.max_pax || 0));
    }, 0);
    if (totalCapacity > selectedPackage?.pax) {
      notifications.show({
        title: 'Capacity Exceeded',
        message: `Total capacity cannot exceed package pax of ${selectedPackage?.pax}.`,
        color: 'red',
      })
      return;
    }
    setQuantities(newQuantities);
  };

  const handleDecrease = (roomId) => {
    if ((quantities[roomId] || 0) > 0) {
      const newQty = quantities[roomId] - 1;
      const room = roomList.find(r => r._id === roomId);
      const maxGuests = (room?.max_pax || 0) * newQty;
      const newGuestDistribution = { ...guestDistribution };
      const g = { ...(newGuestDistribution[roomId] || { adult: 0, child: 0, infant: 0 }) };
      const total = g.adult + g.child + g.infant;
      if (total > maxGuests) {
        let excess = total - maxGuests;
        const removeInfant = Math.min(g.infant, excess);
        g.infant -= removeInfant; excess -= removeInfant;
        const removeChild = Math.min(g.child, excess);
        g.child -= removeChild; excess -= removeChild;
        g.adult = Math.max(0, g.adult - excess);
      }
      newGuestDistribution[roomId] = g;
      setQuantities({ ...quantities, [roomId]: newQty });
      setGuestDistribution(newGuestDistribution);
    }
  };

  const handleToggleWithoutAccommodation = (roomId) => {
    const newQuantities = { ...quantities };
    const currentValue = newQuantities[roomId] || 0;
    newQuantities[roomId] = currentValue === 0 ? 1 : 0;
    setQuantities(newQuantities);

    const newGuestDistribution = { ...guestDistribution };
    newGuestDistribution[roomId] = { adult: 0, child: 0, infant: 0 };
    setGuestDistribution(newGuestDistribution);
  };
  // --- Derived values ---
  const totalRooms = Object.keys(quantities).reduce((sum, key) => {
    const room = roomList.find(r => r._id === key);
    return sum + ((room?.type !== "without_beds") ? quantities[key] : 0);
  }, 0);

  const totalCapacity = Object.keys(quantities).reduce((sum, key) => {
    const room = roomList.find(r => r._id === key);
    return sum + (quantities[key] * (room?.max_pax || 0));
  }, 0);

  const hasWithoutAccommodation = roomList.some(r => r.type === "without_beds" && (quantities[r._id] || 0) > 0);
  const withoutBedsRoom = roomList.find(r => r.type === 'without_beds');

  // --- Without-bed guest handler ---
  const handleWithoutBedChange = (roomId, guestType, increment) => {
    const newWB = { ...withoutBedGuests };
    const current = { ...(newWB[roomId] || { adult: 0, child: 0, infant: 0 }) };
    const roomQty = quantities[roomId] || 1;

    if (increment) {
      if (guestType === 'adult') {
        if (current.adult < roomQty) {
          current.adult++;
          // Enforce child limit: each room with an adult without bed can only have 1 child without bed
          const maxChildAfter = current.adult * 1 + (roomQty - current.adult) * 2;
          if (current.child > maxChildAfter) current.child = maxChildAfter;
        }
      } else if (guestType === 'child') {
        const maxChild = current.adult * 1 + (roomQty - current.adult) * 2;
        if (current.child < maxChild) current.child++;
      } else if (guestType === 'infant') {
        if (current.infant < roomQty) current.infant++;
      }
    } else {
      if (current[guestType] > 0) current[guestType]--;
    }

    newWB[roomId] = current;
    setWithoutBedGuests(newWB);
  };

  // --- Guest handlers ---
  const handleGuestChange = (roomId, guestType, increment) => {
    const room = roomList.find(r => r._id === roomId);
    const newGuestDistribution = { ...guestDistribution };
    const g = { ...(newGuestDistribution[roomId] || { adult: 0, child: 0, infant: 0 }) };

    if (increment) {
      if (room?.type === "without_beds") {
        g[guestType]++;
      } else {
        const maxGuests = (room?.max_pax || 0) * (quantities[roomId] || 0);
        const currentTotal = g.adult + g.child + g.infant;
        if (currentTotal < maxGuests) {
          g[guestType]++;
        }
      }
    } else {
      if (g[guestType] > 0) g[guestType]--;
    }

    newGuestDistribution[roomId] = g;
    setGuestDistribution(newGuestDistribution);
  };

  // --- Price calculations ---
  const calculateTotals = () => {
    let totals = { adult: 0, child: 0, infant: 0, adult_wb: 0, child_wb: 0, infant_wb: 0, grand: 0 };
    Object.keys(guestDistribution).forEach(roomId => {
      const room = roomList.find(r => r._id === roomId);
      if ((quantities[roomId] || 0) > 0) {
        const g = guestDistribution[roomId] || { adult: 0, child: 0, infant: 0 };
        totals.adult += g.adult * (Number(room?.sale_per_person) || 0);
        totals.child += g.child * (Number(room?.child_sale_per_person) || 0);
        totals.infant += g.infant * (Number(room?.infant_sale_per_person) || 0);
      }
    });
    // Without-bed extras (only for selected regular rooms) — use the without_beds entry prices
    Object.keys(withoutBedGuests).forEach(roomId => {
      const room = roomList.find(r => r._id === roomId);
      if ((quantities[roomId] || 0) > 0 && room?.type !== 'without_beds') {
        const wb = withoutBedGuests[roomId] || { adult: 0, child: 0, infant: 0 };
        totals.adult_wb += wb.adult * (Number(withoutBedsRoom?.sale_per_person) || 0);
        totals.child_wb += wb.child * (Number(withoutBedsRoom?.child_sale_per_person) || 0);
        totals.infant_wb += wb.infant * (Number(withoutBedsRoom?.infant_sale_per_person) || 0);
      }
    });
    totals.grand = totals.adult + totals.child + totals.infant + totals.adult_wb + totals.child_wb + totals.infant_wb;
    return totals;
  };
  const canContinue = totalRooms > 0 || hasWithoutAccommodation;

  const ProceedToCheckout = () => {
    if (!roomList.length) return [];
    const updated = roomList
      .filter(room => quantities[room._id] > 0) // only selected rooms
      .map(room => {
        const qty = quantities[room._id] || 0;
        const guests = guestDistribution[room._id] || { adult: 0, child: 0, infant: 0 };
        const totals = { adult: guests.adult, child: guests.child, infant: guests.infant };

        // Distribute totals across individual rooms by filling to max_pax capacity first
        const perRoomGuests = [];
        let remaining = { ...totals };
        for (let i = 0; i < qty; i++) {
          const rg = { adult: 0, child: 0, infant: 0 };
          let capacity = room.max_pax || 0;
          const a = Math.min(remaining.adult, capacity);
          rg.adult = a; remaining.adult -= a; capacity -= a;
          const c = Math.min(remaining.child, capacity);
          rg.child = c; remaining.child -= c; capacity -= c;
          const inf = Math.min(remaining.infant, capacity);
          rg.infant = inf; remaining.infant -= inf;
          perRoomGuests.push(rg);
        }

        const wb = withoutBedGuests[room._id] || { adult: 0, child: 0, infant: 0 };
        return {
          ...room,          // keep original room data
          rooms: qty,              // number of rooms
          adults: totals.adult,
          children: totals.child,
          infants: totals.infant,
          adult_price: Number(room?.sale_per_person) || 0,
          child_price: Number(room?.child_sale_per_person) || 0,
          infant_price: Number(room?.infant_sale_per_person) || 0,
          adults_without_bed: wb.adult,
          children_without_bed: wb.child,
          infants_without_bed: wb.infant,
          adult_without_bed_price: Number(withoutBedsRoom?.sale_per_person) || 0,
          child_without_bed_price: Number(withoutBedsRoom?.child_sale_per_person) || 0,
          infant_without_bed_price: Number(withoutBedsRoom?.infant_sale_per_person) || 0,
        };
      });
    const invalidRoom = updated.find(
      (r) => r.adults === 0 && r.children === 0 && r.infants === 0 && r.type !== 'without_beds'
    );
    if (invalidRoom) {
      notifications.show({
        title: "Guests Required",
        message: `Please select at least 1 guest in room.`,
        color: "red",
      });
      return;
    }
    selectedPackage.selected_rooms = updated;
    const totals = calculateTotals();
    selectedPackage.total_amount = totals.grand;
    setSelectedPackage(selectedPackage);
    router.push(`/${selectedPackage?.category?.slug}/checkout`);
  };

  return (
    <div className={styles.roomContainer}>
      <div className="container py-4 py-md-5">
        <nav className={styles.breadcrumb} aria-label="breadcrumb">
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep}>›</span>
          <Link href={`/${selectedPackage?.category?.slug || 'umrah-packages'}`}>
            Packages
          </Link>
          <span className={styles.breadcrumbSep}>›</span>
          <Link href={`/${selectedPackage?.category?.slug}/${selectedPackage?.slug}`}>
            {selectedPackage?.title || 'Package'}
          </Link>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>Select Your Package</span>
        </nav>

        <div className={styles.titleBox}>
          <h1>Select Your Package</h1>
        </div>

        {/* Room Cards */}
        <div className="row g-4">
          {roomList.filter(room => room.type !== 'without_beds').map(room => {
            const isSelected = (quantities[room._id] || 0) > 0;
            const totalRoomsOfType = quantities[room._id] || 0;
            const maxGuests = (room.max_pax || 0) * totalRoomsOfType;
            const gd = guestDistribution[room._id] || { adult: 0, child: 0, infant: 0 };
            const totalGuestsSelected = gd.adult + gd.child + gd.infant;
            const progress = maxGuests > 0 ? (totalGuestsSelected / maxGuests) * 100 : 0;

            return (
              <div className="col-lg-6" key={room._id}>
                <div className={`${styles.roomCard} ${isSelected ? styles.selectedCard : ''}`}>
                  {/* Room Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className={`${styles.roomTitle} mb-1`}>
                        {room.type === 'without_beds' ? 'Without Beds' : room.type} (Sharing)
                      </div>
                      {room.type !== "without_beds" && (
                        <p className={styles.roomSubtitle}>
                          {room.max_pax} {room.max_pax > 1 ? 'persons' : 'person'} per room
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <span className={styles.selectedBadge}>
                        {room.type === 'without_beds' ? 'Selected' : `${totalRoomsOfType} Selected`}
                      </span>
                    )}
                  </div>

                  {/* Pricing Info */}
                  <div className={`${styles.pricingGrid} mb-2`}>
                    <div className={styles.priceItem}>
                      <span>Adult</span>
                      <strong className="d-block"><PriceDisplay price={room?.sale_per_person} currency={selectedPackage?.currency_code} /></strong>
                    </div>
                    <div className={styles.priceItem}>
                      <span>Child</span>
                      <strong className="d-block"><PriceDisplay price={room?.child_sale_per_person} currency={selectedPackage?.currency_code} /></strong>
                    </div>
                    <div className={styles.priceItem}>
                      <span>Infant</span>
                      <strong className="d-block"><PriceDisplay price={room?.infant_sale_per_person} currency={selectedPackage?.currency_code} /></strong>
                    </div>
                  </div>

                  {/* Room Selection Controls */}
                  {room.type === "without_beds" ? (
                    <div className="text-center mb-3">
                      <button
                        onClick={() => handleToggleWithoutAccommodation(room._id)}
                        disabled={(quantities[room._id] || 0) > 0 ? false : Number(totalCapacity) >= Number(selectedPackage?.pax) ? true : false}
                        className={`${styles.toggleWithoutBtn} ${(quantities[room._id] || 0) > 0 ? styles.toggleWithoutBtnActive : ''}`}
                      >
                        {(quantities[room._id] || 0) > 0 ? "Remove Selection" : "Select Without Beds"}
                      </button>
                    </div>
                  ) : (
                    <div className={styles.roomsCountRow}>
                      <span className={styles.roomsCountLabel}>Number of Rooms</span>
                      <div className={styles.quantityControl}>
                        <button type="button" onClick={() => handleDecrease(room._id)}>-</button>
                        <span>{quantities[room._id] || 0}</span>
                        <button
                          type="button"
                          disabled={Number(totalCapacity) >= Number(selectedPackage?.pax)}
                          onClick={() => handleIncrease(room._id)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Guest Distribution - Shows when room is selected */}
                  {isSelected && (
                    <div className={styles.guestSection}>
                      <div className={styles.guestHeader}>
                        <h6>Guest Selection</h6>
                        {room.type !== 'without_beds' && (
                          <small>
                            {totalGuestsSelected} of {maxGuests} guests
                          </small>
                        )}
                      </div>

                      {room.type !== 'without_beds' && (
                        <div className={styles.progressTrack}>
                          <div
                            className={`${styles.progressFill} ${progress === 100 ? styles.progressFillComplete : ''}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}

                      {/* Guest Type Controls */}
                      <div className={styles.guestControls}>
                        <div className={styles.guestRow}>
                          <div>
                            <p className="guestLabel fw-semibold mb-0">Adults</p>
                            <p className={`${styles.guestPrice} text-muted small mb-0`}>
                              <PriceDisplay price={room?.sale_per_person} currency={selectedPackage?.currency_code} /> each
                            </p>
                          </div>
                          <div className={styles.quantityControl}>
                            <button type="button" onClick={() => handleGuestChange(room._id, 'adult', false)}>-</button>
                            <span>{guestDistribution[room._id]?.adult || 0}</span>
                            <button type="button" onClick={() => handleGuestChange(room._id, 'adult', true)}>+</button>
                          </div>
                        </div>

                        <div className={styles.guestRow}>
                          <div>
                            <p className="guestLabel fw-semibold mb-0">Children</p>
                            <p className={`${styles.guestPrice} text-muted small mb-0`}>
                              <PriceDisplay price={room?.child_sale_per_person} currency={selectedPackage?.currency_code} /> each
                            </p>
                          </div>
                          <div className={styles.quantityControl}>
                            <button type="button" onClick={() => handleGuestChange(room._id, 'child', false)}>-</button>
                            <span>{guestDistribution[room._id]?.child || 0}</span>
                            <button type="button" onClick={() => handleGuestChange(room._id, 'child', true)}>+</button>
                          </div>
                        </div>

                        <div className={styles.guestRow}>
                          <div>
                            <p className="guestLabel fw-semibold mb-0">Infants</p>
                            <p className={`${styles.guestPrice} text-muted small mb-0`}>
                              <PriceDisplay price={room?.infant_sale_per_person} currency={selectedPackage?.currency_code} /> each
                            </p>
                          </div>
                          <div className={styles.quantityControl}>
                            <button type="button" onClick={() => handleGuestChange(room._id, 'infant', false)}>-</button>
                            <span>{guestDistribution[room._id]?.infant || 0}</span>
                            <button type="button" onClick={() => handleGuestChange(room._id, 'infant', true)}>+</button>
                          </div>
                        </div>
                      </div>

                      {/* Without Bed Extras (only for regular room types, and only if without_beds prices are set) */}
                      {room.type !== 'without_beds' && withoutBedsRoom && (Number(withoutBedsRoom?.sale_per_person) > 0 || Number(withoutBedsRoom?.child_sale_per_person) > 0 || Number(withoutBedsRoom?.infant_sale_per_person) > 0) && (
                        <div className={styles.withoutBedSection}>
                          <div className={styles.withoutBedHeader}>
                            <span>Without Bed (Extra Guests)</span>
                            <small className="text-muted">
                              Max {totalRoomsOfType} adult, {totalRoomsOfType * 2} children, {totalRoomsOfType} infant
                            </small>
                          </div>
                          <div className={styles.guestControls}>
                            {Number(withoutBedsRoom?.sale_per_person) > 0 && (
                              <div className={styles.withoutBedRow}>
                                <div>
                                  <p className="guestLabel fw-semibold mb-0">Adult (No Bed)</p>
                                  <p className={`${styles.guestPrice} text-muted small mb-0`}>
                                    <PriceDisplay price={withoutBedsRoom?.sale_per_person} currency={selectedPackage?.currency_code} /> each
                                  </p>
                                </div>
                                <div className={styles.quantityControl}>
                                  <button type="button" onClick={() => handleWithoutBedChange(room._id, 'adult', false)}>-</button>
                                  <span>{withoutBedGuests[room._id]?.adult || 0}</span>
                                  <button
                                    type="button"
                                    disabled={(withoutBedGuests[room._id]?.adult || 0) >= totalRoomsOfType}
                                    onClick={() => handleWithoutBedChange(room._id, 'adult', true)}
                                  >+</button>
                                </div>
                              </div>
                            )}

                            {Number(withoutBedsRoom?.child_sale_per_person) > 0 && (
                              <div className={styles.withoutBedRow}>
                                <div>
                                  <p className="guestLabel fw-semibold mb-0">Child (No Bed)</p>
                                  <p className={`${styles.guestPrice} text-muted small mb-0`}>
                                    <PriceDisplay price={withoutBedsRoom?.child_sale_per_person} currency={selectedPackage?.currency_code} /> each
                                  </p>
                                </div>
                                <div className={styles.quantityControl}>
                                  <button type="button" onClick={() => handleWithoutBedChange(room._id, 'child', false)}>-</button>
                                  <span>{withoutBedGuests[room._id]?.child || 0}</span>
                                  <button
                                    type="button"
                                    disabled={(() => {
                                      const wb = withoutBedGuests[room._id] || { adult: 0, child: 0, infant: 0 };
                                      const maxChild = wb.adult * 1 + (totalRoomsOfType - wb.adult) * 2;
                                      return wb.child >= maxChild;
                                    })()}
                                    onClick={() => handleWithoutBedChange(room._id, 'child', true)}
                                  >+</button>
                                </div>
                              </div>
                            )}

                            {Number(withoutBedsRoom?.infant_sale_per_person) > 0 && (
                              <div className={styles.withoutBedRow}>
                                <div>
                                  <p className="guestLabel fw-semibold mb-0">Infant (No Bed)</p>
                                  <p className={`${styles.guestPrice} text-muted small mb-0`}>
                                    <PriceDisplay price={withoutBedsRoom?.infant_sale_per_person} currency={selectedPackage?.currency_code} /> each
                                  </p>
                                </div>
                                <div className={styles.quantityControl}>
                                  <button type="button" onClick={() => handleWithoutBedChange(room._id, 'infant', false)}>-</button>
                                  <span>{withoutBedGuests[room._id]?.infant || 0}</span>
                                  <button
                                    type="button"
                                    disabled={(withoutBedGuests[room._id]?.infant || 0) >= totalRoomsOfType}
                                    onClick={() => handleWithoutBedChange(room._id, 'infant', true)}
                                  >+</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Price Summary Section */}
        {canContinue && (
          <>
            <div className={styles.selectedSummary}>
              <h5 className={styles.summaryHeading}>Price Summary</h5>
              {(() => {
                const totals = calculateTotals();
                return (
                  <>
                    <div className={styles.summaryLine}>
                      <span>Adults:</span>
                      <strong><PriceDisplay price={totals.adult} currency={selectedPackage?.currency_code} /></strong>
                    </div>
                    <div className={styles.summaryLine}>
                      <span>Childs:</span>
                      <strong><PriceDisplay price={totals.child} currency={selectedPackage?.currency_code} /></strong>
                    </div>
                    <div className={styles.summaryLine}>
                      <span>Infants:</span>
                      <strong><PriceDisplay price={totals.infant} currency={selectedPackage?.currency_code} /></strong>
                    </div>
                    {totals.adult_wb > 0 && (
                      <div className={styles.summaryLine}>
                        <span>Adults (No Bed):</span>
                        <strong><PriceDisplay price={totals.adult_wb} currency={selectedPackage?.currency_code} /></strong>
                      </div>
                    )}
                    {totals.child_wb > 0 && (
                      <div className={styles.summaryLine}>
                        <span>Children (No Bed):</span>
                        <strong><PriceDisplay price={totals.child_wb} currency={selectedPackage?.currency_code} /></strong>
                      </div>
                    )}
                    {totals.infant_wb > 0 && (
                      <div className={styles.summaryLine}>
                        <span>Infants (No Bed):</span>
                        <strong><PriceDisplay price={totals.infant_wb} currency={selectedPackage?.currency_code} /></strong>
                      </div>
                    )}
                    <hr className={styles.summaryDivider} />
                    <div className={styles.summaryTotal}>
                      <h5 className={styles.summaryTotalLabel}>Grand Total</h5>
                      <h4 className={styles.summaryTotalValue}>
                        <PriceDisplay price={totals.grand} currency={selectedPackage?.currency_code} />
                      </h4>
                    </div>
                    <p className={styles.summaryNote}>Inclusive of VAT and Taxes</p>
                  </>
                );
              })()}
            </div>

            <div className={styles.checkoutActions}>
              <button
                type="button"
                onClick={ProceedToCheckout}
                className={styles.btnCheckout}
              >
                Proceed to check Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
