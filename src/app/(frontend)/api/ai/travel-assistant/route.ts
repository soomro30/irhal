import { z } from "zod";

import { getCityBySlug, getListingsByTypes } from "@/lib/city-data";

const requestSchema = z.object({
  city: z.string().min(1),
  question: z.string().min(3),
  travelerProfile: z
    .object({
      halalRequired: z.boolean().default(false),
      needsWomenPrayerArea: z.boolean().default(false),
      familyTravel: z.boolean().default(false),
      days: z.number().int().positive().max(14).optional(),
    })
    .default({ halalRequired: false, needsWomenPrayerArea: false, familyTravel: false }),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      {
        status: "error",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const city = getCityBySlug(parsed.data.city);

  if (!city) {
    return Response.json({ status: "error", errors: [{ message: "City not found" }] }, { status: 404 });
  }

  const muslimListings = getListingsByTypes(city, ["masjid", "prayer-area", "restaurant", "islamic-landmark"]);

  return Response.json({
    status: "ok",
    agent: "muslim-travel-assistant",
    input: parsed.data,
    output: {
      answer:
        "This starter route returns approved structured city context. Connect `AI_API_KEY` to generate final natural language responses from the same JSON payload.",
      city: {
        name: city.name,
        slug: city.slug,
        timezone: city.timezone,
      },
      relevantListings: muslimListings.map((listing) => ({
        name: listing.name,
        type: listing.listingType,
        neighborhood: listing.neighborhoodSlug,
        latitude: listing.latitude,
        longitude: listing.longitude,
        mapUrl: listing.mapUrl,
        muslimTravel: listing.muslimTravel,
      })),
      rulesApplied: [
        "approved_city_data_only",
        "json_output_only",
        "geo_required_for_location_entities",
        "halal_and_women_prayer_area_are_explicit_fields",
      ],
    },
  });
}
