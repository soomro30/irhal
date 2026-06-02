import Image from "next/image";
import Link from "next/link";

import { DiscoverPill } from "@/components/discover-action";
import type { CityNavItem } from "@/lib/city-source";

const fallbackCityImage = "/images/karachi-guide/place.svg";

export function CityImageCard({
  city,
  countryName,
  href,
  variant = "default",
}: {
  city: CityNavItem;
  countryName?: string;
  href: string;
  variant?: "default" | "portrait";
}) {
  return (
    <Link
      className={
        variant === "portrait"
          ? "group relative block aspect-[3/4] overflow-hidden rounded-xl bg-ink text-white shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-irhal-red"
          : "group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-ink text-white shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-irhal-red"
      }
      href={href}
    >
      <Image
        alt=""
        className="object-cover transition duration-500 group-hover:scale-105"
        fill
        sizes="(max-width: 1024px) 100vw, 340px"
        src={city.heroImageUrl || fallbackCityImage}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className={variant === "portrait" ? "absolute inset-x-0 bottom-0 p-4" : "absolute inset-x-0 bottom-0 p-5"}>
        <p className={variant === "portrait" ? "text-xl font-black leading-none text-white drop-shadow" : "text-2xl font-black leading-none text-white drop-shadow"}>
          {city.name}
        </p>
        <p className="mt-1 text-sm font-bold text-white/85">
          {countryName || city.country}
        </p>
        <div className="mt-4">
          <DiscoverPill className="border-white/50 bg-white/10 text-white hover:border-white hover:text-white" />
        </div>
      </div>
    </Link>
  );
}
