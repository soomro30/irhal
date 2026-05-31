import {
  ShoppingPageContent,
  generateShoppingMetadata,
} from "@/app/(frontend)/city/[city]/shopping/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generateShoppingMetadata(props, "ar");
}

export default function ArabicShoppingPage(props: Props) {
  return <ShoppingPageContent {...props} locale="ar" />;
}
