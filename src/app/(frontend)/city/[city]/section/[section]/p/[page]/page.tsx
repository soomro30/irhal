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
  return generateGuideSectionMetadata(props);
}

export default function PaginatedCityGuideSectionPage(props: Props) {
  return <CityGuideSectionPageContent {...props} />;
}
