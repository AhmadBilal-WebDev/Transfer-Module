'use client';
import React, { useEffect, useRef } from 'react';
import { useTransferList } from "./TransferListingContext";

export default function TransferPaginations() {
  const { hasMore, loadMore, totalTransfers, visibleCount } = useTransferList();
  const sentinelRef = useRef(null);
  const hasUserScrolledRef = useRef(false);
  const loadingLockRef = useRef(false);

  // Each new batch requires a fresh scroll before the next 10 can load
  useEffect(() => {
    hasUserScrolledRef.current = false;
    loadingLockRef.current = false;
  }, [visibleCount]);

  useEffect(() => {
    if (!hasMore) return undefined;

    const onScroll = () => {
      hasUserScrolledRef.current = true;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, visibleCount]);

  useEffect(() => {
    if (!hasMore) return undefined;

    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!hasUserScrolledRef.current) return;
        if (loadingLockRef.current) return;

        loadingLockRef.current = true;
        loadMore();
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.15,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleCount]);

  if (totalTransfers <= 0) return null;

  return (
    <div className="d-flex flex-column justify-content-center align-items-center w-100 mt-3">
      {hasMore ? (
        <div
          ref={sentinelRef}
          style={{ width: '100%', height: 24 }}
          aria-hidden="true"
        />
      ) : (
        <p className="mb-0 mt-2" style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
          Showing all {totalTransfers} transfers
        </p>
      )}
    </div>
  );
}
