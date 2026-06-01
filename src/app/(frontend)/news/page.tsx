import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Irhal News",
  description: "Travel news and updates from Irhal.",
  path: "/news",
});

export default function NewsPage() {
  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "News" },
      ]}
    >
      <main className="bg-white">
        <section className="mx-auto max-w-7xl px-5 py-16">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
            News
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-ink">
            Irhal News
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/65">
            Travel updates, new city guides, events, and practical Irhal
            announcements will appear here.
          </p>
          <Link
            className="mt-8 inline-flex rounded-md border border-ink/15 px-4 py-2 text-sm font-bold text-ink hover:border-irhal-red hover:text-irhal-red"
            href="/en/city/karachi"
          >
            Browse city guides
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
