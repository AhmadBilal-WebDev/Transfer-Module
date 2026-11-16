'use client';
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import GalleryImages from "@/components/Hotels/HotelDetail/GalleryImages";
import { FaLocationDot } from "react-icons/fa6";
import { FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiChevronLeft } from "react-icons/fi";
import RoomList from "@/components/Hotels/HotelDetail/RoomSelection/RoomList";
import { useSearchParams } from "next/navigation";
import HotelDetailLoader from "@/components/Loader/HotelDetailLoader";
import { usePackageMode } from "@/components/Store/PackageModeHelper";
import { useHolidayPackageStore } from "@/components/Store/HolidayPackageStore";
import { htmlToPlainText } from "@/util/htmlPlainText";

const HOTEL_FAQS = [
  {
    question: "What time is standard check-in and check-out?",
    answer:
      "Arrival check-in typically begins at 15:00, and check-out concludes at 11:00. Early check-in or late checkout may be available on request and is subject to hotel availability.",
  },
  {
    question: "Is airport transportation provided automatically?",
    answer:
      "Airport transfers are not included by default. You can arrange transportation separately or add a transfer when available for your destination.",
  },
  {
    question: "Can the property accommodate specific dietary requests?",
    answer:
      "Many hotels can accommodate dietary preferences such as vegetarian, halal, or allergy-conscious meals. Please share your requirements with the hotel after booking so they can prepare accordingly.",
  },
  {
    question: "Are taxes and fees included in the room price?",
    answer:
      "Displayed rates generally include VAT and applicable taxes unless otherwise noted on the room option. Always review the rate details before confirming your reservation.",
  },
  {
    question: "Can I cancel or modify my booking?",
    answer:
      "Cancellation and modification rules depend on the selected rate. Free-cancellation rates allow changes until the stated deadline; non-refundable rates usually cannot be changed without a fee.",
  },
];

export default function Page() {
  const searchParams = useSearchParams();
  const HotelCode = searchParams.get("id");
  const ProviderCode = searchParams.get("code");
  const { selectedData, packageConfig } = useHolidayPackageStore();
  const { isPackageMode, isEditMode } = usePackageMode();
  const [searchData, setSearchData] = useState({});
  const [hotelDetails, setHotelDetails] = useState({});
  const [isFetching, setIsFetching] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const allFacilitiesRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const descriptionRef = React.useRef(null);

  const descriptionHtml = hotelDetails?.description || "";
  const isHtmlDescription = /<\s*\w+[^>]*>/.test(descriptionHtml);
  const plainDescription = useMemo(() => {
    if (!descriptionHtml) return "";
    return isHtmlDescription
      ? htmlToPlainText(descriptionHtml).replace(/\n+/g, " ").trim()
      : descriptionHtml.trim();
  }, [descriptionHtml, isHtmlDescription]);

  const facilities = hotelDetails?.facilities || [];

  const returnHref = useMemo(() => {
    if (!searchData?.check_in || !searchData?.check_out || !searchData?.city) {
      return "/hotels";
    }
    const params = new URLSearchParams({
      checkIn: searchData.check_in,
      checkOut: searchData.check_out,
      currency: searchData.currency || "GBP",
      place: searchData.location || searchData.city,
      city: searchData.city,
      nationality: searchData.clientNationality || "",
      lat: String(searchData.lat || ""),
      lng: String(searchData.long || ""),
      code: searchData.countryCode || "",
      location: searchData.location || searchData.city,
      country: searchData.country || "",
    });
    return `/hotels?${params.toString()}`;
  }, [searchData]);

  const returnLabel = searchData?.location || searchData?.city
    ? `Return to ${searchData.location || searchData.city} Hotels`
    : "Return to Hotel Results";

  useEffect(() => {
    setDescExpanded(false);
  }, [hotelDetails?.hotel_name, hotelDetails?.description]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el || !plainDescription) {
      setShowReadMore(false);
      return;
    }

    const measureOverflow = () => {
      // Only measure while collapsed; expanded content is always taller.
      if (descExpanded) return;

      const overflows =
        el.scrollHeight > el.clientHeight + 1 ||
        el.scrollWidth > el.clientWidth + 1;
      setShowReadMore(overflows);
    };

    measureOverflow();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measureOverflow)
        : null;
    resizeObserver?.observe(el);
    window.addEventListener("resize", measureOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureOverflow);
    };
  }, [plainDescription, isHtmlDescription, descExpanded, isFetching]);

  useEffect(() => {
    const storedData = localStorage.getItem("HotelSearchData");
    if (storedData) {
      setSearchData(JSON.parse(storedData));
      fetchDetails(JSON.parse(storedData));
    }
  }, [searchParams]);

  const decodeProvider = (encoded) => {
    let result = "";
    let buffer = "";

    for (const ch of encoded) {
      buffer += ch;
      const code = parseInt(buffer, 36);

      if (code >= 65 && code <= 130) {
        result += String.fromCharCode(code - 3);
        buffer = "";
      }
    }
    return result;
  };

  const fetchDetails = async (searchNew) => {
    let storedRoomList = [];
    var roomDetails = [];
    if (isPackageMode || isEditMode) {
      storedRoomList = selectedData?.hotel?.hotelData?.rooms;
      searchNew = {
        check_in: packageConfig.searchData.dates?.checkIn,
        check_out: packageConfig.searchData.dates?.checkOut,
      };
    } else {
      roomDetails = localStorage.getItem("roomSelection");
      if (roomDetails) {
        storedRoomList = JSON.parse(roomDetails);
      }
    }

    const hotelProviderName = decodeProvider(ProviderCode || "").toLowerCase();

    try {
      setIsFetching(true);
      const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/full/details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: hotelProviderName,
          hotelId: HotelCode,
          checkIn: searchNew?.check_in,
          checkOut: searchNew?.check_out,
          roomList: storedRoomList,
        }),
      });
      const res = await responses.json();
      setIsFetching(false);
      if (res.success) {
        res.data.provider = res.provider;
        setHotelDetails(res.data);
      }
    } catch (err) {
      console.error("Error fetching hotel details:", err);
      setIsFetching(false);
      setHotelDetails({});
    }
  };

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToAllAmenities = () => {
    setTimeout(() => allFacilitiesRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="container my-5 hotel-detail-page">
      {isFetching ? (
        <HotelDetailLoader />
      ) : (
        <div className="hotel-detail-content">
          <Link href={returnHref} className="hotel-detail-return">
            <FiChevronLeft size={16} aria-hidden="true" />
            {returnLabel}
          </Link>

          <GalleryImages imageList={hotelDetails?.all_images || []} />

          <div className="hotel-detail-summary card bg-white text-black p-3 p-md-4 mt-3">
            <h4 className="hotel-detail-summary__title fw-bold mb-2">
              {hotelDetails?.hotel_name}
            </h4>
            <div className="hotel-detail-summary__location small">
              <FaLocationDot />
              <span>
                {hotelDetails?.address}
                {hotelDetails?.coordinates?.latitude && hotelDetails?.coordinates?.longitude && (
                  <>
                    {" — "}
                    <button type="button" className="hotel-detail-summary__map-link" onClick={scrollToMap}>
                      View on Map
                    </button>
                  </>
                )}
              </span>
            </div>

            {plainDescription && (
              <div className="hoteldescriptionSection">
                <h5 className="hoteldescriptionTitle">About this hotel</h5>
                {isHtmlDescription ? (
                  <div
                    ref={descriptionRef}
                    className={`hoteldescriptionHtml${descExpanded ? "" : " hoteldescriptionCollapsed"}`}
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                ) : (
                  <p
                    ref={descriptionRef}
                    className={`hoteldescriptionText${descExpanded ? "" : " hoteldescriptionCollapsed"}`}
                  >
                    {descriptionHtml}
                  </p>
                )}
                {showReadMore && (
                  <button
                    type="button"
                    className="hotelreadMoreBtn"
                    onClick={() => setDescExpanded((prev) => !prev)}
                  >
                    {descExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {facilities.length > 0 && (
              <div className="hotel-amenity-inventory">
                <h5 className="hotel-amenity-inventory__title">Comprehensive Amenity Inventory</h5>
                <div className="hotel-amenity-inventory__grid">
                  {facilities.slice(0, 12).map((item, index) => (
                    <div key={index} className="hotel-amenity-pill">
                      <span className="hotel-amenity-pill__icon-wrapper">
                        <FaCheck className="hotel-amenity-pill__icon" size={11} />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
                {facilities.length > 12 && (
                  <div className="text-center">
                    <button type="button" className="hotel-amenity-viewmore" onClick={scrollToAllAmenities}>
                      View More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <RoomList hotelDetail={hotelDetails} isPackageMode={isPackageMode} isEditMode={isEditMode} />

          {facilities.length > 0 && (
            <div className="hotel-detail-section-card mt-4" ref={allFacilitiesRef}>
              <h5 className="hotel-amenity-inventory__title">Comprehensive Amenity Inventory</h5>
              <div className="hotel-amenity-inventory__grid">
                {facilities.map((item, index) => (
                  <div key={index} className="hotel-amenity-pill">
                    <span className="hotel-amenity-pill__icon-wrapper">
                      <FaCheck className="hotel-amenity-pill__icon" size={11} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="hotel-detail-section-card mt-4" ref={mapRef}>
            <h5 className="hotel-detail-section-card__title">Location & Surroundings</h5>
            <p className="hotel-detail-section-card__text">
              Explore the hotel location and nearby surroundings on the map.
            </p>
            <iframe
              className="hotel-detail-map"
              width="100%"
              height="400"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              title="Hotel location map"
              src={`https://maps.google.com/maps?q=${hotelDetails?.coordinates?.latitude},${hotelDetails?.coordinates?.longitude}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
            />
          </div>

          <div className="hotel-detail-faq mt-4 mb-2">
            <h5 className="hotel-detail-faq__title">Frequently Asked Questions by Travelers</h5>
            <div className="hotel-detail-faq__list">
              {HOTEL_FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.question}
                    className={`hotel-detail-faq__item${isOpen ? " hotel-detail-faq__item--open" : ""}`}
                  >
                    <button
                      type="button"
                      className="hotel-detail-faq__question"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {isOpen && <p className="hotel-detail-faq__answer">{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
