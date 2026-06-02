import {
  generateItineraryMetadata,
  ItineraryDetailPageContent,
} from "@/app/(frontend)/city/[city]/itineraries/[itinerary]/page";

type Props = {
  params: Promise<{ city: string; itinerary: string }>;
};

export async function generateMetadata(props: Props) {
  return generateItineraryMetadata(props, "ar");
}

export default function ArabicItineraryDetailPage(props: Props) {
  return <ItineraryDetailPageContent {...props} locale="ar" />;
}
