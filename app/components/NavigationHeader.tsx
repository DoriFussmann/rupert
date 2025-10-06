"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface PageRecord {
  id: string;
  data?: {
    name?: string;
    [key: string]: unknown;
  };
}

export default function NavigationHeader() {
  const pathname = usePathname();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);

  // Load pages from Pages collection
  useEffect(() => {
    async function loadPages() {
      try {
        const response = await fetch('/api/collections/pages/records');
        if (response.ok) {
          const records: PageRecord[] = await response.json();
          setPages(records);
        }
      } catch (error) {
        console.error('Error loading pages:', error);
      }
    }
    loadPages();
  }, []);

  // Load user info
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
    loadUser();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Function to convert page name to URL slug
  const getPageSlug = (pageName: string) => {
    return pageName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  // Function to get page emoji based on name
  const getPageEmoji = (pageName: string) => {
    const name = pageName.toLowerCase();
    if (name.includes('home')) return '🏠';
    if (name.includes('design')) return '🎨';
    if (name.includes('data')) return '🗺️';
    if (name.includes('model')) return '💰';
    if (name.includes('financial') || name.includes('finance')) return '💰';
    if (name.includes('admin')) return '⚙️';
    if (name.includes('login')) return '🔐';
    if (name.includes('taxonomy') || name.includes('business')) return '🏢';
    if (name.includes('strategy') || name.includes('planner')) return '🎯';
    return '📄'; // Default emoji for other pages
  };

  // Function to get page display name from pathname
  const getPageDisplayName = (path: string) => {
    // First check if it's a known static page
    switch (path) {
      case '/admin':
        return 'Admin';
      case '/login':
        return 'Login';
      case '/':
        return 'Home';
    }
    
    // For dynamic pages, try to find the page name from the Pages collection
    const slug = path.replace('/', '');
    const matchingPage = pages.find(page => {
      const pageName = String(page.data?.name || '');
      return getPageSlug(pageName) === slug;
    });
    
    if (matchingPage) {
      return String(matchingPage.data?.name || '');
    }
    
    // Fallback: Convert path like /some-page to "Some Page"
    return path
      .replace('/', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Home';
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
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {/* Always show Home first */}
                  <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    🏠 Home
                  </Link>
                  
                  {/* Dynamic pages from Pages collection */}
                  {pages
                    .filter(page => {
                      const name = String(page.data?.name || '').toLowerCase();
                      return name !== 'home' && name !== 'admin' && name !== 'login';
                    })
                    .sort((a, b) => String(a.data?.name || '').localeCompare(String(b.data?.name || '')))
                    .map(page => {
                      const pageName = String(page.data?.name || '');
                      const slug = getPageSlug(pageName);
                      const emoji = getPageEmoji(pageName);
                      
                      return (
                        <Link 
                          key={page.id}
                          href={`/${slug}`} 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          {emoji} {pageName}
                        </Link>
                      );
                    })}
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  {/* Always show Admin and Login at bottom */}
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
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      Signed in as <span className="font-medium text-gray-700">{user.name || user.email}</span>
                    </div>
                    <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      Admin
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    Sign Up / Log In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
