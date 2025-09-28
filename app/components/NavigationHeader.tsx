"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationHeader() {
  const pathname = usePathname();

  // Function to get page display name from pathname
  const getPageDisplayName = (path: string) => {
    switch (path) {
      case '/data-mapper':
        return 'Data Mapper';
      case '/design-master':
        return 'Design Master';
      case '/admin':
        return 'Admin';
      case '/login':
        return 'Login';
      case '/':
        return 'Home';
      default:
        // Convert path like /some-page to "Some Page"
        return path
          .replace('/', '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') || 'Home';
    }
  };

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur border-b border-slate-200 bg-white/85"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}
    >
      <div className="nb-container py-3 flex items-center justify-between">
        <Link href="/" className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-md font-normal text-sm hover:bg-blue-200 transition-colors cursor-pointer">
          {getPageDisplayName(pathname)}
        </Link>
        
        {/* Empty Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
        </nav>

        {/* Right Side Dropdowns */}
        <div className="flex items-center gap-4">
          {/* Pages Dropdown - Only show on Home page */}
          {pathname === '/' && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Pages</span>
              </button>
              
              {/* Pages Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    🏠 Home
                  </Link>
                  <Link href="/design-master" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    🎨 Design Master
                  </Link>
                  <Link href="/data-mapper" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    🗺️ Data Mapper
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    ⚙️ Admin Dashboard
                  </Link>
                  <Link href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    🔐 Login
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Menu Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
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
      </div>
    </header>
  );
}
