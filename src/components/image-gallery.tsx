"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type ImageGalleryProps = {
  images: string[];
  alt: string;
  dir?: "ltr" | "rtl";
  labels?: { previous: string; next: string };
};

export function ImageGallery({
  images,
  alt,
  dir = "ltr",
  labels = { previous: "Previous image", next: "Next image" },
}: ImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const safeIndex = Math.min(index, total - 1);
  const hasMultiple = total > 1;

  const go = (delta: number) =>
    setIndex((current) => (current + delta + total) % total);

  const PreviousIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-paper-deep">
      <div className="relative aspect-[1.35] w-full">
        <Image
          alt={total > 1 ? `${alt} (${safeIndex + 1} of ${total})` : alt}
          className="object-cover"
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          src={images[safeIndex]}
        />
      </div>

      {hasMultiple ? (
        <>
          <button
            aria-label={labels.previous}
            className="absolute top-1/2 left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-ink/10 bg-white/90 text-ink transition hover:bg-white rtl:left-auto rtl:right-3"
            onClick={() => go(-1)}
            type="button"
          >
            <PreviousIcon aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            aria-label={labels.next}
            className="absolute top-1/2 right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-ink/10 bg-white/90 text-ink transition hover:bg-white rtl:right-auto rtl:left-3"
            onClick={() => go(1)}
            type="button"
          >
            <NextIcon aria-hidden="true" className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            {images.map((image, dotIndex) => (
              <button
                aria-label={`${dotIndex + 1}`}
                aria-current={dotIndex === safeIndex ? "true" : undefined}
                className={
                  dotIndex === safeIndex
                    ? "h-2 w-6 rounded-full bg-white"
                    : "h-2 w-2 rounded-full bg-white/60 hover:bg-white"
                }
                key={image}
                onClick={() => setIndex(dotIndex)}
                type="button"
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
