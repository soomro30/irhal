export type SeedDbClient = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};

type AssertSafeCityBaselineSeedOptions = {
  allowDestructiveSeed: boolean;
  cityLabel?: string;
  citySlug: string;
  client: SeedDbClient;
  resetCommand: string;
};

const childCollectionCountsSql = `select
  (select count(*)::int from payload.districts where city_id = $1) as districts,
  (select count(*)::int from payload.neighborhoods where city_id = $1) as neighborhoods,
  (select count(*)::int from payload.listings where city_id = $1) as listings,
  (select count(*)::int from payload.guide_sections where city_id = $1) as guide_sections,
  (select count(*)::int from payload.guide_items where city_id = $1) as guide_items,
  (select count(*)::int from payload.itineraries where city_id = $1) as itineraries`;

export const assertSafeCityBaselineSeed = async ({
  allowDestructiveSeed,
  cityLabel,
  citySlug,
  client,
  resetCommand,
}: AssertSafeCityBaselineSeedOptions) => {
  if (allowDestructiveSeed) return;

  const cityResult = await client.query(
    "select id from payload.cities where slug = $1 limit 1",
    [citySlug],
  );
  const cityId = cityResult.rows[0]?.id as number | undefined;
  if (!cityId) return;

  const countResult = await client.query(childCollectionCountsSql, [cityId]);
  const counts = countResult.rows[0] ?? {};
  const existingCollections = Object.entries(counts).filter(
    ([, count]) => Number(count) > 0,
  );

  if (existingCollections.length === 0) return;

  const label = cityLabel ?? citySlug;
  throw new Error(
    [
      `Refusing to run destructive baseline seed against existing Payload city "${label}".`,
      "A baseline seed may delete and recreate child records. After first import, Payload is the editorial source of truth and must not be overwritten by another seed run.",
      "Use targeted update/upsert scripts for explicitly requested changes, and preserve editor-managed CMS fields, media links, galleries, body copy, translations, and workflow state.",
      `Existing rows: ${JSON.stringify(counts)}.`,
      `For an intentional local reset only, run: ${resetCommand}`,
    ].join("\n"),
  );
};
