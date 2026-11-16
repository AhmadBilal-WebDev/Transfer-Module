'use client'
import React, { useState, useMemo } from 'react'
import { BiCalendar } from "react-icons/bi";
import { IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from "react-icons/io5";
import { FiClock, FiUsers, FiRefreshCw, FiZap } from "react-icons/fi";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import moment from 'moment';
import AdditionalServices from './AdditionalServices';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { useActivityStore } from '@/components/Store/ActivityStore';
import { useRouter } from 'next/navigation';
import Availability from './Availability';
import styles from './Availability.module.css';

export default function Selection({ PackageDetail }) {
  const { setSelectedActivity } = useActivityStore();
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [adultCount, setAdultCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const totalPeople = adultCount + childCount;

  const handleAdultChange = (changeType) => {
    if (changeType === 'plus') {
      if (totalPeople < (PackageDetail?.max_people || 10)) {
        setAdultCount(adultCount + 1);
      }
    } else if (changeType === 'minus' && adultCount > 0) {
      setAdultCount(adultCount - 1);
    }
  };

  const handleChildChange = (changeType) => {
    if (changeType === 'plus') {
      if (totalPeople < (PackageDetail?.max_people || 10)) {
        setChildCount(childCount + 1);
      }
    } else if (changeType === 'minus' && childCount > 0) {
      setChildCount(childCount - 1);
    }
  };

  const adultPrice = adultCount * Number(PackageDetail?.sale_price || 0);
  const childPrice = childCount * Number(PackageDetail?.child_sale_price || 0);
  const participantsTotal = adultPrice + childPrice;

  const perPersonServicesTotal = useMemo(() => {
    return selectedServices
      .filter(service => service.type === 'per_person')
      .reduce((acc, service) => acc + (service.quantity * Number(service.price)), 0);
  }, [selectedServices, totalPeople]);

  const perBookingServicesTotal = useMemo(() => {
    return selectedServices
      .filter(service => service.type === 'per_booking')
      .reduce((acc, service) => acc + Number(service.total), 0);
  }, [selectedServices]);

  const grandTotal = participantsTotal + perPersonServicesTotal + perBookingServicesTotal;

  const minPeople = PackageDetail?.min_people || 1;
  const maxPeople = PackageDetail?.max_people || 5;
  const isValidPeopleCount = totalPeople >= minPeople && totalPeople <= maxPeople;

  const cancelPolicy = PackageDetail?.cancellation_policy?.cancel_policy
    || (typeof PackageDetail?.cancellation_policy === 'string'
      ? (() => { try { return JSON.parse(PackageDetail.cancellation_policy)?.cancel_policy; } catch { return null; } })()
      : null);
  const isRefundable = cancelPolicy === 'refundable' || PackageDetail?.is_refundable;

  const renderCancellationPolicy = () => {
    const cancellationPolicy = PackageDetail?.cancellation_policy;

    if (!cancellationPolicy) {
      return (
        <div className={styles.policyEmpty}>
          No cancellation policy available.
        </div>
      );
    }

    const { cancel_policy, cancellation_policies } = cancellationPolicy;

    if (cancel_policy === 'non-refundable') {
      return (
        <div className={`${styles.policyStatus} ${styles.policyStatusDanger}`}>
          <IoCloseCircle className={styles.policyStatusIcon} aria-hidden="true" />
          <div>
            <h6 className={styles.policyStatusTitle}>Non-Refundable</h6>
            <p className={styles.policyStatusText}>
              This booking cannot be cancelled or refunded under any circumstances.
            </p>
          </div>
        </div>
      );
    }

    if (cancel_policy === 'refundable' && cancellation_policies && cancellation_policies.length > 0) {
      const sortedPolicies = [...cancellation_policies].sort((a, b) => b.time_duration - a.time_duration);

      return (
        <div>
          <div className={`${styles.policyStatus} ${styles.policyStatusOk}`}>
            <IoCheckmarkCircle className={styles.policyStatusIcon} aria-hidden="true" />
            <div>
              <h6 className={styles.policyStatusTitle}>Refundable Booking</h6>
              <p className={styles.policyStatusText}>
                You can cancel this booking according to the policy below.
              </p>
            </div>
          </div>

          <h6 className={styles.policyTimelineTitle}>Cancellation Timeline:</h6>

          <div className={styles.policyTimeline}>
            {sortedPolicies.map((policy, index) => {
              const timeText = policy.time_duration >= 24
                ? `${policy.time_duration / 24} day${policy.time_duration / 24 > 1 ? 's' : ''}`
                : `${policy.time_duration} hour${policy.time_duration > 1 ? 's' : ''}`;

              let refundText = '';
              let refundAmount = '';
              let refundDescription = '';

              if (policy.type === 'percentage') {
                const refundPercentage = 100 - policy.value;
                refundText = `${policy.value}% Charge`;
                refundDescription = `${policy.value}% cancellation charge applies. You will receive ${refundPercentage}% of the total booking amount back.`;
              } else if (policy.type === 'fixed') {
                refundText = `Cancellation Fee`;
                refundAmount = policy.value;
                refundDescription = `A fixed cancellation fee will be charged.`;
              }

              return (
                <div
                  key={index}
                  className={`${styles.policyCard} ${index === 0 ? styles.policyCardPrimary : styles.policyCardMuted}`}
                >
                  <div className={styles.policyCardHead}>
                    <h6 className={styles.policyCardTime}>
                      <IoTimeOutline className={styles.policyCardTimeIcon} size={18} aria-hidden="true" />
                      {timeText} before activity
                    </h6>
                    <span
                      className={`${styles.policyBadge} ${
                        policy.type === 'percentage' ? styles.policyBadgePct : styles.policyBadgeFee
                      }`}
                    >
                      {refundText}
                    </span>
                  </div>

                  <p className={styles.policyCardDesc}>{refundDescription}</p>

                  {policy.type === 'fixed' && (
                    <div className={styles.policyFeeLine}>
                      Cancellation Fee:{' '}
                      <PriceDisplay price={refundAmount} currency={PackageDetail?.currency_code} />
                    </div>
                  )}

                  {policy.type === 'percentage' && policy.value === 0 && (
                    <div className={styles.policyFullRefund}>
                      ✓ Full refund - No cancellation charges
                    </div>
                  )}
                  {policy.type === 'percentage' && policy.value === 100 && (
                    <div className={styles.policyNoRefund}>
                      ⚠ No refund - 100% cancellation charge
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.policyNote}>
            <strong>Important:</strong> Cancellation must be made before the stated time.
            After this period, the booking is non-refundable.
          </div>
        </div>
      );
    }

    return (
      <div className={`${styles.policyStatus} ${styles.policyStatusOk}`}>
        <IoCheckmarkCircle className={styles.policyStatusIcon} aria-hidden="true" />
        <div>
          <h6 className={styles.policyStatusTitle}>Free Cancellation</h6>
          <p className={styles.policyStatusText}>
            This booking can be cancelled free of charge.
          </p>
        </div>
      </div>
    );
  };

  const HandleBookNow = () => {
    const getActivityTimingForDate = (date, openHours) => {
      if (!date || !openHours) return null;
      const dayName = moment(date).format('dddd').toLowerCase();
      const dayInfo = openHours[dayName];
      if (!dayInfo || (dayInfo.enabled !== '1' && dayInfo.enabled !== true)) return null;
      const start = moment(dayInfo.open, 'h:mm A');
      const end = moment(dayInfo.close, 'h:mm A');
      if (!start.isValid() || !end.isValid()) return null;
      return {
        start: start.format('h:mm A'),
        end: end.format('h:mm A'),
      };
    };

    const activityTiming = getActivityTimingForDate(selectedDate, PackageDetail?.open_hours);

    const activityData = {
      'id': PackageDetail?.id,
      'title': PackageDetail?.title,
      'address': PackageDetail?.address,
      'included_items': PackageDetail?.included_items,
      'excluded_items': PackageDetail?.excluded_items,
      'banner_image': PackageDetail?.banner_image,
      'featured_image': PackageDetail?.featured_image,
      'duration': PackageDetail?.activity_duration,
      'slug': PackageDetail?.slug,
      'travel_date': selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : null,
      'activity_start_time': activityTiming?.start || null,
      'activity_end_time': activityTiming?.end || null,
      'adults': adultCount,
      'children': childCount,
      'meeting_and_pickup': PackageDetail.meeting_and_pickup,
      'rating_stars': PackageDetail?.rating_stars,
      'participants_total': participantsTotal,
      'services_total': perPersonServicesTotal + perBookingServicesTotal,
      'grand_total': grandTotal,
      'selected_services': selectedServices,
      'currency': PackageDetail?.currency_code,
      'price_per_adult': PackageDetail?.sale_price,
      'price_per_child': PackageDetail?.child_sale_price,
      'ppserson_services_total': perPersonServicesTotal,
      'pb_services_total': perBookingServicesTotal,
      'city': PackageDetail?.city,
      'country': PackageDetail?.country,
      'cancellation_policy_text': PackageDetail?.cancellation_policy_text,
      'cancellation_policy': PackageDetail?.cancellation_policy,
    };
    setSelectedActivity(activityData);
    router.push(`/activities/${PackageDetail.slug}/checkout`);
  };

  const maxGuestsLabel = PackageDetail?.max_guests || PackageDetail?.max_people;

  return (
    <div>
      <Modal
        opened={opened}
        onClose={close}
        title="Cancellation Policy"
        size="lg"
        centered
        radius="lg"
        classNames={{
          content: styles.policyModal,
          header: styles.policyModalHeader,
          title: styles.policyModalTitle,
          body: styles.policyModalBody,
          close: styles.policyModalClose,
        }}
      >
        <div className={styles.policyModalScroll}>
          {renderCancellationPolicy()}
        </div>
      </Modal>

      <div className={styles.card}>
        <div className={styles.priceHeader}>
          <div className={styles.priceGroup}>
            <div className={styles.priceBlock}>
              <span className={styles.priceLabel}>From</span>
              <p className={styles.priceValue}>
                <PriceDisplay price={PackageDetail?.sale_price} currency={PackageDetail?.currency_code} />
              </p>
              <span className={styles.priceLabel}>per guest</span>
            </div>
            {PackageDetail?.has_child_pricing === 1 && (
              <div className={styles.priceBlock}>
                <p className={`${styles.priceValue} ${styles.priceValueChild}`}>
                  <PriceDisplay price={PackageDetail?.child_sale_price} currency={PackageDetail?.currency_code} />
                </p>
                <span className={styles.priceLabel}>per child</span>
              </div>
            )}
          </div>
          <span className={`${styles.refundBadge} ${!isRefundable ? styles.nonRefundBadge : ''}`}>
            {isRefundable ? 'Refundable' : 'Non-refundable'}
          </span>
        </div>

        <Availability
          PackageDetail={PackageDetail}
          setSelectedDate={setSelectedDate}
          selectedDate={selectedDate}
        />

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Number of Guests</span>
          <div className={styles.guestControl}>
            <div className={styles.guestBtns}>
              <button
                type="button"
                className={styles.guestBtn}
                onClick={() => handleAdultChange('minus')}
                disabled={adultCount === 0}
                aria-label="Decrease adults"
              >
                −
              </button>
              <span className={styles.guestLabel}>
                {adultCount} Adult{adultCount !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                className={styles.guestBtn}
                onClick={() => handleAdultChange('plus')}
                disabled={totalPeople >= maxPeople}
                aria-label="Increase adults"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {PackageDetail?.has_child_pricing === 1 && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Children</span>
            <div className={styles.guestControl}>
              <span className={styles.guestLabel}>
                {childCount} Child{childCount !== 1 ? 'ren' : ''}
              </span>
              <div className={styles.guestBtns}>
                <button
                  type="button"
                  className={styles.guestBtn}
                  onClick={() => handleChildChange('minus')}
                  disabled={childCount === 0}
                  aria-label="Decrease children"
                >
                  −
                </button>
                <span className={styles.guestCount}>{childCount}</span>
                <button
                  type="button"
                  className={styles.guestBtn}
                  onClick={() => handleChildChange('plus')}
                  disabled={totalPeople >= maxPeople}
                  aria-label="Increase children"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`${styles.alertBox} ${styles.alertInfo}`}>
          Participant requirements: Minimum {minPeople} – Maximum {maxPeople} people
        </div>

        {PackageDetail?.additional_services && PackageDetail?.additional_services.length > 0 && (
          <AdditionalServices
            Services={PackageDetail?.additional_services || []}
            currency={PackageDetail?.currency_code}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            setServicesTotal={setServicesTotal}
          />
        )}

        <hr className={styles.divider} />

        {totalPeople > 0 && (
          <>
            {adultCount > 0 && (
              <div className={styles.summaryRow}>
                <span>
                  <PriceDisplay price={PackageDetail?.sale_price} currency={PackageDetail?.currency_code} /> x {adultCount} Adult{adultCount !== 1 ? 's' : ''}
                </span>
                <span>
                  <PriceDisplay price={adultPrice} currency={PackageDetail?.currency_code} />
                </span>
              </div>
            )}
            {childCount > 0 && (
              <div className={styles.summaryRow}>
                <span>
                  <PriceDisplay price={PackageDetail?.child_sale_price} currency={PackageDetail?.currency_code} /> x {childCount} Child{childCount !== 1 ? 'ren' : ''}
                </span>
                <span>
                  <PriceDisplay price={childPrice} currency={PackageDetail?.currency_code} />
                </span>
              </div>
            )}
            {selectedServices.map((service, index) => {
              const serviceTotal = service.type === 'per_person'
                ? service.quantity * Number(service.price)
                : Number(service.total);
              return (
                <div key={index} className={styles.summaryRow}>
                  <span>{service.name}</span>
                  <span>
                    <PriceDisplay price={serviceTotal} currency={PackageDetail?.currency_code} />
                  </span>
                </div>
              );
            })}
          </>
        )}

        <div className={styles.summaryTotal}>
          <span>Total Amount</span>
          <span className={styles.totalAmount}>
            <PriceDisplay price={grandTotal} currency={PackageDetail?.currency_code} />
          </span>
        </div>

        {totalPeople > 0 && !isValidPeopleCount && (
          <div className={`${styles.alertBox} ${styles.alertWarn}`}>
            {totalPeople < minPeople && `Please select at least ${minPeople} participant${minPeople > 1 ? 's' : ''}.`}
            {totalPeople > maxPeople && `Maximum ${maxPeople} participants allowed.`}
          </div>
        )}

        <button
          type="button"
          className={styles.policyLink}
          onClick={open}
        >
          <BiCalendar />
          Cancellation Policy
        </button>

        <button
          type="button"
          onClick={HandleBookNow}
          className={styles.bookBtn}
          disabled={!selectedDate || !isValidPeopleCount || totalPeople === 0}
        >
          Book This Experience
        </button>

        <ul className={styles.features}>
          <li className={styles.featureItem}>
            <FiRefreshCw className={styles.featureIcon} aria-hidden="true" />
            Flexible Cancellation Available
          </li>
          <li className={styles.featureItem}>
            <FiZap className={styles.featureIcon} aria-hidden="true" />
            Best Price Guarantee
          </li>
          <li className={styles.featureItem}>
            <FiUsers className={styles.featureIcon} aria-hidden="true" />
            Secure and safe booking
          </li>
          {PackageDetail?.activity_duration && (
            <li className={styles.featureItem}>
              <FiClock className={styles.featureIcon} aria-hidden="true" />
              Duration: {PackageDetail.activity_duration}
            </li>
          )}
          {maxGuestsLabel && (
            <li className={styles.featureItem}>
              <FiUsers className={styles.featureIcon} aria-hidden="true" />
              Up to {maxGuestsLabel} guests per booking
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
