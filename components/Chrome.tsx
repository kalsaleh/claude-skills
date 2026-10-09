"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearStoredSession, clearVerdicts, loadStoredSession } from "@/lib/client-store";
import { useWorkplace } from "@/lib/workplace-context";

const NAV = [
  { href: "/setup", label: "Setup" },
  { href: "/network", label: "Network" },
  { href: "/privacy", label: "Privacy" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { reset } = useWorkplace();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(loadStoredSession());
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-peat/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-chalk">Groundwater</span>
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-mist sm:block">
            Hidden network
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const href =
              item.href === "/network" && sessionId ? `/network?session=${sessionId}` : item.href;
            return (
              <Link
                key={item.href}
                href={href}
                className={`rounded-full px-3 py-1.5 transition ${
                  active ? "bg-moss text-chalk" : "text-mist hover:text-chalk"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {pathname !== "/" ? (
            <button
              type="button"
              className="ml-2 rounded-full border border-line px-3 py-1.5 text-mist hover:border-copper hover:text-chalk"
              onClick={() => {
                reset();
                clearVerdicts();
                clearStoredSession();
                setSessionId(null);
                router.push("/");
              }}
            >
              Reset
            </button>
          ) : (
            <Link
              href={sessionId ? `/network?session=${sessionId}` : "/setup"}
              className="ml-2 rounded-full bg-aquifer px-3 py-1.5 text-sm font-medium text-peat hover:bg-aquifer/90"
            >
              {sessionId ? "Open network" : "Start"}
            </Link>
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
        <p>Confirmations stay in this browser. Live mapping calls The Swarm from the server.</p>
        <p className="flex gap-4">
          <Link href="/privacy" className="hover:text-chalk">
            Privacy
          </Link>
          <Link href="/setup" className="hover:text-chalk">
            Setup
          </Link>
        </p>
      </div>
    </footer>
  );
}
