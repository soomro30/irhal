import {
  FestivalPageContent,
  generateFestivalMetadata,
} from "@/app/(frontend)/city/[city]/festival/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generateFestivalMetadata(props, "ar");
}

export default function ArabicFestivalPage(props: Props) {
  return <FestivalPageContent {...props} locale="ar" />;
}
