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
  chatMessages?: Array<{id: string, text: string, timestamp: Date, isUser: boolean}>;
  onSendPayloadToChat?: (payload: string) => void;
  onClearChat?: () => void;
  advisorName?: string;
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
  onTriggerOutputsPanelBlink,
  chatMessages = [],
  onSendPayloadToChat,
  onClearChat,
  advisorName = 'Advisor'
}: OutputsPanelProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [howItWorksStep, setHowItWorksStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ribbonHidden, setRibbonHidden] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [visibleActionCount, setVisibleActionCount] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Copy chat content for debugging
  const copyChatContent = async () => {
    try {
      const chatData = {
        advisorName,
        totalMessages: chatMessages.length,
        isTyping: isTypingResponse,
        timestamp: new Date().toISOString(),
        messages: chatMessages.map(msg => ({
          id: msg.id,
          text: msg.text,
          timestamp: msg.timestamp.toISOString(),
          isUser: msg.isUser,
          timeFormatted: msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })),
        sessionInfo: {
          chatInput,
          isChatCollapsed,
          outputsExpanded
        }
      };
      
      const debugText = `=== CHAT DEBUG INFO ===
Advisor: ${advisorName}
Total Messages: ${chatMessages.length}
Currently Typing: ${isTypingResponse}
Generated: ${new Date().toISOString()}

=== MESSAGES ===
${chatMessages.map((msg, index) => 
  `${index + 1}. [${msg.isUser ? 'USER' : 'ADVISOR'}] ${msg.timestamp.toLocaleTimeString()}
   ${msg.text}`
).join('\n\n')}

=== SESSION STATE ===
Chat Input: "${chatInput}"
Chat Collapsed: ${isChatCollapsed}
Outputs Expanded: ${outputsExpanded}

=== RAW JSON ===
${JSON.stringify(chatData, null, 2)}`;

      await navigator.clipboard.writeText(debugText);
      console.log('Chat debug info copied to clipboard');
    } catch (err) {
      console.error('Failed to copy chat content:', err);
    }
  };
  
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);


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

  // Handle chat message sending
  async function handleSendMessage() {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      timestamp: new Date(),
      isUser: true
    };
    
    // Add user message to chat
    if (onSendPayloadToChat) {
      onSendPayloadToChat(chatInput.trim());
    }
    
    setChatInput('');
    setIsTypingResponse(true);
    
    try {
      // Send to OpenAI with the specified format
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: chatInput.trim(),
          chatHistory: chatMessages
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: data.response || 'No response received',
          timestamp: new Date(),
          isUser: false
        };
        
        // Add AI response to chat
        if (onSendPayloadToChat) {
          onSendPayloadToChat(data.response);
        }
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isUser: false
      };
      
      if (onSendPayloadToChat) {
        onSendPayloadToChat('Sorry, I encountered an error. Please try again.');
      }
    } finally {
      setIsTypingResponse(false);
    }
  }

  function handleChatKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

        {/* Chat Box */}
        <div className="mt-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          {/* Chat Header */}
          <div 
            className={`px-3 py-1.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${isChatCollapsed ? 'rounded-md' : 'border-b border-gray-100 rounded-t-md'}`}
            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 text-gray-600 transform transition-transform duration-200 ${isChatCollapsed ? 'rotate-0' : 'rotate-90'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm text-gray-700" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Chat to {advisorName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyChatContent();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Copy chat debug info"
                >
                  <svg 
                    className="w-4 h-4"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                {onClearChat && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearChat();
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    title="Clear chat"
                  >
                    <svg 
                      className="w-4 h-4"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Chat Content - Collapsible */}
          {!isChatCollapsed && (
            <>
              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="h-96 overflow-y-auto p-3 space-y-3"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                        message.isUser
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.text}</div>
                      <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTypingResponse && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-sm px-3 py-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Ask me about design..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    disabled={isTypingResponse}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTypingResponse}
                    className="flex-shrink-0 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-10 h-10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
