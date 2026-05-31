import { getCityBySlug } from "@/lib/city-source";
import { getPrayerTimesForCity } from "@/lib/prayer-times";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const citySlug = searchParams.get("city") || "karachi";
  const city = await getCityBySlug(citySlug);

  if (!city) {
    return Response.json({ error: "City not found" }, { status: 404 });
  }

  try {
    const prayerTimes = await getPrayerTimesForCity(city);
    return Response.json(prayerTimes);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Prayer times are unavailable",
      },
      { status: 502 },
    );
  }
}
