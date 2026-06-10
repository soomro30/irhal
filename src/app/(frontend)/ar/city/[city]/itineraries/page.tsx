import {
  ItinerariesPageContent,
  generateItinerariesMetadata,
} from "@/app/(frontend)/city/[city]/itineraries/page";

export { generateStaticParams } from "@/app/(frontend)/city/[city]/itineraries/page";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata(props: Props) {
  return generateItinerariesMetadata(props, "ar");
}

export default function ArabicItinerariesPage(props: Props) {
  return <ItinerariesPageContent {...props} locale="ar" />;
}
