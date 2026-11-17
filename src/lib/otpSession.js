export const OTP_TTL_MS = 60 * 60 * 1000; // 1 hour

export function toEpochMs(value) {
  if (value == null || value === '') return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 1e12 ? numeric * 1000 : numeric;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** True when NextAuth session has a fresh OTP verification (matches middleware gate). */
export function isOtpSessionValid(session) {
  if (!session?.user) return false;
  const otpVerifiedAt = toEpochMs(session.user.otpVerifiedAt);
  if (!otpVerifiedAt) return false;
  return Date.now() - otpVerifiedAt <= OTP_TTL_MS;
}
