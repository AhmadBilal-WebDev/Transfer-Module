'use client'
import React, { useState, useRef, useEffect } from "react";
import { DateInput } from '@mantine/dates';
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaSearch, FaChevronDown, FaThLarge } from "react-icons/fa";
import { usePackageCategories } from "@/contexts/PackageCategoriesContext";
import styles from "./PackageSearch.module.css";

export default function PackageSearch({ categoryList, variant, initialCategory, initialDate }) {
    const isListing = variant === 'listing';
    const { categories: contextCategories } = usePackageCategories();
    const categories = (categoryList?.length ? categoryList : contextCategories) || [];
    const [formData, setFormData] = useState({
        category: initialCategory || '',
        date: null,
    });
    const router = useRouter();
    const dateInputRef = useRef(null);
    const hydrated = useRef(false);

    useEffect(() => {
        if (!isListing || hydrated.current) return;
        let parsedDate = null;
        if (initialDate) {
            const d = new Date(initialDate);
            if (!Number.isNaN(d.getTime())) parsedDate = d;
        }
        setFormData({
            category: initialCategory || '',
            date: parsedDate,
        });
        hydrated.current = true;
    }, [isListing, initialCategory, initialDate]);

    const handleinputchange = (e) => {
        setFormData((prev) => ({
            ...prev,
            category: e.target.value,
        }))
        if (e.target.value !== '') {
            dateInputRef.current?.focus();
        }
    }

    const handledatechange = (value) => {
        setFormData((prev) => ({
            ...prev,
            date: value,
        }))
    }

    const handlesubmit = () => {
        if (formData.category === '') {
            notifications.show({
                title: 'Error',
                message: 'Category is required',
                autoClose: 2000,
                color: 'red'
            })
            return;
        } else if (formData.date === null) {
            notifications.show({
                title: 'Error',
                message: 'Date is required',
                autoClose: 2000,
                color: 'red'
            })
            return;
        }

        const dateObj =
            formData.date instanceof Date ? formData.date : new Date(formData.date);
        const dateValue = Number.isNaN(dateObj.getTime())
            ? String(formData.date)
            : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        router.push(`/${formData.category}?date=${encodeURIComponent(dateValue)}`);
    }

    if (isListing) {
        return (
            <div className={styles.searchBar}>
                <div className={styles.fieldsRow}>
                    <div className={styles.listingField}>
                        <div className={styles.fieldIcon} aria-hidden="true">
                            <FaThLarge />
                        </div>
                        <div className={`${styles.fieldBody} ${styles.categoryField}`}>
                            <span className={styles.fieldLabel}>Category</span>
                            <select
                                id="packageListingCategory"
                                value={formData.category}
                                onChange={handleinputchange}
                                className={`form-select ${styles.categorySelect}`}
                                aria-label="Package category"
                            >
                                <option value="">Where like to escape?</option>
                                {categories.map((item, index) => (
                                    <option key={index} value={item.slug}>{item.name}</option>
                                ))}
                            </select>
                            <span className={styles.selectChevron} aria-hidden="true">
                                <FaChevronDown size={12} />
                            </span>
                        </div>
                    </div>

                    <div className={styles.listingField}>
                        <div className={styles.fieldIcon} aria-hidden="true">
                            <FaCalendarAlt />
                        </div>
                        <div className={styles.fieldBody}>
                            <span className={styles.fieldLabel}>Travel Date</span>
                            <DateInput
                                onFocus={(e) => e.target.select()}
                                ref={dateInputRef}
                                variant="unstyled"
                                id="packageListingDate"
                                onChange={handledatechange}
                                minDate={new Date()}
                                value={formData.date}
                                className="hotel-date-range"
                                placeholder="Choose month"
                                valueFormat="DD MMM YYYY"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handlesubmit}
                    type="button"
                    className={styles.searchBtn}
                >
                    <FaSearch /> Filter Results
                </button>
            </div>
        );
    }

    return (
        <div className="royalaneGrid">
            <div className="royalaneRow royalaneRowTransfer">
                <div className="royalaneField">
                    <div className={`form-floating w-100 position-relative ${styles.categoryField}`}>
                        <select
                            id="packageCategory"
                            value={formData.category}
                            onChange={handleinputchange}
                            className={`form-select form-control ${styles.categorySelect}`}
                            aria-label="Package category"
                        >
                            <option value="">Select category</option>
                            {categories.map((item, index) => (
                                <option key={index} value={item.slug}>{item.name}</option>
                            ))}
                        </select>
                        <label htmlFor="packageCategory" style={{ paddingLeft: '14px' }}>Category</label>
                        <span className={styles.selectChevron} aria-hidden="true">
                            <FaChevronDown size={12} />
                        </span>
                    </div>
                </div>

                <div className="royalaneField position-relative">
                    <div className="d-flex align-items-center position-relative">
                        <div className="form-floating w-100">
                            <DateInput
                                onFocus={(e) => e.target.select()}
                                style={{ paddingLeft: '14px', paddingRight: '40px' }}
                                ref={dateInputRef}
                                variant="unstyled"
                                id="packageDate"
                                onChange={handledatechange}
                                minDate={new Date()}
                                value={formData.date}
                                className="hotel-date-range form-control"
                                placeholder="Select date"
                                valueFormat="DD MMM YYYY"
                            />
                            <label htmlFor="packageDate" style={{ paddingLeft: '14px' }}>Date</label>
                        </div>
                        <div className="royalaneFieldIconRight" aria-hidden="true">
                            <FaCalendarAlt size={15} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="royalaneSearchBtnWrap">
                <button
                    onClick={handlesubmit}
                    type="button"
                    className="btn btn-success search-btn-styling-home royalaneSearchBtn bg-color w-100"
                >
                    <FaSearch /> Search Packages
                </button>
            </div>
        </div>
    );
}
