import { Suspense } from "react";
import { SetupForm } from "@/components/SetupForm";

export default function SetupPage() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mist">Loading setup…</p>}>
      <SetupForm />
    </Suspense>
  );
}
