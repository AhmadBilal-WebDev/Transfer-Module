'use client'
import React, { useState, useEffect } from "react";
import styles from "./islamicheader.module.css";
import { usePackageCategories } from "@/contexts/PackageCategoriesContext";
import Link from "next/link";
import { FaPhoneAlt, FaChevronDown, FaArrowRight } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { HiOutlineUser } from "react-icons/hi";
import { usePathname } from "next/navigation";
import CurrencySelector from "./CurrencySelector";
import moment from "moment";
import { inter } from "@/lib/fonts";
import BrandLogo from "@/components/BrandLogo";

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

export default function IslamicHeader() {
    const pathname = usePathname();
    const { categories: packageCategoryList } = usePackageCategories();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPackagesDropdownOpen, setIsPackagesDropdownOpen] = useState(false);
    const [isMobilePackagesOpen, setIsMobilePackagesOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!isMobileMenuOpen) return;

        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            window.scrollTo(0, scrollY);
        };
    }, [isMobileMenuOpen]);

    const isActive = (href) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const isDashboardRoute = DASHBOARD_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    const headerClass = [
        styles.islamicHeader,
        inter.className,
        isScrolled ? styles.islamicHeaderScrolled : '',
        isMobileMenuOpen ? styles.islamicHeaderMenuOpen : '',
    ].filter(Boolean).join(' ');

    return (
        <header className={headerClass}>
            <div className={styles.islamicHeaderShell}>
                <nav className={styles.islamicNavbar} aria-label="Main navigation">
                    <div className={styles.islamicNavbarInner}>
                        <Link className={styles.islamicNavbarBrand} href="/" onClick={closeMobileMenu} aria-label="Royalane home">
                            <BrandLogo className={styles.brandLogo} width={168} height={40} priority />
                        </Link>

                        {/* Desktop Menu — centered nav */}
                        <div className={styles.islamicDesktopMenu}>
                            <ul className={styles.islamicNavMenu}>
                                <li className={styles.islamicNavItem}>
                                    <Link
                                        className={`${styles.islamicNavLink} ${isActive('/') ? styles.islamicNavLinkActive : ''}`}
                                        href="/"
                                    >
                                        Home
                                    </Link>
                                </li>
                                {/* <li className={styles.islamicNavItem}>
                                    <Link
                                        className={`${styles.islamicNavLink} ${isActive('/activities') ? styles.islamicNavLinkActive : ''}`}
                                        href="/activities"
                                    >
                                        Activities
                                    </Link>
                                </li>
                                <li
                                    className={`${styles.islamicNavItem} ${styles.islamicDropdownItem}`}
                                    onMouseEnter={() => setIsPackagesDropdownOpen(true)}
                                    onMouseLeave={() => setIsPackagesDropdownOpen(false)}
                                >
                                    <div className={`${styles.islamicNavLink} cursor-pointer`}>
                                        Packages
                                        <FaChevronDown className={`${styles.islamicDropdownIcon} ${isPackagesDropdownOpen ? styles.islamicDropdownIconOpen : ''}`} />
                                    </div>
                                    {packageCategoryList.length > 0 && (
                                        <ul className={`${styles.islamicDropdownMenu} ${isPackagesDropdownOpen ? styles.islamicDropdownMenuOpen : ''}`}>
                                            {packageCategoryList.map((category, index) => (
                                                <li key={index} className={styles.islamicDropdownMenuItem}>
                                                    <Link href={`/${category.slug}?date=${moment().format('YYYY-MM-DD')}`} className={styles.islamicDropdownLink}>
                                                        {category.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li> */}
                                <li className={styles.islamicNavItem}>
                                    <Link
                                        className={`${styles.islamicNavLink} ${isActive('/blogs') ? styles.islamicNavLinkActive : ''}`}
                                        href="/blogs"
                                    >
                                        Blogs
                                    </Link>
                                </li>
                                <li className={styles.islamicNavItem}>
                                    <Link
                                        className={`${styles.islamicNavLink} ${isActive('/about-us') ? styles.islamicNavLinkActive : ''}`}
                                        href="/about-us"
                                    >
                                        About
                                    </Link>
                                </li>
                                <li className={styles.islamicNavItem}>
                                    <Link
                                        className={`${styles.islamicNavLink} ${isActive('/contact-us') ? styles.islamicNavLinkActive : ''}`}
                                        href="/contact-us"
                                    >
                                        Contact
                                    </Link>
                                </li>
                            </ul>

                            <div className={styles.islamicNavActions}>
                                {!isDashboardRoute && (
                                    <CurrencySelector width={styles.islamicCurrencySelect} />
                                )}
                                {/* <Link href="/login" className={styles.islamicSignIn}>
                                    Sign in
                                </Link> */}
                                {!isDashboardRoute && (
                                    <Link href="/login" className={styles.islamicBookBtn}>
                                        My Bookings
                                    </Link>
                                )}
                                {/* <Link
                                    href={isDashboardRoute ? "/dashboard" : "/login"}
                                    className={styles.islamicProfileBtn}
                                    aria-label="Account"
                                >
                                    <HiOutlineUser size={18} />
                                </Link> */}
                            </div>
                        </div>

                        <button
                            type="button"
                            className={`${styles.islamicMobileToggle} ${isMobileMenuOpen ? styles.islamicMobileToggleOpen : ''}`}
                            onClick={toggleMobileMenu}
                            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={isMobileMenuOpen}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </nav>
            </div>

            <div
                className={`${styles.islamicMobileMenu} ${isMobileMenuOpen ? styles.islamicMobileMenuOpen : ''}`}
                aria-hidden={!isMobileMenuOpen}
            >
                <div className={styles.islamicMobileMenuHeader}>
                    <div className={styles.islamicMobileMenuIntro}>
                        <p className={styles.islamicMobileMenuEyebrow}>Explore</p>
                        <Link className={styles.islamicMobileMenuLogo} href="/" onClick={closeMobileMenu} aria-label="Royalane home">
                            <BrandLogo className={styles.brandLogoMobile} width={160} height={38} priority />
                        </Link>
                    </div>
                    <button
                        type="button"
                        className={styles.islamicMobileMenuClose}
                        onClick={closeMobileMenu}
                        aria-label="Close menu"
                    >
                        <IoMdClose />
                    </button>
                </div>

                <div className={styles.islamicMobileMenuBody}>
                    <ul className={styles.islamicMobileMenuList}>
                        <li className={styles.islamicMobileMenuItem}>
                            <Link
                                className={`${styles.islamicMobileMenuLink} ${isActive('/') ? styles.islamicMobileMenuLinkActive : ''}`}
                                href="/"
                                onClick={closeMobileMenu}
                            >
                                <span className={styles.islamicMobileLinkIndex}>01</span>
                                <span className={styles.islamicMobileLinkLabel}>Home</span>
                            </Link>
                        </li>
                        {/* Packages / hotels / flights kept commented — same as before */}
                        <li className={styles.islamicMobileMenuItem}>
                            <Link
                                className={`${styles.islamicMobileMenuLink} ${isActive('/blogs') ? styles.islamicMobileMenuLinkActive : ''}`}
                                href="/blogs"
                                onClick={closeMobileMenu}
                            >
                                <span className={styles.islamicMobileLinkIndex}>02</span>
                                <span className={styles.islamicMobileLinkLabel}>Blogs</span>
                            </Link>
                        </li>
                        <li className={styles.islamicMobileMenuItem}>
                            <Link
                                className={`${styles.islamicMobileMenuLink} ${isActive('/about-us') ? styles.islamicMobileMenuLinkActive : ''}`}
                                href="/about-us"
                                onClick={closeMobileMenu}
                            >
                                <span className={styles.islamicMobileLinkIndex}>03</span>
                                <span className={styles.islamicMobileLinkLabel}>About</span>
                            </Link>
                        </li>
                        <li className={styles.islamicMobileMenuItem}>
                            <Link
                                className={`${styles.islamicMobileMenuLink} ${isActive('/contact-us') ? styles.islamicMobileMenuLinkActive : ''}`}
                                href="/contact-us"
                                onClick={closeMobileMenu}
                            >
                                <span className={styles.islamicMobileLinkIndex}>04</span>
                                <span className={styles.islamicMobileLinkLabel}>Contact</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className={styles.islamicMobileMenuFooter}>
                    {!isDashboardRoute && (
                        <div className={styles.islamicMobileCurrency}>
                            <span className={styles.islamicMobileCurrencyLabel}>Currency</span>
                            <CurrencySelector width={styles.islamicMobileCurrencySelect} />
                        </div>
                    )}
                    {!isDashboardRoute && (
                        <Link href="/login" className={styles.islamicMobileCallBtn} onClick={closeMobileMenu}>
                            My Bookings
                            <FaArrowRight size={12} />
                        </Link>
                    )}
                    <a href="tel:01234567890" className={styles.islamicMobilePhoneLink} onClick={closeMobileMenu}>
                        <FaPhoneAlt size={13} />
                        <span>0123 456 7890</span>
                    </a>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div
                    className={styles.islamicMobileBackdrop}
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />
            )}
        </header>
    );
}
