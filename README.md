# Irhal AI Travel Portal V4

Enterprise starter for a map-first, AI-assisted, SEO-optimized city intelligence platform inspired by Irhal and based on the Karachi Enterprise City Guide model.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Payload CMS/Auth/Search with PostgreSQL adapter
- Supabase PostgreSQL with PostGIS, pgvector, RLS, and portable SQL migrations
- Cloudflare R2/Images ready media configuration
- Payload-first city data loader with local JSON fallback for development without database env vars
- JSON-first AI assistant route and agent governance files

## Data Source

Payload CMS is the canonical content backend. Its tables live in the Supabase `payload` schema and are the source used by Payload Admin, Payload API, and the public city frontend.

The earlier custom `public.irhal_*` tables are archived in `legacy_irhal_public` and are not read by the application. They should only be used as historical reference unless a deliberate future read-model/search-cache pipeline is created.

## Key Routes

- `/`
- `/city/karachi`
- `/city/karachi/section/places-to-visit`
- `/city/karachi/section/places-to-visit/top-feature-places-with-tour-guide-voice`
- `/city/karachi/place/mohatta-palace-museum`
- `/city/karachi/masjid/memon-masjid`
- `/city/karachi/neighborhood/clifton`
- `/city/karachi/place/mohatta-palace`
- `/city/karachi/hotel/movenpick-hotel-karachi`
- `/city/karachi/restaurant/bbq-tonight-clifton`
- `/city/karachi/islamic-travel`
- `/city/karachi/itineraries`
- `/admin`
- `/payload-api`
- `/api/ai/travel-assistant`

## Environment

Copy `.env.example` values into your deployment environment. Required before production deployment:

- Supabase: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Payload: `PAYLOAD_SECRET`
- Cloudflare R2/Images: account, bucket, access keys, image account hash/token
- Maps: Google Maps or Mapbox public key
- Vercel: token, project id, org id
- AI: provider and API key

Payload will not start or seed CMS documents until `DATABASE_URL` and `PAYLOAD_SECRET` are present. The public frontend falls back to the local Karachi import when those values are missing, but the intended production source is Payload CMS.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

Supabase migrations are in `supabase/migrations/` and were applied through the Irhal Supabase MCP.

## City Guide Imports

The Karachi enterprise guide was extracted from:

`/Users/zulfiqar/Downloads/Karachi_Pakistan_City_Guide_Irhal_Enterprise_FULL_2026.docx`

Generated structured import:

`src/data/karachi-guide.json`

Extractor:

```bash
python scripts/extract_city_guide_docx.py input.docx src/data/{city-slug}-guide.json
```

The import format preserves section hierarchy, tables, row values, and embedded map hyperlinks. Public section pages render article/item cards; directory rows become separate guide-item pages.

To seed the imported country, city, districts, neighborhoods, anchor listings, sections, item documents, and itineraries into Payload CMS once `DATABASE_URL` and `PAYLOAD_SECRET` are configured:

```bash
npm run seed:karachi-guide
```

The seed uses direct SQL bulk imports into the Supabase `payload` schema and validates row counts after the transaction.

Guide item pages intentionally carry `provider-enrichment-required` until exact provider `place_id`, coordinates, verified media, and source logs are added.
