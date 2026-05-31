import {
  PlacePageContent,
  generatePlaceMetadata,
} from "@/app/(frontend)/city/[city]/place/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generatePlaceMetadata(props, "ar");
}

export default function ArabicPlacePage(props: Props) {
  return <PlacePageContent {...props} locale="ar" />;
}
