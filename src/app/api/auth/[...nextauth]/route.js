import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const SESSION_MAX_AGE_SEC = 60 * 60; // 1 hour — matches login copy + middleware OTP gate

function toEpochMs(value) {
  if (value == null || value === "") return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 1e12 ? numeric * 1000 : numeric;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

const authOptions = {
  secret: authSecret,

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SEC,
    updateAge: SESSION_MAX_AGE_SEC,
  },

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "OTP Verification",
      credentials: {
        email: { label: "Email", type: "email" },
        otp:   { label: "OTP",   type: "text"  },
      },

      /**
       * Runs on the SERVER inside the NextAuth API route.
       * Calls the backend verify-otp endpoint; only issues a session if it succeeds.
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/verify-otp`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                otp:   credentials.otp,
              }),
            }
          );

          const data = await res.json();

          if (res.ok && data?.success !== false) {
            const payload = data.data ?? {};
            // Do not spread payload — backend fields can overwrite otp / otpVerifiedAt
            // with ISO strings or null and the 1-hour gate then fails immediately.
            return {
              id: payload.email ?? credentials.email,
              email: payload.email ?? credentials.email,
              name: payload.name ?? payload.email ?? credentials.email,
              otp: credentials.otp,
              verified_at: payload.verified_at,
              otpVerifiedAt: Date.now(),
            };
          }

          // Throw so NextAuth forwards the message to result.error on the client.
          throw new Error(data?.message);
        } catch (err) {
          // Re-throw our own errors; wrap unexpected ones with a generic message.
          if (err instanceof Error && err.message !== "fetch failed") throw err;
          throw new Error("Network error. Please try again.");
        }
      },
    }),
  ],

  callbacks: {
    /**
     * jwt — runs every time a token is read or written.
     * On initial sign-in `user` is populated from authorize().
     * On session.update() `trigger === "update"` and `session` holds the payload.
     */
    async jwt({ token, user, trigger, session: updatePayload }) {
      if (user) {
        token.email = user.email ?? token.email;
        token.otp = user.otp ?? token.otp;
        token.otpVerifiedAt = toEpochMs(user.otpVerifiedAt) || Date.now();
        token.verified_at = user.verified_at ?? token.verified_at;
      }

      if (trigger === "update" && updatePayload?.otpVerifiedAt) {
        token.otpVerifiedAt = toEpochMs(updatePayload.otpVerifiedAt) || Date.now();
      }

      token.otpVerifiedAt = toEpochMs(token.otpVerifiedAt) || token.otpVerifiedAt;
      return token;
    },

    /**
     * session — shapes what useSession() returns to the client.
     */
    async session({ session, token }) {
      session.user.email         = token.email;
      session.user.otp           = token.otp;
      session.user.otpVerifiedAt = token.otpVerifiedAt;
      session.user.verified_at   = token.verified_at;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",   // on auth errors, redirect to login
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
