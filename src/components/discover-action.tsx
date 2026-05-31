import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export const discoverLabel = (locale?: "en" | "ar") =>
  locale === "ar" ? "اكتشف" : "Discover";

const discoverActionClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-travel-navy transition hover:border-coastal hover:text-coastal";

export function DiscoverPill({
  className,
  label = "Discover",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn(discoverActionClassName, className)}>
      <span>{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-4 w-4 text-coastal transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5"
      />
    </span>
  );
}

export function DiscoverLink({
  className,
  href,
  label = "Discover",
}: {
  className?: string;
  href: string;
  label?: string;
}) {
  return (
    <Link className={cn(discoverActionClassName, "group", className)} href={href}>
      <span>{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-4 w-4 text-coastal transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5"
      />
    </Link>
  );
}
