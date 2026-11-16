import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const DASHBOARD_PREFIXES = [
  "/dashboard",
  "/hotel-bookings",
  "/transfer-bookings",
  "/activity-bookings",
  "/flight-bookings",
  "/package-bookings",
  "/holiday-package-bookings",
  "/group-package-bookings",
  "/account-statement",
  "/my-payments",
  "/make-payments",
];

const OTP_TTL_MS = 60 * 60 * 1000; // 1 hour
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

function toEpochMs(value) {
  if (value == null || value === "") return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 1e12 ? numeric * 1000 : numeric;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const isDashboard = DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (!isDashboard) return NextResponse.next();

  const token = await getToken({
    req,
    secret: authSecret,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const otpVerifiedAt = toEpochMs(token.otpVerifiedAt);
  if (!otpVerifiedAt || Date.now() - otpVerifiedAt > OTP_TTL_MS) {
    return NextResponse.redirect(new URL("/login?expired=1", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/hotel-bookings/:path*",
    "/transfer-bookings/:path*",
    "/activity-bookings/:path*",
    "/flight-bookings/:path*",
    "/package-bookings/:path*",
    "/holiday-package-bookings/:path*",
    "/group-package-bookings/:path*",
    "/account-statement/:path*",
    "/my-payments/:path*",
    "/make-payments/:path*",
  ],
};

