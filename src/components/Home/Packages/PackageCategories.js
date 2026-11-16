'use client'
import { useEffect, useState } from "react";
import PackageSlider from "./PackageSlider";
import { Loader } from '@mantine/core';
import styles from './PackageCategories.module.css';

export default function PackageCategories({ categories, initialSlug, initialPackages }) {
    const [activeSlug, setActiveSlug] = useState(initialSlug);
    const [packagesList, setPackagesList] = useState(initialPackages);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setPackagesList(initialPackages);
    }, [initialPackages]);
    const handleCategoryClick = async (slug) => {
        setActiveSlug(slug);
        setLoading(true);

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/packages/search?category_slug=${slug !== 'all' ? slug : ''}`,
            {
                cache: 'no-store',
                headers: {
                     'Content-Type': 'application/json',
                    }
            }
        );

        const data = await res.json();
        setPackagesList(data?.Content?.packages || []);
        setLoading(false);
    };

    return (
        <div className={`gray-simple home-package-section ${styles.section}`}>
            <div className="section-gap">
                <header className={styles.header}>
                    <span className={styles.tag}>Ready-to-book</span>
                    <h2 className={styles.title}>
                        Featured Holiday Packages
                    </h2>
                    <p className={styles.subtitle}>
                        Handcrafted itineraries with flights, stays and meals included.
                    </p>
                </header>

                <div className={styles.tabsWrap}>
                    <ul className={`nav nav-pills gap-2 ${styles.tabs}`} id="packageCategoryTabs" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${styles.tabBtn} ${activeSlug === 'all' ? styles.tabActive : ""}`}
                                onClick={() => handleCategoryClick('all')}
                                id={`tab-all`}
                                type="button"
                                role="tab"
                                aria-controls={`tab-pane-all`}
                                aria-selected={activeSlug === 'all'}
                            >
                                All
                            </button>
                        </li>
                        {categories.map((item, index) => (
                            <li key={index} className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${styles.tabBtn} ${activeSlug === item.slug ? styles.tabActive : ""}`}
                                    onClick={() => handleCategoryClick(item.slug)}
                                    id={`tab-${item.id}`}
                                    type="button"
                                    role="tab"
                                    aria-controls={`tab-pane-${item.id}`}
                                    aria-selected={activeSlug === item.slug}
                                >
                                    {item.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '30em' }}>
                         <Loader color="red" size='lg' type="dots" />
                    </div>
                ):(
                <div className="container">
                    <PackageSlider packages={packagesList} />
                </div>
                )}

            </div>
        </div>
    );
}
