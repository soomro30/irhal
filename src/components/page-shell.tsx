import { Bot, Map, Newspaper, Search } from "lucide-react";
import Link from "next/link";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link className="text-xl font-bold" href="/">
            Irhal AI Travel
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">
            <Link className="inline-flex items-center gap-2 hover:text-slate-950" href="/city/karachi">
              <Map aria-hidden="true" className="h-4 w-4" />
              Cities
            </Link>
            <Link className="inline-flex items-center gap-2 hover:text-slate-950" href="/city/karachi/islamic-travel">
              <Search aria-hidden="true" className="h-4 w-4" />
              Islamic Travel
            </Link>
            <Link className="inline-flex items-center gap-2 hover:text-slate-950" href="/city/karachi/itineraries">
              <Bot aria-hidden="true" className="h-4 w-4" />
              AI Planner
            </Link>
            <span className="inline-flex items-center gap-2 text-slate-400">
              <Newspaper aria-hidden="true" className="h-4 w-4" />
              Media
            </span>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
