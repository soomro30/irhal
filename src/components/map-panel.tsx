import { MapPin } from "lucide-react";

type Marker = {
  label: string;
  latitude: number;
  longitude: number;
  tone?: "blue" | "green" | "gold";
};

export function MapPanel({ markers }: { markers: Marker[] }) {
  return (
    <div className="relative min-h-[360px] overflow-hidden border border-slate-200 bg-[#eef2ed]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute left-[-8%] top-[45%] h-16 w-[120%] rotate-[-12deg] bg-cyan-100/80" />
      <div className="absolute left-[10%] top-[8%] h-[120%] w-14 rotate-[28deg] bg-white/75" />
      <div className="absolute right-[8%] top-[-10%] h-[120%] w-12 rotate-[-22deg] bg-white/75" />
      {markers.map((marker, index) => {
        const left = `${20 + ((Math.abs(marker.longitude) * 17 + index * 13) % 58)}%`;
        const top = `${16 + ((Math.abs(marker.latitude) * 19 + index * 11) % 60)}%`;
        const tone =
          marker.tone === "green"
            ? "bg-emerald-700"
            : marker.tone === "gold"
              ? "bg-amber-600"
              : "bg-slate-900";

        return (
          <div className="absolute" key={marker.label} style={{ left, top }}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${tone} text-white shadow-lg`}>
              <MapPin aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="mt-2 max-w-36 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm">
              {marker.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
