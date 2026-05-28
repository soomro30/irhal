import {
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Camera,
  Compass,
  ExternalLink,
  Landmark,
  MapPin,
  MapPinned,
  Route,
  Search,
  ShoppingBag,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { MapPanel } from "@/components/map-panel";
import { PageShell } from "@/components/page-shell";
import { GuideItemRail } from "@/components/guide-item-card";
import { GuideSectionGrid } from "@/components/guide-section-grid";
import { getCityBySlug } from "@/lib/city-data";
import { getGuideItemsByKind } from "@/lib/guide-items";
import { breadcrumbJsonLd, cityJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  return pageMetadata({
    title: city.seo.title,
    description: city.seo.description,
    path: `/city/${city.slug}`,
  });
}

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const jsonLd = [
    cityJsonLd(city),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: city.name, path: `/city/${city.slug}` },
    ]),
  ];
  const places = getGuideItemsByKind(city, "place");
  const restaurants = getGuideItemsByKind(city, "restaurant");
  const hotels = getGuideItemsByKind(city, "hotel");
  const masjids = getGuideItemsByKind(city, "masjid");
  const festivals = getGuideItemsByKind(city, "festival");
  const shopping = getGuideItemsByKind(city, "shopping");
  const tours = getGuideItemsByKind(city, "tour");
  const heroImage = city.slug === "karachi" ? "/images/karachi-guide/karachi-coast-hero.png" : "/images/karachi-guide/place.svg";
  const heroStats = [
    { label: "Attractions", value: places.length },
    { label: "Restaurants", value: restaurants.length },
    { label: "Hotels", value: hotels.length },
    { label: "Masjids", value: masjids.length },
  ];
  const planningCards = [
    {
      title: "Things to do",
      description: `${places.length} museums, beaches, shrines, parks, heritage stops, and family attractions.`,
      href: `/city/${city.slug}/section/places-to-visit`,
      icon: Camera,
      image: places[0]?.imageUrl,
    },
    {
      title: "Hotels",
      description: "Choose the right base by neighborhood, airport access, coast, business district, or family needs.",
      href: `/city/${city.slug}/section/hotels`,
      icon: BedDouble,
      image: hotels[0]?.imageUrl,
    },
    {
      title: "Restaurants",
      description: `${restaurants.length} halal-aware food records from Burns Road to Clifton, DHA, Saddar, and highway clusters.`,
      href: `/city/${city.slug}/section/food-and-restaurants`,
      icon: Utensils,
      image: restaurants[0]?.imageUrl,
    },
    {
      title: "Shopping",
      description: `${shopping.length} malls, bazaars, book markets, fashion streets, and souvenir districts.`,
      href: `/city/${city.slug}/section/shopping`,
      icon: ShoppingBag,
      image: shopping[0]?.imageUrl,
    },
    {
      title: "Tours",
      description: "Heritage walks, food crawls, museum circuits, coastal drives, and family-friendly day plans.",
      href: `/city/${city.slug}/section/organized-tours`,
      icon: Route,
      image: tours[0]?.imageUrl,
    },
    {
      title: "Islamic travel",
      description: "Masjid discovery, halal dining context, Islamic landmarks, and prayer-aware planning.",
      href: `/city/${city.slug}/islamic-travel`,
      icon: Landmark,
      image: masjids[0]?.imageUrl,
    },
  ];
  const travelTips = [
    {
      title: "Best neighborhoods",
      description: "Use Clifton, DHA, Saddar, PECHS, and airport clusters as planning anchors.",
      href: `/city/${city.slug}/section/neighborhood-operating-guide`,
      icon: MapPinned,
    },
    {
      title: "Best time to visit",
      description: city.sections.climateWhenToGo,
      href: `/city/${city.slug}/section/climate-and-when-to-go`,
      icon: CalendarDays,
    },
    {
      title: "Getting around",
      description: city.sections.transportSystem,
      href: `/city/${city.slug}/section/transportation-and-getting-around`,
      icon: Compass,
    },
  ];

  return (
    <PageShell>
      <JsonLd data={jsonLd} />
      <main>
        <section className="relative min-h-[610px] overflow-hidden bg-slate-950 text-white">
          <Image
            alt={`${city.name} coastal skyline travel banner`}
            className="object-cover"
            fill
            priority
            sizes="100vw"
            src={heroImage}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-slate-950/10" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950/85 to-transparent" />
          <div className="relative mx-auto flex min-h-[610px] max-w-7xl items-end px-5 py-10">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                {city.country} destination guide
              </p>
              <h1 className="mt-4 text-6xl font-black leading-none tracking-tight md:text-8xl">{city.name}</h1>
              <p className="mt-5 max-w-3xl text-xl leading-9 text-white/90">{city.lede}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-100"
                  href={`/city/${city.slug}/section/places-to-visit`}
                >
                  <Search aria-hidden="true" className="h-4 w-4" />
                  Explore Karachi
                </Link>
                <Link
                  className="inline-flex items-center gap-2 border border-white/70 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                  href={`/city/${city.slug}/itineraries`}
                >
                  <Route aria-hidden="true" className="h-4 w-4" />
                  Plan a trip
                </Link>
                <a
                  className="inline-flex items-center gap-2 border border-white/70 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                  href={city.mapUrl}
                >
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  City map
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-7">
            <div className="grid gap-3 md:grid-cols-4">
              {heroStats.map((stat) => (
                <div className="border-l-2 border-emerald-700 bg-slate-50 px-5 py-4" key={stat.label}>
                  <p className="text-3xl font-black text-slate-950">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-5">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Start planning</p>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Essential {city.name}</h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Browse by the same building blocks editors will use for every city: things to do, hotels, restaurants,
                shopping, tours, Islamic travel, neighborhoods, and verified map context.
              </p>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {planningCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    className="group overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg"
                    href={card.href}
                    key={card.title}
                  >
                    <div className="relative h-56 overflow-hidden bg-slate-200 sm:h-64 lg:h-56">
                      {card.image ? (
                        <Image
                          alt={`${card.title} in ${city.name}`}
                          className="object-cover transition duration-500 group-hover:scale-105"
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          src={card.image}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 inline-flex h-11 w-11 items-center justify-center bg-white text-slate-950">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-2xl font-black leading-tight text-slate-950">{card.title}</h3>
                      <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{card.description}</p>
                      <p className="mt-5 font-mono text-xs uppercase tracking-widest text-slate-950">Explore section -&gt;</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-[#f4f2ec] py-14">
          <div className="mx-auto max-w-7xl px-5">
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                {city.name} travel tips from Irhal editors
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                Practical cards for the decisions travelers make first: where to base, when to go, and how to move
                around the city without losing the day to traffic.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {travelTips.map((tip) => {
                const Icon = tip.icon;
                return (
                  <Link className="bg-[#deddd9] p-6 transition hover:bg-[#d3d2cc]" href={tip.href} key={tip.title}>
                    <div className="flex items-center gap-3">
                      <Icon aria-hidden="true" className="h-8 w-8 text-slate-950" />
                      <h3 className="font-serif text-2xl uppercase tracking-wide text-slate-950">{tip.title}</h3>
                    </div>
                    <p className="mt-7 min-h-28 text-base leading-7 text-slate-800">{tip.description}</p>
                    <div className="mt-7 border-t border-slate-900 pt-5 font-mono text-sm uppercase tracking-widest">
                      Read full article <span aria-hidden="true">-&gt;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <GuideItemRail
          city={city}
          href={`/city/${city.slug}/section/places-to-visit`}
          items={places.slice(0, 12)}
          subtitle={`Discover ${places.length} attractions, museums, beaches, shrines, parks, and heritage stops as separate pages.`}
          title={`Top places to visit in ${city.name}`}
        />

        <GuideItemRail
          actionLabel="Read more"
          city={city}
          href={`/city/${city.slug}/section/food-and-restaurants`}
          items={restaurants.slice(0, 12)}
          subtitle={`Karachi food is a city layer of its own. These ${restaurants.length} food and restaurant records open into individual pages with map and CMS fields.`}
          title={`Food and restaurants in ${city.name}`}
        />

        <GuideItemRail
          city={city}
          href={`/city/${city.slug}/section/hotels`}
          items={hotels.slice(0, 10)}
          subtitle={`Location-led hotel pages for business, family, airport, old-city, Clifton, and DHA stays.`}
          title={`Where to stay in ${city.name}`}
        />

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Map-first intelligence</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Plan {city.name} by neighborhood
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Every destination record needs coordinates, map links, area mapping, and CMS workflow status. This map
                block stays part of the template, but it now supports the travel homepage instead of dominating it.
              </p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm text-slate-500">
                <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                Last verified {city.lastVerifiedAt}
              </p>
            </div>
            <MapPanel
              markers={[
                { label: city.name, latitude: city.latitude, longitude: city.longitude },
                ...city.listings.map((listing) => ({
                  label: listing.name,
                  latitude: listing.latitude,
                  longitude: listing.longitude,
                  tone: listing.listingType === "masjid" ? ("gold" as const) : ("green" as const),
                })),
              ]}
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-black">Neighborhood Operating Guide</h2>
            <div className="mt-4 grid gap-4">
              {city.neighborhoods.map((neighborhood) => (
                <Link
                  className="border border-slate-200 bg-white p-5 transition hover:border-slate-400"
                  href={`/city/${city.slug}/neighborhood/${neighborhood.slug}`}
                  key={neighborhood.slug}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{neighborhood.zone}</p>
                  <h3 className="mt-1 text-lg font-semibold">{neighborhood.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{neighborhood.operatingGuide}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black">Verified Anchor Listings</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {city.listings.map((listing) => (
                <ListingCard city={city} key={listing.slug} listing={listing} />
              ))}
            </div>
          </div>
        </section>

        <GuideItemRail
          city={city}
          href={`/city/${city.slug}/section/festivals-and-annual-events`}
          items={festivals.slice(0, 12)}
          subtitle={`Plan around ${festivals.length} festival seasons, public events, Ramadan/Eid periods, book fairs, art cycles, and winter food activity.`}
          title={`Festivals and events in ${city.name}`}
        />

        <GuideItemRail
          city={city}
          href={`/city/${city.slug}/section/shopping`}
          items={shopping.slice(0, 12)}
          subtitle={`Browse ${shopping.length} shopping areas, malls, markets, book bazaars, fashion streets, and souvenir stops as separate guide pages.`}
          title={`Shopping in ${city.name}`}
        />

        <GuideItemRail
          city={city}
          href={`/city/${city.slug}/section/organized-tours`}
          items={tours.slice(0, 8)}
          subtitle={`Heritage walks, food crawls, coastal trips, museum circuits, family days, and vetted tour ideas as individual planning pages.`}
          title={`${city.name} tours and experiences`}
        />

        <GuideItemRail
          city={city}
          href={`/city/${city.slug}/section/muslim-visitor-information`}
          items={masjids.slice(0, 10)}
          subtitle={`Landmark masjids and prayer-aware records for the Muslim travel layer, ready for women prayer area enrichment.`}
          title={`${city.name} masjids and Muslim travel`}
        />

        <GuideSectionGrid city={city} />

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-4">
            {city.fastFacts.map((fact) => (
              <article className="border-l-2 border-emerald-700 pl-4" key={fact.label}>
                <h2 className="text-sm font-semibold text-slate-950">{fact.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{fact.value}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
