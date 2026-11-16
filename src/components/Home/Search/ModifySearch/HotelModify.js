"use client";
import React, { useEffect, useState } from "react";
import { DatePickerInput } from "@mantine/dates";
import { Popover } from "@mantine/core";
import { FaCalendarAlt, FaMinus, FaPlus, FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { IoMdPerson } from "react-icons/io";
import { notifications } from "@mantine/notifications";
import { useRouter, useSearchParams } from "next/navigation";
import HotelLocationSelector from '../HotelLocationSelector';
import styles from './HotelModify.module.css';

export default function HotelModify({ onSearch }) {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState([
    { adults: 2, children: 0, childrenAges: [], errors: {} }
  ]);
  const [breakPoint, setBreakPoint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    city: "",
    code: "",
    country: "",
    lat: null,
    lng: null,
    dateRange: [],
  })
  const [clientNationality, setClientNationality] = useState('');
  const addRoom = () => {
    setRooms([...rooms, { adults: 2, children: 0, childrenAges: [], errors: {} }]);
  };

  useEffect(() => {
    setBreakPoint(window.innerWidth <= 500);
    setIsMobile(window.innerWidth <= 768);

    const handleResize = () => {
      setBreakPoint(window.innerWidth <= 500);
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    if (searchParams && searchParams.toString()) {
      const city = searchParams.get("city");
      const countryCode = searchParams.get("code");
      const clientNationality = searchParams.get("nationality");
      const check_in = searchParams.get("checkIn");
      const check_out = searchParams.get("checkOut");
      const lat = searchParams.get("lat");
      const long = searchParams.get("lng");
      const location = searchParams.get("location");
      const country = searchParams.get("country");
      const place = searchParams.get("place");
      setClientNationality(clientNationality);
      setFormData({
        location: location,
        city: city,
        code: countryCode,
        country: country,
        lat: lat,
        lng: long,
        dateRange: [check_in, check_out],
      })
      const loc = document.getElementsByName('hotellocation')[0];
      if (loc) loc.value = place;
    } else {
      const data = localStorage.getItem('HotelSearchData');
      if (data) {
        const newData = JSON.parse(data);
        setFormData({
          location: newData?.location,
          city: newData?.city,
          code: newData?.countryCode,
          country: newData?.country,
          lat: newData?.lat,
          lng: newData?.long,
          dateRange: [newData?.check_in, newData?.check_out],
        })
        const loc = document.getElementsByName('hotellocation')[0];
        if (loc) loc.value = newData?.location;
      }
    }
    let RoomMap = []
    const roomData = localStorage.getItem('searchRoomSelection');
    if (roomData) {
      RoomMap = JSON.parse(roomData)
    }
    const formattedRooms = RoomMap.map(item => ({
      adults: item.adults,
      children: item.children.length,
      childrenAges: item.children.map(c => c.age),
      errors: {}
    }));
    setRooms(formattedRooms);

    return () => window.removeEventListener('resize', handleResize);
  }, [searchParams])
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
  }
  const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);

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
  const handleDateChange = (value) => {
    let newValue = value;

    if (!value[0] && !value[1]) {
      newValue = [];
    }
    setFormData((prev) => ({
      ...prev,
      dateRange: newValue,
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

    if (!formData.dateRange || formData.dateRange.length !== 2) {
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

    const queryParams = new URLSearchParams();
    const locationName = document.getElementsByName('hotellocation')[0]?.value || formData.location;
    queryParams.set('checkIn', formData.dateRange[0])
    queryParams.set('checkOut', formData.dateRange[1])
    queryParams.set('currency', 'GBP')
    queryParams.set('place', locationName)
    queryParams.set('city', formData.city)
    queryParams.set('nationality', clientNationality),
    queryParams.set('lat', formData.lat)
    queryParams.set('lng', formData.lng)
    queryParams.set('code', formData.code)
    queryParams.set('location', formData.location)
    queryParams.set('country', formData.country)
    localStorage.setItem('searchRoomSelection', JSON.stringify(roomsArray));
    if (onSearch) onSearch();
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

  const guestsLabel = `${totalAdults + totalChildren} traveler${totalAdults + totalChildren !== 1 ? 's' : ''}, ${rooms.length} room${rooms.length !== 1 ? 's' : ''}`;

  return (
    <div className={styles.searchBar}>
      <div className={styles.fieldsRow}>
        <div className={styles.listingField}>
          <div className={styles.fieldIcon} aria-hidden="true">
            <FaMapMarkerAlt />
          </div>
          <div className={styles.fieldBody}>
            <span className={styles.fieldLabel}>Place</span>
            <div className={styles.fieldValue}>
              <HotelLocationSelector
                value={formData.location}
                onChange={handleLocationChange}
                onPlaceSelected={handlePlaceSelected}
                isMobile={isMobile}
                label="Place"
              />
            </div>
          </div>
        </div>

        <div className={styles.listingField}>
          <div className={styles.fieldIcon} aria-hidden="true">
            <FaCalendarAlt />
          </div>
          <div className={styles.fieldBody}>
            <span className={styles.fieldLabel}>Check-in & Check-out</span>
            <div className={styles.fieldValue}>
              <DatePickerInput
                variant="unstyled"
                id="hotelModifyDates"
                minDate={new Date()}
                valueFormat="DD MMM YYYY"
                numberOfColumns={breakPoint ? 1 : 2}
                value={formData.dateRange}
                onChange={handleDateChange}
                className="hotel-date-range"
                type="range"
                placeholder="Select your dates"
              />
            </div>
          </div>
        </div>

        <div className={styles.listingField}>
          <div className={styles.fieldIcon} aria-hidden="true">
            <IoMdPerson />
          </div>
          <div className={styles.fieldBody}>
            <span className={styles.fieldLabel}>Guests & Rooms</span>
            <div className={styles.fieldValue}>
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
                  <button
                    type="button"
                    onClick={() => setPopoverOpened((o) => !o)}
                    className={styles.guestsBtn}
                  >
                    {guestsLabel}
                  </button>
                </Popover.Target>
                <Popover.Dropdown>
                  <div className="p-2">
                    {rooms.map((room, index) => (
                      <div key={index} className="mt-2">
                        <div className="d-flex justify-content-between align-items-center">
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
                                className="form-control border form-control-sm"
                              >
                                <option value="">Age Needed</option>
                                {[...Array(16).keys()].map((n) => (
                                  <option key={n + 1} value={n + 1}>{n + 1}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                        {room.errors.childrenAges && (
                          <p className="text-danger small mt-1">{room.errors.childrenAges}</p>
                        )}
                      </div>
                    ))}
                    <hr />
                    <p onClick={addRoom} className="small cursor-pointer text-end mb-1 text-primary">+ Add Room</p>
                    <button onClick={ClosePopover} type="button" className="btn w-100 btn-outline-success">Done</button>
                  </div>
                </Popover.Dropdown>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <button onClick={SubmitForm} type="button" className={styles.searchBtn}>
        <FaSearch /> Search Hotels
      </button>
    </div>
  );
}
