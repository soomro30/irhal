import {
  TourPageContent,
  generateTourMetadata,
} from "@/app/(frontend)/city/[city]/tour/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generateTourMetadata(props, "ar");
}

export default function ArabicTourPage(props: Props) {
  return <TourPageContent {...props} locale="ar" />;
}
