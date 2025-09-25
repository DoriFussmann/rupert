export function methodNotAllowed() {
  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
}
export async function parseJSON(req: Request) {
  try { return await req.json(); } catch { return {}; }
}
