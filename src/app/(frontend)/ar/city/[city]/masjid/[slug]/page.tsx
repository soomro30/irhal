import {
  MasjidPageContent,
  generateMasjidMetadata,
} from "@/app/(frontend)/city/[city]/masjid/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generateMasjidMetadata(props, "ar");
}

export default function ArabicMasjidPage(props: Props) {
  return <MasjidPageContent {...props} locale="ar" />;
}
