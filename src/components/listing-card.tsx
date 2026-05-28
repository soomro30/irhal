import { ExternalLink, MapPin, MoonStar } from "lucide-react";
import Link from "next/link";

import type { CityGuide, Listing } from "@/lib/city-data";

const pathForListing = (city: CityGuide, listing: Listing) => {
  if (listing.listingType === "hotel") return `/city/${city.slug}/hotel/${listing.slug}`;
  if (listing.listingType === "restaurant") return `/city/${city.slug}/restaurant/${listing.slug}`;
  return `/city/${city.slug}/place/${listing.slug}`;
};

export function ListingCard({ city, listing }: { city: CityGuide; listing: Listing }) {
  return (
    <article className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{listing.listingType}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            <Link className="hover:underline" href={pathForListing(city, listing)}>
              {listing.name}
            </Link>
          </h3>
        </div>
        {listing.muslimTravel?.isHalal || listing.listingType === "masjid" ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <MoonStar aria-hidden="true" className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{listing.shortDescription}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <MapPin aria-hidden="true" className="h-4 w-4" />
          {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
        </span>
        <a className="inline-flex items-center gap-1 font-medium text-slate-950 hover:underline" href={listing.mapUrl}>
          Map
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
