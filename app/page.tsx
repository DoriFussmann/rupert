"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavigationHeader from './components/NavigationHeader';

// Add keyframe animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}

interface AdvisorRecord {
  id: string;
  data?: {
    name?: string;
    role?: string;
    image?: string;
    [key: string]: unknown;
  };
}

interface ToolsPageRecord {
  id: string;
  data?: {
    name?: string;
    description?: string;
    active?: boolean;
    mainAdvisorId?: string;
    [key: string]: unknown;
  };
}

export default function Home() {
  useEffect(() => {
    // Create a style element to forcefully hide the layout header and scrollbar
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-layout-header';
    styleElement.textContent = `
      body > header {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      html, body {
        overflow: auto !important;
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      // Remove the style element when leaving the page
      const styleElement = document.getElementById('hide-layout-header');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Typewriter state
  const words: string[] = ["create?", "build?", "design?", "prompt?", "model?"];
  const colorMap: Record<string, string> = {
    "create?": "text-blue-600",
    "build?": "text-green-600",
    "design?": "text-purple-600",
    "prompt?": "text-orange-600",
    "model?": "text-rose-600",
  };
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  
  // Advisor cycling state
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>([]);
  const [currentAdvisorIndex, setCurrentAdvisorIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextAdvisorIndex, setNextAdvisorIndex] = useState(0);
  
  // Pages data
  const [toolsPages, setToolsPages] = useState<ToolsPageRecord[]>([]);
  
  // Track which advisors are expanded (show all pages)
  const [expandedAdvisors, setExpandedAdvisors] = useState<Record<string, boolean>>({});

  // Helper function to get pages where advisor is Main Advisor
  const getPagesAsMainAdvisor = (advisor: AdvisorRecord): ToolsPageRecord[] => {
    console.log('Getting pages where advisor is Main Advisor:', advisor.data?.name);
    
    const pages = toolsPages.filter(tool => 
      tool.data?.mainAdvisorId === advisor.id
    );
    
    console.log('Filtered pages as Main Advisor:', pages);
    return pages;
  };

  // Helper function to convert page name to URL slug
  const getPageSlug = (pageName: string) => {
    return pageName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  // Helper function to get the first page URL for an advisor where they are Main Advisor
  const getAdvisorPageUrl = (advisor: AdvisorRecord): string | null => {
    const pages = getPagesAsMainAdvisor(advisor);
    if (pages.length > 0) {
      const pageName = pages[0].data?.name;
      if (pageName) {
        return `/${getPageSlug(String(pageName))}`;
      }
    }
    return null;
  };

  useEffect(() => {
    const currentWord = words[wordIndex];

    // Adjust speed
    let delay = isDeleting ? 60 : 100;

    // Hold when fully typed
    if (!isDeleting && charIndex === currentWord.length) {
      const hold = setTimeout(() => setIsDeleting(true), 900);
      return () => clearTimeout(hold);
    }

    // Move to next word after deleting
    if (isDeleting && charIndex === 0) {
      const pause = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((idx) => (idx + 1) % words.length);
      }, 400);
      return () => clearTimeout(pause);
    }

    const timer = setTimeout(() => {
      const nextIndex = isDeleting ? charIndex - 1 : charIndex + 1;
      setCharIndex(nextIndex);
      setDisplayedText(currentWord.slice(0, nextIndex));
    }, delay);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, wordIndex]);

  // Load advisors and tools & pages from API
  useEffect(() => {
    async function loadData() {
      try {
        // Load advisors
        const advisorsResponse = await fetch('/api/collections/advisors/records');
        if (advisorsResponse.ok) {
          const records: AdvisorRecord[] = await advisorsResponse.json();
          // Prioritize Rupert first, Jade second (case-insensitive name contains)
          const score = (name: string): number => {
            const n = name.toLowerCase();
            if (n.includes('rupert')) return 2;
            if (n.includes('jade')) return 1;
            return 0;
          };
          const prioritized = records.slice().sort((a, b) => {
            const aScore = score(String(a.data?.name || ''));
            const bScore = score(String(b.data?.name || ''));
            return bScore - aScore;
          });
          setAdvisors(prioritized);
        }

        // Load tools & pages
        const toolsResponse = await fetch('/api/collections/pages/records');
        if (toolsResponse.ok) {
          const toolsData: ToolsPageRecord[] = await toolsResponse.json();
          console.log('Pages data:', toolsData);
          setToolsPages(toolsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  // Cycle through advisors every 3 seconds with complete fade-out/fade-in
  useEffect(() => {
    if (advisors.length <= 1) return; // Don't cycle if only one or no advisors
    
    const interval = setInterval(() => {
      // Phase 1: Start fade out (leaving effect)
      setIsTransitioning(true);
      
      // Phase 2: After fade out completes, change to next advisor
      setTimeout(() => {
        const nextIndex = (currentAdvisorIndex + 1) % advisors.length;
        setNextAdvisorIndex(nextIndex);
        setCurrentAdvisorIndex(nextIndex);
      }, 400); // Wait for fade-out to complete
      
      // Phase 3: Start fade in (appearing effect)
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Brief pause before fade-in starts
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [advisors.length, currentAdvisorIndex]);

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className="pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
            {/* Left: Headline with typewriter */}
            <div className="pl-0 ml-0 md:col-span-3">
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-extralight text-gray-900 leading-tight"
                style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' }}
              >
                What would you like the power to{' '}
                <span className={`${colorMap[words[wordIndex]]} transition-colors duration-200`}>
                  {displayedText}
                </span>
                <span className="ml-1 align-middle inline-block w-[2px] h-[1.1em] bg-gray-900 opacity-75 animate-pulse" />
              </h1>
            </div>

            {/* Right: Advisor images */}
            <div className="md:col-span-1 flex items-center justify-end">
              <div className="w-full h-52 md:h-80 bg-gray-100 border border-gray-200 rounded-sm shadow-inner overflow-hidden relative">
                {advisors.length > 0 ? (
                  <>
                {/* Advisor Image with Complete Fade-Out/Fade-In Effect */}
                <div className="relative w-full h-full">
                  <img
                    key={`advisor-${currentAdvisorIndex}`}
                    src={(() => {
                      const imageUrl = advisors[currentAdvisorIndex]?.data?.image || '';
                      return imageUrl.startsWith('http') || imageUrl.startsWith('/') 
                        ? imageUrl 
                        : `/uploads/${imageUrl}`;
                    })()}
                    alt={advisors[currentAdvisorIndex]?.data?.name || 'Advisor'}
                    className={`absolute inset-0 w-full h-full object-cover transform transition-all duration-500 ease-in-out ${
                      isTransitioning 
                        ? 'opacity-0 scale-95 blur-sm' // Fade out: disappear, shrink slightly, add blur
                        : 'opacity-100 scale-100 blur-0' // Fade in: appear, normal size, sharp
                    }`}
                    style={{ objectPosition: 'center 20%' }}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                    
                    {/* Name and Role Overlay with Fade Effect */}
                    <div className={`absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-all duration-500 ${
                      isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                    }`}>
                      <div className="text-white">
                        <div 
                          className="font-medium text-lg leading-tight mb-1 transform transition-all duration-500"
                          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        >
                          {advisors[currentAdvisorIndex]?.data?.name || 'Advisor'}
                        </div>
                        <div 
                          className="text-sm opacity-90 transform transition-all duration-500 delay-75"
                          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        >
                          {advisors[currentAdvisorIndex]?.data?.role || 'Role'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Cycling Indicator Dots with Animation */}
                    {advisors.length > 1 && (
                      <div className={`absolute bottom-4 right-4 flex space-x-2 transition-all duration-300 ${
                        isTransitioning ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
                      }`}>
                        {advisors.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-500 transform ${
                              index === currentAdvisorIndex 
                                ? 'bg-white scale-125 shadow-lg shadow-white/30' 
                                : 'bg-white/50 scale-100 hover:bg-white/70'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Fallback placeholder
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-lg mb-2">👥</div>
                      <div className="text-sm">Loading Advisors...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advisor Grid Section */}
        <div className="py-16 bg-gray-50">
          <div className="w-full max-w-[1120px] mx-auto">
            <div className="space-y-8">
              {advisors.map((advisor, index) => {
                return (
                  <div key={advisor.id} className="block">
                    <div className="overflow-hidden">
                      {/* Advisor Name and Role Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 
                          className="text-lg font-normal text-gray-900"
                          style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' }}
                        >
                          {advisor.data?.name || 'Unknown Advisor'} - {advisor.data?.role || 'No role assigned'}
                        </h3>
                        {getPagesAsMainAdvisor(advisor).length > 4 && (
                          <button
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedAdvisors(prev => ({
                                ...prev,
                                [advisor.id]: !prev[advisor.id]
                              }));
                            }}
                          >
                            {expandedAdvisors[advisor.id] ? 'Show Less' : 'Show More'}
                          </button>
                        )}
                      </div>
                      
                      {/* Grid Layout - Advisor + Pages */}
                      <div className="grid grid-cols-5 gap-4 auto-rows-auto">
                        {/* Advisor Image - Row 1, Column 1 */}
                        <div className="col-span-1 row-span-1">
                          <div className="h-44 md:h-64 bg-gray-100 relative rounded-sm overflow-hidden shadow-sm border border-gray-200">
                            <img
                              src={(() => {
                                const imageUrl = advisor.data?.image || '';
                                return imageUrl.startsWith('http') || imageUrl.startsWith('/') 
                                  ? imageUrl 
                                  : `/uploads/${imageUrl}`;
                              })()}
                              alt={advisor.data?.name || 'Advisor'}
                              className="w-full h-full object-cover"
                              style={{ objectPosition: 'center 5%' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            
                            {/* Name and Role Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                              <div className="text-white">
                                <div 
                                  className="font-medium text-lg leading-tight mb-1"
                                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                                >
                                  {advisor.data?.name || 'Advisor'}
                                </div>
                                <div 
                                  className="text-sm opacity-90"
                                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                                >
                                  {advisor.data?.role || 'Role'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Pages - First 4 in Row 1 (columns 2-5), rest starting from Row 2 Column 1 */}
                        {getPagesAsMainAdvisor(advisor).length > 0 ? (
                          getPagesAsMainAdvisor(advisor).map((tool, toolIndex) => {
                            const isExpanded = expandedAdvisors[advisor.id];
                            const shouldHide = !isExpanded && toolIndex >= 4;
                            // First 4 pages don't need special positioning (auto-flow after advisor)
                            // Pages 5+ should start from column 1 of row 2
                            const gridColumnStart = toolIndex >= 4 ? ((toolIndex - 4) % 5) + 1 : undefined;
                            const pageName = tool.data?.name || '';
                            const pageUrl = `/${getPageSlug(pageName)}`;
                            
                            if (shouldHide) {
                              return null;
                            }
                            
                            return (
                              <Link
                                key={tool.id}
                                href={pageUrl}
                                className={`h-44 md:h-64 p-4 rounded-sm border border-gray-300 transition-all duration-500 ease-in-out hover:shadow-md hover:border-gray-400 relative cursor-pointer block ${
                                  toolIndex >= 4 ? 'animate-in fade-in slide-in-from-bottom-4' : ''
                                }`}
                                style={{
                                  gridColumnStart: gridColumnStart,
                                  animation: toolIndex >= 4 && isExpanded ? 'slideIn 0.5s ease-out' : undefined,
                                }}
                              >
                                <div className="relative h-full">
                                  <div 
                                    className="text-lg text-black absolute top-3 left-3 right-3"
                                    style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'normal', lineHeight: '1.4' }}
                                  >
                                    {tool.data?.name || 'Unnamed Tool'}
                                  </div>
                                  <div className="absolute top-16 left-3 right-3 h-px bg-gray-300"></div>
                                  <div 
                                    className="text-sm text-black absolute top-20 left-3 right-3 bottom-3 overflow-hidden"
                                    style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'normal' }}
                                  >
                                    {tool.data?.description || ''}
                                  </div>
                                  
                                  {/* Active/Not Active Ribbon */}
                                  <div className={`absolute bottom-0 right-0 px-3 py-1.5 text-xs font-medium ${
                                    tool.data?.active 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-gray-400 text-white'
                                  }`}
                                  style={{ 
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    borderTopLeftRadius: '0.25rem'
                                  }}>
                                    {tool.data?.active ? '✓ Active' : 'Not Active'}
                                  </div>
                                </div>
                              </Link>
                            );
                          })
                        ) : (
                          // Show single empty box if no pages assigned
                          <div className="h-44 md:h-64 p-4 rounded-sm border border-gray-300 relative col-span-1">
                            <div className="relative h-full">
                              <span 
                                className="text-lg text-gray-500 italic absolute top-3 left-3"
                                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'normal' }}
                              >
                                No pages assigned
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
