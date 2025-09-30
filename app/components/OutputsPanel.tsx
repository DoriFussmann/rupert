"use client";
import { useEffect, useRef, useState } from "react";

interface OutputsPanelProps {
  outputsExpanded: boolean;
  onToggleExpanded: () => void;
  isBlinking?: boolean;
  howItWorksTexts?: string[];
  onTriggerSuccessSequence?: () => void;
  isSimulating?: boolean;
  simulateResult?: { ok: boolean; elapsedMs: number; startedAt: number; finishedAt: number } | null;
  loadingMessages?: string[];
  onTriggerInputsPanelBlink?: () => void;
  onTriggerOutputsPanelBlink?: () => void;
}

export default function OutputsPanel({ 
  outputsExpanded, 
  onToggleExpanded,
  isBlinking = false,
  howItWorksTexts = [],
  onTriggerSuccessSequence,
  isSimulating = false,
  simulateResult = null,
  loadingMessages = [
    "Analyzing semantic intent…",
    "Calibrating vector embeddings…",
    "Mapping entities and relationships…",
    "Synthesizing optimal strategy…",
    "Validating constraints and edge cases…",
  ],
  onTriggerInputsPanelBlink,
  onTriggerOutputsPanelBlink
}: OutputsPanelProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [howItWorksStep, setHowItWorksStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ribbonHidden, setRibbonHidden] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [visibleActionCount, setVisibleActionCount] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actionsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingMsgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dropdown options for each action
  const dropdownOptions = {
    add: [
      { label: 'Add to Projects', action: () => console.log('Add to Projects') },
      { separator: true },
      { label: 'Random', action: () => console.log('Add to Random') },
      { label: 'Project Alpha', action: () => console.log('Add to Project Alpha') },
      { label: 'Project Beta', action: () => console.log('Add to Project Beta') },
    ],
    save: [
      { label: 'To PC', action: () => console.log('Save to PC') },
      { label: 'To Projects', action: () => console.log('Save to Projects') },
      { label: 'To CSV', action: () => console.log('Save to CSV') },
      { label: 'To PDF', action: () => console.log('Save to PDF') },
    ],
    copy: [
      { label: 'To Clipboard', action: () => console.log('Copy to Clipboard') },
      { label: 'As Rich Text', action: () => console.log('Copy as Rich Text') },
      { label: 'As Plain Text', action: () => console.log('Copy as Plain Text') },
    ],
    code: [
      { label: 'Copy Raw Code', action: () => console.log('Copy Raw Code') },
      { label: 'Copy JSON', action: () => console.log('Copy JSON') },
      { label: 'Copy XML', action: () => console.log('Copy XML') },
    ],
    share: [
      { label: 'To Team', action: () => console.log('Send to Team') },
      { label: 'To WhatsApp', action: () => console.log('Send to WhatsApp') },
      { label: 'To Email', action: () => console.log('Send to Email') },
      { label: 'To Slack', action: () => console.log('Send to Slack') },
      { label: 'Generate Link', action: () => console.log('Generate Link') },
    ],
    download: [
      { label: 'Download PDF', action: () => console.log('Download PDF') },
      { label: 'Download Word', action: () => console.log('Download Word') },
      { label: 'Download Excel', action: () => console.log('Download Excel') },
      { label: 'Download ZIP', action: () => console.log('Download ZIP') },
    ],
  };

  const actionItems: Array<{ key: string; title: string; svg: JSX.Element }> = [
    {
      key: 'add',
      title: 'Add to Projects',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      key: 'save',
      title: 'Save',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l-4-4-4 4m8-8H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      key: 'copy',
      title: 'Copy',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16h8a2 2 0 002-2v-4M8 16v2a2 2 0 002 2h4" />
        </svg>
      ),
    },
    {
      key: 'code',
      title: 'Copy Raw',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6L2 12l6 6" />
        </svg>
      ),
    },
    {
      key: 'share',
      title: 'Send / Share',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4m4-4v14" />
        </svg>
      ),
    },
    {
      key: 'download',
      title: 'Download',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
      ),
    },
  ];

  // Staggered show of action icons
  useEffect(() => {
    if (showActions) {
      setVisibleActionCount(0);
      if (actionsIntervalRef.current) clearInterval(actionsIntervalRef.current);
      actionsIntervalRef.current = setInterval(() => {
        setVisibleActionCount((c) => {
          if (c >= actionItems.length) {
            if (actionsIntervalRef.current) clearInterval(actionsIntervalRef.current);
            return c;
          }
          return c + 1;
        });
      }, 500);
    }
    return () => { if (actionsIntervalRef.current) clearInterval(actionsIntervalRef.current); };
  }, [showActions]);

  // Rotate loading messages every 2.5s while simulating
  useEffect(() => {
    if (isSimulating) {
      setLoadingMessageIndex(0);
      if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current);
      loadingMsgIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((i) => (i + 1) % loadingMessages.length);
      }, 2500);
    } else {
      if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current);
    }
    return () => { if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current); };
  }, [isSimulating, loadingMessages]);

  // Cleanup any running typing interval on unmount
  useEffect(() => {
    return () => { if (typingIntervalRef.current) clearInterval(typingIntervalRef.current); };
  }, []);


  function startTyping(text: string) {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setIsTyping(true);
    setTypedText("");
    let index = 0;
    typingIntervalRef.current = setInterval(() => {
      index += 1;
      setTypedText(text.slice(0, index));
      if (index >= text.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setIsTyping(false);
      }
    }, 15);
  }

  function handleShowHowItWorks() {
    if (!howItWorksTexts.length) return;
    setShowHowItWorks(true);
    setHowItWorksStep(0);
    startTyping(howItWorksTexts[0]);
  }

  function handleNextHowItWorks() {
    if (howItWorksStep + 1 < howItWorksTexts.length) {
      const next = howItWorksStep + 1;
      setHowItWorksStep(next);
      
      // Trigger blink effect when moving to second step (step 1, 0-indexed)
      if (next === 1 && onTriggerInputsPanelBlink) {
        onTriggerInputsPanelBlink();
      }
      
      // Trigger blink effect when moving to third step (step 2, 0-indexed)
      if (next === 2 && onTriggerOutputsPanelBlink) {
        onTriggerOutputsPanelBlink();
      }
      
      startTyping(howItWorksTexts[next]);
    }
  }

  function handleCloseHowItWorks() {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setIsTyping(false);
    setShowHowItWorks(false);
    setTypedText("");
    setHowItWorksStep(0);
  }

  function triggerSuccessSequence() {
    setRibbonHidden(true);
    setTimeout(() => {
      setShowActions(true);
    }, 250);
    if (onTriggerSuccessSequence) {
      onTriggerSuccessSequence();
    }
  }

  return (
    <div
      className="overflow-hidden"
      style={{ width: outputsExpanded ? "100%" : "calc(75% - 0.5rem)", transition: "width 200ms ease" }}
    >
      <div className={`bg-white rounded-md border border-gray-200 transition-colors relative ${isBlinking ? "nb-anim-outputs-panel-blink" : ""}`}>
        <div 
          className="bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors min-h-[52px] flex items-center"
          onClick={onToggleExpanded}
          role="button"
          tabIndex={0}
          aria-label="Toggle Outputs width"
          aria-expanded={outputsExpanded}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpanded();
            }
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 transform transition-transform ${outputsExpanded ? "" : "rotate-180"} ${outputsExpanded ? "ml-0" : "-ml-1"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h2 className="text-sm font-medium text-gray-900">Outputs Panel</h2>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShowHowItWorks();
              }}
              className={`bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-normal text-xs hover:bg-blue-200 transition-all ${ribbonHidden ? 'opacity-0 scale-95' : 'opacity-100'} duration-200`}
              aria-label="Show How it Works"
            >
              How it Works?
            </button>
          </div>
        </div>
        {(showHowItWorks || isSimulating || simulateResult) && (
          <div className="p-4">
            {showHowItWorks && (
              <div>
                <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed min-h-24">
                  {typedText}
                  {isTyping && <span className="inline-block w-2 h-4 bg-gray-400 ml-1 align-baseline animate-pulse" />}
                </div>
              </div>
            )}

            {/* Simulation states */}
            {isSimulating && (
              <div className="my-3 flex justify-center">
                <div className="w-1/2">
                  <div className="border border-gray-200 bg-gray-50 rounded-md h-9 px-4 flex items-center justify-center overflow-hidden">
                    <div key={loadingMessageIndex} className="text-sm text-gray-700 nb-anim-loading-line">
                      {loadingMessages[loadingMessageIndex]}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!isSimulating && simulateResult && (
              <div className="mt-3 text-sm text-gray-800">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  <span>Simulation complete in {Math.round(simulateResult.elapsedMs)} ms</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Started: {new Date(simulateResult.startedAt).toLocaleTimeString()} • Finished: {new Date(simulateResult.finishedAt).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        )}
        {showHowItWorks && (
          <div className="absolute right-3 bottom-3">
            {howItWorksStep + 1 >= howItWorksTexts.length ? (
              <button
                type="button"
                onClick={handleCloseHowItWorks}
                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 border border-blue-300"
              >
                Close
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextHowItWorks}
                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 border border-blue-300"
              >
                {howItWorksStep + 1} / {howItWorksTexts.length} Next
              </button>
            )}
          </div>
        )}
        {/* Action icons top-right */}
        {showActions && (
          <div className="absolute top-2 right-2 flex flex-row-reverse items-center gap-2">
            {actionItems.slice(0, visibleActionCount).map((a, idx) => (
              <div key={a.key} className="relative group">
                <button
                  title={a.title}
                  className="bg-blue-100 text-blue-800 border border-blue-300 rounded-md p-1 shadow-sm hover:bg-blue-200 transition-all nb-anim-fade-slide-in"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {a.svg}
                </button>
                
                {/* Hover Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                  <div className="py-2">
                    {dropdownOptions[a.key as keyof typeof dropdownOptions]?.map((option, optIdx) => (
                      option.separator ? (
                        <hr key={`sep-${optIdx}`} className="my-1 border-gray-200" />
                      ) : (
                        <button
                          key={`opt-${optIdx}`}
                          onClick={option.action}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          {option.label}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
