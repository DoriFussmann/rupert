"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavigationHeader from './components/NavigationHeader';

interface AdvisorRecord {
  id: string;
  data?: {
    name?: string;
    role?: string;
    image?: string;
    assignedPages?: string[]; // Array of Tools & Pages IDs
    [key: string]: unknown;
  };
}

interface ToolsPageRecord {
  id: string;
  data?: {
    name?: string;
    description?: string;
    [key: string]: unknown;
  };
}

export default function Home() {
  useEffect(() => {
    // Create a style element to forcefully hide the layout header
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
  
  // Tools & Pages data
  const [toolsPages, setToolsPages] = useState<ToolsPageRecord[]>([]);

  // Helper function to get assigned tools & pages for an advisor
  const getAssignedToolsPages = (advisor: AdvisorRecord): ToolsPageRecord[] => {
    console.log('Getting assigned tools for advisor:', advisor.data?.name, 'assignedPages:', advisor.data?.assignedPages);
    
    if (!advisor.data?.assignedPages || !Array.isArray(advisor.data.assignedPages)) {
      console.log('No assigned pages found or not an array');
      return [];
    }
    
    const assigned = toolsPages.filter(tool => 
      advisor.data?.assignedPages?.includes(tool.id)
    );
    
    console.log('Filtered assigned tools:', assigned);
    return assigned;
  };

  // Helper function to convert page name to URL slug
  const getPageSlug = (pageName: string) => {
    return pageName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  // Helper function to get the first assigned page URL for an advisor
  const getAdvisorPageUrl = (advisor: AdvisorRecord): string | null => {
    const assignedPages = getAssignedToolsPages(advisor);
    if (assignedPages.length > 0) {
      const pageName = assignedPages[0].data?.name;
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
          // Filter advisors that have both name and image
          const validAdvisors = records.filter(advisor => 
            advisor.data?.name && 
            advisor.data?.image && 
            advisor.data.name.trim() !== '' &&
            advisor.data.image.trim() !== ''
          );
          // Prioritize Rupert first, Jade second (case-insensitive name contains)
          const score = (name: string): number => {
            const n = name.toLowerCase();
            if (n.includes('rupert')) return 2;
            if (n.includes('jade')) return 1;
            return 0;
          };
          const prioritized = validAdvisors.slice().sort((a, b) => {
            const aScore = score(String(a.data?.name || ''));
            const bScore = score(String(b.data?.name || ''));
            return bScore - aScore;
          });
          setAdvisors(prioritized);
        }

        // Load tools & pages
        const toolsResponse = await fetch('/api/collections/tools-pages/records');
        if (toolsResponse.ok) {
          const toolsData: ToolsPageRecord[] = await toolsResponse.json();
          console.log('Tools & Pages data:', toolsData);
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
            <h2 
              className="text-3xl font-light text-gray-900 mb-12 text-center"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' }}
            >
              Meet The Team
            </h2>
            
            <div className="space-y-8">
              {advisors.map((advisor, index) => {
                const advisorPageUrl = getAdvisorPageUrl(advisor);
                const AdvisorWrapper = advisorPageUrl ? Link : 'div';
                const wrapperProps = advisorPageUrl ? { href: advisorPageUrl } : {};
                
                return (
                  <AdvisorWrapper key={advisor.id} {...wrapperProps} className={advisorPageUrl ? "block hover:opacity-90 transition-opacity" : "block"}>
                    <div className="overflow-hidden">
                      {/* 5-Box Grid Layout with Separation */}
                      <div className="grid grid-cols-5 gap-4">
                    {/* Left Box: Advisor Image */}
                    <div className="col-span-1">
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
                    
                    {/* Right 4 Boxes: Tools & Pages */}
                    <div className="col-span-4 grid grid-cols-4 gap-4">
                      {getAssignedToolsPages(advisor).length > 0 ? (
                        getAssignedToolsPages(advisor).slice(0, 4).map((tool, toolIndex) => (
                          <div 
                            key={tool.id} 
                            className="h-44 md:h-64 p-4 rounded-sm border border-gray-300 transition-all hover:shadow-md relative"
                          >
                            <div className="relative h-full">
                              <div 
                                className="text-xl text-gray-800 absolute top-8 left-3"
                                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'normal' }}
                              >
                                {tool.data?.name || 'Unnamed Tool'}
                              </div>
                              <div className="absolute bottom-1 left-1 right-1 h-16 bg-gray-100 border border-gray-300 rounded-sm"></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Show empty boxes if no tools assigned
                        Array.from({ length: 4 }).map((_, toolIndex) => (
                          <div 
                            key={toolIndex}
                            className="h-44 md:h-64 p-4 rounded-sm border border-gray-300 relative"
                          >
                            <div className="relative h-full">
                              <span 
                                className="text-xl text-gray-500 italic absolute top-8 left-3"
                                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'normal' }}
                              >
                                No tool assigned
                              </span>
                              <div className="absolute bottom-1 left-1 right-1 h-16 bg-gray-100 border border-gray-300 rounded-sm"></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                    </div>
                  </AdvisorWrapper>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
