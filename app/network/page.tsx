import { Suspense } from "react";
import { NetworkExperience } from "@/components/NetworkExperience";

export default function NetworkPage() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mist">Loading the network…</p>}>
      <NetworkExperience />
    </Suspense>
  );
}
