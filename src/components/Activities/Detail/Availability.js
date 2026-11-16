'use client'
import React, { useState, useMemo, useEffect } from 'react'
import moment from 'moment'
import { FiCalendar, FiChevronDown } from 'react-icons/fi'
import styles from './Availability.module.css'

export default function Availability({ PackageDetail, setSelectedDate, selectedDate }) {
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [calendarOpen, setCalendarOpen] = useState(false);

    useEffect(() => {
        if (PackageDetail?.start_date) {
            const start = moment(PackageDetail.start_date);
            const today = moment().startOf('day');
            setCurrentMonth(start.isBefore(today, 'month') ? today.clone() : start.clone());
        }
    }, [PackageDetail?.start_date]);

    const calendarDates = useMemo(() => {
        if (!PackageDetail?.start_date || !PackageDetail?.end_date || !PackageDetail?.open_hours) {
            return [];
        }

        const startOfMonth = currentMonth.clone().startOf('month');
        const endOfMonth = currentMonth.clone().endOf('month');
        const activityStart = moment(PackageDetail.start_date);
        const activityEnd = moment(PackageDetail.end_date);
        const today = moment().startOf('day');

        const calendarStart = startOfMonth.clone().startOf('isoWeek');
        const calendarEnd = endOfMonth.clone().endOf('isoWeek');

        const dates = [];
        let currentDate = calendarStart.clone();

        while (currentDate.isSameOrBefore(calendarEnd)) {
            const dayName = currentDate.format('dddd').toLowerCase();
            const dayInfo = PackageDetail.open_hours[dayName];
            const isCurrentMonth = currentDate.month() === currentMonth.month();
            const isInRange = currentDate.isBetween(activityStart, activityEnd, 'day', '[]');
            const isEnabled = dayInfo && (dayInfo.enabled === "1" || dayInfo.enabled === true);
            const isPast = currentDate.isBefore(today, 'day');

            let status = 'unavailable';
            if (isPast) {
                status = 'past';
            } else if (isInRange && isEnabled && isCurrentMonth) {
                status = 'available';
            }

            dates.push({
                date: currentDate.clone(),
                day: currentDate.format('D'),
                dayName: currentDate.format('ddd'),
                isCurrentMonth,
                isPast,
                status,
                openTime: dayInfo?.open,
                closeTime: dayInfo?.close
            });

            currentDate.add(1, 'day');
        }

        return dates;
    }, [PackageDetail, currentMonth]);

    const activityTiming = useMemo(() => {
        if (!PackageDetail?.open_hours) return null;

        let startTime = null;
        let endTime = null;

        if (selectedDate) {
            const dayName = selectedDate.format('dddd').toLowerCase();
            const dayInfo = PackageDetail.open_hours[dayName];
            if (dayInfo?.enabled === "1" || dayInfo.enabled === true) {
                startTime = dayInfo.open;
                endTime = dayInfo.close;
            }
        } else {
            const firstAvailableDate = calendarDates.find(
                dateInfo => dateInfo.status === 'available' && dateInfo.isCurrentMonth
            );

            if (firstAvailableDate) {
                startTime = firstAvailableDate.openTime;
                endTime = firstAvailableDate.closeTime;
            }
        }

        if (startTime && endTime) {
            const start = moment(startTime, 'h:mm A');
            const end = moment(endTime, 'h:mm A');
            const duration = moment.duration(end.diff(start));
            const hours = duration.asHours();

            return {
                start: start.format('h:mm A'),
                end: end.format('h:mm A'),
                startDisplay: start.format('h:mm A'),
                endDisplay: end.format('h:mm A'),
                duration: hours.toFixed(1) + 'hrs'
            };
        }

        return null;
    }, [PackageDetail, selectedDate, calendarDates]);

    const previousMonth = () => {
        setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
    };

    const nextMonth = () => {
        setCurrentMonth(currentMonth.clone().add(1, 'month'));
    };

    const handleSelectDate = (dateInfo) => {
        if (dateInfo.status !== 'available' || dateInfo.isPast || !dateInfo.isCurrentMonth) return;
        setSelectedDate(dateInfo.date);
        setCalendarOpen(false);
    };

    const weeks = [];
    for (let i = 0; i < calendarDates.length; i += 7) {
        weeks.push(calendarDates.slice(i, i + 7));
    }

    const dateLabel = selectedDate
        ? moment(selectedDate).format('MMMM D, YYYY')
        : 'Choose a date';

    const timingLabel = activityTiming
        ? `Time: ${activityTiming.start} - ${activityTiming.end}`
        : 'Select a date to view timing';

    return (
        <div>
            <div className={styles.field}>
                <span className={styles.fieldLabel}>Select Date</span>
                <button
                    type="button"
                    className={`${styles.fieldControl} ${calendarOpen ? styles.fieldControlOpen : ''}`}
                    onClick={() => setCalendarOpen((open) => !open)}
                    aria-expanded={calendarOpen}
                >
                    <FiCalendar className={styles.fieldIcon} aria-hidden="true" />
                    <span className={selectedDate ? styles.fieldValue : styles.fieldPlaceholder}>
                        {dateLabel}
                    </span>
                    <FiChevronDown className={styles.fieldChevron} aria-hidden="true" />
                </button>
            </div>

            {calendarOpen && (
                <div className={styles.calendarPanel}>
                    <div className={styles.monthNav}>
                        <button type="button" className={styles.monthBtn} onClick={previousMonth}>
                            ‹ Prev
                        </button>
                        <span className={styles.monthLabel}>{currentMonth.format('MMM YYYY')}</span>
                        <button type="button" className={styles.monthBtn} onClick={nextMonth}>
                            Next ›
                        </button>
                    </div>

                    <div className={styles.weekHead}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <span key={day}>{day}</span>
                        ))}
                    </div>

                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className={styles.weekRow}>
                            {week.map((dateInfo, dayIndex) => {
                                const isAvailable = dateInfo.status === 'available';
                                const isSelected = selectedDate && dateInfo.date.isSame(selectedDate, 'day');
                                const classNames = [
                                    styles.dayCell,
                                    isAvailable ? styles.dayAvailable : '',
                                    isSelected ? styles.daySelected : '',
                                    dateInfo.isPast ? styles.dayPast : '',
                                    !dateInfo.isCurrentMonth ? styles.dayOutside : '',
                                ].filter(Boolean).join(' ');

                                return (
                                    <button
                                        key={dayIndex}
                                        type="button"
                                        className={classNames}
                                        disabled={!isAvailable}
                                        onClick={() => handleSelectDate(dateInfo)}
                                        aria-label={dateInfo.date.format('YYYY-MM-DD')}
                                    >
                                        <span>{dateInfo.day}</span>
                                        {isAvailable && (
                                            <span className={styles.dayStatus}>
                                                {isSelected ? 'Selected' : 'Open'}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    <div className={styles.legend}>
                        <span className={styles.legendItem}>
                            <span className={`${styles.dot} ${styles.dotAvailable}`} />
                            Available
                        </span>
                        <span className={styles.legendItem}>
                            <span className={`${styles.dot} ${styles.dotSelected}`} />
                            Selected
                        </span>
                    </div>
                </div>
            )}

            <div className={styles.field}>
                <span className={styles.fieldLabel}>Activity Timing</span>
                <div className={styles.fieldControl} style={{ cursor: 'default' }}>
                    <span className={activityTiming ? styles.fieldValue : styles.fieldPlaceholder}>
                        {timingLabel}
                        {PackageDetail?.activity_duration ? ` · ${PackageDetail.activity_duration}` : ''}
                    </span>
                </div>
            </div>
        </div>
    );
}
