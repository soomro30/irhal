import {
  CityGuideSectionPageContent,
  generateGuideSectionMetadata,
} from "@/app/(frontend)/city/[city]/section/[section]/page";

type Props = {
  params: Promise<{ city: string; section: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata(props: Props) {
  return generateGuideSectionMetadata(props, "ar");
}

export default function ArabicCityGuideSectionPage(props: Props) {
  return <CityGuideSectionPageContent {...props} locale="ar" />;
}
