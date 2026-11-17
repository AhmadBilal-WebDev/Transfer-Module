import { redirect } from 'next/navigation';

/** Legacy path — keep for old links, send users to /dashboard */
export default function TransferBookingsRedirect() {
  redirect('/dashboard');
}
