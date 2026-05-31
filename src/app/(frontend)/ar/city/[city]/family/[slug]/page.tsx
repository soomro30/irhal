import {
  FamilyPageContent,
  generateFamilyMetadata,
} from "@/app/(frontend)/city/[city]/family/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generateFamilyMetadata(props, "ar");
}

export default function ArabicFamilyPage(props: Props) {
  return <FamilyPageContent {...props} locale="ar" />;
}
