import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "Zero-to-Production", description: "Admin CMS baseline" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-slate-200 bg-white/90 shadow-sm">
          <div className="mx-auto max-w-[1120px] px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-normal">Z2P</Link>
            <nav className="flex items-center gap-6 text-sm font-normal">
              <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
              <Link href="/admin" className="hover:text-slate-600 transition-colors">Admin</Link>
              <form action="/api/auth/logout" method="post" className="inline">
                <button className="hover:text-slate-600 transition-colors" type="submit">Logout</button>
              </form>
              <Link href="/login" className="hover:text-slate-600 transition-colors">Login</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[1120px] px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
