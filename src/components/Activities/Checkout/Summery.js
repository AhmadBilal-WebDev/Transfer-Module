import React from 'react'
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { LuShield, LuRefreshCw } from 'react-icons/lu';
import { IoCheckmarkCircle, IoCloseCircle, IoTimeOutline, IoInformation } from 'react-icons/io5';

export default function Summery({ activityDetail }) {
  const adults = Number(activityDetail?.adults || 0);
  const children = Number(activityDetail?.children || 0);
  const pricePerAdult = Number(activityDetail?.price_per_adult || 0);
  const pricePerChild = Number(activityDetail?.price_per_child || 0);
  const adultTotal = adults * pricePerAdult;
  const childTotal = children * pricePerChild;

  const renderCancellationPolicy = () => {
    const cancellationPolicy = activityDetail?.cancellation_policy;

    if (!cancellationPolicy) {
      return null;
    }

    const { cancel_policy, cancellation_policies } = cancellationPolicy;

    if (cancel_policy === 'non-refundable') {
      return (
        <div className="policy-alert danger">
          <IoCloseCircle size={20} className="flex-shrink-0" />
          <div>
            <h6>Non-Refundable</h6>
            <p>This booking cannot be cancelled or refunded under any circumstances.</p>
          </div>
        </div>
      );
    }

    if (cancel_policy === 'refundable' && cancellation_policies && cancellation_policies.length > 0) {
      const sortedPolicies = [...cancellation_policies].sort((a, b) => b.time_duration - a.time_duration);

      return (
        <div>
          <div className="policy-alert success">
            <IoCheckmarkCircle size={20} className="flex-shrink-0" />
            <div>
              <h6>Refundable Booking</h6>
              <p>You can cancel according to the policy below.</p>
            </div>
          </div>

          {sortedPolicies.map((policy, index) => {
            const timeText = policy.time_duration >= 24
              ? `${policy.time_duration / 24} day${policy.time_duration / 24 > 1 ? 's' : ''}`
              : `${policy.time_duration} hour${policy.time_duration > 1 ? 's' : ''}`;

            let refundText = '';
            let refundAmount = '';

            if (policy.type === 'percentage') {
              refundText = `${policy.value}% Charge`;
            } else if (policy.type === 'fixed') {
              refundText = 'Cancellation Fee';
              refundAmount = policy.value;
            }

            return (
              <div key={index} className={`policy-timeline-item ${index === 0 ? 'primary' : 'secondary'}`}>
                <div className="d-flex align-items-start gap-2">
                  <IoTimeOutline size={16} className="mt-1 flex-shrink-0" />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                      <h6 className="mb-0 small fw-bold">{timeText} before activity</h6>
                      <span className="policy-badge">{refundText}</span>
                    </div>
                    {policy.type === 'fixed' && refundAmount && (
                      <strong className="text-danger small">
                        Fee: <PriceDisplay price={refundAmount} currency={activityDetail?.currency} />
                      </strong>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="policy-alert success">
        <IoCheckmarkCircle size={20} className="flex-shrink-0" />
        <div>
          <h6>Free Cancellation</h6>
          <p>This booking can be cancelled free of charge.</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className='final-summary-card'>
        <div className='final-summary-header'>
          <span className='final-summary-eyebrow'>Final Summary</span>
          <h5>Your Activity Booking</h5>
        </div>

        <div className='final-summary-body'>
          {adults > 0 && (
            <div className="summary-line">
              <span className="line-label">
                {adults} Adult{adults !== 1 ? 's' : ''}
                <span className="line-label-meta">
                  {' '}× <PriceDisplay price={pricePerAdult} currency={activityDetail?.currency} />
                </span>
              </span>
              <span className="line-value">
                <PriceDisplay price={adultTotal} currency={activityDetail?.currency} />
              </span>
            </div>
          )}

          {children > 0 && (
            <div className="summary-line">
              <span className="line-label">
                {children} Child{children !== 1 ? 'ren' : ''}
                <span className="line-label-meta">
                  {' '}× <PriceDisplay price={pricePerChild} currency={activityDetail?.currency} />
                </span>
              </span>
              <span className="line-value">
                <PriceDisplay price={childTotal} currency={activityDetail?.currency} />
              </span>
            </div>
          )}

          {activityDetail?.selected_services?.length > 0 && (
            <>
              {activityDetail.selected_services.map((service, index) => {
                const serviceTotal = service.type === 'per_person'
                  ? service.quantity * Number(service.price)
                  : Number(service.total);
                return (
                  <div key={index} className="summary-line">
                    <span className="line-label">{service.name}</span>
                    <span className="line-value">
                      <PriceDisplay price={serviceTotal} currency={activityDetail?.currency} />
                    </span>
                  </div>
                );
              })}
            </>
          )}

          <hr className="summary-divider" />

          <div className="final-total-block">
            <span className="final-total-label">Total Secure payment</span>
            <div className="final-total-value-container">
              <span className="final-total-value">
                <PriceDisplay price={activityDetail?.grand_total} currency={activityDetail?.currency} />
              </span>
              <span className="final-total-value-label">VAT and Taxes included</span>
            </div>
          </div>

          <div className="summary-trust-list">
            <div className="summary-trust-item">
              <LuShield size={16} aria-hidden="true" />
              <span>Encrypted 256-bit Secure Transaction</span>
            </div>
            <div className="summary-trust-item">
              <LuRefreshCw size={16} aria-hidden="true" />
              <span>Flexible booking terms apply</span>
            </div>
          </div>
        </div>
      </div>

      {activityDetail?.cancellation_policy && (
        <div className='cancellation-card'>
          <div className='cancellation-card-header'>
            <h5>Cancellation Policy</h5>
          </div>
          <div className='cancellation-card-body'>
            {renderCancellationPolicy()}
          </div>
        </div>
      )}

      <div className='summary-help-note'>
        <IoInformation size={16} aria-hidden="true" />
        <span>Complete the form on the left to confirm your booking.</span>
      </div>
    </div>
  )
}
