import type { Metadata } from "next";

import { DiscoverLink } from "@/components/discover-action";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCityNavItems } from "@/lib/city-source";
import { publicSectionCards } from "@/lib/guide-items";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Travel Articles | Irhal",
  description:
    "Read Irhal travel articles covering visitor essentials, transport, family trips, Islamic travel, food, shopping, and city planning.",
  path: "/travel-articles",
});

export default async function TravelArticlesPage() {
  const [city] = await getCityNavItems();
  const citySlug = city?.slug ?? "karachi";
  const cityName = city?.name ?? "Karachi";
  const featuredSections = publicSectionCards.filter((section) =>
    [
      "visitor-information",
      "city-information",
      "transportation-and-getting-around",
      "children-in-tow",
      "muslim-visitor-information",
      "health-and-safety",
    ].includes(section.slug),
  );

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Travel Articles" },
      ]}
    >
      <main className="bg-white">
        <section className="mx-auto max-w-7xl px-5 py-14">
          <Badge variant="red">Irhal editorial</Badge>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-ink">
            Travel Articles
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/68">
            Practical city articles for planning better trips with Irhal, from
            arrival basics and family pacing to Muslim-friendly travel guidance.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredSections.map((section) => (
              <Card
                className="border-ink/10 bg-white shadow-none transition hover:border-irhal-red/45"
                key={section.slug}
              >
                <CardContent className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
                    {cityName}
                  </p>
                  <h2 className="mt-3 text-xl font-black text-ink">
                    {section.title}
                  </h2>
                  <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-ink/62">
                    {section.summary}
                  </p>
                  <div className="mt-5">
                    <DiscoverLink href={`/en/city/${citySlug}/section/${section.slug}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
