import {
  NeighborhoodPageContent,
  generateNeighborhoodMetadata,
} from "@/app/(frontend)/city/[city]/neighborhood/[area]/page";

type Props = {
  params: Promise<{ city: string; area: string }>;
};

export async function generateMetadata(props: Props) {
  return generateNeighborhoodMetadata(props, "ar");
}

export default function ArabicNeighborhoodPage(props: Props) {
  return <NeighborhoodPageContent {...props} locale="ar" />;
}
