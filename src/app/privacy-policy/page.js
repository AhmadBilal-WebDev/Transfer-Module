
import PrivacyPolicyContent from './PrivacyPolicyContent';

export const metadata = {
  title: 'Privacy Policy | Royalane',

  description:
    'Learn how Royalane collects, uses and protects your personal information when using our transfer services. We are committed to keeping your booking details and personal data secure.',

  keywords: [
    'Royalane Privacy Policy',
    'Transfer Booking Privacy',
    'Customer Data Protection',
    'Personal Information Security',
    'Airport Transfer Privacy',
    'Transportation Data Protection',
    'Customer Privacy Policy',
    'Data Security',
  ],

  alternates: {
    canonical: 'https://royalane.com/privacy-policy',
  },
};

export default function Page() {
  return <PrivacyPolicyContent />;
}
