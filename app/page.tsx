export default function Home() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-normal">Rupert</h1>
      <p className="text-slate-600">Strategy & FP&A platform with dynamic collections and admin dashboard.</p>
      <ul className="list-disc ml-5 text-slate-700">
        <li>Try <code>/admin</code> (protected)</li>
        <li>Log in at <code>/login</code></li>
        <li>APIs under <code>/api/collections</code></li>
      </ul>
    </div>
  );
}
