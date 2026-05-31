import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "أخبار إرحل",
  description: "أخبار السفر وتحديثات المدن من إرحل.",
  path: "/ar/news",
});

export default function ArabicNewsPage() {
  return (
    <PageShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/ar" },
        { label: "الأخبار" },
      ]}
      locale="ar"
    >
      <main className="font-arabic bg-white" dir="rtl">
        <section className="mx-auto max-w-7xl px-5 py-16">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
            الأخبار
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-ink">
            أخبار إرحل
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/65">
            ستظهر هنا أخبار السفر، وإطلاق أدلة المدن، والتحديثات التحريرية
            الجديدة.
          </p>
          <Link
            className="mt-8 inline-flex rounded-md border border-ink/15 px-4 py-2 text-sm font-bold text-ink hover:border-irhal-red hover:text-irhal-red"
            href="/ar/city/karachi"
          >
            تصفح أدلة المدن
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
