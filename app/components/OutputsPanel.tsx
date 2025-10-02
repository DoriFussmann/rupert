"use client";

interface OutputsPanelProps {
  outputsExpanded: boolean;
  onToggleExpanded: () => void;
  isRunningApiCall?: boolean;
  apiCallResult?: string;
}

export default function OutputsPanel({ 
  outputsExpanded, 
  onToggleExpanded,
  isRunningApiCall = false,
  apiCallResult = ''
}: OutputsPanelProps) {

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
        
        <div className="p-8 text-center text-gray-500">
          {isRunningApiCall ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-sm">Running API Call...</p>
            </div>
          ) : apiCallResult ? (
            <div className="text-left">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">API Response:</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiCallResult);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Copy API Response"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-900 whitespace-pre-wrap">{apiCallResult}</pre>
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lg">Outputs Panel</p>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}
