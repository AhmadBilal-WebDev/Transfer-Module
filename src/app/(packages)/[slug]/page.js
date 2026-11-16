import React from "react";
import PackageList from "@/components/Package/PackageList";
import PackageListingHero from "@/components/Package/PackageListingHero";

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

  return (
    <>
      <PackageListingHero initialCategory={category_slug} />
      <div className="package-listing-results">
        <PackageList category_slug={category_slug} />
      </div>
    </>
  );
}
