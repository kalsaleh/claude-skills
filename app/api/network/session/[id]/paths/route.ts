import { searchSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let body: { query?: unknown };
  try {
    body = (await request.json()) as { query?: unknown };
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (query.length < 2 || query.length > 120) {
    return Response.json({ error: "Type a person or company name." }, { status: 400 });
  }
  const result = searchSession(id, query);
  if (!result) {
    return Response.json({ error: "That mapping session is gone. Start again." }, { status: 404 });
  }
  return Response.json(result);
}
