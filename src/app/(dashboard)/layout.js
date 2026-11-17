import React from 'react'
import './dashboard.css'
import SideBar from '../../dashboard_components/Layout/SideBar';
import { Philosopher } from "next/font/google";
import { ProfileProvider } from '../../contexts/ProfileContext';
import OtpGuard from "@/components/Auth/OtpGuard";
const philosopher = Philosopher({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-philosopher",
  display: "swap",
});
export default function layout({ children }) {

  return (
    <div className={`dashboard ${philosopher.variable}`}>
      <OtpGuard>
        <SideBar />
        <div className="main">
          <div className="content">
            <ProfileProvider>
              {children}
            </ProfileProvider>
          </div>
        </div>
      </OtpGuard>
    </div>
  )
}
