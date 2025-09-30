"use client";
import { useEffect, useState } from 'react';
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
  const words: string[] = ["create", "build", "design", "prompt", "model"];
  const colorMap: Record<string, string> = {
    create: "text-blue-600",
    build: "text-green-600",
    design: "text-purple-600",
    prompt: "text-orange-600",
    model: "text-rose-600",
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
          setAdvisors(validAdvisors);
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
        <div className="pt-24 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-10 gap-8 items-center">
            {/* Left: Headline with typewriter */}
            <div className="pl-0 ml-0 md:col-span-7">
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
            <div className="md:col-span-3 flex items-center justify-end">
              <div className="w-full h-64 md:h-96 bg-gray-100 border border-gray-200 rounded-md shadow-inner overflow-hidden relative">
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
          <div className="max-w-7xl mx-auto px-4">
            <h2 
              className="text-3xl font-light text-gray-900 mb-12 text-center"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' }}
            >
              Meet Our Advisors & Their Tools
            </h2>
            
            <div className="space-y-8">
              {advisors.map((advisor, index) => (
                <div key={advisor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Left: Advisor Image and Info */}
                    <div className="md:w-80 flex-shrink-0">
                      <div className="h-64 md:h-full bg-gray-100 relative">
                        <img
                          src={(() => {
                            const imageUrl = advisor.data?.image || '';
                            return imageUrl.startsWith('http') || imageUrl.startsWith('/') 
                              ? imageUrl 
                              : `/uploads/${imageUrl}`;
                          })()}
                          alt={advisor.data?.name || 'Advisor'}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center 20%' }}
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
                    
                    {/* Right: Tools & Pages Grid */}
                    <div className="flex-1 p-6">
                      <h3 
                        className="text-lg font-medium text-gray-900 mb-4"
                        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        Tools & Pages
                      </h3>
                      
                      {/* Tools & Pages Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {getAssignedToolsPages(advisor).length > 0 ? (
                          getAssignedToolsPages(advisor).map((tool, toolIndex) => (
                            <div 
                              key={tool.id} 
                              className={`rounded-lg px-4 py-3 border transition-all hover:shadow-sm ${
                                toolIndex % 4 === 0 ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                                toolIndex % 4 === 1 ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                                toolIndex % 4 === 2 ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' :
                                'bg-orange-50 border-orange-200 hover:bg-orange-100'
                              }`}
                            >
                              <span 
                                className={`text-sm font-medium ${
                                  toolIndex % 4 === 0 ? 'text-blue-800' :
                                  toolIndex % 4 === 1 ? 'text-green-800' :
                                  toolIndex % 4 === 2 ? 'text-purple-800' :
                                  'text-orange-800'
                                }`}
                                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                              >
                                {tool.data?.name || 'Unnamed Tool'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-8 text-center">
                            <span 
                              className="text-sm text-gray-500 italic"
                              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                            >
                              No tools assigned yet
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
