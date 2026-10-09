import { pollSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await pollSession(id);
  if (!session) return Response.json({ error: "That mapping session is gone. Start again." }, { status: 404 });
  return Response.json(session);
}
