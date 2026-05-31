import {
  HotelPageContent,
  generateHotelMetadata,
} from "@/app/(frontend)/city/[city]/hotel/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generateHotelMetadata(props, "ar");
}

export default function ArabicHotelPage(props: Props) {
  return <HotelPageContent {...props} locale="ar" />;
}
