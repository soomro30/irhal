"use client";

/* eslint-disable @next/next/no-img-element -- Payload admin previews are transient external provider thumbnails. */

import { Button, SearchIcon, toast, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import type { UIFieldClientComponent } from "payload";
import { useMemo, useState } from "react";

type MediaCandidate = {
  alt: string;
  attribution: string;
  height: number;
  id: string;
  license: string;
  photographer: string;
  previewUrl: string;
  provider: "unsplash";
  score: number;
  sourceUrl: string;
  thumbUrl: string;
  width: number;
};

type SearchResponse = {
  message?: string;
  query?: string;
  results?: MediaCandidate[];
  status: "error" | "ok";
};

type ImportResponse = {
  media?: {
    id: number | string;
    alt?: string;
    filename?: string;
    url?: string;
  };
  message?: string;
  status: "error" | "ok";
};

const stringifyValue = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name || record.title || record.value || record.id || "");
  }

  return "";
};

export const GuideItemMediaDiscovery: UIFieldClientComponent = () => {
  const { id, isEditing } = useDocumentInfo();
  const { area, city, dispatchFields, formTitle, kind } = useFormFields(([fields, dispatch]) => ({
    area: stringifyValue(fields.area?.value),
    city: stringifyValue(fields.city?.value),
    dispatchFields: dispatch,
    formTitle: stringifyValue(fields.title?.value),
    kind: stringifyValue(fields.kind?.value),
  }));
  const defaultQuery = useMemo(
    () =>
      [formTitle, area, city || "Karachi", kind, "travel"]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    [area, city, formTitle, kind],
  );
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<MediaCandidate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const searchQuery = (query || defaultQuery).trim();

    if (searchQuery.length < 2) {
      setError("Enter at least two characters to search.");
      return;
    }

    setIsOpen(true);
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/media-search", {
        body: JSON.stringify({
          city,
          kind,
          query: searchQuery,
          title: formTitle,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as SearchResponse;

      if (!response.ok || json.status !== "ok") {
        throw new Error(json.message || "Image search failed.");
      }

      setResults(json.results || []);
      if (!json.results?.length) {
        setError("No image candidates found for this query.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image search failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  };

  const importCandidate = async (candidate: MediaCandidate) => {
    setImportingId(candidate.id);
    setError(null);

    try {
      const response = await fetch("/api/admin/media-import", {
        body: JSON.stringify({
          alt: candidate.alt || `${formTitle} travel image`,
          guideItemId: id,
          photoId: candidate.id,
          query: query || defaultQuery,
          title: formTitle || defaultQuery,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ImportResponse;

      if (!response.ok || json.status !== "ok" || !json.media) {
        throw new Error(json.message || "Image import failed.");
      }

      dispatchFields({
        path: "image",
        type: "UPDATE",
        value: json.media.id,
      });
      dispatchFields({
        path: "imageAlt",
        type: "UPDATE",
        value: json.media.alt || candidate.alt || `${formTitle} travel image`,
      });
      toast.success("Media imported to R2 and set as the primary image. Save the guide item to keep it attached.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image import failed.";
      setError(message);
      toast.error(message);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <section className="irhal-media-discovery">
      <div className="irhal-media-discovery__header">
        <div>
          <h3>Internet Image Discovery</h3>
          <p>Find licensed candidates, import the selected asset to Payload Media, and set it as this guide item image.</p>
        </div>
        <Button
          buttonStyle="primary"
          disabled={!isEditing || isSearching}
          onClick={search}
          type="button"
        >
          <SearchIcon />
          {isSearching ? "Searching" : "Find Images"}
        </Button>
      </div>

      <div className="irhal-media-discovery__search">
        <input
          aria-label="Image search query"
          disabled={isSearching}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={defaultQuery}
          type="search"
          value={query}
        />
        {!isEditing ? <span>Save this guide item before importing media.</span> : null}
      </div>

      {error ? <p className="irhal-media-discovery__error">{error}</p> : null}

      {isOpen ? (
        <div className="irhal-media-discovery__results" aria-live="polite">
          {isSearching ? (
            <div className="irhal-media-discovery__empty">Searching image providers...</div>
          ) : null}

          {!isSearching && results.length > 0
            ? results.map((candidate) => (
                <article className="irhal-media-discovery__candidate" key={candidate.id}>
                  <img alt="" loading="lazy" src={candidate.thumbUrl || candidate.previewUrl} />
                  <div className="irhal-media-discovery__candidate-body">
                    <strong>{candidate.alt}</strong>
                    <span>{candidate.attribution}</span>
                    <span>
                      {candidate.width}x{candidate.height} - Match {candidate.score}%
                    </span>
                    <a href={candidate.sourceUrl} rel="noreferrer" target="_blank">
                      View source
                    </a>
                  </div>
                  <Button
                    buttonStyle="secondary"
                    disabled={importingId === candidate.id}
                    onClick={() => void importCandidate(candidate)}
                    type="button"
                  >
                    {importingId === candidate.id ? "Importing" : "Import & Set"}
                  </Button>
                </article>
              ))
            : null}
        </div>
      ) : null}
    </section>
  );
};

export default GuideItemMediaDiscovery;
