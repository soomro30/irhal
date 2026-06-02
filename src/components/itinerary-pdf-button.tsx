"use client";

import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ItineraryPdfButton({
  label = "Export PDF",
}: {
  label?: string;
}) {
  return (
    <Button
      className="print:hidden"
      onClick={() => window.print()}
      type="button"
      variant="red"
    >
      <FileDown aria-hidden="true" />
      {label}
    </Button>
  );
}
