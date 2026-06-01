import type { Metadata } from "next";

import { DiscoverLink } from "@/components/discover-action";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCityNavItems } from "@/lib/city-source";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Special Offers | Irhal",
  description:
    "Find curated Irhal special offers for hotels, tours, family trips, and Muslim-friendly travel planning.",
  path: "/special-offers",
});

export default async function SpecialOffersPage() {
  const [city] = await getCityNavItems();
  const citySlug = city?.slug ?? "karachi";

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Special Offers" },
      ]}
    >
      <main className="bg-white">
        <section className="mx-auto max-w-7xl px-5 py-14">
          <Badge variant="red">Irhal deals</Badge>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-ink">
            Special Offers
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/68">
            Curated hotel, tour, and family travel offers will appear here after
            partner and editorial review.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Hotels", `/en/city/${citySlug}/section/hotels`],
              ["Organized tours", `/en/city/${citySlug}/section/organized-tours`],
              ["Family travel", `/en/city/${citySlug}/section/children-in-tow`],
            ].map(([label, href]) => (
              <Card
                className="border-ink/10 bg-paper shadow-none transition hover:border-irhal-red/45"
                key={label}
              >
                <CardContent className="p-5">
                  <h2 className="text-xl font-black text-ink">{label}</h2>
                  <div className="mt-5">
                    <DiscoverLink href={href} />
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
