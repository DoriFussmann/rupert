"use client";
import { useState, useEffect } from "react";

interface InputsPanelProps {
  outputsExpanded: boolean;
  onApiCallStart?: () => void;
  onApiCallComplete?: (result: string, debugInfo: any) => void;
}

interface SystemPrompt {
  id: string;
  data: {
    name: string;
    content: string;
  };
}

export default function InputsPanel({ 
  outputsExpanded, 
  onApiCallStart,
  onApiCallComplete
}: InputsPanelProps) {
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  
  // System Prompts from collection
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<string>("");
  
  // Configuration state with defaults
  const [model, setModel] = useState("gpt-4o-mini");
  const [responseFormat, setResponseFormat] = useState("json_object");
  const [temperature, setTemperature] = useState(0);
  const [topP, setTopP] = useState(1);
  const [maxOutputTokens, setMaxOutputTokens] = useState(5000);
  const [store, setStore] = useState(false);
  
  // Prompt state (empty by default, will be populated from System Prompt selection)
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState(`{
  "start_month": "2025-11",
  "currency": "USD",
  "model_horizon_months": 9,

  "income": {
    "volume": {
      "m1_base": 160,
      "additions_per_month": 12,
      "mom_growth_pct": 0.03
    },
    "price": {
      "m1_unit_price": 250,
      "mom_growth_pct": 0.0
    },
    "retention": {
      "monthly_churn_pct": 0.04,
      "expansion_pct": 0.01,
      "repeat_frequency": "monthly"
    }
  },

  "cogs": {
    "fixed": {
      "m1": 18000,
      "mom_growth_pct": 0.01
    },
    "variable": {
      "ratio_type": "0.12 of revenue"
    }
  },

  "sales_marketing": {
    "fixed": {
      "m1": 40000,
      "mom_growth_pct": 0.02
    },
    "variable": {
      "ratio_type": "0.06 of revenue"
    }
  },

  "rnd": {
    "fixed_payroll": [
      {
        "role": "CTO",
        "salary": 20000,
        "mom_growth_pct": 0.0
      }
    ]
  },

  "ga": {
    "fixed": {
      "m1": 22000,
      "mom_growth_pct": 0.01
    }
  }
}`);

  // Load system prompts from collection
  useEffect(() => {
    async function loadSystemPrompts() {
      try {
        const response = await fetch('/api/collections/system-prompts/records');
        if (response.ok) {
          const data = await response.json();
          setSystemPrompts(data);
          
          // Auto-select "FP&A Modeling Assistant" as default
          const defaultPrompt = data.find((p: SystemPrompt) => 
            p.data.name === "FP&A Modeling Assistant"
          );
          if (defaultPrompt) {
            setSelectedSystemPromptId(defaultPrompt.id);
            setSystemPrompt(defaultPrompt.data.content);
          }
        }
      } catch (error) {
        console.error('Failed to load system prompts:', error);
      }
    }
    loadSystemPrompts();
  }, []);

  // Handle system prompt selection
  const handleSystemPromptChange = (promptId: string) => {
    setSelectedSystemPromptId(promptId);
    if (promptId) {
      const selected = systemPrompts.find(p => p.id === promptId);
      if (selected && selected.data.content) {
        setSystemPrompt(selected.data.content);
      }
    }
  };

  // Build payload based on current form values (POST /v1/responses schema)
  const buildPayload = () => {
    // Build messages array with role-based content blocks
    const messages = [];
    
    // Add system message if present
    if (systemPrompt.trim()) {
      messages.push({
        "role": "system",
        "content": systemPrompt
      });
    }
    
    // Always add user message (required)
    messages.push({
      "role": "user",
      "content": userPrompt
    });

    return {
      "model": model,
      "response_format": { "type": responseFormat },
      "temperature": temperature,
      "top_p": topP,
      "max_tokens": maxOutputTokens,
      "store": store,
      "messages": messages
    };
  };

  // Handle Pre-Flight Payload button
  const handlePreFlightPayload = () => {
    setIsPayloadModalOpen(true);
  };

  // Handle Run API Call button
  const handleRunApiCall = async () => {
    if (onApiCallStart) onApiCallStart();
    
    const startTime = Date.now();
    const payload = buildPayload();
    
    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const endTime = Date.now();
      const elapsedMs = endTime - startTime;
      
      let result = '';
      let debugInfo: any = {
        timestamp: new Date().toISOString(),
        elapsedMs,
        status: response.status,
        statusText: response.statusText,
        payload: payload,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      if (response.ok) {
        const data = await response.json();
        result = data.response || 'No response received';
        debugInfo.success = true;
        debugInfo.responseData = data;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        result = `Error: ${response.status} - ${errorData.error || 'Failed to get response'}`;
        debugInfo.success = false;
        debugInfo.error = errorData;
      }
      
      if (onApiCallComplete) {
        onApiCallComplete(result, debugInfo);
        }
      } catch (error) {
      console.error('Error running API call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const debugInfo = {
        timestamp: new Date().toISOString(),
        elapsedMs: Date.now() - startTime,
        success: false,
        error: errorMessage,
        payload: payload
      };
      
      if (onApiCallComplete) {
        onApiCallComplete(`Error: ${errorMessage}`, debugInfo);
      }
    }
  };

  // Copy payload to clipboard
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  
  const copyPayloadToClipboard = async () => {
    try {
      const payload = buildPayload();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    } catch (error) {
      console.error('Failed to copy payload:', error);
      setCopyButtonText('Failed');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    }
  };

  return (
    <div
      className="overflow-hidden"
      style={{ width: outputsExpanded ? "0%" : "calc(25% - 0.5rem)", transition: "width 200ms ease" }}
    >
      <div className="bg-white rounded-md border border-gray-200">
        <div 
          className="bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors min-h-[52px] flex items-center"
          onClick={() => setInputsCollapsed(!inputsCollapsed)}
          role="button"
          tabIndex={0}
          aria-label="Toggle Inputs width"
          aria-expanded={!inputsCollapsed}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setInputsCollapsed(!inputsCollapsed);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 transform transition-transform ${inputsCollapsed ? "" : "rotate-180"} ${inputsCollapsed ? "ml-0" : "-ml-1"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-sm font-medium text-gray-900">Inputs Panel</h2>
          </div>
        </div>
        
        {!inputsCollapsed && (
          <div className="p-4 space-y-4">
            {/* System Prompt Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">System Prompt</label>
              <div className="relative">
                <select 
                  value={selectedSystemPromptId} 
                  onChange={(e) => handleSystemPromptChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 pr-8 text-sm appearance-none bg-white"
                >
                  <option value="">-- Select a System Prompt --</option>
                  {systemPrompts.map(prompt => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.data.name}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
              <div className="relative">
                <select 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 pr-8 text-sm appearance-none bg-white"
                >
                  <option value="gpt-5">gpt-5</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4">gpt-4</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </select>
                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
          </div>

            {/* Response Format */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Response Format</label>
              <div className="relative">
                <select 
                  value={responseFormat} 
                  onChange={(e) => setResponseFormat(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 pr-8 text-sm appearance-none bg-white"
                >
                  <option value="json_object">type: json_object</option>
                  <option value="text">type: text</option>
                  <option value="xml">type: xml</option>
                </select>
                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              </div>
                  </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
              <input 
                type="number" 
                value={temperature} 
                onChange={(e) => setTemperature(Number(e.target.value))}
                min="0" 
                max="2" 
                step="0.1"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
            </div>

            {/* Top P */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Top P</label>
              <input 
                type="number" 
                value={topP} 
                onChange={(e) => setTopP(Number(e.target.value))}
                min="0" 
                max="1" 
                step="0.1"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
          </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Tokens</label>
              <div className="relative">
                <select 
                  value={maxOutputTokens} 
                  onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 pr-8 text-sm appearance-none bg-white"
                >
                  <option value="1000">1,000</option>
                  <option value="2000">2,000</option>
                  <option value="3000">3,000</option>
                  <option value="4000">4,000</option>
                  <option value="5000">5,000</option>
                  <option value="8000">8,000</option>
                  <option value="10000">10,000</option>
                  <option value="16000">16,000</option>
                  <option value="32000">32,000</option>
                </select>
                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Store */}
            <div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={store} 
                  onChange={(e) => setStore(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs font-medium text-gray-700">Store</span>
              </label>
      </div>
            
            {/* System Prompt */}
                <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">System Prompt</label>
              <textarea 
                value={systemPrompt} 
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                placeholder="Enter system prompt..."
              />
                </div>
            
            {/* User Prompt */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">User Prompt</label>
              <textarea 
                value={userPrompt} 
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                placeholder="Enter user prompt..."
              />
          </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
                onClick={handlePreFlightPayload}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
                Pre-Flight Payload
            </button>
            <button
                onClick={handleRunApiCall}
                className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              Run API Call
            </button>
            </div>
        </div>
    )}
      </div>

      {/* Payload Modal */}
      {isPayloadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pre-Flight Payload</h2>
              <div className="flex gap-2">
                <button
                  onClick={copyPayloadToClipboard}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    copyButtonText === 'Copied!' 
                      ? 'bg-green-600 text-white' 
                      : copyButtonText === 'Failed'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copyButtonText}
                </button>
                <button 
                  onClick={() => setIsPayloadModalOpen(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <pre className="text-sm font-mono bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {JSON.stringify(buildPayload(), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}