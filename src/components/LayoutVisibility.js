"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer/Footer";
import IslamicHeader from "./Header/IslamicHeader";

export default function LayoutVisibility({ children }) {
  const pathname = usePathname();
  // get last part of url
  const lastSegment = pathname?.split("/")

  // hide layout on voucher, invoice, and auth portal pages
  const hideLayout =
    lastSegment &&
    (lastSegment.includes("voucher") ||
      lastSegment.includes("invoice") ||
      lastSegment.includes("login") ||
      lastSegment.includes("verify-otp"));

  return (
    <>
      {!hideLayout && <IslamicHeader />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
