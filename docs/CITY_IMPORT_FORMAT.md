# City Import Format

Irhal city imports use `irhal-city-guide-import-v1`, generated from a Word city guide with:

```bash
python scripts/extract_city_guide_docx.py input.docx src/data/{city-slug}-guide.json
```

## Required Coverage

Every imported city must include the 15 enterprise sections:

1. Visitor Information
2. Festivals and Annual Events
3. Transportation and Getting Around
4. City Information
5. Neighborhood Operating Guide
6. Hotels
7. Places to Visit
8. Shopping
9. Food and Restaurants
10. Organized Tours
11. Health and Safety
12. City in a Day and Longer Itineraries
13. What to Do with Children in Tow
14. Muslim Visitor Information
15. Data Resources and Update Workflow

The extractor reports `missingRequiredSectionSlugs`; this must be empty before a city is accepted.

## Data Shape

Each import contains:

- `source`: source filename, extraction date, format version.
- `city`: city identity and source update label.
- `introBlocks`: cover/introduction content before section 1.
- `sections`: ordered city sections with paragraph, heading, list, and table blocks.
- `tables`: all table blocks flattened for indexing and validation.
- `coverage`: row counts and acceptance checks.

Table rows preserve:

- normalized cell values
- embedded hyperlinks, including Google Maps locator links
- source table purpose, such as `places_to_visit`, `food_restaurants`, or `masjids`

## Publishing Rule

Imported directory rows become `guide-items`, each with its own Payload CMS document and public page. They are not rendered as a single long text/table page.

A guide item still needs the following before it can be promoted to a canonical location listing:

- provider `place_id` where available
- exact latitude and longitude
- map URL
- city, district, and neighborhood mapping
- source and verification log
- SEO metadata

This keeps the full editorial guide visible while protecting the production listing database from pretending area-level map locators are exact geocoded places.
