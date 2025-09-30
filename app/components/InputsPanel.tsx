"use client";
import { useEffect, useRef, useState } from "react";

interface InputsPanelProps {
  outputsExpanded: boolean;
  isBlinking?: boolean;
  advisorImageUrl?: string | null;
  advisorName?: string;
  onSimulate?: () => Promise<void>;
  isSimulating?: boolean;
  onOpenPayloadModal?: () => void;
}

export default function InputsPanel({ 
  outputsExpanded, 
  isBlinking = false,
  advisorImageUrl = null,
  advisorName = 'Advisor',
  onSimulate,
  isSimulating = false,
  onOpenPayloadModal
}: InputsPanelProps) {
  const [inputsCollapsed, setInputsCollapsed] = useState(false);


  return (
    <div
      className="relative"
      style={{ width: outputsExpanded ? "0%" : "25%", transition: "width 200ms ease", pointerEvents: outputsExpanded ? "none" : "auto" }}
    >
      <div className={`bg-white rounded-md border border-gray-200 ${outputsExpanded ? "opacity-0" : "opacity-100"} transition-opacity duration-200 ${isBlinking ? "nb-anim-inputs-panel-blink" : ""}`}>
        <button
          type="button"
          aria-label="Toggle Inputs visibility"
          aria-expanded={!inputsCollapsed}
          onClick={() => setInputsCollapsed((v) => !v)}
          className="w-full bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200 flex items-center gap-2 text-left hover:bg-gray-200 transition-colors min-h-[52px]"
        >
          <svg
            className={`w-4 h-4 transform transition-transform ${inputsCollapsed ? "" : "rotate-90"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-sm font-medium text-gray-900">Inputs Panel</h2>
        </button>
        {!inputsCollapsed && (
        <div className="p-4">
          {/* Image placeholder at top */}
          <div className="mb-4 w-full h-64 bg-gray-100 border border-gray-200 rounded-md shadow-inner flex items-center justify-center text-gray-400 overflow-hidden">
            {advisorImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={advisorImageUrl} 
                alt="Advisor" 
                className="w-full h-full object-cover" 
                style={{ objectPosition: 'center 5%' }}
              />
            ) : (
              <span>Image Placeholder</span>
            )}
          </div>

          {/* Dropdown Menu - identical to header Menu button */}
          <div className="relative group mt-3">
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
              <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Select Option</span>
            </button>
            
          {/* Dropdown Menu */}
          <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
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

          {/* Full Payload Upload Button */}
          {onOpenPayloadModal && (
            <button
              type="button"
              onClick={onOpenPayloadModal}
              className="w-full mt-2 px-3 py-1.5 text-sm rounded-md transition-colors border text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-300"
            >
              Full Payload Upload
            </button>
          )}

        </div>
        )}
      </div>
    </div>
  );
}
