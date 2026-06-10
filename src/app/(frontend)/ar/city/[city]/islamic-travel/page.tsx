import {
  IslamicTravelPageContent,
  generateIslamicTravelMetadata,
} from "@/app/(frontend)/city/[city]/islamic-travel/page";

export { generateStaticParams } from "@/app/(frontend)/city/[city]/islamic-travel/page";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata(props: Props) {
  return generateIslamicTravelMetadata(props, "ar");
}

export default function ArabicIslamicTravelPage(props: Props) {
  return <IslamicTravelPageContent {...props} locale="ar" />;
}
