import { liveKeyConfigured } from "@/lib/providers";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    demo: true,
    liveAvailable: liveKeyConfigured(),
  });
}
