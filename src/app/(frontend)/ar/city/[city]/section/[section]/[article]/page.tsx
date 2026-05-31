import {
  GuideArticlePageContent,
  generateGuideArticleMetadata,
} from "@/app/(frontend)/city/[city]/section/[section]/[article]/page";

type Props = {
  params: Promise<{ city: string; section: string; article: string }>;
};

export async function generateMetadata(props: Props) {
  return generateGuideArticleMetadata(props, "ar");
}

export default function ArabicGuideArticlePage(props: Props) {
  return <GuideArticlePageContent {...props} locale="ar" />;
}
