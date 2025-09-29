export async function POST(req: Request) {
  // Optional payload
  let payload: any = null;
  try {
    const text = await req.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    // ignore bad JSON; keep payload null
  }

  const startedAt = Date.now();
  await new Promise(resolve => setTimeout(resolve, 7000));
  const finishedAt = Date.now();

  return new Response(
    JSON.stringify({ ok: true, startedAt, finishedAt, elapsedMs: finishedAt - startedAt, payload }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function GET() {
  // Simple health check
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}


