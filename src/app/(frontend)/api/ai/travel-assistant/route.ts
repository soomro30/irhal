import { z } from "zod";

import { getListingsByTypes } from "@/lib/city-data";
import { getCityBySlug } from "@/lib/city-source";

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

  const city = await getCityBySlug(parsed.data.city);

  if (!city) {
    return Response.json({ status: "error", errors: [{ message: "City not found" }] }, { status: 404 });
  }

  const muslimListings = getListingsByTypes(city, ["masjid", "prayer-area", "restaurant", "islamic-landmark"]);

  return Response.json({
    status: "ok",
    input: parsed.data,
    output: {
      answer:
        "Here are relevant Muslim-friendly travel references for your city. Use the map links and confirm current details before you visit.",
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
    },
  });
}
