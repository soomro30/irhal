import {
  RestaurantPageContent,
  generateRestaurantMetadata,
} from "@/app/(frontend)/city/[city]/restaurant/[slug]/page";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  return generateRestaurantMetadata(props, "ar");
}

export default function ArabicRestaurantPage(props: Props) {
  return <RestaurantPageContent {...props} locale="ar" />;
}
