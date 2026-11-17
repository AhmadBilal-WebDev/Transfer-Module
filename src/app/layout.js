import "bootstrap/dist/css/bootstrap.min.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "yet-another-react-lightbox/styles.css";
import BootstrapClient from "@/components/BootstrapClient";
import ScrollTop from "@/components/ScrollTop/ScrollTop";
import "./globals.css";
import "./mediaquery.css";
import "swiper/css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import LayoutVisibility from "@/components/LayoutVisibility";
import { MantineProvider } from "@mantine/core";
import { CurrencyProvider } from "@/util/currency";
import { PackageCategoriesProvider } from "@/contexts/PackageCategoriesContext";
import { Notifications } from "@mantine/notifications";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import VipCookieConsent from "@/components/CookieConsent";
import RoyalaneBootLoader from "@/components/Loader/RoyalaneBootLoader";
import SessionProvider from "@/components/Auth/SessionProvider";
import DisableInspect from "@/components/DisableInspect";

export const metadata = {
  metadataBase: new URL("https://royalane.com"),
  title: "Premium Airport Transfers & Chauffeur Services | Royalane",
  description:
    "Book reliable airport transfers with Royalane. Enjoy comfortable, safe and hassle-free transportation with convenient pickup and drop-off services.",
  icons: {
    icon: "/favicon.png",
  },
  alternates: {
    canonical: "https://royalane.com",
  },
  // verification: {
  //   google: "google77d305b7f6f43da9",
  // },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <meta name="google-site-verification" content="LrPi-9aOkjsL7aVkJs-j4E9ChWyOya5A_bFRMlXZZeU" />
        <meta name="author" content="Royalane" />

        {/* GTM / GA4 Head Script */}
        {/* <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L0YZJET5XE"
          strategy="lazyOnload"
        /> */}

        {/* <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-L0YZJET5XE');
          `}
        </Script> */}
      </head>
      <body id="scrool">
        {/* <DisableInspect /> */}
        <SpeedInsights />
        <Analytics />
        <VipCookieConsent />
        <SessionProvider>
          <CurrencyProvider>
            <PackageCategoriesProvider>
              <BootstrapClient />
              <MantineProvider>
                <RoyalaneBootLoader />
                <NextTopLoader color="#1f63d6" height={3} crawl={true} showSpinner={false} />
                <Notifications position="top-right" zIndex={10001} />
                <LayoutVisibility>{children}</LayoutVisibility>
              </MantineProvider>
            </PackageCategoriesProvider>
          </CurrencyProvider>
        </SessionProvider>
        <ScrollTop />
      </body>
    </html>
  );
}
