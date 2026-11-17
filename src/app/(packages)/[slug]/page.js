import React from "react";
import { notFound } from "next/navigation";
import PackageList from "@/components/Package/PackageList";
import PackageListingHero from "@/components/Package/PackageListingHero";

async function getValidCategorySlugs() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/packages/categories`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 300 },
      }
    );
    const data = await response.json();
    return (data?.Content?.categories || [])
      .map((category) => category?.slug)
      .filter(Boolean);
  } catch (error) {
    console.error("Error validating package category slug:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const title = String(slug || "packages")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    title: `${title} | Royalane`,
    description: `Explore ${title} with Royalane. Book reliable and comfortable transfer services with convenient airport pickups, drop-offs and hassle-free transportation.`,
    alternates: {
      canonical: `https://royalane.com/${slug}`,
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const category_slug = slug;
  const validSlugs = await getValidCategorySlugs();

  // Unknown single-segment paths were matching this catch-all package route.
  if (
    Array.isArray(validSlugs) &&
    !validSlugs.includes(category_slug) &&
    category_slug !== "umrah-packages"
  ) {
    notFound();
  }

  return (
    <>
      <PackageListingHero initialCategory={category_slug} />
      <div className="package-listing-results">
        <PackageList category_slug={category_slug} />
      </div>
    </>
  );
}
