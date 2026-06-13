"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type CityHeroCarouselLabels = {
  previous: string;
  next: string;
  slide: string;
};

type CityHeroCarouselProps = {
  autoAdvanceMs?: number;
  images: string[];
  alt: string;
  dir?: "ltr" | "rtl";
  backdropClassName?: string;
  frameClassName?: string;
  imageClassName?: string;
  mirrorForRtl?: boolean;
  objectFit?: "contain" | "cover" | "fill";
  labels: CityHeroCarouselLabels;
  sizes?: string;
};

export function CityHeroCarousel({
  autoAdvanceMs,
  images,
  alt,
  backdropClassName,
  dir = "ltr",
  frameClassName = "absolute inset-0",
  imageClassName = "object-cover object-center",
  mirrorForRtl = true,
  objectFit = "cover",
  labels,
  sizes = "100vw",
}: CityHeroCarouselProps) {
  const safeImages = images.filter(Boolean);
  const total = safeImages.length;
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;
  const hasMultiple = total > 1;
  const currentImage = safeImages[safeIndex];
  const imageTransform =
    mirrorForRtl && dir === "rtl" ? "scaleX(-1)" : undefined;

  const go = (delta: number) =>
    setIndex((current) => (current + delta + total) % total);

  const PreviousIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (!autoAdvanceMs || autoAdvanceMs <= 0 || !hasMultiple || isPaused) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, autoAdvanceMs);

    return () => window.clearInterval(timer);
  }, [autoAdvanceMs, hasMultiple, isPaused, total]);

  if (!currentImage) return null;

  return (
    <div
      className={frameClassName}
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {safeImages.map((image, imageIndex) => {
        const isActive = imageIndex === safeIndex;
        const layerClassName = isActive
          ? "opacity-100"
          : "opacity-0";

        return (
          <div
            aria-hidden={!isActive}
            className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-in-out ${layerClassName}`}
            key={`${image}-${imageIndex}`}
          >
            {backdropClassName ? (
              <Image
                alt=""
                aria-hidden="true"
                className={backdropClassName}
                fill
                quality={90}
                sizes={sizes}
                src={image}
                style={{
                  objectFit: "cover",
                  objectPosition: "center center",
                  transform: imageTransform,
                }}
              />
            ) : null}
            <Image
              alt={
                isActive
                  ? hasMultiple
                    ? `${alt} (${safeIndex + 1} of ${total})`
                    : alt
                  : ""
              }
              aria-hidden={!isActive}
              className={imageClassName}
              fetchPriority={imageIndex === 0 ? "high" : "auto"}
              fill
              loading={imageIndex <= 1 ? "eager" : "lazy"}
              quality={90}
              sizes={sizes}
              src={image}
              style={{
                objectFit,
                objectPosition: "center center",
                transform: imageTransform,
              }}
            />
          </div>
        );
      })}

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
