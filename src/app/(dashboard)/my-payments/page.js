"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiSearch, FiPlus, FiFileText } from "react-icons/fi";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaCreditCard,
  FaBus,
} from "react-icons/fa";
import { plusJakarta } from "@/lib/fonts";

const statusBadgeClass = {
  confirmed: "mp-badge-confirmed",
  pending: "mp-badge-pending",
  "under review": "mp-badge-pending",
  under_review: "mp-badge-pending",
  rejected: "mp-badge-rejected",
};

function formatStatusLabel(status) {
  const st = (status || "").toLowerCase();
  if (st === "under review" || st === "under_review" || st === "pending") {
    return "Pending";
  }
  if (!st) return "—";
  return st.charAt(0).toUpperCase() + st.slice(1);
}

const PAGE_SIZE = 10;

function getPaymentStatus(payment) {
  return (payment?.status || payment?.payment_status || "").toLowerCase();
}

function formatAmount(payment) {
  const currency =
    payment?.currency ||
    payment?.display_currency ||
    payment?.amount_currency ||
    "";
  const amount =
    payment?.amount ??
    payment?.paid_amount ??
    payment?.total_amount ??
    payment?.payment_amount;
  if (amount == null || amount === "") return "—";
  const num = Number(amount);
  const formatted = Number.isFinite(num)
    ? num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : String(amount);
  return currency ? `${currency} ${formatted}` : formatted;
}

function formatRoute(payment) {
  const pickup =
    payment?.pickup_location ||
    payment?.booking_criteria?.pickup_location ||
    payment?.from ||
    "";
  const dropoff =
    payment?.dropoff_location ||
    payment?.booking_criteria?.dropoff_location ||
    payment?.to ||
    "";
  if (pickup && dropoff) return `${pickup} → ${dropoff}`;
  if (payment?.booking_type) {
    return String(payment.booking_type).replace(/_/g, " ");
  }
  return "Transfer payment";
}

export default function MyPaymentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    fetchPayments();
  }, [session?.user?.email, session?.user?.otp]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedStatus]);

  async function fetchPayments() {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/payment-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        },
      );
      const data = await response.json();
      if (!data?.success && data?.message?.toLowerCase().includes("otp")) {
        router.push("/login?expired=1");
        return;
      }
      setPayments(data?.data || data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const st = getPaymentStatus(p);
      const matchesSearch =
        !q ||
        p?.invoice_number?.toLowerCase().includes(q) ||
        p?.booking_type?.toLowerCase().includes(q) ||
        p?.booking_id?.toString().includes(q) ||
        p?.transaction_id?.toLowerCase().includes(q) ||
        p?.name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === "all" ||
        st === selectedStatus ||
        (selectedStatus === "pending" &&
          (st === "pending" || st === "under review" || st === "under_review"));

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, selectedStatus]);

  const visiblePayments = filteredPayments.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPayments.length;

  const counts = useMemo(() => {
    const total = payments.length;
    let confirmed = 0;
    let pending = 0;
    let rejected = 0;
    payments.forEach((p) => {
      const st = getPaymentStatus(p);
      if (st === "confirmed") confirmed += 1;
      else if (st === "rejected") rejected += 1;
      else if (st === "pending" || st === "under review" || st === "under_review") {
        pending += 1;
      }
    });
    return { total, confirmed, pending, rejected };
  }, [payments]);

  const statCards = [
    {
      key: "total",
      label: "Total payments",
      value: counts.total,
      tone: "total",
      icon: <FaCreditCard size={16} />,
      foot: "Payments submitted",
    },
    {
      key: "confirmed",
      label: "Confirmed",
      value: counts.confirmed,
      tone: "confirmed",
      icon: <FaCheckCircle size={16} />,
      foot: "Confirmed",
    },
    {
      key: "pending",
      label: "Under review",
      value: counts.pending,
      tone: "tentative",
      icon: <FaClock size={16} />,
      foot: "Under review",
    },
    {
      key: "rejected",
      label: "Rejected",
      value: counts.rejected,
      tone: "cancelled",
      icon: <FaTimesCircle size={16} />,
      foot: "Rejected",
    },
  ];

  const statusChips = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className={`mp-page-wrapper royalane-bk royalane-mp ${plusJakarta.className}`}>
      <div className="royalane-mp-hero">
        <div className="royalane-mp-hero-copy">
          <p className="royalane-mp-eyebrow">Billing</p>
          <h1 className="royalane-mp-title">My payments</h1>
          <p className="royalane-mp-subtitle">
            Every payment you&apos;ve submitted for your transfers, with its review status.
          </p>
        </div>
        <Link href="/make-payments" className="royalane-mp-new-btn">
          <FiPlus aria-hidden="true" />
          New payment
        </Link>
      </div>

      <div className="royalane-stat-grid">
        {statCards.map((s) => (
          <article
            key={s.key}
            className={`royalane-stat-card royalane-stat-card--${s.tone} royalane-mp-stat`}
          >
            <div className="royalane-stat-head">
              <p className="royalane-stat-label">{s.label}</p>
              <span className="royalane-stat-icon" aria-hidden="true">
                {s.icon}
              </span>
            </div>
            <p className="royalane-stat-value">{s.value ?? 0}</p>
            <p className="royalane-stat-foot">{s.foot}</p>
          </article>
        ))}
      </div>

      <div className="bk-table-card royalane-tb-card">
        <div className="royalane-bk-toolbar royalane-mp-toolbar">
          <div className="royalane-bk-tools royalane-mp-tools">
            <div className="royalane-bk-search">
              <FiSearch aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by invoice or transaction ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search payments"
              />
            </div>
            <div className="royalane-status-chips" role="tablist" aria-label="Status filter">
              {statusChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedStatus === chip.id}
                  className={`royalane-status-chip ${
                    selectedStatus === chip.id ? "is-active" : ""
                  }`}
                  onClick={() => setSelectedStatus(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <span className="royalane-mp-count">
              {filteredPayments.length} of {payments.length} payments
            </span>
          </div>
        </div>

        <div className="table-responsive royalane-tb-desktop">
          <table className="bk-table">
            <thead>
              <tr className="bk-thead-tr">
                {["Invoice", "Amount", "Transaction ID", "Payment Date", "Status", "Receipt"].map(
                  (h) => (
                    <th key={h} className="bk-th">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="mp-skeleton-row">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div
                          className={`mp-skeleton-bar${j === 5 ? " mp-skeleton-bar-short" : ""}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visiblePayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="bk-empty-state">
                    <div className="mp-empty-title">
                      {searchQuery || selectedStatus !== "all"
                        ? "No matching payments"
                        : "No payments found"}
                    </div>
                    <div className="mp-empty-subtitle">
                      {searchQuery || selectedStatus !== "all"
                        ? "Try adjusting your search or filters."
                        : "You have no payment records yet."}
                    </div>
                  </td>
                </tr>
              ) : (
                visiblePayments.map((p, i) => {
                  const st = getPaymentStatus(p);
                  const badgeClass = statusBadgeClass[st] || "mp-badge-default";
                  const invoice = p?.invoice_number || "—";
                  return (
                    <tr key={p?.id || p?.transaction_id || i} className="bk-tr">
                      <td className="bk-td-ref">
                        <div className="royalane-mp-invoice">
                          <span className="royalane-mp-invoice-icon" aria-hidden="true">
                            <FaBus size={12} />
                          </span>
                          <span>
                            <span className="royalane-tb-invoice">{invoice}</span>
                            <span className="royalane-tb-sub">{formatRoute(p)}</span>
                          </span>
                        </div>
                      </td>
                      <td className="bk-td-amount">{formatAmount(p)}</td>
                      <td className="bk-td-text-nowrap">{p?.transaction_id || "—"}</td>
                      <td className="bk-td-text-nowrap">
                        {p?.payment_date || p?.created_at
                          ? moment(p?.payment_date || p?.created_at).format("MMM DD, YYYY")
                          : "—"}
                      </td>
                      <td className="bk-td-status">
                        <span className={`bk-status-badge ${badgeClass}`}>
                          <span className="royalane-mp-status-dot" aria-hidden="true" />
                          {formatStatusLabel(st)}
                        </span>
                      </td>
                      <td className="bk-td-actions">
                        {p?.invoice_snapshot_url ? (
                          <a
                            href={p.invoice_snapshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="royalane-mp-view-btn"
                          >
                            <FiFileText size={13} aria-hidden="true" />
                            View
                          </a>
                        ) : (
                          <span className="royalane-mp-view-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="royalane-tb-mobile">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="royalane-tb-mobile-card">
                <div className="mp-skeleton-bar" />
                <div className="mp-skeleton-bar" />
              </div>
            ))
          ) : visiblePayments.length === 0 ? (
            <p className="bk-empty-state">No payments found matching your filters.</p>
          ) : (
            visiblePayments.map((p, i) => {
              const st = getPaymentStatus(p);
              const badgeClass = statusBadgeClass[st] || "mp-badge-default";
              return (
                <article
                  key={p?.id || p?.transaction_id || i}
                  className="royalane-tb-mobile-card"
                >
                  <div className="royalane-tb-mobile-top">
                    <span className="royalane-tb-invoice">
                      {p?.invoice_number || "—"}
                    </span>
                    <span className={`bk-status-badge ${badgeClass}`}>
                      <span className="royalane-mp-status-dot" aria-hidden="true" />
                      {formatStatusLabel(st)}
                    </span>
                  </div>
                  <p className="royalane-tb-mobile-guest">{formatRoute(p)}</p>
                  <div className="royalane-tb-mobile-meta">
                    <span>
                      {p?.payment_date || p?.created_at
                        ? moment(p?.payment_date || p?.created_at).format("MMM DD, YYYY")
                        : "—"}
                    </span>
                    <strong>{formatAmount(p)}</strong>
                  </div>
                  <p className="royalane-mp-mobile-tx">{p?.transaction_id || "—"}</p>
                  {p?.invoice_snapshot_url ? (
                    <div className="royalane-tb-mobile-actions">
                      <a
                        href={p.invoice_snapshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View receipt
                      </a>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>

        {!loading && filteredPayments.length > 0 && (
          <div className="royalane-tb-footer">
            <span className="royalane-tb-count">
              Showing {Math.min(visibleCount, filteredPayments.length)} of{" "}
              {filteredPayments.length}
            </span>
            {hasMore ? (
              <button
                type="button"
                className="royalane-tb-load-more"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Load more
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
