import nextEnv from "@next/env";
import dns from "node:dns";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

nextEnv.loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");
process.env.IRHAL_SKIP_PAYLOAD_HOOK_REVALIDATE = "true";

const require = createRequire(import.meta.url);
const { Client } = require("pg") as {
  Client: new (config: {
    connectionString?: string;
    ssl?: { rejectUnauthorized: boolean };
  }) => {
    connect: () => Promise<void>;
    end: () => Promise<void>;
    query: (
      text: string,
      values?: unknown[],
    ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
  };
};

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

type Kind =
  | "family"
  | "festival"
  | "hotel"
  | "masjid"
  | "place"
  | "restaurant"
  | "shopping"
  | "tour";

type Target = {
  kind: Kind;
  slug: string;
};

type Asset = {
  alt: string;
  attribution: string;
  caption: string;
  copyright?: string;
  createdLabel?: string;
  file: string;
  galleryFor?: Target[];
  originalDescription?: string;
  outputBase: string;
  photographer?: string;
  primaryFor?: Target[];
  skipReason?: string;
};

type NewItem = {
  address?: string;
  arabicAddress?: string;
  arabicArea: string;
  arabicCategory: string;
  arabicOverview: string;
  arabicSummary: string;
  arabicTitle: string;
  area: string;
  body: string[];
  category: string;
  kind: Kind;
  latitude: number;
  longitude: number;
  mapUrl: string;
  neighborhoodSlug: string;
  sectionSlug: string;
  seoDescription: string;
  slug: string;
  sourceUrl: string;
  summary: string;
  title: string;
};

const verifiedAt = "2026-06-13T00:00:00.000Z";
const baseDir = path.resolve(process.cwd(), "public/guide_photos");
const reportPath = path.resolve(
  process.cwd(),
  "tmp/london-guide-photo-import-report.json",
);

const target = (kind: Kind, slug: string): Target => ({ kind, slug });

const assets: Asset[] = [
  {
    file: "2026-06-12 - 10 files/VB8GW1.jpg",
    outputBase: "london-portobello-alices-antiques-interior-visitbritain",
    alt: "Alice's Antiques interior on Portobello Road, Notting Hill",
    caption:
      "Inside Alice's Antiques and bric-a-brac store on Portobello Road in Notting Hill.",
    originalDescription:
      "Inside Alice's Antiques and bric-a-brac store piled high with fun goodies, along Portobello Road, Notting Hill, in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    galleryFor: [
      target("place", "portobello-road-market"),
      target("shopping", "portobello-road-market"),
      target("tour", "notting-hill-and-portobello-route"),
      target("place", "notting-hill"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8GW7.jpg",
    outputBase: "london-electric-cinema-portobello-screen-visitbritain",
    alt: "Electric Cinema screen and red velvet seating on Portobello Road",
    caption:
      "The red velvet auditorium inside Electric Cinema on Portobello Road.",
    originalDescription:
      "Inside view of Electric Cinema with red velvet cinema screen closed, on Portobello Road, Notting Hill, in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    primaryFor: [target("place", "electric-cinema-portobello")],
    galleryFor: [
      target("tour", "notting-hill-and-portobello-route"),
      target("place", "notting-hill"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8H9X.jpg",
    outputBase: "london-portobello-alices-antiques-browsing-visitbritain",
    alt: "Visitors browsing Alice's Antiques on Portobello Road",
    caption:
      "Visitors browsing antiques and bric-a-brac inside Alice's Antiques on Portobello Road.",
    originalDescription:
      "Two women browsing inside Alice's Antiques and bric-a-brac store piled high with fun goodies, along Portobello Road, Notting Hill, in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    galleryFor: [
      target("place", "portobello-road-market"),
      target("shopping", "portobello-road-market"),
      target("tour", "notting-hill-and-portobello-route"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8HA0.jpg",
    outputBase: "london-churchill-arms-kensington-christmas-visitbritain",
    alt: "The Churchill Arms lit for Christmas in Kensington",
    caption:
      "The Churchill Arms exterior at night with Christmas lights in Kensington.",
    originalDescription:
      "A long exposure image of the exterior of Churchill Arms at night with Christmas lights on, in Kensington, London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    primaryFor: [target("place", "churchill-arms-kensington")],
    galleryFor: [
      target("place", "notting-hill"),
      target("tour", "notting-hill-and-portobello-route"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8HCK.jpg",
    outputBase: "london-portobello-road-market-street-visitbritain",
    alt: "Portobello Road Market street scene in Notting Hill",
    caption: "Visitors walking through Portobello Road Market in London.",
    originalDescription:
      "Two women walking through Portobello Road Market, in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    primaryFor: [
      target("place", "portobello-road-market"),
      target("shopping", "portobello-road-market"),
    ],
    galleryFor: [
      target("place", "notting-hill"),
      target("tour", "notting-hill-and-portobello-route"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8HHZ.jpg",
    outputBase: "london-portobello-alices-antiques-exterior-visitbritain",
    alt: "Alice's Antiques exterior on Portobello Road",
    caption:
      "Visitors outside Alice's Antiques on Portobello Road in Notting Hill.",
    originalDescription:
      "Two women browsing outside Alice's Antiques and bric-a-brac store piled high with fun goodies, along Portobello Road, Notting Hill, in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    galleryFor: [
      target("place", "portobello-road-market"),
      target("shopping", "portobello-road-market"),
      target("tour", "notting-hill-and-portobello-route"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8HIZ.jpg",
    outputBase: "london-portobello-farm-girl-cafe-courtyard-visitbritain",
    alt: "Outdoor cafe table on Portobello Road in Notting Hill",
    caption:
      "Pancakes served in the outdoor courtyard of Farm Girl Cafe on Portobello Road.",
    originalDescription:
      "Two women eating pancakes sitting in the outdoor courtyard of Farm Girl Cafe, on Portobello Road, Notting Hill, in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    galleryFor: [
      target("place", "notting-hill"),
      target("tour", "notting-hill-and-portobello-route"),
      target("place", "portobello-road-market"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8HKU.jpg",
    outputBase: "london-electric-cinema-portobello-seating-visitbritain",
    alt: "Visitors seated inside Electric Cinema Portobello",
    caption: "Visitors relaxing inside Electric Cinema on Portobello Road.",
    originalDescription:
      "Two women relaxing in the Electric Cinema, on Portobello Road, Notting Hill, in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    galleryFor: [
      target("place", "electric-cinema-portobello"),
      target("tour", "notting-hill-and-portobello-route"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8HLM.jpg",
    outputBase: "london-portobello-alices-antiques-red-exterior-visitbritain",
    alt: "Alice's Antiques red shopfront on Portobello Road",
    caption: "A visitor outside Alice's Antiques on Portobello Road.",
    originalDescription:
      "A woman posing outside Alice's Antiques and bric-a-brac store piled high with fun goodies, along Portobello Road, Notting Hill, in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    galleryFor: [
      target("place", "portobello-road-market"),
      target("shopping", "portobello-road-market"),
      target("tour", "notting-hill-and-portobello-route"),
    ],
  },
  {
    file: "2026-06-12 - 10 files/VB8HLR.jpg",
    outputBase: "london-electric-cinema-portobello-exterior-visitbritain",
    alt: "Electric Cinema exterior on Portobello Road",
    caption: "Visitors walking toward Electric Cinema on Portobello Road.",
    originalDescription:
      "Two women walking towards Electric Cinema, on Portobello Road in London.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-11-12",
    primaryFor: [target("place", "electric-cinema-portobello")],
    galleryFor: [
      target("place", "notting-hill"),
      target("tour", "notting-hill-and-portobello-route"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8K8Y.jpg",
    outputBase: "london-thomas-farthing-vintage-shop-visitbritain",
    alt: "Thomas Farthing vintage shop in London",
    caption: "Thomas Farthing vintage clothing and objects shop in London.",
    originalDescription:
      "Man outside a shop called Thomas Farthing in London selling vintage clothing and objects",
    attribution: "VisitBritain/RichardAllen",
    photographer: "VisitBritain/RichardAllen",
    copyright: "©VisitBritain/RichardAllen",
    createdLabel: "2013-06-05",
    skipReason:
      "No existing London guide item matches Thomas Farthing, and it is too narrow for a new Irhal guide item in this pass.",
  },
  {
    file: "2026-06-12 - 17 files/VB8KNX.jpg",
    outputBase: "london-national-gallery-seurat-djanogly-room-visitbritain",
    alt: "Visitor viewing Seurat at The National Gallery in London",
    caption:
      "A visitor looking at Georges Seurat's The Bathers at Asnieres in The National Gallery.",
    originalDescription:
      "Woman looking at the The Bathers at Asnières, an impressionist painting by French artist Georges Pierre Seurat in the Djanogly room of the National Gallery in London.",
    attribution: "VisitBritain/Eric Nathan",
    photographer: "VisitBritain/Eric Nathan",
    copyright: "©VisitBritain/ Eric Nathan",
    createdLabel: "2013-08-04",
    primaryFor: [target("place", "the-national-gallery")],
  },
  {
    file: "2026-06-12 - 17 files/VB8KQV.jpg",
    outputBase: "london-science-museum-gallery-visitor-visitbritain",
    alt: "Visitor inside the Science Museum in London",
    caption: "A visitor viewing displays inside the Science Museum.",
    originalDescription:
      "Visitor looking at the items on display at the Science Museum, London, England while sitting down holding crutches",
    attribution: "VisitBritain/Britain on View",
    photographer: "VisitBritain/Britain on View",
    copyright: "©VisitBritain / Britain on View",
    createdLabel: "2010-11-03",
    primaryFor: [target("place", "science-museum")],
  },
  {
    file: "2026-06-12 - 17 files/VB8KXA.jpg",
    outputBase: "london-thomas-farthing-shopfront-visitbritain",
    alt: "Thomas Farthing shopfront in London",
    caption: "Thomas Farthing vintage and antiques shopfront in London.",
    originalDescription:
      "Man sat outside Thomas Farthing shop specialising in antiques and retro goods",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2013-06-05",
    skipReason:
      "Second Thomas Farthing image; no suitable existing guide item and not important enough for a new item.",
  },
  {
    file: "2026-06-12 - 17 files/VB8L2S.jpg",
    outputBase: "london-coppa-club-domes-tower-bridge-visitbritain",
    alt: "Coppa Club domes beside the Thames near Tower Bridge",
    caption:
      "Coppa Club restaurant domes overlooking the River Thames near Tower Bridge.",
    originalDescription:
      "Coppa Club restaurant domes overlooking the River Thames near Tower Bridge in London",
    attribution: "VisitBritain/Ann-Katrin Engels",
    photographer: "VisitBritain/Ann-Katrin Engels",
    copyright: "©VisitBritain/Ann-Katrin Engels",
    createdLabel: "2018-03-25",
    galleryFor: [
      target("place", "tower-bridge"),
      target("tour", "thames-river-cruise-westminster-to-greenwich"),
      target("hotel", "the-tower-hotel"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8L7E.jpg",
    outputBase: "london-horse-guards-parade-mounted-guards-visitbritain",
    alt: "Mounted Horse Guards at Horse Guards Parade, London",
    caption: "Mounted Horse Guards walking toward Horse Guards Parade.",
    originalDescription:
      "Horse Guards walking towards Horse Guards Parade, St James Park, London, England.",
    attribution: "VisitBritain/Martin Ritchie",
    photographer: "VisitBritain/Martin Ritchie",
    copyright: "©VisitBritain/Martin Ritchie",
    createdLabel: "2018-01-31",
    primaryFor: [target("place", "horse-guards-parade")],
    galleryFor: [
      target("place", "st-james-s-park"),
      target("tour", "city-of-westminster-royal-walking-route"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8L7Q.jpg",
    outputBase: "london-thames-skyline-shard-night-visitbritain",
    alt: "London skyline at night with the River Thames and The Shard",
    caption: "London's river skyline at night, including The Shard.",
    originalDescription:
      "London city skyline at night including River Thames and the Shard building.",
    attribution: "VisitBritain/George Johnson",
    photographer: "VisitBritain/George Johnson",
    copyright: "©VisitBritain/George Johnson",
    createdLabel: "2016-10-08",
    galleryFor: [
      target("tour", "thames-river-cruise-westminster-to-greenwich"),
      target("hotel", "shangri-la-the-shard"),
      target("place", "sky-garden"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8LAG.jpg",
    outputBase: "london-neals-yard-covent-garden-visitbritain",
    alt: "Neal's Yard courtyard in Covent Garden",
    caption: "A visitor walking through Neal's Yard in Covent Garden.",
    originalDescription: "Man walking through Neal's Yard, Covent Garden, London.",
    attribution: "VisitBritain/Yousef Alsudais",
    photographer: "VisitBritain/Yousef Alsudais",
    copyright: "©VisitBritain/Yousef Alsudais",
    createdLabel: "2018-11-20",
    primaryFor: [target("place", "neal-s-yard")],
    galleryFor: [
      target("place", "covent-garden"),
      target("shopping", "seven-dials"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8LBK.jpg",
    outputBase: "london-st-pauls-dome-millennium-bridge-skyline-visitbritain",
    alt: "View from St Paul's Cathedral dome over Millennium Bridge",
    caption:
      "Sunrise view from St Paul's Cathedral dome toward Millennium Bridge and the City.",
    originalDescription:
      "View at sunrise from the top of St Paul's cathedral's dome featuring Millennium Bridge and city skyline",
    attribution: "VisitBritain/Matador Network",
    photographer: "Matador Network",
    copyright: "©VisitBritain/Matador Network",
    createdLabel: "2018-10-22",
    galleryFor: [
      target("place", "st-paul-s-cathedral"),
      target("place", "millennium-bridge"),
      target("tour", "city-of-london-history-walk"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8LCG.jpg",
    outputBase: "london-cyclist-big-ben-westminster-visitbritain",
    alt: "Cyclist near Big Ben and the Palace of Westminster",
    caption:
      "Cyclist with Big Ben and the Palace of Westminster in the background.",
    originalDescription:
      "Man cycling with legs outstretched with Big Ben and the Houses of Parliament, Palace of Westminster, in the background.",
    attribution: "VisitBritain/Mirko",
    photographer: "VisitBritain/Mirko",
    copyright: "©VisitBritain/Mirko",
    createdLabel: "2015-12-24",
    galleryFor: [
      target("place", "palace-of-westminster-and-elizabeth-tower"),
      target("tour", "city-of-westminster-royal-walking-route"),
      target("tour", "royal-parks-cycle-or-walking-route"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8LHP.jpg",
    outputBase: "london-red-phone-box-book-exchange-visitbritain",
    alt: "Red telephone box filled with books in London",
    caption:
      "A red telephone box used as a book exchange beneath a magnolia tree.",
    originalDescription:
      "Red telephone box filled with books underneath a pink magnolia tree, London, England.",
    attribution: "VisitBritain/Bei Na",
    photographer: "VisitBritain/Bei Na",
    copyright: "©VisitBritain/Bei Na",
    createdLabel: "2019-04-19",
    skipReason:
      "Iconic London context image but no specific guide item or verifiable location in the embedded metadata.",
  },
  {
    file: "2026-06-12 - 17 files/VB8LI9.jpg",
    outputBase: "london-tower-bridge-rainy-night-visitbritain",
    alt: "Tower Bridge seen from a wet London street at night",
    caption: "People walking past lights on a wet street near Tower Bridge.",
    originalDescription:
      "People walking past fairy lights on a wet street at night with Tower Bridge beyond, London, England.",
    attribution: "VisitBritain/Moumita Paul",
    photographer: "VisitBritain/Moumita Paul",
    copyright: "©VisitBritain/ Moumita Paul",
    createdLabel: "2017-12-15",
    galleryFor: [target("place", "tower-bridge")],
  },
  {
    file: "2026-06-12 - 17 files/VB8LQ4.jpg",
    outputBase: "london-seven-dials-black-taxi-visitbritain",
    alt: "Black taxi outside the Crown and Anchor in Seven Dials",
    caption: "A black taxi driving past the Crown and Anchor in Seven Dials.",
    originalDescription:
      "Black taxi driving on the street in front of the Crown and Anchor Pub, Seven Dials, London, England.",
    attribution: "VisitBritain/Francesco Meola",
    photographer: "VisitBritain/Francesco Meola",
    copyright: "©VisitBritain/Francesco Meola",
    createdLabel: "2020-02-10",
    galleryFor: [
      target("shopping", "seven-dials"),
      target("place", "covent-garden"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8LQI.jpg",
    outputBase: "london-st-pauls-red-telephone-box-visitbritain",
    alt: "Red telephone box in front of St Paul's Cathedral",
    caption:
      "A visitor beside a red telephone box with St Paul's Cathedral behind.",
    originalDescription:
      "Woman in a red telephone box in front of St Paul's Cathedral, City of London,",
    attribution: "VisitBritain/Sam Barker",
    photographer: "VisitBritain/Sam Barker",
    copyright: "©VisitBritain/Sam Barker",
    createdLabel: "2019-10-20",
    galleryFor: [target("place", "st-paul-s-cathedral")],
  },
  {
    file: "2026-06-12 - 17 files/VB8LRH.jpg",
    outputBase: "london-westminster-abbey-red-telephone-box-visitbritain",
    alt: "Red telephone box outside Westminster Abbey",
    caption: "A visitor by a red telephone box in front of Westminster Abbey.",
    originalDescription:
      "Woman by a red telephone box in front of Westminster Abbey, London",
    attribution: "VisitBritain/Sam Barker",
    photographer: "VisitBritain/Sam Barker",
    copyright: "©VisitBritain/Sam Barker",
    createdLabel: "2019-10-22",
    galleryFor: [target("place", "westminster-abbey")],
  },
  {
    file: "2026-06-12 - 17 files/VB8K9R.jpeg",
    outputBase: "london-south-bank-london-eye-river-visitbritain",
    alt: "Friends on the South Bank overlooking the London Eye",
    caption: "Friends sitting on the South Bank by the River Thames.",
    originalDescription:
      "Friends sat on the Southbank, by the River Thames, overlooking the London Eye Wheel, London, England.",
    attribution: "VisitBritain/Jessica Lemaitre",
    photographer: "VisitBritain/Jessica Lemaitre",
    copyright: "©VisitBritain/ Jessica Lemaitre",
    createdLabel: "2024-03-25",
    galleryFor: [
      target("place", "london-eye"),
      target("place", "southbank-centre"),
      target("family", "south-bank-walk"),
    ],
  },
  {
    file: "2026-06-12 - 17 files/VB8KH9.jpeg",
    outputBase: "london-ampersand-hotel-afternoon-tea-visitbritain",
    alt: "Afternoon tea at The Ampersand Hotel in London",
    caption: "Afternoon tea service at The Ampersand Hotel.",
    originalDescription: "Afternoon tea at Ampersand Hotel, London, England",
    attribution: "VisitBritain/adventureswithaunty",
    photographer: "VisitBritain/adventureswithaunty",
    copyright: "©VisitBritain/adventureswithaunty",
    createdLabel: "2024-03-25",
    skipReason:
      "The Ampersand Hotel is not currently a London guide item, and this pass avoids adding a hotel solely from an afternoon-tea image.",
  },
  {
    file: "2026-06-12 - 20 files/VB884X.jpeg",
    outputBase: "london-westow-house-hotel-crystal-palace-visitbritain",
    alt: "Westow House Hotel exterior in Crystal Palace",
    caption: "Westow House Hotel entrance decorated for Christmas.",
    originalDescription:
      "Westow House Hotel external entrance in Crystal Palace, London, during the Christmas festive season and decorated.",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-03-25",
    skipReason:
      "Westow House Hotel is a local hotel rather than a priority Irhal London guide item.",
  },
  {
    file: "2026-06-12 - 20 files/VB8DAI.jpg",
    outputBase: "london-kings-cross-station-train-platform-visitbritain",
    alt: "Travellers waiting for a train at King's Cross Station",
    caption: "A couple waiting for a train at King's Cross Station.",
    originalDescription: "A couple waits for a train in Kings Cross Station",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-01-31",
    galleryFor: [
      target("place", "king-s-cross-and-st-pancras"),
      target("masjid", "st-pancras-international-prayer-room-leads"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8DBR.jpg",
    outputBase: "london-claremont-square-vintage-car-visitbritain",
    alt: "Vintage car outside Claremont Square in London",
    caption: "A vintage car parked outside Claremont Square on a London tour.",
    originalDescription: "A vintage car parked outside Claremont Square on a tour",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-01-30",
    galleryFor: [target("tour", "harry-potter-london-locations-walk")],
  },
  {
    file: "2026-06-12 - 20 files/VB8DDC.jpg",
    outputBase: "london-st-pancras-autograph-hotel-exterior-visitbritain",
    alt: "St Pancras London Autograph Collection exterior",
    caption:
      "A vintage British car outside the St Pancras London hotel and station building.",
    originalDescription:
      "A vintage British car is parked outside the St. Pancras Renaissance Hotel in London",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-01-30",
    primaryFor: [target("hotel", "st-pancras-london-autograph-collection")],
    galleryFor: [
      target("place", "king-s-cross-and-st-pancras"),
      target("tour", "harry-potter-london-locations-walk"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8DDD.jpg",
    outputBase: "london-kings-cross-station-escalator-visitbritain",
    alt: "Escalator inside King's Cross Station",
    caption: "Travellers descending an escalator at King's Cross Station.",
    originalDescription: "A couple travel down an escalator at Kings Cross Station",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-01-31",
    galleryFor: [
      target("place", "king-s-cross-and-st-pancras"),
      target("masjid", "st-pancras-international-prayer-room-leads"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8DFD.jpg",
    outputBase: "london-kings-cross-station-escalator-wide-visitbritain",
    alt: "Travellers on an escalator at King's Cross Station",
    caption: "Travellers moving through King's Cross Station in London.",
    originalDescription:
      "A couple travel down an escalator at Kings Cross Station in London",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-01-30",
    galleryFor: [target("place", "king-s-cross-and-st-pancras")],
  },
  {
    file: "2026-06-12 - 20 files/VB8DK8.jpg",
    outputBase: "london-rangers-house-wernher-collection-stateroom",
    alt: "State room at Ranger's House and The Wernher Collection",
    caption:
      "A furnished state room inside Ranger's House and The Wernher Collection in Greenwich.",
    originalDescription:
      "Visual identification from contact sheet: furnished state room inside Ranger's House and The Wernher Collection, Greenwich.",
    attribution: "VisitBritain supplied asset",
    photographer: "Credit unavailable in embedded metadata",
    createdLabel: "2024-03-25",
    galleryFor: [target("place", "ranger-s-house-and-the-wernher-collection")],
  },
  {
    file: "2026-06-12 - 20 files/VB8DKE.jpg",
    outputBase: "london-rangers-house-wernher-collection-display",
    alt: "Display room at Ranger's House and The Wernher Collection",
    caption:
      "Display cases inside Ranger's House and The Wernher Collection in Greenwich.",
    originalDescription:
      "Visual identification from contact sheet: museum display cases at Ranger's House and The Wernher Collection, Greenwich.",
    attribution: "VisitBritain supplied asset",
    photographer: "Credit unavailable in embedded metadata",
    createdLabel: "2024-03-25",
    primaryFor: [target("place", "ranger-s-house-and-the-wernher-collection")],
  },
  {
    file: "2026-06-12 - 20 files/VB8DL3.jpg",
    outputBase: "london-rangers-house-wernher-collection-cabinet",
    alt: "Decorative arts cabinet at Ranger's House in Greenwich",
    caption:
      "Decorative arts on display at Ranger's House and The Wernher Collection.",
    originalDescription:
      "Visual identification from contact sheet: decorative arts cabinet at Ranger's House and The Wernher Collection, Greenwich.",
    attribution: "VisitBritain supplied asset",
    photographer: "Credit unavailable in embedded metadata",
    createdLabel: "2024-03-25",
    galleryFor: [target("place", "ranger-s-house-and-the-wernher-collection")],
  },
  {
    file: "2026-06-12 - 20 files/VB8DSF.jpg",
    outputBase: "london-queens-house-greenwich-aerial",
    alt: "Aerial view of Queen's House and Greenwich Park",
    caption: "Aerial view of Queen's House and gardens in Greenwich.",
    originalDescription:
      "Visual identification from contact sheet and folder sequence: aerial view of Queen's House and gardens in Greenwich.",
    attribution: "VisitBritain supplied asset",
    photographer: "Credit unavailable in embedded metadata",
    createdLabel: "2024-03-25",
    galleryFor: [
      target("place", "queen-s-house"),
      target("place", "greenwich-park"),
      target("tour", "greenwich-maritime-day-tour"),
      target("family", "greenwich-day"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8EYR.jpg",
    outputBase: "london-old-spitalfields-market-shopping-brendan-bell",
    alt: "Shoppers inside Old Spitalfields Market",
    caption:
      "Shoppers exploring stalls and food shops inside Old Spitalfields Market.",
    originalDescription:
      "Shoppers exploring vast Spitalfields Market with clothing and trinket stalls, food, retail shops, in the East End of London.",
    attribution: "Spitalfields Market / Brendan Bell",
    photographer: "Brendan Bell",
    copyright: "©Brendan Bell",
    createdLabel: "2024-03-25",
    primaryFor: [
      target("place", "old-spitalfields-market"),
      target("shopping", "old-spitalfields-market"),
    ],
    galleryFor: [
      target("tour", "east-end-and-brick-lane-heritage-walk"),
      target("tour", "london-markets-route"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8GXY.jpg",
    outputBase: "london-thames-dinner-cruise-hornblower",
    alt: "Dinner cruise on the River Thames in London",
    caption:
      "A couple enjoying a Thames river cruise with London landmarks in view.",
    originalDescription:
      "A couple enjoying a Thames River city cruise with dinner and wine and London sights in the background.",
    attribution: "Hornblower Group / City Experiences",
    photographer: "Hornblower Group / City Experiences",
    createdLabel: "2024-03-25",
    galleryFor: [
      target("tour", "thames-river-cruise-westminster-to-greenwich"),
      target("place", "london-eye"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8H6U.jpg",
    outputBase: "london-big-bus-tour-st-pauls-visitbritain",
    alt: "Big Bus London sightseeing bus outside St Paul's Cathedral",
    caption:
      "An open-top Big Bus Tours sightseeing bus passing St Paul's Cathedral.",
    originalDescription:
      "People enjoying an open top bus excursion with Big Bus Tours exploring the iconic city sights of London, England.",
    attribution: "Big Bus Tours / Exponent LLC",
    photographer: "Marc Sethi Photography",
    copyright: "Marc Sethi Photography",
    createdLabel: "2024-03-25",
    primaryFor: [target("tour", "big-bus-london-sightseeing-tour")],
    galleryFor: [
      target("tour", "london-buses"),
      target("place", "st-paul-s-cathedral"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8H80.jpg",
    outputBase: "london-big-bus-tour-st-pauls-wide-visitbritain",
    alt: "Open-top Big Bus tour in front of St Paul's Cathedral",
    caption:
      "A Big Bus Tours open-top bus with St Paul's Cathedral in the background.",
    originalDescription:
      "People enjoying an open top bus excursion with Big Bus Tours exploring the iconic city sights of London, England.",
    attribution: "Big Bus Tours / Exponent LLC",
    photographer: "Marc Sethi Photography",
    copyright: "Marc Sethi Photography",
    createdLabel: "2024-03-25",
    galleryFor: [
      target("tour", "big-bus-london-sightseeing-tour"),
      target("tour", "london-buses"),
      target("place", "st-paul-s-cathedral"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8LOA.jpg",
    outputBase: "london-st-pauls-cathedral-group-visitbritain",
    alt: "Visitors outside St Paul's Cathedral in London",
    caption:
      "Visitors standing and talking in front of St Paul's Cathedral.",
    originalDescription:
      "Two men and two women standing and talking in front of St Paul's Cathedral, City of London, London",
    attribution: "VisitBritain/Sam Barker",
    photographer: "VisitBritain/Sam Barker",
    copyright: "©VisitBritain/Sam Barker",
    createdLabel: "2024-03-25",
    galleryFor: [
      target("place", "st-paul-s-cathedral"),
      target("tour", "city-of-london-history-walk"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8LSL.jpg",
    outputBase: "london-dare-skywalk-tottenham-hotspur-stadium",
    alt: "The Dare Skywalk at Tottenham Hotspur Stadium",
    caption:
      "Visitors on The Dare Skywalk Edge at Tottenham Hotspur Stadium.",
    originalDescription:
      "People at The Dare Skywalk Edge, Tottenham Hotspurs Stadium",
    attribution: "Tottenham Hotspur / Dare Skywalk Edge",
    photographer: "Tottenham Hotspur / Dare Skywalk Edge",
    copyright: "Tottenham Hotspur",
    createdLabel: "2024-03-25",
    galleryFor: [
      target("place", "tottenham-hotspur-stadium"),
      target("tour", "tottenham-hotspur-stadium-tour"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8LTA.jpg",
    outputBase: "london-skuna-boats-thames-hot-tub-ride",
    alt: "Skuna Boats hot tub ride on the Thames",
    caption:
      "Views from a Skuna Boats hot tub ride on London's waterways.",
    originalDescription: "Views during the Hot Tub ride on the Thames trip with Skuna Boats.",
    attribution: "Skuna Boats",
    photographer: "Skuna Boats",
    copyright: "Skuna Boats",
    createdLabel: "2024-03-25",
    galleryFor: [
      target("tour", "thames-river-cruise-westminster-to-greenwich"),
      target("place", "canary-wharf"),
    ],
  },
  {
    file: "2026-06-12 - 20 files/VB8MHA.jpg",
    outputBase: "london-notting-hill-colourful-street-visitbritain",
    alt: "Colourful Notting Hill street on a sunny day",
    caption: "A visitor walking down a colourful street in Notting Hill.",
    originalDescription:
      "Woman walking down a street in Notting Hill, London on a sunny day",
    attribution: "VisitBritain",
    photographer: "VisitBritain",
    createdLabel: "2024-03-25",
    primaryFor: [target("place", "notting-hill")],
    galleryFor: [target("tour", "notting-hill-and-portobello-route")],
  },
  {
    file: "2026-06-12 - 20 files/VB8N7F.jpg",
    outputBase: "london-brigits-bakery-afternoon-tea-bus-tate-britain",
    alt: "Brigit's Bakery afternoon tea bus outside Tate Britain",
    caption:
      "Brigit's Bakery bus decorated for Christmas outside Tate Britain.",
    originalDescription:
      "Brigit's Bakery Bus in front of Tate Britain Gallery decorated with Christmas lights during the festive season",
    attribution: "Brigit's Bakery supplied asset",
    photographer: "Credit unavailable in embedded metadata",
    createdLabel: "2024-03-25",
    primaryFor: [target("tour", "brigit-s-bakery-afternoon-tea-bus-tour")],
    galleryFor: [target("tour", "london-buses")],
  },
  {
    file: "2026-06-12 - 20 files/VB8NJ5.jpg",
    outputBase: "london-sun-street-hotel-shoreditch-doorman",
    alt: "Doorman outside Sun Street Hotel in Shoreditch",
    caption: "A doorman standing outside Sun Street Hotel in Shoreditch.",
    originalDescription:
      "A doorman standing outside the entrance to Sun Street Hotel, Shoreditch, London",
    attribution: "Nick Smith Photography",
    photographer: "nick @nicksmithphotography.com",
    copyright: "© nick @nicksmithphotography.com",
    createdLabel: "2024-03-25",
    skipReason:
      "Sun Street Hotel is a useful boutique hotel lead but not important enough to add as a new Irhal guide item without a hotel curation brief.",
  },
];

const newItems: NewItem[] = [
  {
    kind: "place",
    slug: "electric-cinema-portobello",
    title: "Electric Cinema Portobello",
    arabicTitle: "إلكتريك سينما بورتوبيللو",
    area: "Notting Hill",
    arabicArea: "نوتنغ هيل",
    category: "Historic cinema",
    arabicCategory: "سينما تاريخية",
    sectionSlug: "places-to-visit",
    neighborhoodSlug: "kensington-and-chelsea",
    latitude: 51.515,
    longitude: -0.2057,
    address: "191 Portobello Road, London W11 2ED",
    arabicAddress: "١٩١ بورتوبيللو رود، لندن W11 2ED",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Electric%20Cinema%20Portobello%20London",
    sourceUrl: "https://www.electriccinema.co.uk/",
    summary:
      "Historic Portobello Road cinema known for its restored auditorium, lounge seating and Notting Hill atmosphere.",
    arabicSummary:
      "سينما تاريخية على بورتوبيللو رود تشتهر بقاعتها المجددة ومقاعدها الوثيرة وأجواء نوتنغ هيل.",
    seoDescription:
      "Electric Cinema Portobello is a historic Notting Hill cinema on Portobello Road, useful for travellers planning a relaxed West London evening.",
    body: [
      "Electric Cinema Portobello is one of Notting Hill's most distinctive cultural stops: a restored neighbourhood cinema on Portobello Road with deep red interiors, lounge-style seating and a schedule that mixes mainstream releases with curated screenings.",
      "For Irhal travellers, it works best as an evening add-on after Portobello Road Market or a Notting Hill walk. It is not an Islamic attraction, and food or drink options should be checked directly before booking, but the venue is a useful marker for the area's historic creative character.",
    ],
    arabicOverview:
      "تُعد إلكتريك سينما بورتوبيللو من أبرز المحطات الثقافية في نوتنغ هيل؛ فهي سينما تاريخية مجددة تقع على بورتوبيللو رود، وتجمع بين قاعة ذات طابع كلاسيكي ومقاعد مريحة وبرنامج عروض متنوع.\n\nتناسب الزائر بوصفها إضافة مسائية هادئة بعد سوق بورتوبيللو أو جولة مشي في نوتنغ هيل. وليست معلماً إسلامياً، كما ينبغي التحقق من خيارات الطعام والشراب مباشرة قبل الحجز، لكنها تمنح المسافر لمحة واضحة عن الطابع الإبداعي التاريخي للحي.",
  },
  {
    kind: "place",
    slug: "churchill-arms-kensington",
    title: "The Churchill Arms Kensington",
    arabicTitle: "تشرشل آرمز كنسينغتون",
    area: "Kensington",
    arabicArea: "كنسينغتون",
    category: "Historic pub exterior",
    arabicCategory: "واجهة تاريخية وحانة شهيرة",
    sectionSlug: "places-to-visit",
    neighborhoodSlug: "kensington-and-chelsea",
    latitude: 51.5069,
    longitude: -0.1948,
    address: "119 Kensington Church Street, London W8 7LN",
    arabicAddress: "١١٩ كنسينغتون تشيرش ستريت، لندن W8 7LN",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=The%20Churchill%20Arms%20Kensington%20London",
    sourceUrl: "https://www.churchillarmskensington.co.uk/",
    summary:
      "Famous Kensington pub exterior known for extravagant flowers, seasonal lights and Churchill-themed decoration.",
    arabicSummary:
      "واجهة شهيرة في كنسينغتون تُعرف بزهورها الكثيفة وإضاءاتها الموسمية وزخارفها المرتبطة بتشرشل.",
    seoDescription:
      "The Churchill Arms in Kensington is a famous London pub exterior and photo stop near Notting Hill and Kensington Church Street.",
    body: [
      "The Churchill Arms is best treated in this guide as a visual landmark rather than a dining recommendation. Its flower-covered facade and elaborate festive lights make it one of Kensington's most photographed pub exteriors.",
      "Muslim travellers should note that it is a working pub, so it is not positioned here as a halal food stop. It can, however, be a quick exterior photo point when walking between Kensington, Notting Hill and Portobello Road.",
    ],
    arabicOverview:
      "يُدرج تشرشل آرمز في هذا الدليل بوصفه معلماً بصرياً لا توصية لتناول الطعام؛ إذ تشتهر واجهته المكسوة بالزهور وإضاءاته الاحتفالية الكثيفة، ما جعله من أكثر واجهات كنسينغتون تصويراً.\n\nينبغي للمسافر المسلم الانتباه إلى أنه حانة عاملة، لذلك لا يُقدَّم هنا كوجهة طعام حلال. ومع ذلك يمكن التوقف عنده سريعاً لالتقاط صورة خارجية أثناء المشي بين كنسينغتون ونوتنغ هيل وبورتوبيللو رود.",
  },
  {
    kind: "place",
    slug: "horse-guards-parade",
    title: "Horse Guards Parade",
    arabicTitle: "هورس غاردز باريد",
    area: "Westminster",
    arabicArea: "وستمنستر",
    category: "Ceremonial parade ground",
    arabicCategory: "ساحة مراسم ملكية",
    sectionSlug: "places-to-visit",
    neighborhoodSlug: "westminster",
    latitude: 51.5048,
    longitude: -0.1282,
    address: "Horse Guards Parade, Whitehall, London SW1A 2AX",
    arabicAddress: "هورس غاردز باريد، وايتهول، لندن SW1A 2AX",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Horse%20Guards%20Parade%20London",
    sourceUrl:
      "https://www.royalparks.org.uk/visit/parks/st-jamess-park/horse-guards-parade",
    summary:
      "Ceremonial parade ground beside St James's Park, known for royal military ceremonies and mounted guards.",
    arabicSummary:
      "ساحة مراسم بجوار سانت جيمس بارك تشتهر بالمراسم العسكرية الملكية والحرس الخيّالة.",
    seoDescription:
      "Horse Guards Parade is a Westminster ceremonial landmark beside St James's Park and Whitehall.",
    body: [
      "Horse Guards Parade is the ceremonial ground between Whitehall and St James's Park, best known to visitors for mounted guards, royal pageantry and major state occasions such as Trooping the Colour.",
      "It fits naturally into a Westminster walking route with Buckingham Palace, St James's Park, Downing Street, Westminster Abbey and the Palace of Westminster. Check ceremony times before making it the anchor of a morning plan, as access can change around official events.",
    ],
    arabicOverview:
      "هورس غاردز باريد ساحة مراسم تقع بين وايتهول وسانت جيمس بارك، ويعرفها الزوار بالحرس الخيّالة والاستعراضات الملكية والمناسبات الرسمية الكبرى مثل مراسم تروبينغ ذا كَلَر.\n\nتندمج الساحة بسهولة ضمن مسار مشي في وستمنستر يضم قصر بكنغهام وسانت جيمس بارك وداوننغ ستريت ودير وستمنستر وقصر وستمنستر. ويُستحسن التحقق من أوقات المراسم قبل جعلها نقطة ارتكاز لبرنامج صباحي، لأن الإتاحة قد تتغير أثناء الفعاليات الرسمية.",
  },
  {
    kind: "place",
    slug: "neal-s-yard",
    title: "Neal's Yard",
    arabicTitle: "نيلز يارد",
    area: "Covent Garden",
    arabicArea: "كوفنت غاردن",
    category: "Colourful courtyard",
    arabicCategory: "فناء ملوّن",
    sectionSlug: "places-to-visit",
    neighborhoodSlug: "westminster",
    latitude: 51.5145,
    longitude: -0.1268,
    address: "Neal's Yard, Covent Garden, London WC2H 9DP",
    arabicAddress: "نيلز يارد، كوفنت غاردن، لندن WC2H 9DP",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Neal%27s%20Yard%20Covent%20Garden%20London",
    sourceUrl: "https://www.coventgarden.london/experience/visit/neal-s-yard",
    summary:
      "Small colourful courtyard tucked between Covent Garden and Seven Dials, popular for cafes, photos and short West End walks.",
    arabicSummary:
      "فناء صغير ملوّن بين كوفنت غاردن وسفن دايلز، يقصده الزوار للمقاهي والصور وجولات المشي القصيرة.",
    seoDescription:
      "Neal's Yard is a colourful hidden courtyard in Covent Garden near Seven Dials.",
    body: [
      "Neal's Yard is a compact courtyard hidden behind narrow passages between Covent Garden and Seven Dials. Its bright facades, independent cafes and small shops make it a quick but memorable stop in the West End.",
      "It is easiest to visit as part of a Covent Garden, Seven Dials or Soho walk. Muslim travellers should treat dining here as venue-by-venue research rather than assume halal availability, but the courtyard itself is a convenient photo and rest stop.",
    ],
    arabicOverview:
      "نيلز يارد فناء صغير مخفي خلف ممرات ضيقة بين كوفنت غاردن وسفن دايلز. تمنحه واجهاته الزاهية ومقاهيه ومتاجره المستقلة حضوراً محبباً في قلب ويست إند، رغم أن زيارته لا تستغرق عادة وقتاً طويلاً.\n\nيسهل إدراجه ضمن جولة كوفنت غاردن أو سفن دايلز أو سوهو. وبالنسبة للمسافر المسلم، ينبغي التحقق من كل مطعم أو مقهى على حدة وعدم افتراض توافر الطعام الحلال، أما الفناء نفسه فهو نقطة مناسبة للصور والاستراحة القصيرة.",
  },
  {
    kind: "hotel",
    slug: "st-pancras-london-autograph-collection",
    title: "St Pancras London, Autograph Collection",
    arabicTitle: "سانت بانكراس لندن، أوتوغراف كوليكشن",
    area: "King's Cross / St Pancras",
    arabicArea: "كينغز كروس / سانت بانكراس",
    category: "Historic luxury railway hotel",
    arabicCategory: "فندق فاخر تاريخي بمحاذاة محطة قطارات",
    sectionSlug: "hotels",
    neighborhoodSlug: "camden",
    latitude: 51.5297,
    longitude: -0.1254,
    address: "Euston Road, London NW1 2AR",
    arabicAddress: "يوستن رود، لندن NW1 2AR",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=St%20Pancras%20London%20Autograph%20Collection",
    sourceUrl:
      "https://www.marriott.com/en-us/hotels/lonpk-st-pancras-london-autograph-collection/overview/",
    summary:
      "Landmark Gothic railway hotel attached to St Pancras International, useful for Eurostar, King's Cross and heritage-led London stays.",
    arabicSummary:
      "فندق تاريخي بطراز قوطي متصل بسانت بانكراس إنترناشونال، ملائم لليوروستار وكينغز كروس والإقامات ذات الطابع التراثي.",
    seoDescription:
      "St Pancras London, Autograph Collection is a landmark railway hotel beside St Pancras International and King's Cross.",
    body: [
      "St Pancras London, Autograph Collection occupies the restored former Midland Grand Hotel beside St Pancras International. The red-brick Gothic frontage, grand interiors and direct rail setting make it one of London's most recognisable station hotels.",
      "It is especially practical for travellers using Eurostar or national rail connections, and for itineraries focused on King's Cross, the British Library, Bloomsbury and central London. Muslim travellers should verify breakfast, room-service and nearby halal options directly before booking.",
    ],
    arabicOverview:
      "يشغل فندق سانت بانكراس لندن، أوتوغراف كوليكشن مبنى ميدلاند غراند هوتيل التاريخي المجدد بجوار محطة سانت بانكراس إنترناشونال. وتجعله واجهته القوطية الحمراء وداخله الفخم وموقعه المتصل بالسكك الحديدية واحداً من أشهر فنادق المحطات في لندن.\n\nيناسب خصوصاً المسافرين عبر اليوروستار أو القطارات الوطنية، وكذلك البرامج التي تركز على كينغز كروس والمكتبة البريطانية وبلومزبري ووسط لندن. وينبغي للمسافر المسلم التحقق مباشرة من خيارات الإفطار وخدمة الغرف والمطاعم الحلال القريبة قبل الحجز.",
  },
  {
    kind: "place",
    slug: "ranger-s-house-and-the-wernher-collection",
    title: "Ranger's House and The Wernher Collection",
    arabicTitle: "رينجرز هاوس ومجموعة ورنر",
    area: "Greenwich / Blackheath",
    arabicArea: "غرينتش / بلاكهيث",
    category: "Historic house and art collection",
    arabicCategory: "بيت تاريخي ومجموعة فنية",
    sectionSlug: "places-to-visit",
    neighborhoodSlug: "greenwich",
    latitude: 51.477,
    longitude: 0.0011,
    address: "Chesterfield Walk, Blackheath, London SE10 8QX",
    arabicAddress: "تشيسترفيلد ووك، بلاكهيث، لندن SE10 8QX",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Ranger%27s%20House%20The%20Wernher%20Collection%20London",
    sourceUrl:
      "https://www.english-heritage.org.uk/visit/places/rangers-house-the-wernher-collection/",
    summary:
      "Elegant Georgian villa beside Greenwich Park housing The Wernher Collection of jewellery, paintings, porcelain and decorative art.",
    arabicSummary:
      "فيلا جورجية أنيقة بجوار غرينتش بارك تضم مجموعة ورنر من الجواهر واللوحات والخزف والفنون الزخرفية.",
    seoDescription:
      "Ranger's House and The Wernher Collection is an English Heritage historic house beside Greenwich Park.",
    body: [
      "Ranger's House is an elegant Georgian villa on the edge of Greenwich Park and Blackheath. It houses The Wernher Collection, a dense private collection of jewellery, paintings, porcelain, sculpture and decorative art.",
      "It is a strong add-on to a Greenwich day when travellers want a quieter indoor heritage stop beyond the Royal Observatory, Queen's House and National Maritime Museum. Opening days can be seasonal, so check English Heritage before planning around it.",
    ],
    arabicOverview:
      "رينجرز هاوس فيلا جورجية أنيقة تقع على طرف غرينتش بارك وبلاكهيث، وتضم مجموعة ورنر؛ وهي مجموعة خاصة غنية من الجواهر واللوحات والخزف والمنحوتات والفنون الزخرفية.\n\nيمثل الموقع إضافة مناسبة ليوم غرينتش لمن يرغب في محطة تراثية داخلية أكثر هدوءاً بعد المرصد الملكي وكوينز هاوس والمتحف البحري الوطني. وقد تختلف أيام الافتتاح موسمياً، لذلك ينبغي مراجعة إنغلش هيريتج قبل بناء البرنامج عليه.",
  },
  {
    kind: "tour",
    slug: "big-bus-london-sightseeing-tour",
    title: "Big Bus London sightseeing tour",
    arabicTitle: "جولة بيغ باص لمشاهدة معالم لندن",
    area: "Central London",
    arabicArea: "وسط لندن",
    category: "Hop-on hop-off bus tour",
    arabicCategory: "جولة حافلات سياحية متعددة التوقفات",
    sectionSlug: "organized-tours",
    neighborhoodSlug: "westminster",
    latitude: 51.5007,
    longitude: -0.1246,
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Big%20Bus%20Tours%20London",
    sourceUrl: "https://www.bigbustours.com/en/london/london-bus-tours",
    summary:
      "Open-top hop-on hop-off sightseeing tour linking major central London landmarks with commentary and flexible stops.",
    arabicSummary:
      "جولة حافلات مكشوفة متعددة التوقفات تربط أبرز معالم وسط لندن مع تعليق صوتي وخيارات نزول وصعود مرنة.",
    seoDescription:
      "Big Bus London sightseeing tour is an open-top hop-on hop-off route for major central London landmarks.",
    body: [
      "Big Bus London is a practical orientation tour for first-time visitors who want to see several landmark zones without planning every transport leg themselves. Open-top buses usually cover central sights such as Westminster, St Paul's, Tower Bridge and museum districts, with the exact route depending on the ticket and season.",
      "For Muslim families, the format can reduce walking pressure, especially with children or older travellers. Check route maps, prayer breaks, weather and ticket conditions before booking, and do not rely on onboard food or nearby stops for halal dining without separate verification.",
    ],
    arabicOverview:
      "تعد جولة بيغ باص لندن خياراً عملياً للتعرّف الأولي إلى المدينة، خصوصاً لمن يرغب في رؤية عدة مناطق ومعالم رئيسية من دون تخطيط كل انتقال على حدة. تمر الحافلات المكشوفة عادةً بمشاهد مركزية مثل وستمنستر وسانت بولز وتاور بريدج ومناطق المتاحف، مع اختلاف المسار بحسب نوع التذكرة والموسم.\n\nبالنسبة للعائلات المسلمة، قد تساعد هذه الصيغة في تقليل المشي، ولا سيما مع الأطفال أو كبار السن. ويُنصح بمراجعة خريطة المسار وفواصل الصلاة وحالة الطقس وشروط التذكرة قبل الحجز، وعدم الاعتماد على الطعام المتاح في الجولة أو قرب المحطات من دون تحقق مستقل من الخيارات الحلال.",
  },
  {
    kind: "tour",
    slug: "brigit-s-bakery-afternoon-tea-bus-tour",
    title: "Brigit's Bakery afternoon tea bus tour",
    arabicTitle: "جولة شاي العصر بحافلة بريجيتس بيكري",
    area: "Central London",
    arabicArea: "وسط لندن",
    category: "Afternoon tea bus tour",
    arabicCategory: "جولة حافلة مع شاي العصر",
    sectionSlug: "organized-tours",
    neighborhoodSlug: "westminster",
    latitude: 51.5076,
    longitude: -0.1244,
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Brigit%27s%20Bakery%20Afternoon%20Tea%20Bus%20London",
    sourceUrl: "https://b-bakery.com/london/bus-tours/afternoon-tea-bus-london",
    summary:
      "Routemaster-style London sightseeing bus tour paired with Brigit's Bakery afternoon tea service.",
    arabicSummary:
      "جولة مشاهدة معالم لندن على متن حافلة بطراز راوتماستر مع خدمة شاي العصر من بريجيتس بيكري.",
    seoDescription:
      "Brigit's Bakery afternoon tea bus tour combines London sightseeing with afternoon tea on a Routemaster-style bus.",
    body: [
      "Brigit's Bakery afternoon tea bus tour combines a classic Routemaster-style sightseeing loop with a seated afternoon tea service. It is more of a themed experience than a transport solution, and is best considered by travellers who want a photogenic central London activity.",
      "Muslim travellers should check dietary options directly before booking; halal status, vegetarian options, cross-contact and alcohol-free service should not be assumed from the tour format. Departure points and routes may vary, so confirm the exact meeting point on the booking confirmation.",
    ],
    arabicOverview:
      "تجمع جولة شاي العصر بحافلة بريجيتس بيكري بين مسار لمشاهدة معالم لندن على حافلة بطراز راوتماستر وخدمة شاي عصر للجلوس. وهي تجربة ذات طابع خاص أكثر من كونها وسيلة تنقل، وتناسب من يبحث عن نشاط مركزي قابل للتصوير.\n\nينبغي للمسافر المسلم التحقق مباشرة من الخيارات الغذائية قبل الحجز؛ فلا يجوز افتراض حالة الحلال أو الخيارات النباتية أو خلو الخدمة من التداخل أو الكحول من مجرد صيغة الجولة. كما قد تختلف نقطة الانطلاق والمسار، لذلك يجب تثبيت موقع اللقاء من تأكيد الحجز.",
  },
];

const lexicalFromParagraphs = (paragraphs: string[]) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: null,
    children: paragraphs.map((paragraph) => ({
      type: "paragraph",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      textFormat: 0,
      textStyle: "",
      children: [
        {
          type: "text",
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: paragraph,
          version: 1,
        },
      ],
    })),
  },
});

const toSourceUrl = (asset: Asset) => `local:${asset.file}`;

const usageNotes = (asset: Asset) =>
  [
    `Supplied file: ${asset.file}.`,
    asset.originalDescription
      ? `Embedded/verified description: ${asset.originalDescription}.`
      : undefined,
    asset.createdLabel ? `Embedded creation date: ${asset.createdLabel}.` : undefined,
    asset.copyright ? `Embedded copyright: ${asset.copyright}.` : undefined,
    asset.skipReason ? `Import decision: ${asset.skipReason}.` : undefined,
    "Rights note: asset supplied for Irhal editorial use; preserve stored attribution and confirm license terms during CMS review.",
  ]
    .filter(Boolean)
    .join(" ");

const payload = await getPayload({ config });
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const mediaIdByFile = new Map<string, number>();
const report: {
  createdGuideItems: Array<{ id: number; kind: Kind; slug: string }>;
  linked: Array<{
    action: "gallery-appended" | "primary-set" | "already-linked";
    kind: Kind;
    mediaId: number;
    slug: string;
  }>;
  media: Array<{ file: string; id: number; status: "created" | "updated" }>;
  missingTargets: Array<{ file: string; kind: Kind; slug: string }>;
  skipped: Array<{ file: string; reason: string }>;
} = {
  createdGuideItems: [],
  linked: [],
  media: [],
  missingTargets: [],
  skipped: [],
};

await db.connect();

try {
  const city = await db.query(
    "select id from payload.cities where slug = 'london' limit 1",
  );
  const cityId = city.rows[0]?.id ? Number(city.rows[0].id) : undefined;
  if (!cityId) throw new Error("London city record not found in Payload.");

  const sectionBySlug = new Map<string, number>();
  const sections = await db.query(
    "select id, section_slug from payload.guide_sections where city_id = $1",
    [cityId],
  );
  for (const row of sections.rows) {
    sectionBySlug.set(String(row.section_slug), Number(row.id));
  }

  const neighborhoodBySlug = new Map<string, number>();
  const neighborhoods = await db.query(
    "select id, slug from payload.neighborhoods where city_id = $1",
    [cityId],
  );
  for (const row of neighborhoods.rows) {
    neighborhoodBySlug.set(String(row.slug), Number(row.id));
  }

  for (const item of newItems) {
    const existing = await db.query(
      `select id
         from payload.guide_items
        where city_id = $1 and kind = $2 and slug = $3
        limit 1`,
      [cityId, item.kind, item.slug],
    );
    if (existing.rows[0]?.id) continue;

    const section = sectionBySlug.get(item.sectionSlug);
    if (!section) throw new Error(`Missing section ${item.sectionSlug}`);

    const neighborhood = neighborhoodBySlug.get(item.neighborhoodSlug);
    if (!neighborhood) {
      throw new Error(`Missing London neighborhood ${item.neighborhoodSlug}`);
    }

    const created = (await payload.create({
      collection: "guide-items" as never,
      data: {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        body: lexicalFromParagraphs(item.body),
        arabicTitle: item.arabicTitle,
        arabicSummary: item.arabicSummary,
        arabicOverview: item.arabicOverview,
        arabicArea: item.arabicArea,
        arabicCategory: item.arabicCategory,
        arabicAddress: item.arabicAddress,
        kind: item.kind,
        city: cityId,
        section,
        sectionSlug: item.sectionSlug,
        area: item.area,
        category: item.category,
        address: item.address,
        neighborhood,
        mapUrl: item.mapUrl,
        geoStatus: "verified",
        latitude: item.latitude,
        longitude: item.longitude,
        imageAlt: `${item.title}, London`,
        workflowStatus: "review",
        sources: [
          {
            label: `${item.title} official site`,
            url: item.sourceUrl,
            type: "official",
            verifiedAt,
            confidence: "high",
          },
        ],
        sourceTable: "public/guide_photos",
        sourceRowId: item.slug,
        importedDetails: {
          createdFrom: "scripts/import-london-guide-photos.ts",
          editorialStatus:
            "AI-drafted from supplied media and official source; requires editorial review before publication.",
        },
        seo: {
          title: `${item.title} | London`,
          description: item.seoDescription,
          canonicalUrl: `/city/london/${item.kind}/${item.slug}`,
          robots: "index,follow",
          schemaType:
            item.kind === "hotel"
              ? "Hotel"
              : item.kind === "tour"
                ? "TouristTrip"
                : "Place",
        },
        _status: "draft",
      } as never,
      draft: true,
      overrideAccess: true,
    })) as { id: number | string };

    report.createdGuideItems.push({
      id: Number(created.id),
      kind: item.kind,
      slug: item.slug,
    });
    console.log(`created review guide item ${item.kind}:${item.slug} #${created.id}`);
  }

  for (const asset of assets) {
    const inputPath = path.join(baseDir, asset.file);
    await fs.access(inputPath);
    const outputPath = path.join(
      os.tmpdir(),
      `${asset.outputBase}${path.extname(asset.file)}`,
    );
    await fs.copyFile(inputPath, outputPath);

    const sourceUrl = toSourceUrl(asset);
    const existing = await db.query(
      `select id
         from payload.media
        where source_url = $1
        order by id desc
        limit 1`,
      [sourceUrl],
    );

    const mediaData = {
      alt: asset.alt,
      attribution: asset.attribution,
      caption: asset.caption,
      license: "partner-provided",
      photographer: asset.photographer ?? asset.attribution,
      sourceUrl,
      usageNotes: usageNotes(asset),
      usageStatus: "approved",
    } as never;

    let mediaId = existing.rows[0]?.id ? Number(existing.rows[0].id) : undefined;
    let status: "created" | "updated" = "updated";

    if (mediaId) {
      await payload.update({
        collection: "media" as never,
        id: mediaId,
        data: mediaData,
        overrideAccess: true,
      });
    } else {
      const created = (await payload.create({
        collection: "media" as never,
        filePath: outputPath,
        data: mediaData,
        overrideAccess: true,
      })) as { id: number | string };
      mediaId = Number(created.id);
      status = "created";
    }

    mediaIdByFile.set(asset.file, mediaId);
    report.media.push({ file: asset.file, id: mediaId, status });
    console.log(`${status} media #${mediaId} ${asset.file}`);
  }

  const allTargets = (asset: Asset) => [
    ...(asset.primaryFor ?? []).map((target) => ({ ...target, primary: true })),
    ...(asset.galleryFor ?? []).map((target) => ({ ...target, primary: false })),
  ];

  for (const asset of assets) {
    const mediaId = mediaIdByFile.get(asset.file);
    if (!mediaId) throw new Error(`Missing media id for ${asset.file}`);

    if (asset.skipReason && allTargets(asset).length === 0) {
      report.skipped.push({ file: asset.file, reason: asset.skipReason });
      continue;
    }

    for (const link of allTargets(asset)) {
      const item = await db.query(
        `select id, image_id, image_alt
           from payload.guide_items
          where city_id = $1 and kind = $2 and slug = $3
          limit 1`,
        [cityId, link.kind, link.slug],
      );

      const itemId = item.rows[0]?.id ? Number(item.rows[0].id) : undefined;
      if (!itemId) {
        report.missingTargets.push({
          file: asset.file,
          kind: link.kind,
          slug: link.slug,
        });
        continue;
      }

      const currentPrimary = item.rows[0]?.image_id
        ? Number(item.rows[0].image_id)
        : undefined;
      const currentImageAlt =
        typeof item.rows[0]?.image_alt === "string"
          ? String(item.rows[0].image_alt)
          : undefined;
      const gallery = await db.query(
        `select image_id
           from payload.guide_items_gallery
          where _parent_id = $1
          order by _order asc`,
        [itemId],
      );
      const galleryIds = gallery.rows
        .map((row) => (row.image_id ? Number(row.image_id) : undefined))
        .filter((id): id is number => typeof id === "number");

      if (currentPrimary === mediaId || galleryIds.includes(mediaId)) {
        report.linked.push({
          action: "already-linked",
          kind: link.kind,
          mediaId,
          slug: link.slug,
        });
        continue;
      }

      if (link.primary && !currentPrimary) {
        await payload.update({
          collection: "guide-items" as never,
          id: itemId,
          data: {
            image: mediaId,
            imageAlt: asset.alt,
          } as never,
          overrideAccess: true,
        });
        report.linked.push({
          action: "primary-set",
          kind: link.kind,
          mediaId,
          slug: link.slug,
        });
        continue;
      }

      await payload.update({
        collection: "guide-items" as never,
        id: itemId,
        data: {
          ...(currentPrimary
            ? {
                image: currentPrimary,
                imageAlt: currentImageAlt || asset.alt,
              }
            : {}),
          gallery: [...galleryIds, mediaId].map((image) => ({ image })),
        } as never,
        overrideAccess: true,
      });
      report.linked.push({
        action: "gallery-appended",
        kind: link.kind,
        mediaId,
        slug: link.slug,
      });
    }
  }

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        createdGuideItems: report.createdGuideItems.length,
        linked: report.linked.length,
        media: report.media.length,
        missingTargets: report.missingTargets.length,
        reportPath,
        skipped: report.skipped.length,
      },
      null,
      2,
    ),
  );
} finally {
  await db.end();
}

process.exit(0);
