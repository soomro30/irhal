import {
  CityGuideSectionPageContent,
  generateGuideSectionMetadata,
} from "@/app/(frontend)/city/[city]/section/[section]/page";

type Props = {
  params: Promise<{ city: string; section: string; page: string }>;
};

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: Props) {
  return generateGuideSectionMetadata(props, "ar");
}

export default function ArabicPaginatedCityGuideSectionPage(props: Props) {
  return <CityGuideSectionPageContent {...props} locale="ar" />;
}
