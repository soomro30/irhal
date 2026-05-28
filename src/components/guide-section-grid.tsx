import {
  Award,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Map,
  ShieldCheck,
  Train,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import type { CityGuide } from "@/lib/city-data";
import { sectionCards } from "@/lib/guide-items";

const iconByName = {
  award: Award,
  calendar: CalendarDays,
  book: BookOpenCheck,
  train: Train,
  building: Building2,
  map: Map,
  wallet: WalletCards,
  family: UsersRound,
  shield: ShieldCheck,
};

export function GuideSectionGrid({ city }: { city: CityGuide }) {
  return (
    <section className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{city.name} travel guide sections</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Each section is a dynamic page. Directory sections open into individual CMS-style pages for every place,
            restaurant, hotel, masjid, shop, tour, or family stop.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sectionCards.map((card) => {
            const Icon = iconByName[card.icon];
            return (
              <Link className="bg-[#deddd9] p-6 transition hover:bg-[#d4d3cf]" href={`/city/${city.slug}/section/${card.slug}`} key={card.slug}>
                <div className="flex items-center gap-3">
                  <Icon aria-hidden="true" className="h-8 w-8" />
                  <h3 className="font-serif text-2xl uppercase tracking-wide">{card.title}</h3>
                </div>
                <p className="mt-7 min-h-20 text-base leading-7 text-slate-800">{card.summary}</p>
                <div className="mt-7 border-t border-slate-900 pt-5 font-mono text-sm uppercase tracking-widest">
                  Read full section <span aria-hidden="true">-&gt;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
