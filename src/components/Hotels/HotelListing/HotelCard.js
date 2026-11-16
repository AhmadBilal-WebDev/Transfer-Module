'use client'
import PriceDisplay from '@/components/Currency/PriceDisplay';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react'
import { FaArrowRightLong } from 'react-icons/fa6';
import { IoLocationSharp, IoCheckmarkCircle } from 'react-icons/io5';
import { useHotelList } from './HotelListingContext';
import { useSearchParams } from "next/navigation";
import moment from 'moment';
import { FaHome, FaStar } from 'react-icons/fa';
import { LiaAngleRightSolid } from "react-icons/lia";
import { useQuery } from '@tanstack/react-query';

const normalizeImageSrc = (raw) => {
  if (!raw) return '/images/hotelloadimg.jpg';
  if (raw.startsWith('data:') || raw.startsWith('/')) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) {
    if (typeof window !== 'undefined') return window.location.protocol + raw;
    return 'https:' + raw;
  }
  return 'http://' + raw.replace(/^\/+/, '');
};

const encodeProvider = (str) => {
  return [...str].map(c => (c.charCodeAt(0) + 3).toString(36)).join('');
};

const makingSlug = (name) => {
  return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
};

const ProviderShortNames = (encodedProvider) => {
  if (!encodedProvider) return '';
  return encodeProvider(encodedProvider).toLowerCase();
};

function HotelResultsHeader() {
  const { totalHotels } = useHotelList();

  return (
    <div className="htc-results-header">
      <div className="htc-results-header__copy">
        <span className="htc-results-header__eyebrow">Available Properties</span>
        <h2 className="htc-results-header__title">Available Luxury Properties</h2>
      </div>
      <p className="htc-results-header__count" aria-live="polite">
        {totalHotels} {totalHotels === 1 ? 'result' : 'results'}
      </p>
    </div>
  );
}

function HotelCardItem({ item, check_in, check_out, daysDiff, allHotels }) {
  const [imgFallback, setImgFallback] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ['hotelDetail', item.id, item.provider, check_in, check_out],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hotel/basic/details`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: item.provider,
            hotelId: item.id,
            checkIn: check_in,
            checkOut: check_out,
          }),
        }
      );
      const res = await response.json();
      return {
        images:
          Array.isArray(res.data.main_images) && res.data.main_images.length > 0
            ? res.data.main_images[0].url || ''
            : '',
        address: res.data.address || '',
        facilities: res.data.facilities || [],
      };
    },
    enabled: !!item.id && !!check_in && !!check_out,
    cacheTime: 20 * 60 * 1000,
    staleTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const SetRoomsData = (id) => {
    const selectedHotel = allHotels.find(hotel => hotel.id === id);
    if (selectedHotel) {
      localStorage.setItem('roomSelection', JSON.stringify(selectedHotel.rooms));
    }
  };

  const starCount = item?.metadata?.stars && !isNaN(item.metadata.stars)
    ? Math.round(Number(item.metadata.stars))
    : 0;

  const ratingValue = starCount > 0
    ? starCount.toFixed(1)
    : (item?.metadata?.stars && item.metadata.stars !== '0' ? String(item.metadata.stars) : null);

  const roomsLeft = item?.rooms?.length || 0;
  const mapHref = detail?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.address)}`
    : null;

  const detailHref = `/hotels/${makingSlug(item.name)}?id=${item.id}&code=${ProviderShortNames(item.provider)}`;

  return (
    <div className="col-12 mb-3 px-0">
      <article className="htc-card">
        <div className="htc-card__layout">
          <div className="htc-card__media">
            <Image
              src={
                imgFallback
                  ? '/images/hotelloadimg.jpg'
                  : normalizeImageSrc(detail?.images || '/images/hotelloadimg.jpg')
              }
              width={420}
              height={240}
              className="htc-card__img"
              alt={item.name}
              quality={100}
              placeholder="blur"
              blurDataURL="/images/hotelloadimg.jpg"
              onError={() => setImgFallback(true)}
              unoptimized={true}
            />
            <div className="htc-card__media-badges">
              {item?.provider === 'custom' && (
                <span className="htc-card__badge htc-card__badge--overlay">
                  VT Verified
                </span>
              )}
              {roomsLeft > 0 && (
                <span className="htc-card__badge htc-card__badge--rooms">
                  {roomsLeft} {roomsLeft > 1 ? 'Rooms Left' : 'Room Left'}
                </span>
              )}
            </div>
          </div>

          <div className="htc-card__content">
            <div className="htc-card__top">
              <div className="htc-card__heading">
                <h3 className="htc-card__title">{item.name}</h3>
                {ratingValue ? (
                  <span className="htc-card__rating-pill">
                    <FaStar aria-hidden="true" />
                    {ratingValue}
                  </span>
                ) : (
                  <span className="htc-card__rating-pill htc-card__rating-pill--muted">
                    No Rating
                  </span>
                )}
              </div>

              {detail ? (
                <p className="htc-card__location">
                  <IoLocationSharp aria-hidden="true" />
                  <span>
                    {detail.address || 'Address not available'}
                    {mapHref && (
                      <>
                        {' — '}
                        <a
                          href={mapHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="htc-card__map-link"
                        >
                          View on Map
                        </a>
                      </>
                    )}
                  </span>
                </p>
              ) : (
                <p className="htc-card__location placeholder-glow">
                  <IoLocationSharp aria-hidden="true" />
                  <span className="placeholder rounded col-6"></span>
                </p>
              )}

              {check_in && check_out && (
                <time className="htc-card__dates">
                  {moment(check_in).format('DD MMM YYYY')}
                  <FaArrowRightLong aria-hidden="true" />
                  {moment(check_out).format('DD MMM YYYY')}
                </time>
              )}
            </div>

            {detail ? (
              <ul className="htc-card__amenities">
                {detail.facilities.slice(0, 6).map((amenity, i) => (
                  <li key={i}>
                    <IoCheckmarkCircle aria-hidden="true" />
                    {amenity}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="htc-card__amenities placeholder-glow">
                <li className="placeholder rounded col-3"></li>
                <li className="placeholder rounded col-4"></li>
                <li className="placeholder rounded col-2"></li>
              </ul>
            )}

            <div className="htc-card__footer">
              <div className="htc-card__pricing">
                <p className="htc-card__price-line">
                  <span className="htc-card__price-from">From</span>
                  <span className="htc-card__price-main">
                    <PriceDisplay
                      price={(item.metadata?.min_price / (daysDiff || 1))}
                      currency={item?.metadata?.currency || item?.currency}
                    />
                  </span>
                  <span className="htc-card__price-unit">/ night</span>
                  <span className="htc-card__price-note">VAT and Taxes included</span>
                </p>
                {item?.price != null && (
                  <p className="htc-card__price-total">
                    Total stay: {item?.currency} {item?.price}
                  </p>
                )}
              </div>

              <Link
                target="_blank"
                onClick={() => SetRoomsData(item.id)}
                href={detailHref}
                className="htc-card__cta"
              >
                See Availability <LiaAngleRightSolid />
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function HotelCard({ isLoading }) {
  const searchParams = useSearchParams();
  const { hotels, totalHotels } = useHotelList();
  const check_in = searchParams.get("checkIn");
  const check_out = searchParams.get("checkOut");
  const daysDiff = moment(check_out).diff(moment(check_in), 'days') || 1;

  return (
    <div className="container hotel-card px-0">
      {!isLoading && (totalHotels > 0 || hotels.length > 0) && (
        <HotelResultsHeader />
      )}

      {hotels.length === 0 && isLoading === false && (
        <div className="alert alert-warning text-center" role="alert">
          <strong>No hotels</strong> found for the selected criteria. Please try adjusting your search.<br />
          <Link href='/'>
            <button className='btn btn-success mt-2'><FaHome size={15} /> Go to Home</button>
          </Link>
        </div>
      )}

      <div className="row" id='top_hotel'>
        {hotels.map((item, index) => (
          <HotelCardItem
            key={item.id || index}
            item={item}
            check_in={check_in}
            check_out={check_out}
            daysDiff={daysDiff}
            allHotels={hotels}
          />
        ))}
      </div>
    </div>
  );
}
