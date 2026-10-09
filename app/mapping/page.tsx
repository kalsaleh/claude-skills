import { Suspense } from "react";
import { MappingProgress } from "@/components/MappingProgress";

export default function MappingPage() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mist">Loading mapping…</p>}>
      <MappingProgress />
    </Suspense>
  );
}
