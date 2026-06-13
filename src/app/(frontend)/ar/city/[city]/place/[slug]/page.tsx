import {
  cityInformationArticleRedirectPath,
  PlacePageContent,
  generatePlaceMetadata,
} from "@/app/(frontend)/city/[city]/place/[slug]/page";
import { redirect } from "next/navigation";

export { generateStaticParams } from "@/app/(frontend)/city/[city]/place/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generatePlaceMetadata(props, "ar");
}

export default async function ArabicPlacePage(props: Props) {
  const { city: citySlug, slug } = await props.params;
  const redirectPath = cityInformationArticleRedirectPath(citySlug, slug, "ar");
  if (redirectPath) redirect(redirectPath);

  return <PlacePageContent {...props} locale="ar" />;
}
