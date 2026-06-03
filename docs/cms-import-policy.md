# CMS Import Policy

Payload CMS is the editorial source of truth after a city has been imported.

## Baseline Import

Use a baseline import only when the city has no existing child content in Payload.

For example, the first London guide import may create the `london` city record and its districts, neighborhoods, listings, guide sections, guide items, itineraries, SEO fields, translations, source records, and media relationships.

Baseline import scripts may replace city child records only when the city is genuinely empty, or when a developer explicitly runs a reset command for a local/destructive rebuild.

## Protected City

After the first successful import, the city is protected.

Running the same baseline seed again must refuse to continue if Payload already has child rows for that city. This protects editor-managed CMS fields, body copy, translations, workflow status, image relationships, galleries, and map/geography fixes.

The shared helper `assertSafeCityBaselineSeed` in `scripts/lib/payload-seed-safety.ts` is the required guard for baseline city seed scripts.

## Later Changes

Later imports must be targeted and explicit:

- Add new records that do not exist yet.
- Update only fields the operator explicitly requested.
- Preserve existing Payload values by default.
- Preserve `image`, `gallery`, workflow, source, translation, and editorial body fields unless the update request specifically names them.
- Write new AI/imported content as `review` or `draft` unless an editor asked for published output.
- Treat JSON, scripts, seeds, and local fixture files as transitional staging only. If an agent creates or edits translated copy, long descriptions, overviews, SEO fields, image metadata, galleries, listings, guide items, guide-section/article copy, itineraries, or media relationships in a local file, the same work must write those values into Payload unless Payload is unreachable.
- Public routes must read imported city content, translations, SEO, and media from Payload when configured. Local files may support first-bootstrap imports or development-only unconfigured fallback, but they must not be the canonical runtime source after a city exists in Payload.
- Missing Payload translations must be exposed as CMS gaps or Arabic missing-content copy instead of falling back silently to English on Arabic pages.

For London, that means: first import can create London; later London imports must not overwrite London unless the command is intentionally an update/reset command.
