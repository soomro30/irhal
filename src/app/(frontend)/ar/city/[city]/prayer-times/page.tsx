import {
  generatePrayerTimesMetadata,
  PrayerTimesPageContent,
} from "@/app/(frontend)/city/[city]/prayer-times/page";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata(props: Props) {
  return generatePrayerTimesMetadata(props, "ar");
}

export default function ArabicPrayerTimesPage(props: Props) {
  return <PrayerTimesPageContent {...props} locale="ar" />;
}
