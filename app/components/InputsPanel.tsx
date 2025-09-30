"use client";
import { useEffect, useRef, useState } from "react";

interface InputsPanelProps {
  outputsExpanded: boolean;
  isBlinking?: boolean;
  advisorImageUrl?: string | null;
  advisorName?: string;
  onSimulate?: () => Promise<void>;
  isSimulating?: boolean;
}

export default function InputsPanel({ 
  outputsExpanded, 
  isBlinking = false,
  advisorImageUrl = null,
  advisorName = 'Advisor',
  onSimulate,
  isSimulating = false
}: InputsPanelProps) {
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, timestamp: Date, isUser: boolean}>>([
    { id: '1', text: `Hello! I'm your ${advisorName.toLowerCase()}. How can I help you today?`, timestamp: new Date(), isUser: false }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle chat message sending
  function handleSendMessage() {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      timestamp: new Date(),
      isUser: true
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTypingResponse(true);
    
    // Simulate advisor response after a short delay
    setTimeout(() => {
      const responses = [
        "That's an interesting perspective! Let me help you explore that further.",
        "I can definitely assist with that. Here are some considerations...",
        "Great question! Based on your requirements, I'd recommend...",
        "Let me analyze that for you. This approach could work well because...",
        "I see what you're looking for. Have you considered these alternatives?"
      ];
      
      const advisorMessage = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        isUser: false
      };
      
      setChatMessages(prev => [...prev, advisorMessage]);
      setIsTypingResponse(false);
    }, 1500 + Math.random() * 1000);
  }

  function handleChatKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

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
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Chat Content - Collapsible */}
            {!isChatCollapsed && (
              <>
                {/* Chat Messages */}
                <div 
                  ref={chatContainerRef}
                  className="h-48 overflow-y-auto p-3 space-y-3"
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

          {/* Action Button (matches selection height and layout, light style) */}
          <button
            type="button"
            onClick={onSimulate}
            disabled={isSimulating}
            className={`w-full mt-3 px-3 py-1.5 text-sm rounded-md transition-colors border ${isSimulating ? 'bg-gray-100 text-gray-400 border-gray-200' : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-300'}`}
          >
            {isSimulating ? 'Processing…' : 'Button'}
          </button>

        </div>
        )}
      </div>
    </div>
  );
}
