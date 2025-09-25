import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "Starter", description: "Admin CMS baseline" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <header className="sticky top-0 z-50 backdrop-blur border-b border-slate-200 bg-white/85">
          <div className="nb-container py-3 flex items-center justify-between">
            <Link href="/" className="brand">Z2P</Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/">Home</Link>
              <Link href="/admin">Admin</Link>
              <form action="/api/auth/logout" method="post">
                <button className="hover:underline" type="submit">Logout</button>
              </form>
              <Link href="/login">Login</Link>
            </nav>

            {/* Menu Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Menu</span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    Sign Up / Log In
                  </Link>
                  <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    Admin
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <form action="/api/auth/logout" method="post" className="block">
                    <button type="submit" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      Logout
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="nb-container py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
