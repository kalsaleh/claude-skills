"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkplace } from "@/lib/workplace-context";

const NAV = [
  { href: "/import", label: "Builder" },
  { href: "/map", label: "Map" },
  { href: "/playbooks", label: "Playbooks" },
  { href: "/privacy", label: "Privacy" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, workplace, builder, reset } = useWorkplace();
  const inApp =
    pathname.startsWith("/map") ||
    pathname.startsWith("/playbooks") ||
    pathname.startsWith("/enrich") ||
    pathname.startsWith("/filter");

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-peat/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-chalk">Groundwater</span>
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-mist sm:block">
            IC prototype
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active =
              item.href === "/import"
                ? ["/import", "/filter", "/enrich"].some((path) => pathname.startsWith(path))
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 transition ${
                  active ? "bg-moss text-chalk" : "text-mist hover:text-chalk"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {ready && inApp && workplace ? (
            <button
              type="button"
              className="ml-2 rounded-full border border-line px-3 py-1.5 text-mist hover:border-copper hover:text-chalk"
              onClick={() => {
                reset();
                router.push("/");
              }}
            >
              Reset
            </button>
          ) : ready ? (
            <Link
              href={
                workplace?.onboarded
                  ? "/map"
                  : builder?.stage === "enrich"
                    ? "/enrich"
                    : builder?.stage === "filter" || (builder?.people.length ?? 0) > 0
                      ? "/filter"
                      : "/onboarding"
              }
              className="ml-2 rounded-full bg-aquifer px-3 py-1.5 text-sm font-medium text-peat hover:bg-aquifer/90"
            >
              {workplace?.onboarded ? "Open map" : "Enter"}
            </Link>
          ) : (
            <span className="ml-2 inline-block h-8 w-16" />
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line/70 px-5 py-8 text-sm text-mist">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>Groundwater stays in this browser. No account. No pipeline.</p>
        <p className="flex gap-4">
          <Link href="/privacy" className="hover:text-chalk">
            Privacy
          </Link>
          <a href="/samples/Connections.csv" className="hover:text-chalk">
            Sample CSV
          </a>
        </p>
      </div>
    </footer>
  );
}
