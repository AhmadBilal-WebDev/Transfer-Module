"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FaMapMarkerAlt,
  FaCreditCard,
  FaTimes,
  FaCheck,
  FaCalendarCheck,
  FaCarSide,
} from "react-icons/fa";
import { plusJakarta } from "@/lib/fonts";
import styles from "./PackageBookingLoader.module.css";

export default function PackageBookingLoader({
  showLoader,
  confirmStatus = "pending", // pending | validate | reserve | payment | success | error
  errorMessage,
  componentName = "Booking",
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [failedStep, setFailedStep] = useState(null);

  const steps = useMemo(
    () => [
      {
        id: "validate",
        label: "Validating details",
        icon: <FaMapMarkerAlt aria-hidden="true" />,
      },
      {
        id: "reserve",
        label: `Reserving your ${componentName}`,
        icon: <FaCalendarCheck aria-hidden="true" />,
      },
      {
        id: "payment",
        label: "Generating payment link",
        icon: <FaCreditCard aria-hidden="true" />,
      },
    ],
    [componentName],
  );

  useEffect(() => {
    if (confirmStatus === "pending") {
      setCurrentStep(0);
      setIsComplete(false);
      setFailedStep(null);
      return;
    }
    if (confirmStatus === "validate") {
      setCurrentStep(1);
      setIsComplete(false);
      return;
    }
    if (confirmStatus === "reserve") {
      setCurrentStep(2);
      setIsComplete(false);
      return;
    }
    if (confirmStatus === "payment") {
      setCurrentStep(3);
      setIsComplete(false);
      return;
    }
    if (confirmStatus === "success") {
      setCurrentStep(steps.length);
      setIsComplete(true);
      setFailedStep(null);
      return;
    }
    if (confirmStatus === "error") {
      setFailedStep((prev) =>
        prev == null ? Math.min(currentStep, steps.length - 1) : prev,
      );
      setIsComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to status changes
  }, [confirmStatus, steps.length]);

  if (!showLoader) return null;

  const safeStep = Math.min(Math.max(currentStep, 0), steps.length);
  const progressPct = isComplete
    ? 100
    : Math.min(100, Math.round((safeStep / steps.length) * 100));

  const progressClass =
    confirmStatus === "error"
      ? styles.progressFillError
      : confirmStatus === "success"
        ? styles.progressFillSuccess
        : "";

  return (
    <div className={styles.overlay} role="alertdialog" aria-modal="true" aria-labelledby="pbl-title">
      <div className={`${styles.card} ${plusJakarta.className}`}>
        <div className={styles.header}>
          <div
            className={`${styles.brandMark} ${
              !isComplete || confirmStatus === "success" ? styles.brandMarkPulse : ""
            }`}
            aria-hidden="true"
          >
            {confirmStatus === "error" ? (
              <FaTimes size={18} />
            ) : confirmStatus === "success" ? (
              <FaCheck size={18} />
            ) : (
              <FaCarSide size={18} />
            )}
          </div>
          <h4 id="pbl-title" className={styles.title}>
            {confirmStatus === "error"
              ? "Booking interrupted"
              : confirmStatus === "success"
                ? "Booking confirmed"
                : "Processing your booking"}
          </h4>
          <p className={styles.subtitle}>
            {confirmStatus === "error"
              ? "We couldn’t finish this step. Please review and try again."
              : confirmStatus === "success"
                ? "Everything looks good — redirecting you shortly."
                : "Please wait while we secure your reservation."}
          </p>
        </div>

        <div className={styles.body}>
          <div className={styles.steps}>
            {steps.map((step, index) => {
              const isFailed = failedStep === index;
              const isCompleted =
                !isFailed &&
                confirmStatus !== "error" &&
                (index < currentStep || confirmStatus === "success");
              const isActive =
                !isComplete && !isFailed && index === Math.min(currentStep, steps.length - 1);

              let statusText = "Pending";
              let statusClass = "";
              if (isFailed) {
                statusText = "Failed";
                statusClass = styles.stepStatusFailed;
              } else if (isCompleted) {
                statusText = "Completed";
                statusClass = styles.stepStatusDone;
              } else if (isActive) {
                statusText = "Processing…";
                statusClass = styles.stepStatusActive;
              }

              return (
                <div
                  key={step.id}
                  className={`${styles.step} ${
                    isFailed
                      ? styles.stepFailed
                      : isCompleted
                        ? styles.stepDone
                        : isActive
                          ? styles.stepActive
                          : ""
                  }`}
                >
                  <div
                    className={`${styles.icon} ${
                      isFailed
                        ? styles.iconFailed
                        : isCompleted
                          ? styles.iconDone
                          : isActive
                            ? styles.iconActive
                            : styles.iconPending
                    }`}
                  >
                    {isCompleted ? (
                      <FaCheck aria-hidden="true" />
                    ) : isFailed ? (
                      <FaTimes aria-hidden="true" />
                    ) : isActive ? (
                      <span className={styles.spinner} aria-hidden="true" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className={styles.copy}>
                    <p className={styles.stepLabel}>{step.label}</p>
                    <p className={`${styles.stepStatus} ${statusClass}`}>{statusText}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.progressTrack} aria-hidden="true">
            <div
              className={`${styles.progressFill} ${progressClass}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {confirmStatus === "error" && (
            <div className={styles.errorBox}>
              {errorMessage || "Something went wrong. Please try again."}
            </div>
          )}

          <p className={styles.meta}>
            {confirmStatus === "error"
              ? "Action required"
              : confirmStatus === "success"
                ? "All steps complete"
                : `Step ${Math.min(currentStep + 1, steps.length)} of ${steps.length}`}
          </p>
        </div>
      </div>
    </div>
  );
}
