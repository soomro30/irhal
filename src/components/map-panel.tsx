import { MapPin } from "lucide-react";

type Marker = {
  label: string;
  latitude: number;
  longitude: number;
  tone?: "blue" | "green" | "gold";
};

export function MapPanel({
  layerLabel = "Irhal map layer",
  markers,
}: {
  layerLabel?: string;
  markers: Marker[];
}) {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-ink/10 bg-irhal-panel shadow-[0_24px_70px_rgba(23,33,29,0.12)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,33,29,.1)_1px,transparent_1px),linear-gradient(rgba(23,33,29,.1)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute left-[-8%] top-[45%] h-16 w-[120%] rotate-[-12deg] bg-irhal-sky/20" />
      <div className="absolute left-[10%] top-[8%] h-[120%] w-14 rotate-[28deg] bg-white/70" />
      <div className="absolute right-[8%] top-[-10%] h-[120%] w-12 rotate-[-22deg] bg-white/70" />
      <div className="absolute bottom-5 left-5 rounded-md border border-ink/10 bg-paper/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-ink/65 shadow-sm">
        {layerLabel}
      </div>
      {markers.map((marker, index) => {
        const left = `${20 + ((Math.abs(marker.longitude) * 17 + index * 13) % 58)}%`;
        const top = `${16 + ((Math.abs(marker.latitude) * 19 + index * 11) % 60)}%`;
        const tone =
          marker.tone === "green"
            ? "bg-irhal-green"
            : marker.tone === "gold"
              ? "bg-irhal-yellow"
              : "bg-irhal-red";
        const iconTone = marker.tone === "gold" ? "text-ink" : "text-white";

        return (
          <div className="absolute" key={marker.label} style={{ left, top }}>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${tone} ${iconTone} shadow-lg`}
            >
              <MapPin aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="mt-2 max-w-36 rounded-md bg-white px-2 py-1 text-xs font-bold text-ink shadow-sm">
              {marker.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
