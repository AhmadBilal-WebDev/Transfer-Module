'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { HiOutlineLogout } from 'react-icons/hi';
import { IoCardOutline, IoAdd, IoGridOutline } from 'react-icons/io5';
import { plusJakarta } from '@/lib/fonts';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: IoGridOutline },
  { href: '/my-payments', label: 'My payments', icon: IoCardOutline },
  { href: '/make-payments', label: 'Make a payment', icon: IoAdd },
];

export default function SideBar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    localStorage.removeItem('otp_verification');
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className={`dash-nav ${plusJakarta.className}`}>
      <div className="dash-nav-inner">
        <nav className="dash-nav-pill" aria-label="Dashboard sections">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav-item ${active ? 'is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button type="button" className="dash-nav-logout" onClick={handleLogout}>
          <HiOutlineLogout aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
