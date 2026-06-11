"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type CityHeroCarouselLabels = {
  previous: string;
  next: string;
  slide: string;
};

type CityHeroCarouselProps = {
  images: string[];
  alt: string;
  dir?: "ltr" | "rtl";
  frameClassName?: string;
  labels: CityHeroCarouselLabels;
  sizes?: string;
};

export function CityHeroCarousel({
  images,
  alt,
  dir = "ltr",
  frameClassName = "absolute inset-0",
  labels,
  sizes = "100vw",
}: CityHeroCarouselProps) {
  const safeImages = images.filter(Boolean);
  const total = safeImages.length;
  const [index, setIndex] = useState(0);
  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;
  const hasMultiple = total > 1;
  const currentImage = safeImages[safeIndex];

  if (!currentImage) return null;

  const go = (delta: number) =>
    setIndex((current) => (current + delta + total) % total);

  const PreviousIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className={frameClassName}>
      <Image
        alt={hasMultiple ? `${alt} (${safeIndex + 1} of ${total})` : alt}
        className="object-cover object-center"
        fetchPriority={safeIndex === 0 ? "high" : "auto"}
        fill
        loading={safeIndex === 0 ? "eager" : "lazy"}
        sizes={sizes}
        src={currentImage}
        style={{
          objectFit: "cover",
          objectPosition: "center center",
          transform: dir === "rtl" ? "scaleX(-1)" : undefined,
        }}
      />

      {hasMultiple ? (
        <div className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-2 py-1 text-white shadow-sm backdrop-blur-md md:bottom-5 md:top-auto rtl:left-5 rtl:right-auto">
          <button
            aria-label={labels.previous}
            className="grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => go(-1)}
            type="button"
          >
            <PreviousIcon aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {safeImages.map((image, dotIndex) => (
              <button
                aria-current={dotIndex === safeIndex ? "true" : undefined}
                aria-label={`${labels.slide} ${dotIndex + 1}`}
                className={
                  dotIndex === safeIndex
                    ? "h-2 w-6 rounded-full bg-white"
                    : "h-2 w-2 rounded-full bg-white/55 transition hover:bg-white"
                }
                key={`${image}-${dotIndex}`}
                onClick={() => setIndex(dotIndex)}
                type="button"
              />
            ))}
          </div>
          <span
            aria-live="polite"
            className="min-w-10 text-center text-xs font-black tabular-nums text-white"
          >
            {safeIndex + 1}/{total}
          </span>
          <button
            aria-label={labels.next}
            className="grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => go(1)}
            type="button"
          >
            <NextIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
