
import FaqsList from "@/components/Faqs/FaqsList";

export const metadata = {
  title: "Royalane FAQs | Airport Transfer Questions",

  description:
    "Find answers to frequently asked questions about Royalane transfer services, airport pickups, drop-offs, booking procedures, transportation and travel assistance.",

  keywords: [
    "Royalane FAQs",
    "Airport Transfer FAQs",
    "Transfer Booking Questions",
    "Airport Pickup Questions",
    "Airport Drop-off Services",
    "Private Transfer FAQs",
    "Transportation Guide",
    "Transfer Booking Process",
    "Travel Assistance",
  ],

  alternates: {
    canonical: "https://royalane.com/faqs",
  },
};

export default function Page() {
  return <FaqsList />;
}
