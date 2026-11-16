'use client';
import dynamic from 'next/dynamic';
// Search is the above-fold hero — import it statically so it is included in
// the initial JS bundle and paints immediately (critical for LCP).
import Search from '@/components/Home/Search/Search';
// Everything below the fold is code-split and loaded only when needed.
const Package = dynamic(() => import('@/components/Home/Packages/Package'));
// const Services = dynamic(() => import('@/components/Home/Services/Services'));
const TopHotels = dynamic(() => import('@/components/Home/TopHotels/TopHotels'), { ssr: false });
const TopTransfers = dynamic(() => import('@/components/Home/TopTransfers/TopTransfers'));
const MeetGreet = dynamic(() => import('@/components/Home/MeetGreet/MeetGreet'));
const WhyTravelers = dynamic(() => import('@/components/Home/WhyTravelers/WhyTravelers'));
const TransferServices = dynamic(() => import('@/components/Home/TransferServices/TransferServices'));
const HowItWorks = dynamic(() => import('@/components/Home/HowItWorks/HowItWorks'));
const PrivateTransfer = dynamic(() => import('@/components/Home/PrivateTransfer/PrivateTransfer'));
const PopularRoutes = dynamic(() => import('@/components/Home/PopularRoutes/PopularRoutes'));
const RelaxRide = dynamic(() => import('@/components/Home/RelaxRide/RelaxRide'));
const RoyalaneStandard = dynamic(() => import('@/components/Home/RoyalaneStandard/RoyalaneStandard'));
const ClientInquiries = dynamic(() => import('@/components/Home/ClientInquiries/ClientInquiries'));
const DepartureCTA = dynamic(() => import('@/components/Home/DepartureCTA/DepartureCTA'));
const TopActivities = dynamic(() => import('@/components/Home/TopActivities/TopActivities'));
// const AboutUs = dynamic(() => import('@/components/Home/AboutUs/AboutUs'));
const Destination = dynamic(() => import('@/components/Home/Destinations/Destination'));
const Testimonials = dynamic(() => import('@/components/Home/Testimonials/Testimonials'));
const WhyUs = dynamic(() => import('@/components/Home/WhyUs/Index'));
const Blogs = dynamic(() => import('@/components/Home/Blogs/Index'));
const AppNewsletter = dynamic(() => import('@/components/Home/AppNewsletter/Index'));
export default function Index() {
  return (
    <div>
      <Search />
      {/* <Package /> */}
      {/* <Destination /> */}
      {/* <Services /> */}
      {/* <TopHotels /> */}
      {/* <WhyUs /> */}
      <TopTransfers />
      <MeetGreet />
      <TransferServices />
      <WhyTravelers />
      <HowItWorks />
      <PrivateTransfer />
      <PopularRoutes />
      <RelaxRide />
      <RoyalaneStandard />
      <ClientInquiries />
      <DepartureCTA />
      {/* <AppNewsletter /> */}
      {/* <TopActivities /> */}
      {/* <Testimonials /> */}
      {/* <Blogs /> */}
      {/* <AboutUs /> */}
    </div>
  );
}
