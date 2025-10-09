"use client";
import { useEffect, useRef, useState } from "react";
import FinancialModelOutput from "./FinancialModelOutput";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

interface OutputsPanelProps {
  outputsExpanded: boolean;
  onToggleExpanded: () => void;
  isRunningApiCall?: boolean;
  apiCallResult?: string | null;
  apiCallDebugInfo?: any;
  chatMessages?: ChatMessage[];
  isTypingResponse?: boolean;
  onSendMessage?: (message: string) => void;
  lastSentPayload?: any;
  buildChatDebugInfo?: () => any;
  finalOutput?: any;
  expandedSections?: Record<string, boolean>;
  onToggleSection?: (key: string) => void;
  isSavingDataMap?: boolean;
  saveDataMapMessage?: {type: 'success' | 'error', text: string} | null;
  dataMapSaved?: boolean;
  onUpdateBusinessDataMap?: () => void;
  isInModelBuildStep?: boolean;
  onNextModelBuildStep?: () => void;
  topLineChatMessages?: ChatMessage[];
  isTopLineTypingResponse?: boolean;
  onTopLineSendMessage?: (message: string) => void;
}

export default function OutputsPanel({ 
  outputsExpanded, 
  onToggleExpanded,
  isRunningApiCall = false,
  apiCallResult = null,
  apiCallDebugInfo = null,
  chatMessages = [],
  isTypingResponse = false,
  onSendMessage,
  lastSentPayload = null,
  buildChatDebugInfo,
  finalOutput = null,
  expandedSections = {},
  onToggleSection,
  isSavingDataMap = false,
  saveDataMapMessage = null,
  dataMapSaved = false,
  onUpdateBusinessDataMap,
  isInModelBuildStep = false,
  onNextModelBuildStep,
  topLineChatMessages = [],
  isTopLineTypingResponse = false,
  onTopLineSendMessage
}: OutputsPanelProps) {
  const [showApiResponse, setShowApiResponse] = useState(false);
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [debugCopyText, setDebugCopyText] = useState('Copy');
  const [responseCopyText, setResponseCopyText] = useState('Copy');
  
  // Chat functionality
  const [chatInput, setChatInput] = useState('');
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  
  // Debug modals
  const [isSentPayloadOpen, setIsSentPayloadOpen] = useState(false);
  const [isChatDebugOpen, setIsChatDebugOpen] = useState(false);
  const [copySentPayloadButtonText, setCopySentPayloadButtonText] = useState('Copy');
  const [copyChatDebugButtonText, setCopyChatDebugButtonText] = useState('Copy');

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Refocus input after AI responds
  useEffect(() => {
    if (!isTypingResponse && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isTypingResponse]);

  // Handle chat message sending
  async function handleSendMessage() {
    if (!chatInput.trim() || !onSendMessage) return;
    
    const message = chatInput.trim();
    setChatInput('');
    onSendMessage(message);
    
    // Refocus input after sending
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }, 100);
  }

  function handleChatKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // Reusable preloader (matching Design Master)
  const loadingMessages = [
    "Analyzing semantic intent…",
    "Calibrating vector embeddings…",
    "Mapping entities and relationships…",
    "Synthesizing optimal strategy…",
    "Validating constraints and edge cases…",
  ];
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMsgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunningApiCall) {
      setLoadingMessageIndex(0);
      if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current);
      loadingMsgIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((i) => (i + 1) % loadingMessages.length);
      }, 2500);
    } else {
      if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current);
    }
    return () => { if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current); };
  }, [isRunningApiCall]);

  // Check if response is a financial model (has meta, tables, etc.)
  const isFinancialModel = (response: string | null) => {
    if (!response) return false;
    try {
      const parsed = JSON.parse(response);
      return parsed.meta && parsed.tables && parsed.tables.pnl_summary;
    } catch {
      return false;
    }
  };

  // Copy debug info to clipboard
  const copyDebugToClipboard = async () => {
    try {
      const debugText = JSON.stringify(apiCallDebugInfo, null, 2);
      await navigator.clipboard.writeText(debugText);
      setDebugCopyText('Copied!');
      setTimeout(() => setDebugCopyText('Copy'), 2000);
    } catch (error) {
      console.error('Failed to copy debug log:', error);
      setDebugCopyText('Failed');
      setTimeout(() => setDebugCopyText('Copy'), 2000);
    }
  };

  // Copy API response to clipboard
  const copyResponseToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiCallResult || '');
      setResponseCopyText('Copied!');
      setTimeout(() => setResponseCopyText('Copy'), 2000);
    } catch (error) {
      console.error('Failed to copy response:', error);
      setResponseCopyText('Failed');
      setTimeout(() => setResponseCopyText('Copy'), 2000);
    }
  };
  return (
    <>
    <div
      className="overflow-hidden"
      style={{ width: outputsExpanded ? "100%" : "75%", transition: "width 200ms ease" }}
    >
      <div className="bg-white rounded-md border border-gray-200">
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
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 transform transition-transform ${outputsExpanded ? "" : "rotate-180"} ${outputsExpanded ? "ml-0" : "-ml-1"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h2 className="text-sm text-gray-900">Advisor Engagement</h2>
          </div>
        </div>
        
        <div className="p-4">
          {/* Preloader when API call is running */}
          {isRunningApiCall && (
            <div className="my-3 flex justify-center py-10">
              <div className="w-1/2">
                <div className="border border-gray-200 bg-gray-50 rounded-md h-9 px-4 flex items-center justify-center overflow-hidden">
                  <div key={loadingMessageIndex} className="text-sm text-gray-700 nb-anim-loading-line">
                    {loadingMessages[loadingMessageIndex]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show result and debug log when API call is complete */}
          {!isRunningApiCall && apiCallResult && (
            <div className="space-y-4">
              {/* Financial Model Output if detected */}
              {isFinancialModel(apiCallResult) && (
                <div>
                  <h3 className="text-base text-gray-900 mb-4">Financial Model Results</h3>
                  <FinancialModelOutput data={apiCallResult} />
                </div>
              )}

              {/* Always show Raw API Response */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-900">Raw API Response:</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApiResponse(!showApiResponse)}
                      className="text-xs px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                      {showApiResponse ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={copyResponseToClipboard}
                      className={`text-xs px-3 py-1 rounded-md flex items-center gap-1 transition-colors ${
                        responseCopyText === 'Copied!' 
                          ? 'bg-green-600 text-white' 
                          : responseCopyText === 'Failed'
                          ? 'bg-red-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {responseCopyText}
                    </button>
                  </div>
                </div>
                
                {showApiResponse && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-900 whitespace-pre-wrap font-mono">
                      {apiCallResult}
                    </pre>
                  </div>
                )}
              </div>

              {/* Debug Log */}
              {apiCallDebugInfo && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-gray-900">Debug Log:</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDebugLog(!showDebugLog)}
                        className="text-xs px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        {showDebugLog ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={copyDebugToClipboard}
                        className={`text-xs px-3 py-1 rounded-md flex items-center gap-1 transition-colors ${
                          debugCopyText === 'Copied!' 
                            ? 'bg-green-600 text-white' 
                            : debugCopyText === 'Failed'
                            ? 'bg-red-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {debugCopyText}
                      </button>
                    </div>
                  </div>
                  
                  {showDebugLog && (
                    <div className="bg-gray-900 text-green-400 rounded-md p-4 max-h-96 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(apiCallDebugInfo, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              </div>
              )}

          {/* Default state when no API call has been made - intentionally empty */}
          {!isRunningApiCall && !apiCallResult && null}

          {/* Business Taxonomy Chat Box - Only show when NOT in model build step */}
          {!isInModelBuildStep && (
          <div>
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
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
                    {isChatCollapsed && (
                      <span className="text-sm text-gray-700" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                        Business Classification Chat
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSentPayloadOpen(true);
                      }}
                      className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                      title="View last sent payload"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l18 4-8 3-2 4-2-6-6-5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsChatDebugOpen(true);
                      }}
                      className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors font-mono"
                      title="View chat debug info"
                    >
                      &lt;&gt;
                    </button>
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
                    className="overflow-y-auto p-3 space-y-3 max-h-64"
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
                        ref={chatInputRef}
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleChatKeyPress}
                        placeholder="Ask me about the business classification..."
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
          )}

          {/* Top-Line Builder Chat Box - Only show when IN model build step */}
          {isInModelBuildStep && (
          <div>
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
              {/* Chat Header */}
              <div 
                className={`px-3 py-1.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${isChatCollapsed ? 'rounded-md' : 'border-b border-gray-100 rounded-t-md'}`}
                onClick={() => setIsChatCollapsed(!isChatCollapsed)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 text-gray-600 transform transition-transition duration-200 ${isChatCollapsed ? 'rotate-0' : 'rotate-90'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {isChatCollapsed && (
                      <span className="text-sm text-gray-700" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                        Top-Line Builder Chat
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                    className="overflow-y-auto p-3 space-y-3 max-h-64"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    {topLineChatMessages.map((message) => (
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
                    {isTopLineTypingResponse && (
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
                        ref={chatInputRef}
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && onTopLineSendMessage) {
                            e.preventDefault();
                            if (chatInput.trim()) {
                              onTopLineSendMessage(chatInput.trim());
                              setChatInput('');
                            }
                          }
                        }}
                        placeholder="Ask me about the top-line model..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        disabled={isTopLineTypingResponse}
                      />
                      <button
                        onClick={() => {
                          if (chatInput.trim() && onTopLineSendMessage) {
                            onTopLineSendMessage(chatInput.trim());
                            setChatInput('');
                          }
                        }}
                        disabled={!chatInput.trim() || isTopLineTypingResponse}
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
          )}

          {/* Final Output Display - Parsed JSON */}
          {finalOutput && (
            <>
              <div className="mt-4" style={{
                opacity: isInModelBuildStep ? 0 : 1,
                transition: 'opacity 1s ease-out'
              }}>
                <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-sm font-medium text-gray-900">Business Taxonomy Classification</span>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(finalOutput).map(([key, value]) => {
                      const sectionKey = key;
                      const isExpanded = Boolean(expandedSections[sectionKey]);
                      
                      return (
                        <div key={sectionKey} className="border border-gray-200 rounded-md bg-white">
                          <button
                            onClick={() => onToggleSection?.(sectionKey)}
                            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-600 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {isExpanded && (
                            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Update Business Data Map / Next Model Build Step Buttons - Outside the box */}
              <div className="relative mt-4">
                <div className="flex justify-end items-center gap-3">
                  {saveDataMapMessage && (
                    <div className={`text-sm px-3 py-1.5 rounded-md transition-opacity duration-300 ${
                      saveDataMapMessage.type === 'success' 
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {saveDataMapMessage.text}
                    </div>
                  )}
                  
                  {/* Update Business Data Map Button - Fades out after success */}
                  {!dataMapSaved && (
                    <button
                      type="button"
                      onClick={onUpdateBusinessDataMap}
                      disabled={isSavingDataMap}
                      className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 border border-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        animation: 'fadeIn 0.3s ease-in'
                      }}
                    >
                      {isSavingDataMap ? 'Saving...' : 'Update Business Data Map'}
                    </button>
                  )}
                  
                    {/* Next Model Build Step Button - Fades in after save success */}
                    {dataMapSaved && !isInModelBuildStep && (
                      <button
                        type="button"
                        onClick={onNextModelBuildStep}
                        className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 border border-blue-300 transition-all duration-300"
                        style={{
                          animation: 'fadeIn 0.5s ease-in'
                        }}
                      >
                        Next Model Build Step
                      </button>
                    )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Sent Payload Modal - centered */}
    {isSentPayloadOpen && (
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl flex flex-col"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', width: '72rem', maxWidth: '90vw', aspectRatio: '16/9' }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm text-gray-900">Last Sent Payload</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const text = JSON.stringify(lastSentPayload ?? { info: 'No payload sent yet' }, null, 2);
                    await navigator.clipboard.writeText(text);
                    setCopySentPayloadButtonText('Copied!');
                    setTimeout(() => setCopySentPayloadButtonText('Copy'), 2000);
                  } catch (e) {
                    setCopySentPayloadButtonText('Failed');
                    setTimeout(() => setCopySentPayloadButtonText('Copy'), 2000);
                  }
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  copySentPayloadButtonText === 'Copied!'
                    ? 'bg-green-600 text-white'
                    : copySentPayloadButtonText === 'Failed'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copySentPayloadButtonText}
              </button>
              <button onClick={() => setIsSentPayloadOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-auto">
            <pre className="text-xs bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-gray-900 font-mono">
              {JSON.stringify(lastSentPayload ?? { info: 'No payload sent yet' }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )}

    {/* Chat Debug Modal - centered */}
    {isChatDebugOpen && (
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl flex flex-col"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', width: '72rem', maxWidth: '90vw', aspectRatio: '16/9' }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm text-gray-900">Chat Debug</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const debugInfo = buildChatDebugInfo ? buildChatDebugInfo() : { info: 'Debug info not available' };
                    await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                    setCopyChatDebugButtonText('Copied!');
                    setTimeout(() => setCopyChatDebugButtonText('Copy'), 2000);
                  } catch (e) {
                    setCopyChatDebugButtonText('Failed');
                    setTimeout(() => setCopyChatDebugButtonText('Copy'), 2000);
                  }
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  copyChatDebugButtonText === 'Copied!'
                    ? 'bg-green-600 text-white'
                    : copyChatDebugButtonText === 'Failed'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copyChatDebugButtonText}
              </button>
              <button onClick={() => setIsChatDebugOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-auto">
            <pre className="text-xs bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-gray-900 font-mono">
              {JSON.stringify(buildChatDebugInfo ? buildChatDebugInfo() : { info: 'Debug info not available' }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )}
    </>
  );
}