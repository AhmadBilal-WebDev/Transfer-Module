'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Autocomplete from "react-google-autocomplete";
import { MdMyLocation, MdMap } from 'react-icons/md';
import { FaLocationDot } from 'react-icons/fa6';
import { notifications } from '@mantine/notifications';
import styles from './LocationPicker.module.css';
import {
    buildCityBoundsLiteral,
    placeBelongsToCity,
    isWithinCityRadius,
} from '@/util/transferLocationRestrict';

export default function LocationPicker({
    label,
    value,
    onChange,
    error,
    placeholder,
    onOpenMap,
    required = true,
    name,
    restrictCity = '',
    restrictLat = null,
    restrictLng = null,
    variant = 'default',
    tone = 'pickup',
    leadingIcon = null,
    hideLabel = false,
    showActions = true,
}) {
    const [isLoadingGPS, setIsLoadingGPS] = useState(false);
    const [locationDetails, setLocationDetails] = useState({
        address: value || '',
        lat: null,
        lng: null
    });
    const selectedDisplayNameRef = useRef(null);
    const isProtocol = variant === 'protocol';

    useEffect(() => {
        if (value !== locationDetails.address) {
            setLocationDetails(prev => ({
                ...prev,
                address: value || ''
            }));
        }
    }, [value, locationDetails.address]);

    const autocompleteOptions = useMemo(() => {
        const options = {
            types: ["geocode", "establishment"],
            fields: [
                "name",
                "formatted_address",
                "geometry.location",
                "place_id",
                "address_components",
                "types",
            ],
        };

        const bounds = buildCityBoundsLiteral(restrictLat, restrictLng);
        if (bounds) {
            options.bounds = bounds;
            options.strictBounds = true;
            options.location = { lat: restrictLat, lng: restrictLng };
            options.radius = 45000;
        }

        return options;
    }, [restrictLat, restrictLng]);

    const isAllowedPlace = (placeOrLat, lng, placeResult) => {
        if (restrictCity && placeResult && !placeBelongsToCity(placeResult, restrictCity)) {
            return false;
        }
        const lat = typeof placeOrLat === 'object' ? placeOrLat?.lat : placeOrLat;
        const checkLng = typeof placeOrLat === 'object' ? placeOrLat?.lng : lng;
        if (
            Number.isFinite(restrictLat) &&
            Number.isFinite(restrictLng) &&
            lat != null &&
            checkLng != null &&
            !isWithinCityRadius(lat, checkLng, restrictLat, restrictLng)
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

    const handlePlaceSelected = (place, inputEl) => {
        if (!place || (!place.name && !place.formatted_address)) return;

        if (restrictCity && !placeBelongsToCity(place, restrictCity)) {
            showCityRestrictionError();
            if (inputEl) {
                inputEl.value = locationDetails.address || '';
            }
            return;
        }

        const address = place.name || place.formatted_address;
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();

        if (!isAllowedPlace(lat, lng, place)) {
            showCityRestrictionError();
            if (inputEl) {
                inputEl.value = locationDetails.address || '';
            }
            return;
        }

        const details = {
            address,
            lat,
            lng,
            placeId: place.place_id,
            formattedAddress: place.formatted_address || address,
        };

        selectedDisplayNameRef.current = address;
        if (inputEl) {
            inputEl.value = address;
        }

        setLocationDetails(details);
        onChange(details);
    };

    const handleInputChange = (e) => {
        const newAddress = e.target.value;
        const lockedName = selectedDisplayNameRef.current;

        if (lockedName && newAddress !== lockedName) {
            e.target.value = lockedName;
            selectedDisplayNameRef.current = null;
            return;
        }

        selectedDisplayNameRef.current = null;

        setLocationDetails(prev => ({
            ...prev,
            address: newAddress
        }));

        onChange({
            address: newAddress,
            lat: locationDetails.lat,
            lng: locationDetails.lng
        });
    };

    const handleGetCurrentLocation = async () => {
        if (!navigator.geolocation) {
            notifications.show({
                title: 'Not Supported',
                message: 'Geolocation is not supported by your browser',
                color: 'red',
                autoClose: 4000
            });
            return;
        }

        if (navigator.permissions) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                if (permissionStatus.state === 'denied') {
                    notifications.show({
                        title: 'Permission Denied',
                        message: 'Location access was previously denied. Please enable it in your browser settings.',
                        color: 'red',
                        autoClose: 6000
                    });
                    return;
                }
            } catch {
                // Permission API not supported
            }
        }

        setIsLoadingGPS(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode(
                        { location: { lat, lng } },
                        (results, status) => {
                            setIsLoadingGPS(false);

                            if (status === 'OK' && results[0]) {
                                if (!isAllowedPlace(lat, lng, results[0])) {
                                    showCityRestrictionError();
                                    return;
                                }
                                const address = results[0].formatted_address;
                                const details = {
                                    address,
                                    lat,
                                    lng,
                                    placeId: results[0].place_id
                                };

                                selectedDisplayNameRef.current = address;
                                setLocationDetails(details);
                                onChange(details);

                                notifications.show({
                                    title: 'Success',
                                    message: 'Current location detected successfully',
                                    color: 'green',
                                    autoClose: 2000
                                });
                            } else {
                                notifications.show({
                                    title: 'Warning',
                                    message: 'Could not get address for your location',
                                    color: 'orange',
                                    autoClose: 3000
                                });
                            }
                        }
                    );
                } catch {
                    setIsLoadingGPS(false);
                    notifications.show({
                        title: 'Error',
                        message: 'Failed to get address from coordinates',
                        color: 'red',
                        autoClose: 3000
                    });
                }
            },
            (error) => {
                setIsLoadingGPS(false);
                notifications.show({
                    title: 'Location Error',
                    message: error.message || 'Failed to get your location',
                    color: 'red',
                    autoClose: 4000
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    if (isProtocol) {
        return (
            <div className={`${styles.root} ${styles.protocolRoot}`}>
                {!hideLabel && label && (
                    <label className={styles.protocolLabel}>
                        {label}{required && <span className={styles.required}>*</span>}
                    </label>
                )}

                <div
                    className={`${styles.protocolRow} ${
                        tone === 'dropoff' ? styles.protocolRowDrop : styles.protocolRowPickup
                    }`}
                >
                    {leadingIcon && (
                        <span className={styles.protocolLeading} aria-hidden="true">
                            {leadingIcon}
                        </span>
                    )}

                    <div className={styles.protocolInputWrap}>
                        <Autocomplete
                            key={`loc-${name}-${restrictCity || 'any'}-${restrictLat || 0}-${restrictLng || 0}`}
                            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                            placeholder={
                                placeholder ||
                                (restrictCity ? `Search in ${restrictCity}…` : 'Enter location')
                            }
                            className={`${styles.protocolInput} ${error ? styles.inputError : ""}`}
                            name={name}
                            value={locationDetails.address}
                            onChange={handleInputChange}
                            onPlaceSelected={handlePlaceSelected}
                            options={autocompleteOptions}
                        />
                    </div>

                    {showActions && (
                        <>
                            <button
                                type="button"
                                className={styles.protocolGpsBtn}
                                onClick={handleGetCurrentLocation}
                                disabled={isLoadingGPS}
                                title="Use current GPS location"
                                aria-label="Use current GPS location"
                            >
                                {isLoadingGPS ? (
                                    <span className="spinner-border spinner-border-sm" />
                                ) : (
                                    <MdMyLocation size={18} />
                                )}
                            </button>

                            <button
                                type="button"
                                className={`${styles.protocolPinBtn} ${
                                    tone === 'dropoff' ? styles.protocolPinBtnSoft : styles.protocolPinBtnSolid
                                }`}
                                onClick={() => onOpenMap(name, locationDetails)}
                                title="Select location from map"
                            >
                                <FaLocationDot size={14} aria-hidden="true" />
                                <span>Pin Map</span>
                            </button>
                        </>
                    )}
                </div>

                {error && <p className={styles.error}>{error}</p>}
            </div>
        );
    }

    return (
        <div className={styles.root}>
            {!hideLabel && (
                <label className={styles.label}>
                    {label}{required && <span className={styles.required}>*</span>}
                </label>
            )}

            <div className={styles.row}>
                <div className={styles.inputWrap}>
                    <Autocomplete
                        key={`loc-${name}-${restrictCity || 'any'}-${restrictLat || 0}-${restrictLng || 0}`}
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                        placeholder={
                            placeholder ||
                            (restrictCity ? `Search in ${restrictCity}…` : 'Enter location')
                        }
                        className={`${styles.input} ${error ? styles.inputError : ""}`}
                        name={name}
                        value={locationDetails.address}
                        onChange={handleInputChange}
                        onPlaceSelected={handlePlaceSelected}
                        options={autocompleteOptions}
                    />
                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <button
                    type="button"
                    className={styles.mapBtn}
                    onClick={handleGetCurrentLocation}
                    disabled={isLoadingGPS}
                    title="Use current GPS location"
                >
                    {isLoadingGPS ? (
                        <span className="spinner-border spinner-border-sm" />
                    ) : (
                        <MdMyLocation size={20} />
                    )}
                </button>

                <button
                    type="button"
                    className={styles.mapBtn}
                    onClick={() => onOpenMap(name, locationDetails)}
                    title="Select location from map"
                >
                    <MdMap size={20} />
                </button>
            </div>
        </div>
    );
}
