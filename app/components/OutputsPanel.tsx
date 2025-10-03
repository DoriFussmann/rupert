"use client";
import { useState } from "react";
import FinancialModelOutput from "./FinancialModelOutput";

interface OutputsPanelProps {
  outputsExpanded: boolean;
  onToggleExpanded: () => void;
  isRunningApiCall?: boolean;
  apiCallResult?: string | null;
  apiCallDebugInfo?: any;
}

export default function OutputsPanel({ 
  outputsExpanded, 
  onToggleExpanded,
  isRunningApiCall = false,
  apiCallResult = null,
  apiCallDebugInfo = null
}: OutputsPanelProps) {
  const [showApiResponse, setShowApiResponse] = useState(false);
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [debugCopyText, setDebugCopyText] = useState('Copy');
  const [responseCopyText, setResponseCopyText] = useState('Copy');

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
    <div
      className="overflow-hidden"
      style={{ width: outputsExpanded ? "100%" : "calc(75% - 0.5rem)", transition: "width 200ms ease" }}
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
            <h2 className="text-sm font-medium text-gray-900">Outputs Panel</h2>
          </div>
        </div>
        
        <div className="p-6">
          {/* Preloader when API call is running */}
          {isRunningApiCall && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium text-gray-700">Processing API Call...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we generate your financial model</p>
            </div>
          )}

          {/* Show result and debug log when API call is complete */}
          {!isRunningApiCall && apiCallResult && (
            <div className="space-y-4">
              {/* Financial Model Output if detected */}
              {isFinancialModel(apiCallResult) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Model Results</h3>
                  <FinancialModelOutput data={apiCallResult} />
                </div>
              )}

              {/* Always show Raw API Response */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Raw API Response:</h3>
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
                    <h3 className="text-sm font-semibold text-gray-900">Debug Log:</h3>
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

          {/* Default state when no API call has been made */}
          {!isRunningApiCall && !apiCallResult && (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lg">Outputs Panel</p>
              <p className="text-sm mt-2">Run an API call to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}