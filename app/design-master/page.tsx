"use client";
import { useEffect } from "react";
import NavigationHeader from "../components/NavigationHeader";

export default function DesignMaster() {
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

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className="flex gap-4">
          {/* Left Panel - 25% width, aligned with page name ribbon */}
          <div className="w-1/4">
            <div className="bg-white rounded-md border border-gray-200 p-4">
              <h2 className="text-base font-normal text-gray-900 mb-4">Inputs Panel</h2>
              
              {/* Dropdown Menu - identical to header Menu button */}
              <div className="relative group">
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                  <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Select Option</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      Option 1
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      Option 2
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      Option 3
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - 75% width, Outputs Panel */}
          <div className="flex-1">
            <div className="bg-white rounded-md border border-gray-200 p-4">
              <h2 className="text-base font-normal text-gray-900 mb-4">Outputs Panel</h2>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}