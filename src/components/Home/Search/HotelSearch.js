"use client";
import React, { useState, useEffect } from "react";
import { DateInput } from "@mantine/dates";
import { Popover } from "@mantine/core";
import { FaMinus, FaPlus, FaCalendarAlt, FaSearch } from "react-icons/fa";
import { IoMdPerson } from "react-icons/io";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import moment from "moment";
import HotelLocationSelector from './HotelLocationSelector';

const toYmd = (value) => {
  if (!value) return null;
  return moment(value).format('YYYY-MM-DD');
};

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = moment(value);
  return parsed.isValid() ? parsed.toDate() : null;
};

export default function HotelSearch() {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaceDetailsLoading, setIsPlaceDetailsLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [rooms, setRooms] = useState([
    { adults: 2, children: 0, childrenAges: [], errors: {} }
  ]);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const getCountry = async () => {
      try {
        const res = await fetch("https://api.country.is/");
        const data = await res.json();
        setCountryCode(data.country);
      } catch (error) {
        console.log(error);
      }
    };

    getCountry();
  }, []);

  const [formData, setFormData] = useState({
    location: "",
    city: "",
    code: "",
    country: "",
    lat: null,
    lng: null,
    dateRange: [moment().add(1, 'days').format('YYYY-MM-DD'), moment().add(2, 'days').format('YYYY-MM-DD')],
  });

  const addRoom = () => {
    setRooms([...rooms, { adults: 2, children: 0, childrenAges: [], errors: {} }]);
  };

  const router = useRouter();

  const removeRoom = (index) => {
    if (rooms.length === 1) return;
    const updatedRooms = rooms.filter((_, i) => i !== index);
    setRooms(updatedRooms);
  };

  const handleRoomChange = (index, type, delta) => {
    const updatedRooms = [...rooms];

    if (type === "adults") {
      updatedRooms[index].adults = Math.max(
        1,
        updatedRooms[index].adults + delta
      );
    }
    else if (type === "children") {
      const prevCount = updatedRooms[index].children;
      const newCount = Math.max(0, prevCount + delta);

      updatedRooms[index].children = newCount;

      let ages = [...(updatedRooms[index].childrenAges || [])];

      if (newCount > prevCount) {
        ages.push(null);
      } else if (newCount < prevCount) {
        ages.pop();
      }

      updatedRooms[index].childrenAges = ages;

      if (newCount === 0) {
        updatedRooms[index].errors = {};
      }
    }

    setRooms(updatedRooms);
  };

  const handleAgeChange = (roomIndex, ageIndex, value) => {
    const updatedRooms = [...rooms];
    updatedRooms[roomIndex].childrenAges[ageIndex] = value;
    const hasEmptyAge = updatedRooms[roomIndex].childrenAges.some((age) => !age);
    if (!hasEmptyAge) {
      updatedRooms[roomIndex].errors = {};
    }
    setRooms(updatedRooms);
  };

  const handleLocationChange = (e) => {
    setFormData((prev) => ({ ...prev, location: e.target.value }));
  };

  const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);
  const totalTravelers = totalAdults + totalChildren;

  const handlePlaceSelected = (place) => {
    if (!place.geometry) return;

    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    let city = "";
    let country = "";
    let code = "";
    place.address_components.forEach((component) => {
      if (component.types.includes("locality")) {
        city = component.long_name;
      } else if (component.types.includes("postal_town")) {
        city = component.long_name;
      }
      if (component.types.includes("country")) {
        country = component.long_name;
        code = component.short_name;
      }
    });

    setFormData((prev) => ({
      ...prev,
      location: place.displayName || place.formatted_address,
      lat,
      lng,
      city,
      code,
      country,
    }));
  };

  const handleCheckInChange = (date) => {
    const checkIn = toYmd(date);
    let checkOut = formData.dateRange?.[1] || null;

    if (checkIn && checkOut && moment(checkOut).isSameOrBefore(checkIn, 'day')) {
      checkOut = moment(checkIn).add(1, 'days').format('YYYY-MM-DD');
    }

    setFormData((prev) => ({
      ...prev,
      dateRange: [checkIn, checkOut],
    }));
  };

  const handleCheckOutChange = (date) => {
    const checkOut = toYmd(date);
    setFormData((prev) => ({
      ...prev,
      dateRange: [prev.dateRange?.[0] || null, checkOut],
    }));
  };

  const validateForm = () => {
    if (!formData.location) {
      notifications.show({
        autoClose: 2000,
        title: "Error",
        message: "Location is required",
        color: "red",
      });
      return false;
    }

    if (!formData.dateRange?.[0] || !formData.dateRange?.[1]) {
      notifications.show({
        autoClose: 2000,
        title: "Error",
        message: "Please select check-in and check-out dates",
        color: "red",
      });
      return false;
    }

    const updatedRooms = rooms.map((room) => {
      const roomErrors = {};
      if (room.children > 0) {
        const hasEmptyAge = room.childrenAges.some((age) => !age);
        if (hasEmptyAge) {
          roomErrors.childrenAges = "Please select age for all children";
        }
      }
      return { ...room, errors: roomErrors };
    });

    setRooms(updatedRooms);

    const hasRoomErrors = updatedRooms.some(
      (room) => Object.keys(room.errors).length > 0
    );

    if (hasRoomErrors) {
      notifications.show({
        autoClose: 2000,
        title: "Error",
        message: "Please select age for all children",
        color: "red",
      });
      setPopoverOpened(true);
      return false;
    }

    return true;
  };

  const SubmitForm = () => {
    if (!validateForm()) return;

    const roomsArray = rooms.map(room => ({
      adults: room.adults,
      children: room.childrenAges.map(age => ({ age: Number(age) }))
    }));
    localStorage.setItem('clientNationality', countryCode);
    const queryParams = new URLSearchParams();
    const locationName = document.getElementsByName('hotellocation')[0].value;
    queryParams.set('checkIn', formData.dateRange[0]);
    queryParams.set('checkOut', formData.dateRange[1]);
    queryParams.set('currency', 'GBP');
    queryParams.set('place', locationName);
    queryParams.set('city', formData.city);
    queryParams.set('nationality', countryCode);
    queryParams.set('lat', formData.lat);
    queryParams.set('lng', formData.lng);
    queryParams.set('code', formData.code);
    queryParams.set('location', formData.location);
    queryParams.set('country', formData.country);
    localStorage.setItem('searchRoomSelection', JSON.stringify(roomsArray));
    router.push(`/hotels?${queryParams.toString()}`);
  };

  const ClosePopover = () => {
    const updatedRooms = rooms.map((room) => {
      const roomErrors = {};
      if (room.children > 0) {
        const hasEmptyAge = room.childrenAges.some((age) => !age);
        if (hasEmptyAge) {
          roomErrors.childrenAges = "Please select age for all children";
        }
      }
      return { ...room, errors: roomErrors };
    });

    setRooms(updatedRooms);
    const hasRoomErrors = updatedRooms.some(
      (room) => Object.keys(room.errors).length > 0
    );
    if (hasRoomErrors) {
      return;
    }
    setPopoverOpened(false);
  };

  const guestsFieldLabel = (() => {
    const parts = [];
    if (totalAdults > 0) {
      parts.push(`${totalAdults} Adult${totalAdults !== 1 ? 's' : ''}`);
    }
    if (totalChildren > 0) {
      parts.push(`${totalChildren} Child${totalChildren !== 1 ? 'ren' : ''}`);
    }
    parts.push(`${rooms.length} Room${rooms.length !== 1 ? 's' : ''}`);
    return parts.join(', ') || '1 Adult, 1 Room';
  })();

  const guestsDropdown = (
    <div className="p-2">
      {rooms.map((room, index) => (
        <div key={index} className="mt-2">
          <div className="d-flex justify-content-between  align-items-center">
            <p className="small m-0">Room {index + 1}</p>
            {index + 1 !== 1 && (
              <button onClick={() => removeRoom(index)} className="btn btn-danger x-small btn-sm" type="button">
                Delete
              </button>
            )}
          </div>
          <hr className="m-1" />
          <div className="e484bb5b7a mt-2">
            <div className="c5aae0350e">
              <label className="small">Adults</label>
            </div>
            <div className="e301a14002">
              <div className="e301a14002">
                <button onClick={() => handleRoomChange(index, "adults", -1)} className="adult-modal-btn" type="button">
                  <FaMinus />
                </button>
                <span className="mx-2" aria-hidden="true">{room.adults}</span>
                <button onClick={() => handleRoomChange(index, "adults", 1)} className="adult-modal-btn" type="button">
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
          <div className="e484bb5b7a mt-2">
            <div className="c5aae0350e">
              <label className="small">Children</label>
            </div>
            <div className="e301a14002">
              <div className="e301a14002">
                <button onClick={() => handleRoomChange(index, "children", -1)} className="adult-modal-btn" type="button">
                  <FaMinus />
                </button>
                <span className="mx-2" aria-hidden="true">{room.children}</span>
                <button onClick={() => handleRoomChange(index, "children", 1)} className="adult-modal-btn" type="button">
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
          <div className="d-flex mt-2 flex-wrap justify-content-between">
            {room.childrenAges.map((age, ageIndex) => (
              <div key={ageIndex} className="kids-age-select">
                <select
                  onChange={(e) => handleAgeChange(index, ageIndex, e.target.value)}
                  value={age}
                  className="form-control border  form-control-sm"
                >
                  <option value="">Age Needed</option>
                  {[...Array(16).keys()].map((n) => (
                    <option key={n + 1} value={n + 1}>
                      {n + 1}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {room.errors.childrenAges && (
            <p className="text-danger small mt-1">
              {room.errors.childrenAges}
            </p>
          )}
        </div>
      ))}
      <hr />
      <p onClick={addRoom} className="small cursor-pointer text-end mb-1 text-primary">+ Add Room</p>
      <button onClick={ClosePopover} type="button" className="btn  w-100 btn-outline-success">Done</button>
    </div>
  );

  return (
    <div className="royalaneGrid">
      <div className="royalaneRow royalaneRowTop">
        <div className="royalaneField">
          <HotelLocationSelector
            value={formData.location}
            onChange={handleLocationChange}
            onPlaceSelected={handlePlaceSelected}
            isMobile={isMobile}
            onLoadingChange={setIsPlaceDetailsLoading}
          />
        </div>

        <div className="royalaneField position-relative">
          <div className="d-flex align-items-center position-relative">
            <div className="form-floating w-100">
              <DateInput
                variant="unstyled"
                id="hotelCheckIn"
                minDate={new Date()}
                valueFormat="DD MMM YYYY"
                value={toDate(formData.dateRange?.[0])}
                onChange={handleCheckInChange}
                className="form-control hotel-date-range"
                style={{ paddingLeft: '14px', paddingRight: '40px' }}
                placeholder="Date"
              />
              <label htmlFor="hotelCheckIn" style={{ paddingLeft: '14px' }}>Check In</label>
            </div>
            <div className="royalaneFieldIconRight" aria-hidden="true">
              <FaCalendarAlt size={15} />
            </div>
          </div>
        </div>

        <div className="royalaneField position-relative">
          <div className="d-flex align-items-center position-relative">
            <div className="form-floating w-100">
              <DateInput
                variant="unstyled"
                id="hotelCheckOut"
                minDate={toDate(formData.dateRange?.[0]) || new Date()}
                valueFormat="DD MMM YYYY"
                value={toDate(formData.dateRange?.[1])}
                onChange={handleCheckOutChange}
                className="form-control hotel-date-range"
                style={{ paddingLeft: '14px', paddingRight: '40px' }}
                placeholder="Date"
              />
              <label htmlFor="hotelCheckOut" style={{ paddingLeft: '14px' }}>Check Out</label>
            </div>
            <div className="royalaneFieldIconRight" aria-hidden="true">
              <FaCalendarAlt size={15} />
            </div>
          </div>
        </div>
      </div>

      <div className="royalaneRow royalaneRowBottom royalaneRowBottomOneWay">
        <div className="royalaneField">
          <Popover
            width={300}
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-start"
            withArrow
            shadow="md"
            styles={{
              dropdown: {
                maxHeight: 380,
                overflowY: "auto",
              },
            }}
            clickOutsideEvents={["mouseup", "touchend"]}
          >
            <Popover.Target>
              <div className="d-flex align-items-center position-relative">
                <div className="form-floating w-100">
                  <button
                    id="hotelGuests"
                    type="button"
                    onClick={() => setPopoverOpened((o) => !o)}
                    className="form-control btn btn-light text-start person-selection w-100"
                    style={{ paddingLeft: '14px', paddingRight: '40px' }}
                  >
                    {guestsFieldLabel}
                  </button>
                  <label htmlFor="hotelGuests" style={{ paddingLeft: '14px' }}>Rooms & Travelers</label>
                </div>
                <div className="royalaneFieldIconRight" aria-hidden="true">
                  <IoMdPerson size={16} />
                </div>
              </div>
            </Popover.Target>
            <Popover.Dropdown>
              {guestsDropdown}
            </Popover.Dropdown>
          </Popover>
        </div>
      </div>

      <div className="royalaneSearchBtnWrap">
        <button
          onClick={SubmitForm}
          disabled={isPlaceDetailsLoading}
          type="button"
          className="btn btn-success search-btn-styling-home royalaneSearchBtn bg-color w-100"
        >
          <FaSearch /> Search Hotels
        </button>
      </div>
    </div>
  );
}
