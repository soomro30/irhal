"use client";

import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type DetailMediaGalleryProps = {
  alt: string;
  dir: "ltr" | "rtl";
  images: string[];
  labels: {
    close: string;
    next: string;
    previous: string;
    viewAll: string;
  };
};

const fallbackImage = "/images/karachi-guide/place.svg";

export function DetailMediaGallery({
  alt,
  dir,
  images,
  labels,
}: DetailMediaGalleryProps) {
  const safeImages = images.length > 0 ? images : [fallbackImage];
  const secondaryImages = safeImages.slice(1, 5);
  const shouldBalanceSecondaryGrid = secondaryImages.length >= 3;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const hasMultiple = safeImages.length > 1;
  const PreviousIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  const openAt = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const go = (delta: number) => {
    setActiveIndex((current) => (current + delta + safeImages.length) % safeImages.length);
  };

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "ArrowLeft") {
        const delta = dir === "rtl" ? 1 : -1;
        setActiveIndex((current) => (current + delta + safeImages.length) % safeImages.length);
      }
      if (event.key === "ArrowRight") {
        const delta = dir === "rtl" ? -1 : 1;
        setActiveIndex((current) => (current + delta + safeImages.length) % safeImages.length);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dir, isOpen, safeImages.length]);

  return (
    <>
      {secondaryImages.length === 0 ? (
        <button
          aria-label={labels.viewAll}
          className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-paper-deep text-start"
          onClick={() => openAt(0)}
          type="button"
        >
          <Image
            alt={alt}
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            fill
            preload
            sizes="(min-width: 1024px) 780px, 100vw"
            src={safeImages[0]}
          />
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-travel-navy shadow-sm rtl:left-4 rtl:right-auto">
            <Camera aria-hidden="true" className="h-4 w-4" />
            {labels.viewAll}
          </span>
        </button>
      ) : (
        <div className="grid gap-2 overflow-hidden rounded-2xl bg-white md:grid-cols-[1.3fr_0.9fr]">
          <button
            aria-label={labels.viewAll}
            className="group relative aspect-[16/11] overflow-hidden bg-paper-deep text-start md:aspect-auto md:min-h-[438px]"
            onClick={() => openAt(0)}
            type="button"
          >
            <Image
              alt={alt}
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              fill
              preload
              sizes="(min-width: 1024px) 560px, 100vw"
              src={safeImages[0]}
            />
          </button>
          <div
            className={
              shouldBalanceSecondaryGrid
                ? "grid grid-cols-2 gap-2 md:grid-rows-2"
                : "grid grid-cols-2 gap-2"
            }
          >
            {secondaryImages.map((image, index) => {
              const imageIndex = index + 1;

              return (
                <button
                  aria-label={`${labels.viewAll} ${imageIndex + 1}`}
                  className={
                    shouldBalanceSecondaryGrid
                      ? "group relative aspect-[1.25] overflow-hidden bg-paper-deep text-start md:aspect-auto md:h-full md:min-h-0"
                      : "group relative aspect-[1.25] overflow-hidden bg-paper-deep text-start"
                  }
                  key={`${image}-${index}`}
                  onClick={() => openAt(imageIndex)}
                  type="button"
                >
                  <Image
                    alt={`${alt} ${imageIndex + 1}`}
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    fill
                    sizes="(min-width: 1024px) 180px, 50vw"
                    src={image}
                  />
                  {index === secondaryImages.length - 1 ? (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-travel-navy shadow-sm rtl:left-3 rtl:right-auto">
                      <Camera aria-hidden="true" className="h-4 w-4" />
                      {labels.viewAll}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
          dir={dir}
          role="dialog"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
            <p className="text-sm font-bold text-white/80">
              {activeIndex + 1} / {safeImages.length}
            </p>
            <button
              aria-label={labels.close}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-5">
            <Image
              alt={`${alt} ${activeIndex + 1}`}
              className="object-contain"
              fill
              sizes="100vw"
              src={safeImages[activeIndex]}
            />

            {hasMultiple ? (
              <>
                <button
                  aria-label={labels.previous}
                  className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-travel-navy shadow-lg transition hover:bg-paper-deep rtl:left-auto rtl:right-4"
                  onClick={() => go(-1)}
                  type="button"
                >
                  <PreviousIcon aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  aria-label={labels.next}
                  className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-travel-navy shadow-lg transition hover:bg-paper-deep rtl:left-4 rtl:right-auto"
                  onClick={() => go(1)}
                  type="button"
                >
                  <NextIcon aria-hidden="true" className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          {hasMultiple ? (
            <div className="flex gap-3 overflow-x-auto border-t border-white/10 px-4 py-3">
              {safeImages.map((image, index) => (
                <button
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={
                    index === activeIndex
                      ? "relative h-16 w-24 shrink-0 overflow-hidden rounded-md ring-2 ring-white"
                      : "relative h-16 w-24 shrink-0 overflow-hidden rounded-md opacity-60 transition hover:opacity-100"
                  }
                  key={`${image}-thumb-${index}`}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <Image
                    alt={`${alt} ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="96px"
                    src={image}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
