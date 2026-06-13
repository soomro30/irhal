import type { CityGuide } from "./city-data";

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

type OpenMeteoCurrent = {
  temperature_2m?: number;
  weather_code?: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  current_units?: {
    temperature_2m?: string;
  };
};

export type CurrentWeather = {
  label: string;
  temperature: number;
  unit: string;
};

const weatherLabelByCode = (code: number) => {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 95) return "Storm";
  return "Weather";
};

export const getCurrentWeatherForCity = async (
  city: Pick<CityGuide, "latitude" | "longitude">,
): Promise<CurrentWeather> => {
  const url = new URL(OPEN_METEO_BASE_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OpenMeteoResponse;
  const temperature = payload.current?.temperature_2m;

  if (typeof temperature !== "number") {
    throw new Error("Weather provider returned no current temperature");
  }

  return {
    label: weatherLabelByCode(payload.current?.weather_code ?? -1),
    temperature: Math.round(temperature),
    unit: payload.current_units?.temperature_2m ?? "°C",
  };
};
