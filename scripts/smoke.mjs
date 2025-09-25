/**
 * Usage:
 *   node scripts/smoke.mjs https://your-app.vercel.app
 *   (or omit URL to default to http://localhost:3000)
 */
const base = process.argv[2] || "http://localhost:3000";

async function get(path, opts) {
  const res = await fetch(base + path, { ...opts, redirect: "manual" });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text.slice(0, 200); }
  return { status: res.status, location: res.headers.get("location"), json };
}

(async () => {
  console.log("🔎 Smoke test @", base);

  const health = await get("/api/health");
  console.log("health:", health.status, health.json?.ok ? "ok" : health.json);

  const self = await get("/api/selftest");
  console.log("selftest:", self.status, self.json?.ok ? "ok" : self.json);

  const colGET = await get("/api/collections");
  console.log("collections GET:", colGET.status);

  const adminGET = await get("/admin");
  console.log("admin GET (logged-out):", adminGET.status, adminGET.location || "");

  const recPOST = await get("/api/collections/advisors/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { name: "Smoke", role: "Test", oneliner: "Ping" } }),
  });
  console.log("records POST (logged-out):", recPOST.status);

  console.log("✅ Smoke complete");
})().catch((e) => { console.error(e); process.exit(1); });
