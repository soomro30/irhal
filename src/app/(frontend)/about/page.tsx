import { Shuffle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CityImageCard } from "@/components/city-image-card";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCityNavItems } from "@/lib/city-source";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Us | Irhal",
  description:
    "The story behind Irhal, a travel guide built for outbound travelers from the Middle East.",
  path: "/about",
});

const aboutParagraphs = [
  "Crossing the Charles River from the Harvard Business School and walking past the John F. Kennedy School of Government towards Harvard Square, I was intrigued by a strange sign on a store window: \"Please Go Away.\" Moving closer I noticed that the sign continued with the word \"Often.\"",
  "\"Please Go Away ... Often.\" An apt slogan for a travel agency! This is the inspiration behind \"irhal.com.\"",
  "Irhal is an Arabic word which means \"Go Away.\" While it may sound rude and impolite, the magic of travel comes alive with the addition of the word \"often.\" The niceties of \"please\" and \"often\" have been removed to make way for a short and memorable domain name, but the site aims to nurture the magic of travel.",
  "Whenever you venture to an unknown destination you need a guide. Irhal wishes to be that guide. And when you have seen it, done that, and worn the t-shirt, we would like you to add your comments and upload your pictures so that your experiences can facilitate future travelers.",
  "This site is meant for outbound travelers from the Middle East. Every summer hordes of expats and locals leave the region with a vengeance. Some with their families, some with just their toothbrush and a spare pair of jeans in their backpack. Irhal caters to them all. We have city guides with information on what to do with kids in tow. We also have prayer timings, mosque locations and halal food restaurants listed for those who wish to avoid non-zabiha meat and want to survive on more than just seafood and salads.",
  "Irhal will remain a work in progress. Adding new cities. Opening new avenues for exploring the world of haute couture or hot cuisine. Sharing new discoveries. And gently dropping crumbs of information to guide those who will follow your steps.",
  "Irhal. Often! Min fadlik (please)!",
];

const orderedCities = (cities: Awaited<ReturnType<typeof getCityNavItems>>) =>
  [...cities].sort((a, b) => a.slug.localeCompare(b.slug)).slice(0, 10);

export default async function AboutPage() {
  const cities = orderedCities(await getCityNavItems());

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About Us" },
      ]}
    >
      <main className="bg-white">
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article>
            <Badge variant="red">Irhal</Badge>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-ink">
              About Us
            </h1>
            <div className="mt-8 space-y-7 text-lg leading-9 text-ink/78">
              {aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden border-ink/10 bg-white shadow-none">
              <CardContent className="p-5">
                <Image
                  alt="Irhal mobile app preview"
                  className="mx-auto h-auto w-full max-w-[300px]"
                  height={337}
                  loading="lazy"
                  src="/images/irhal_app.png"
                  width={367}
                />
              </CardContent>
            </Card>

            <section aria-labelledby="about-city-cards">
              <div className="flex items-center gap-2">
                <Shuffle aria-hidden="true" className="h-5 w-5 text-irhal-red" />
                <h2 className="text-lg font-black text-ink" id="about-city-cards">
                  Explore the World
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Pick a city guide and start planning with Irhal.
              </p>
              <div className="mt-5 grid gap-4">
                {cities.map((city) => (
                  <CityImageCard
                    city={city}
                    href={`/en/city/${city.slug}`}
                    key={city.slug}
                  />
                ))}
              </div>
            </section>

            <Card className="border-0 bg-ink text-white shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-irhal-orange">
                  Irhal travel tools
                </p>
                <div className="mt-4 grid gap-2">
                  {[
                    ["Prayer times", "/en/city/karachi/prayer-times"],
                    ["Islamic travel", "/en/city/karachi/islamic-travel"],
                    ["Traveling with kids", "/en/city/karachi/section/children-in-tow"],
                    ["Hotels", "/en/city/karachi/section/hotels"],
                  ].map(([label, href]) => (
                    <Link
                      className="rounded-md px-3 py-2 text-sm font-bold text-white/78 transition hover:bg-white/10 hover:text-white"
                      href={href}
                      key={label}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}
