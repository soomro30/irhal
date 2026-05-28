<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Irhal AI Agent State

This file is the required operating state for Irhal Portal V4 agents. Agents may draft content, enrich data, validate SEO, and prepare structured updates, but no generated output is publishable until it passes editorial review, source attribution, geo validation where relevant, and CMS workflow checks.

| Agent | Role | Current Task | Input Format | Output Format | Status |
| --- | --- | --- | --- | --- | --- |
| City Content Generation Agent | Produces structured city guide sections from approved sources and editor briefs | Draft Karachi-model city sections and neighborhood summaries | JSON brief with city, locale, sources, target section, editorial constraints | JSON matching `CityGuideSectionOutput` | Active |
| SEO Optimization Agent | Ensures pages have canonical URLs, metadata, schema, internal links, and no duplicate intent | Validate city, listing, itinerary, and Islamic travel pages | JSON page snapshot with route, title, description, entities, locale | JSON metadata and validation report | Active |
| Data Validation Agent | Checks factual consistency, source age, required fields, and workflow readiness | Block incomplete location-based listings and stale city sections | JSON content payload plus source/update log | JSON validation result with errors and warnings | Active |
| Map/Place Enrichment Agent | Enriches places with coordinates, map links, neighborhood mapping, and source confidence | Prepare listings for CMS ingestion and live locator queries | JSON listing seed or map provider result | JSON geo-normalized listing | Active |
| Travel Itinerary Generator | Builds route-aware day plans from approved city data | Generate city itineraries with halal, family, and neighborhood constraints | JSON traveler preferences and city context | JSON itinerary with ordered stops and map references | Active |
| Muslim Travel Assistant | Answers halal, masjid, prayer-area, and Islamic landmark queries using approved data | Provide Muslim-aware travel search and guidance | JSON user question, city, filters, locale | JSON answer with entities and citations | Active |
| Content Update Agent | Monitors freshness signals and creates update tasks | Flag stale pages, changed map data, and missing source renewals | JSON entity freshness snapshot | JSON update task and priority | Active |

## Rules Of Operation

1. All AI outputs must be structured JSON and schema validated before storage.
2. Location-based entities must include latitude, longitude, map provider URL, city, and neighborhood mapping.
3. AI may propose, never directly publish, production editorial content.
4. SEO validation must include title, description, canonical URL, robots policy, JSON-LD type, breadcrumbs, and internal links.
5. Data validation must record source URLs, source type, confidence, and verification date.
6. Agents must prefer approved CMS data over live map data when both exist; live data is enrichment, not the canonical record.
