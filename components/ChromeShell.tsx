"use client";

import { Footer, Header } from "@/components/Chrome";
import { FoldModal } from "@/components/FoldModal";
import { WorkplaceProvider } from "@/lib/workplace-context";

export function ChromeShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkplaceProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <FoldModal />
    </WorkplaceProvider>
  );
}
