'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@mantine/core';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { notifications } from '@mantine/notifications';
import { FaLocationDot, FaMagnifyingGlass } from 'react-icons/fa6';
import { IoInformationCircleOutline } from 'react-icons/io5';
import {
    isWithinCityRadius,
    placeBelongsToCity,
} from '@/util/transferLocationRestrict';
import styles from './LocationMapModal.module.css';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 51.5074, // London
    lng: -0.1278
};

export default function LocationMapModal({ 
    isOpen, 
    onClose, 
    onSelectLocation, 
    initialLocation,
    locationdata,
    title = "Select Location",
    restrictCity = '',
    restrictLat = null,
    restrictLng = null,
}) {
    // Helper to check if coordinate is valid
    const isValidCoord = (val) => val && val !== 'null' && val !== null && !isNaN(parseFloat(val));
    
    const [fromLocation, setFromLocation] = useState(() => {
        const lat = isValidCoord(locationdata?.pickupLatitude ?? locationdata?.fromLat)
            ? parseFloat(locationdata.pickupLatitude ?? locationdata.fromLat)
            : null;
        const lng = isValidCoord(locationdata?.pickupLongitude ?? locationdata?.fromLng)
            ? parseFloat(locationdata.pickupLongitude ?? locationdata.fromLng)
            : null;
        return { lat, lng };
    });
    
    const [toLocation, setToLocation] = useState(() => {
        let lat = isValidCoord(locationdata?.dropoffLatitude ?? locationdata?.toLat)
            ? parseFloat(locationdata.dropoffLatitude ?? locationdata.toLat)
            : (isValidCoord(locationdata?.pickupLatitude ?? locationdata?.fromLat)
                ? parseFloat(locationdata.pickupLatitude ?? locationdata.fromLat)
                : null);
        let lng = isValidCoord(locationdata?.dropoffLongitude ?? locationdata?.toLng)
            ? parseFloat(locationdata.dropoffLongitude ?? locationdata.toLng)
            : (isValidCoord(locationdata?.pickupLongitude ?? locationdata?.fromLng)
                ? parseFloat(locationdata.pickupLongitude ?? locationdata.fromLng)
                : null);
        return { lat, lng };
    });
    
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [address, setAddress] = useState('');
    const [center, setCenter] = useState(() => {
        // Try to use fromLocation first, then defaultCenter
        const latVal = locationdata?.pickupLatitude ?? locationdata?.fromLat;
        const lngVal = locationdata?.pickupLongitude ?? locationdata?.fromLng;
        if (isValidCoord(latVal) && isValidCoord(lngVal)) {
            return {
                lat: parseFloat(latVal),
                lng: parseFloat(lngVal)
            };
        }
        return defaultCenter;
    });
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 767px)');
        const sync = () => setIsMobile(media.matches);
        sync();
        media.addEventListener('change', sync);
        return () => media.removeEventListener('change', sync);
    }, []);

    // Prefer a named place (airport/hotel/POI) over a raw street address
    const getDisplayAddress = (results) => {
        if (!results?.length) return '';
        const namedTypes = ['airport', 'establishment', 'point_of_interest', 'premise', 'lodging'];
        const namedResult = results.find((r) =>
            r.types?.some((t) => namedTypes.includes(t))
        ) || results[0];
        const full = namedResult.formatted_address || '';
        // Use the primary name part shown before the street details
        return full.split(',')[0]?.trim() || full;
    };

    useEffect(() => {
        if (isOpen) {
            // If initial location provided, use it
            if (initialLocation?.lat && initialLocation?.lng) {
                setSelectedPosition({
                    lat: initialLocation.lat,
                    lng: initialLocation.lng
                });
                setCenter({
                    lat: initialLocation.lat,
                    lng: initialLocation.lng
                });
                setAddress(initialLocation.address || '');
            } else {
                // Determine which location to use based on the modal title
                const isPickup = title?.toLowerCase().includes('pickup');
                let targetLocation = null;
                
                if (isPickup && fromLocation.lat && fromLocation.lng) {
                    // For pickup, use fromLocation
                    targetLocation = {
                        lat: fromLocation.lat,
                        lng: fromLocation.lng
                    };
                } else if (!isPickup && toLocation.lat && toLocation.lng) {
                    // For dropoff, use toLocation
                    targetLocation = {
                        lat: toLocation.lat,
                        lng: toLocation.lng
                    };
                } else if (fromLocation.lat && fromLocation.lng) {
                    // Fallback to fromLocation
                    targetLocation = {
                        lat: fromLocation.lat,
                        lng: fromLocation.lng
                    };
                }
                
                if (targetLocation) {
                    setCenter(targetLocation);
                } else {
                    // Try to get user's current location as last resort
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const userLocation = {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                };
                                setCenter(userLocation);
                            },
                            (error) => {
                                console.log('Could not get current location:', error);
                            }
                        );
                    }
                }
            }
        }
    }, [isOpen, initialLocation, fromLocation, toLocation, title]);

    const isAllowedLocation = (lat, lng, placeOrAddress) => {
        if (restrictCity && placeOrAddress && !placeBelongsToCity(placeOrAddress, restrictCity)) {
            return false;
        }
        if (
            Number.isFinite(restrictLat) &&
            Number.isFinite(restrictLng) &&
            !isWithinCityRadius(lat, lng, restrictLat, restrictLng)
        ) {
            return false;
        }
        return true;
    };

    const showCityRestrictionError = () => {
        notifications.show({
            title: 'Location not allowed',
            message: restrictCity
                ? `Please select a location within ${restrictCity} only.`
                : 'Please select a location within the searched city area.',
            color: 'red',
            autoClose: 3500,
        });
    };

    const handleMapClick = async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setSelectedPosition({ lat, lng });
        setIsLoadingAddress(true);

        // Reverse geocode to get address
        try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
                { location: { lat, lng } },
                (results, status) => {
                    setIsLoadingAddress(false);

                    if (status === 'OK' && results[0]) {
                        if (!isAllowedLocation(lat, lng, results[0])) {
                            setSelectedPosition(null);
                            setAddress('');
                            showCityRestrictionError();
                            return;
                        }
                        setAddress(getDisplayAddress(results));
                    } else {
                        if (!isAllowedLocation(lat, lng, null)) {
                            setSelectedPosition(null);
                            setAddress('');
                            showCityRestrictionError();
                            return;
                        }
                        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                        notifications.show({
                            title: 'Warning',
                            message: 'Could not get address for this location',
                            color: 'orange',
                            autoClose: 2000
                        });
                    }
                }
            );
        } catch (error) {
            setIsLoadingAddress(false);
            if (!isAllowedLocation(lat, lng, null)) {
                setSelectedPosition(null);
                setAddress('');
                showCityRestrictionError();
                return;
            }
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    };

    const handleConfirm = () => {
        if (!selectedPosition) {
            notifications.show({
                title: 'Error',
                message: 'Please click on the map to select a location',
                color: 'red',
                autoClose: 3000
            });
            return;
        }

        if (!isAllowedLocation(selectedPosition.lat, selectedPosition.lng, address)) {
            showCityRestrictionError();
            return;
        }

        onSelectLocation({
            address: address || `${selectedPosition.lat.toFixed(6)}, ${selectedPosition.lng.toFixed(6)}`,
            lat: selectedPosition.lat,
            lng: selectedPosition.lng
        });
        
        onClose();
    };

    const handleSearchLocation = () => {
        if (!address) return;

        const geocoder = new window.google.maps.Geocoder();
        const searchQuery = restrictCity && !placeBelongsToCity(address, restrictCity)
            ? `${address}, ${restrictCity}`
            : address;

        geocoder.geocode({ address: searchQuery }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();

                if (!isAllowedLocation(lat, lng, results[0])) {
                    showCityRestrictionError();
                    return;
                }
                
                setSelectedPosition({ lat, lng });
                setCenter({ lat, lng });
                setAddress(getDisplayAddress(results));
                
                if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng });
                }
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Location not found',
                    color: 'red',
                    autoClose: 3000
                });
            }
        });
    };

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title={
                <span className={styles.headerTitleWrap}>
                    <span className={styles.headerIcon} aria-hidden="true">
                        <FaLocationDot size={15} />
                    </span>
                    <span className={styles.headerTitleText}>{title}</span>
                </span>
            }
            size="xl"
            centered={!isMobile}
            fullScreen={isMobile}
            zIndex={11000}
            overlayProps={{ backgroundOpacity: 0.5, blur: 4, color: '#0b1b33' }}
            lockScroll
            radius={isMobile ? 0 : 'lg'}
            classNames={{
                content: styles.modalContent,
                header: styles.modalHeader,
                title: styles.modalTitle,
                body: styles.modalBody,
                inner: styles.modalInner,
            }}
        >
            <div className={styles.root}>
                <div className={styles.scrollArea}>
                    <p className={styles.hint}>
                        <IoInformationCircleOutline size={18} className={styles.hintIcon} aria-hidden="true" />
                        <span>
                            {restrictCity ? (
                                <>
                                    Tap the map or search to pin a place within
                                    <span className={styles.cityTag}>{restrictCity}</span>
                                </>
                            ) : (
                                'Tap the map or search to pin your exact pickup or drop-off point'
                            )}
                        </span>
                    </p>

                    <div className={styles.searchRow}>
                        <div className={styles.searchField}>
                            <FaMagnifyingGlass size={13} className={styles.searchFieldIcon} aria-hidden="true" />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search hotel, airport, landmark…"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearchLocation();
                                    }
                                }}
                                aria-label="Search location"
                            />
                        </div>
                        <button
                            type="button"
                            className={styles.searchBtn}
                            onClick={handleSearchLocation}
                        >
                            Search
                        </button>
                    </div>

                    <div className={styles.mapShell}>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={center}
                            zoom={13}
                            onClick={handleMapClick}
                            onLoad={(map) => { mapRef.current = map; }}
                            options={{
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: false,
                                zoomControl: true,
                                gestureHandling: 'greedy',
                            }}
                        >
                            {selectedPosition && (
                                <Marker
                                    position={selectedPosition}
                                    animation={window.google?.maps?.Animation?.DROP}
                                />
                            )}
                        </GoogleMap>

                        {isLoadingAddress && (
                            <div className={styles.mapLoading}>
                                <span className={styles.mapLoadingSpinner} aria-hidden="true" />
                            </div>
                        )}
                    </div>

                    {selectedPosition && (
                        <div className={styles.selectedBox}>
                            <span className={styles.selectedPin} aria-hidden="true">
                                <FaLocationDot size={14} />
                            </span>
                            <div className={styles.selectedCopy}>
                                <p className={styles.selectedLabel}>Selected location</p>
                                <p className={styles.selectedAddress}>
                                    {address || 'Getting address…'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.confirmBtn}
                        onClick={handleConfirm}
                        disabled={!selectedPosition}
                    >
                        Confirm Location
                    </button>
                </div>
            </div>
        </Modal>
    );
}
