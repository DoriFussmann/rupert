import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Zero-to-Production", description: "Admin CMS baseline" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-50 backdrop-blur border-b border-slate-200 bg-white/85">
          <div className="mx-auto max-w-[1120px] px-6 py-3 flex items-center justify-between">
            <Link href="/" className="brand">Z2P</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/">Home</Link>
              <Link href="/admin">Admin</Link>
              <form action="/api/auth/logout" method="post">
                <button className="hover:underline" type="submit">Logout</button>
              </form>
              <Link href="/login">Login</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[1120px] px-6 py-6 border-2 border-red-500">
          {children}
        </main>
      </body>
    </html>
  );
}
