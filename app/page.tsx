export default function Home() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl">Zero-to-Production</h1>
      <p className="text-slate-600">Clean baseline with sticky header and 1120px container.</p>
      <ul className="list-disc ml-5 text-slate-700">
        <li>Try <code>/admin</code> (protected)</li>
        <li>Log in at <code>/login</code></li>
        <li>APIs under <code>/api/collections</code></li>
      </ul>
    </div>
  );
}
