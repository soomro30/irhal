import { ExternalLink, MapPin, MoonStar } from "lucide-react";
import Link from "next/link";

import { DiscoverLink } from "@/components/discover-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pathForListing, type CityGuide, type Listing } from "@/lib/city-data";

export function ListingCard({
  city,
  locale = "en",
  listing,
}: {
  city: CityGuide;
  locale?: "en" | "ar";
  listing: Listing;
}) {
  const localePrefix = locale === "ar" ? "/ar" : "/en";
  const listingPath = `${localePrefix}${pathForListing(city, listing)}`;

  return (
    <Card className="h-full shadow-sm transition hover:-translate-y-0.5 hover:border-coastal/40 hover:shadow-[0_20px_55px_rgba(0,109,119,0.14)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="secondary">{listing.listingType}</Badge>
            <CardTitle className="mt-3 text-lg">
              <Link
                className="hover:underline"
                href={listingPath}
              >
                {listing.name}
              </Link>
            </CardTitle>
          </div>
          {listing.muslimTravel?.isHalal || listing.listingType === "masjid" ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-saffron text-ink">
              <MoonStar aria-hidden="true" className="h-5 w-5" />
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-ink/65">
          {listing.shortDescription}
        </p>
        <div className="mt-5">
          <DiscoverLink href={listingPath} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink/65">
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
          </span>
          <a
            className="inline-flex items-center gap-1 font-bold text-coastal hover:underline"
            href={listing.mapUrl}
          >
            Map
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
