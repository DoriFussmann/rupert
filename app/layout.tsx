import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "Zero-to-Production", description: "Admin CMS baseline" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <header className="sticky top-0 z-50 backdrop-blur border-b border-slate-200 bg-white/85">
          <div className="nb-container py-3 flex items-center justify-between">
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
        <main className="nb-container py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
