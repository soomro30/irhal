# Irhal Portal V4 Feature Tracker

Last updated: 2026-05-28

This tracker reflects the current local implementation against the Irhal Enterprise City Guide V4 requirements. Status values are `Not Started`, `In Progress`, `Completed`, or `Blocked`.

## Current Build Snapshot

- Local app: Next.js 16 App Router, TypeScript, Tailwind CSS.
- Public city page: `/city/karachi` now uses a Tripadvisor/Lonely Planet-style destination homepage layout with a large city banner, essential planning cards, editor guide cards, item rails, map intelligence, neighborhoods, and fast facts.
- Dynamic item pages exist for imported places, hotels, restaurants, masjids, shopping entries, tours, family entries, and festivals.
- Karachi guide import exists locally at `src/data/karachi-guide.json`, extracted from the full Karachi enterprise DOCX.
- Payload now has a first-class `countries` collection, and `cities.country` is a Payload relationship instead of plain text.
- Public city routes use a Payload-first data loader when `DATABASE_URL` and `PAYLOAD_SECRET` are configured, with the local Karachi JSON import retained only as a development fallback.
- `.env.local` is configured locally with the Supabase database connection and Payload secret. Secret values are intentionally not committed.
- Payload is using an isolated `payload` Postgres schema so CMS tables do not collide with the portable `public.irhal_*` database foundation.
- Payload CMS has been seeded and verified in Supabase: 1 country, 1 city, 2 districts, 3 neighborhoods, 5 anchor listings, 15 guide sections, 410 guide item documents, and 1 itinerary.
- Dev server runs at `http://localhost:3001` because another Next app is using port `3000`.
- Latest verification completed: `npm run seed:karachi-guide`, `npm run typecheck`, `npm run lint`, `npm run build`, and `curl -I http://localhost:3001/city/karachi`.

## Requirement Coverage

| Requirement Area | Status | Notes |
| --- | --- | --- |
| Map-first city guide architecture | In Progress | Public routes and map panels exist. Full provider-backed live map enrichment is still pending API keys and enrichment workflow. |
| Dynamic city page template | Completed | `/city/[city]` is reusable for future cities and driven by city data plus guide item transforms. |
| Separate document/page per place/restaurant/hotel/etc. | Completed | Public pages exist, Payload collections exist, and 410 Karachi guide item documents are seeded into Payload CMS. Remaining work is media/geo enrichment, not the document model. |
| Karachi enterprise guide import | Completed | Imported all required guide sections and all detected tables from the attached Karachi DOCX into structured JSON. |
| Global city import format | In Progress | Import format and extractor exist. Needs normalization rules, validation reports, and bulk import pipeline for all world cities. |
| Payload CMS/Auth/Admin | In Progress | Collections, admin route, auth, Payload API route, and Payload-first frontend loader are implemented against Supabase. Editor user creation and workflow hardening remain. |
| PostgreSQL portability | Completed | Supabase migrations are stored in repo and use portable PostgreSQL conventions where possible. |
| Country/city geography model | Completed | Payload has `countries`; cities relate to countries. Supabase also has `irhal_countries`, with Karachi linked to Pakistan. |
| PostGIS | Completed | Database migration includes PostGIS extension and geo-capable schema. |
| pgvector | Completed | Database migration includes vector extension for future embeddings. |
| Cloudflare R2 / Cloudflare Images | Blocked | Waiting for Cloudflare R2 and Images credentials. `.env.example` lists required keys. |
| Search Phase 1 | In Progress | Payload search plugin/config is scaffolded and CMS data exists. Needs search UI and production indexing validation. |
| Advanced search Phase 2 | Not Started | Meilisearch/Typesense intentionally deferred. |
| AI agent architecture | In Progress | `AGENTS.md` defines agents, rules, input formats, output formats, and statuses. Actual provider-backed execution and schema validation remain. |
| AI assistant API | In Progress | JSON-only route scaffold exists. Model provider integration awaits API keys. |
| Muslim travel layer | In Progress | Islamic travel page, masjid pages, halal-aware content model, and tags exist. Women prayer area verification and prayer-time awareness remain. |
| SEO foundation | In Progress | Metadata helpers, canonical paths, JSON-LD, breadcrumbs, SSR pages, and internal links exist. Sitemap, robots, duplicate-content QA, and production domain validation remain. |
| Multi-language readiness | In Progress | Locale fields exist. Localized routing, translated content workflow, and hreflang are pending. |
| Vercel hosting | Blocked | Waiting for Vercel project/token and production environment variables. |

## Feature Tracker

| Feature | Status | Owner | Priority | Dependencies | Notes |
| --- | --- | --- | --- | --- | --- |
| Next.js App Router Foundation | Completed | Codex | High | Node, npm | Next.js 16, TypeScript, Tailwind, lint, typecheck, and build scripts are configured. |
| Public Travel Homepage Style | Completed | Codex | High | City data, guide item data, image asset | `/city/karachi` now has a large city banner, planning cards, guide cards, visual item rails, and map intelligence lower on the page. |
| Payload CMS Foundation | In Progress | Codex | High | `DATABASE_URL`, `PAYLOAD_SECRET` | Payload config, auth, collections, admin route, `/payload-api` route, and Supabase-backed local env are configured. Editor user creation and production workflow hardening remain. |
| Payload Collections | In Progress | Codex | High | Payload CMS foundation | Countries, cities, guide sections, guide items, districts, neighborhoods, listings, itineraries, AI jobs, media, users, and update logs are modeled. Karachi baseline data is seeded; editor workflow testing remains. |
| Countries Collection | Completed | Codex | High | Payload CMS foundation | Added first-class countries collection and changed cities to relate to countries. Pakistan is included in the seed workflow. |
| Supabase/PostGIS/pgvector Schema | Completed | Codex | High | Supabase Irhal MCP | Migrations applied through the Irhal Supabase MCP. Security advisor was clean after hardening. |
| City Page System | Completed | Codex | High | City data model | `/city/{city-name}` route exists with SSR metadata, JSON-LD, reusable destination template, internal links, and public travel design. |
| URL Structure | In Progress | Codex | High | Dynamic routes | Required routes exist for city, neighborhoods, places, hotels, restaurants, Islamic travel, itineraries, shopping, tours, masjids, family, and festivals. Needs final production URL QA and redirects/canonical domain setup. |
| Full Karachi City Guide Import | Completed | Codex | High | DOCX extractor | Imported 15 required sections and 17 tables from `Karachi_Pakistan_City_Guide_Irhal_Enterprise_FULL_2026.docx`. |
| City Import Format Documentation | Completed | Codex | High | DOCX extraction | `docs/CITY_IMPORT_FORMAT.md` documents the import structure and directory-to-document model. |
| City Section Pages | Completed | Codex | High | Full guide import | `/city/{city-name}/section/{section}` renders section landing pages with cards and separate item/article links. |
| Section Article Pages | Completed | Codex | Medium | Guide section headings | `/city/{city-name}/section/{section}/{article}` exists for section-level editorial documents. |
| Payload-first Frontend Data Source | Completed | Codex | High | Payload CMS env vars | Public routes attempt Payload first and fall back to local JSON only when database env vars are missing or unavailable. Verified with Supabase-backed local env. |
| Guide Item Documents | Completed | Codex | High | Payload GuideItems collection, seed script | Public item pages exist and 410 Karachi guide items are seeded as Payload CMS documents. |
| Places Directory | In Progress | Codex | High | Guide item model, map links | `/city/{city-name}/place/{slug}` exists for imported attractions. Many records still need verified coordinates/images/provider IDs. |
| Hotel Directory | In Progress | Codex | High | Guide item model, CMS seed | `/city/{city-name}/hotel/{slug}` exists. Needs live hotel enrichment, affiliate fields, photos, and verification. |
| Restaurant Directory | In Progress | Codex | High | Guide item model, halal tags | `/city/{city-name}/restaurant/{slug}` exists. Needs halal/source verification and live map enrichment. |
| Shopping Directory | In Progress | Codex | High | Guide item model | `/city/{city-name}/shopping/{slug}` exists. Needs provider enrichment, photos, and CMS seeding. |
| Tours Directory | In Progress | Codex | Medium | Guide item model | `/city/{city-name}/tour/{slug}` exists. Needs vetted suppliers and commercial workflow. |
| Festivals Directory | In Progress | Codex | Medium | Guide item model | `/city/{city-name}/festival/{slug}` exists. Needs recurring date model and update cadence. |
| Family/Children Directory | In Progress | Codex | Medium | Guide item model | `/city/{city-name}/family/{slug}` exists. Needs family suitability QA and image enrichment. |
| Neighborhood System | In Progress | Codex | High | District/zone model, geo data | Neighborhood pages exist and city homepage links to them. Needs complete district/zone/cluster model in CMS for all imported neighborhoods. |
| Live Map Layer | Blocked | Codex | High | Google Maps or Mapbox API key | Static map-style panels and map URLs exist. Real provider search, place enrichment, and live locators await API keys. |
| Geo Validation Workflow | In Progress | Codex | High | Map provider integration | Schema has geo fields and `geoStatus`. Imported guide items currently mark many records as provider-enrichment required. |
| Masjid Directory | In Progress | Codex | High | Guide item model, Muslim travel layer | `/city/{city-name}/masjid/{slug}` exists. Needs women prayer area verification and provider-enriched coordinates. |
| Islamic Travel Module | In Progress | Codex | High | Masjids, halal restaurants, Islamic landmarks | `/city/{city-name}/islamic-travel` route exists. Prayer timing awareness remains future work. |
| Itineraries | In Progress | Codex | Medium | Route-aware listings, AI output schema | `/city/{city-name}/itineraries` route exists with starter Karachi plans. Needs AI-generated route optimization and saved itinerary support. |
| AI Travel Assistant API | In Progress | Codex | High | Approved content, model provider key | `/api/ai/travel-assistant` returns structured JSON pattern. Real model integration awaits provider key. |
| City Content Generation Agent | In Progress | Codex | High | Agent schemas, editorial review workflow | Defined in `AGENTS.md`; execution pipeline not implemented yet. |
| SEO Optimization Agent | In Progress | Codex | High | SEO snapshots, schema validation | Defined in `AGENTS.md`; automated validation/report persistence remains. |
| Data Validation Agent | In Progress | Codex | High | Source logs, validation schema | Defined in `AGENTS.md`; automated blocking workflow remains. |
| Map/Place Enrichment Agent | Blocked | Codex | High | Google Maps or Mapbox API key | Defined in `AGENTS.md`; cannot enrich provider places without API key. |
| Travel Itinerary Generator | In Progress | Codex | Medium | AI provider key, route-aware data | Defined in `AGENTS.md`; provider-backed generation remains. |
| Muslim Travel Assistant | In Progress | Codex | High | AI provider key, masjid/halal verification | Defined in `AGENTS.md`; live assistant behavior remains. |
| Content Update Agent | In Progress | Codex | Medium | Update logs, freshness scans | Update log model exists. Scheduled monitoring remains. |
| SEO Engine | In Progress | Codex | High | Metadata helpers, schema helpers | Page metadata, canonical helpers, JSON-LD, breadcrumbs, and SSR are in place. Sitemap, robots, OG image generation, and production domain canonical QA remain. |
| Schema.org JSON-LD | In Progress | Codex | High | SEO helpers | City and breadcrumb JSON-LD exist. Needs richer per-item schema for all guide item types. |
| Internal Linking | In Progress | Codex | High | City/item routes | City page, section pages, and item rails link internally. Needs related-items logic and cross-city links. |
| OpenGraph/Twitter Cards | In Progress | Codex | Medium | Metadata helpers, hero/media assets | Basic metadata exists. Needs dynamic social images per city/item. |
| Search Phase 1 | In Progress | Codex | Medium | Payload Search Plugin, CMS data | Plugin is configured and CMS data is seeded. Needs search UI validation. |
| Search Phase 2 | Not Started | Codex | Low | Meilisearch or Typesense decision | Deferred until scale requires advanced search. |
| Media Storage | Blocked | Codex | High | Cloudflare R2 and Images credentials | Placeholder/generated images exist locally. Production media storage is not configured. |
| Image Optimization/CDN | Blocked | Codex | High | Cloudflare Images credentials | Next image optimization works locally. Cloudflare Images integration awaits keys. |
| Production Deployment | Blocked | Codex | High | Vercel credentials, env vars | Build succeeds locally. Vercel deployment remains. |
| Environment/API Keys | Blocked | User | High | Cloudflare R2, Cloudflare Images, Vercel, Google/Mapbox, AI provider | Supabase and Payload local env are configured. Cloudflare, Vercel, map provider, and AI provider keys are still required for media, deployment, live maps, and live AI. |
| Multi-language Architecture | In Progress | Codex | Medium | Locale routing strategy, translation workflow | Locale-ready fields exist. Need localized routes, hreflang, translations, RTL QA where needed. |
| User Accounts | Not Started | Codex | Medium | Payload Auth, frontend account UI | Payload Auth exists at backend level. Public account flows are future work. |
| Saved Itineraries | Not Started | Codex | Medium | User accounts, itinerary model | Future feature. |
| Reviews System | Not Started | Codex | Low | User accounts, moderation model | Future feature. |
| React Native Mobile App | Not Started | Codex | Low | Stable API contracts | Future feature. |

## Completed Work

- Built the Next.js 16 application foundation with TypeScript and Tailwind.
- Added Payload CMS configuration, admin route, collections, auth foundation, and Payload API route.
- Added first-class countries in Payload and linked cities to countries.
- Added a Payload-first frontend data source with local JSON fallback only for missing database env vars.
- Added local `.env.local` configuration for Supabase-backed Payload CMS using the provided database password.
- Isolated Payload CMS tables into the `payload` Postgres schema to avoid collisions with the portable `public.irhal_*` schema.
- Added Supabase migrations for the Irhal V4 data foundation, including PostGIS and pgvector.
- Extracted the full Karachi enterprise DOCX into structured JSON.
- Built public routes for the city page, sections, articles, neighborhoods, item detail pages, Islamic travel, and itineraries.
- Reworked the Karachi city main page into a full travel destination homepage rather than a flat CMS/article page.
- Added separate public pages for places, hotels, restaurants, masjids, shopping, tours, festivals, and family entries.
- Added `AGENTS.md` with active AI agent definitions and operating rules.
- Added and verified the seed script for importing Pakistan, Karachi, districts, neighborhoods, anchor listings, guide sections, guide items, and itineraries into Payload.
- Seeded Payload CMS with 1 country, 1 city, 2 districts, 3 neighborhoods, 5 listings, 15 guide sections, 410 guide items, and 1 itinerary.
- Verified the app with `npm run seed:karachi-guide`, `npm run typecheck`, `npm run lint`, `npm run build`, and a `200 OK` response from `/city/karachi`.

## Remaining / Blocked Work

- Provide remaining real API/environment keys:
  - Cloudflare R2 and Cloudflare Images credentials.
  - Vercel token/project configuration.
  - Google Maps or Mapbox API key.
  - AI provider key.
- Replace placeholder/generated category imagery with real CMS media assets stored in Cloudflare.
- Enrich all location-based guide items with verified latitude, longitude, map provider place IDs, map URLs, neighborhood mapping, source confidence, and verification dates.
- Add production sitemap, robots, richer JSON-LD, dynamic OG images, and canonical domain validation.
- Build real search UI and validate Payload search against seeded CMS content.
- Implement AI provider-backed agents with strict JSON schemas, validation, editorial review, and persistence.
- Add multi-city import automation and validation reports so the Karachi format can scale to all world cities.
- Deploy to Vercel with production environment variables.

## Completion Rule

No feature is considered complete unless it is listed here, tested, SEO validated, geo-tagged if location-based, and connected to CMS. Features that have public routes but still require CMS seeding, live API credentials, media storage, or geo enrichment remain `In Progress` or `Blocked`.
