"use client";
import { useState, useEffect, useCallback } from "react";

interface InputsPanelProps {
  outputsExpanded: boolean;
  onApiCallStart?: () => void;
  onApiCallComplete?: (result: string, debugInfo: any) => void;
  onRegisterGetControls?: (getControls: () => any) => void;
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
  onApiCallComplete,
  onRegisterGetControls
}: InputsPanelProps) {
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isTopLineControlsOpen, setIsTopLineControlsOpen] = useState(false);
  const [isSystemPromptPreviewOpen, setIsSystemPromptPreviewOpen] = useState(false);
  const [isUserPromptOpen, setIsUserPromptOpen] = useState(false);
  const [copyPromptText, setCopyPromptText] = useState('Copy');
  
  // Advisor image
  const [advisorImageUrl, setAdvisorImageUrl] = useState<string | null>(null);
  const [advisorName, setAdvisorName] = useState<string>('');
  
  // System Prompts from collection
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<string>("");
  
  // Top-Line Builder System Prompt (separate from Business Taxonomy)
  const [selectedTopLineSystemPromptId, setSelectedTopLineSystemPromptId] = useState<string>("");
  const [topLineSystemPrompt, setTopLineSystemPrompt] = useState<string>('');
  
  // Top-Line Builder - Number of Months
  const [numberOfMonths, setNumberOfMonths] = useState<number>(18);
  
  // Structures from collection
  const [structures, setStructures] = useState<Array<{ id: string; data: { name?: string; schema?: unknown } }>>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string>("");
  
  // Threshold
  const [completionThreshold, setCompletionThreshold] = useState<number>(80);
  
  // Configuration state with defaults
  const [llm, setLlm] = useState<string>('OpenAI');
  const [model, setModel] = useState("gpt-4o-mini");
  const [responseFormat, setResponseFormat] = useState<'json_object' | 'text' | 'xml'>('text');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [topP, setTopP] = useState<number>(1.0);
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(2500);
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const [verbosity, setVerbosity] = useState<'low' | 'medium' | 'high'>('medium');
  const [frequencyPenalty, setFrequencyPenalty] = useState<number>(0);
  const [presencePenalty, setPresencePenalty] = useState<number>(0);
  const [storeLogs, setStoreLogs] = useState<boolean>(true);
  const [includeDataMapContext, setIncludeDataMapContext] = useState<boolean>(true);
  
  // Model options based on LLM
  const modelsByLlm: Record<string, string[]> = {
    'OpenAI': ['gpt-5', 'o1', 'o1-preview', 'o1-mini', 'o3-mini', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    'Anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    'Google': ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    'Meta': ['llama-3.3-70b-instruct', 'llama-3.1-405b-instruct', 'llama-3.1-70b-instruct', 'llama-3.1-8b-instruct'],
    'Mistral': ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'mistral-tiny']
  };

  // Update model when LLM changes
  const handleLlmChange = (newLlm: string) => {
    setLlm(newLlm);
    const models = modelsByLlm[newLlm];
    if (models && models.length > 0) {
      setModel(models[0]); // Set to first model of the new LLM
    }
  };

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

  // Load advisor image for Model Builder page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const toolsRes = await fetch('/api/collections/pages/records', { headers: { 'Content-Type': 'application/json' } });
        if (!toolsRes.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await toolsRes.json();
        const page = records.find(r => String((r.data as any)?.name || '').toLowerCase() === 'model builder');
        const advisorId = page?.data ? (page.data as any).mainAdvisorId : null;
        if (!advisorId) {
          console.log('No advisor ID found for Model Builder page');
          return;
        }
        const advRes = await fetch(`/api/collections/advisors/records/${advisorId}`, { headers: { 'Content-Type': 'application/json' } });
        if (!advRes.ok) return;
        const advisor = await advRes.json();
        const raw = advisor?.data?.image ? String(advisor.data.image) : '';
        const img = raw
          ? (/^https?:\/\//i.test(raw) || raw.startsWith('/') ? raw : `/uploads/${raw}`)
          : '';
        const name = advisor?.data?.name ? String(advisor.data.name) : 'Advisor';
        if (!cancelled) {
          setAdvisorImageUrl(img || null);
          setAdvisorName(name);
        }
      } catch (error) {
        console.error('Error loading advisor image:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load structures from collection
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const structuresRes = await fetch('/api/collections/structures/records', { headers: { 'Content-Type': 'application/json' } });
        if (!structuresRes.ok) return;
        const records: Array<{ id: string; data?: { name?: string } }> = await structuresRes.json();
        if (!cancelled) {
          setStructures(records as any);
          if (records.length > 0) {
            setSelectedStructureId(records[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading structures:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load system prompts from collection
  useEffect(() => {
    async function loadSystemPrompts() {
      try {
        const response = await fetch('/api/collections/system-prompts/records');
        if (response.ok) {
          const data = await response.json();
          setSystemPrompts(data);
          
          // Auto-select "Business Taxonomy" as default
          const defaultPrompt = data.find((p: SystemPrompt) => 
            p.data.name === "Business Taxonomy"
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

  // Handle Top-Line system prompt selection
  const handleTopLineSystemPromptChange = useCallback((promptId: string) => {
    setSelectedTopLineSystemPromptId(promptId);
    if (promptId) {
      const selected = systemPrompts.find(p => p.id === promptId);
      if (selected && selected.data.content) {
        setTopLineSystemPrompt(selected.data.content);
      }
    }
  }, [systemPrompts]);

  // Auto-select Top-Line System Prompt based on classification
  const autoSelectTopLinePrompt = useCallback((classification: string) => {
    console.log('=== AUTO-SELECT: Searching for prompt ===');
    console.log('Classification:', classification);
    console.log('Available prompts:', systemPrompts.map(p => p.data.name));
    
    // Search for a system prompt that contains the classification in its name
    const matchingPrompt = systemPrompts.find(p => {
      const promptName = p.data.name || '';
      // Check if the prompt name contains the classification
      // e.g., "Digital_Product_Recurring Top-Line Model Builder" contains "Digital_Product_Recurring"
      return promptName.includes(classification);
    });
    
    if (matchingPrompt) {
      console.log('✅ Found matching prompt:', matchingPrompt.data.name);
      handleTopLineSystemPromptChange(matchingPrompt.id);
    } else {
      console.log('❌ No matching prompt found for classification:', classification);
    }
  }, [systemPrompts, handleTopLineSystemPromptChange]);

  // Register function to get current controls
  useEffect(() => {
    if (onRegisterGetControls) {
      onRegisterGetControls(() => ({
        systemPrompt,
        topLineSystemPrompt,
        numberOfMonths,
        model,
        responseFormat,
        temperature,
        topP,
        maxOutputTokens,
        reasoningEffort,
        verbosity,
        frequencyPenalty,
        presencePenalty,
        storeLogs,
        includeDataMapContext,
        completionThreshold,
        autoSelectTopLinePrompt // Expose the auto-select function
      }));
    }
  }, [
    onRegisterGetControls,
    systemPrompt,
    topLineSystemPrompt,
    numberOfMonths,
    model,
    responseFormat,
    temperature,
    topP,
    maxOutputTokens,
    reasoningEffort,
    verbosity,
    frequencyPenalty,
    presencePenalty,
    storeLogs,
    includeDataMapContext,
    completionThreshold,
    autoSelectTopLinePrompt
  ]);

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
      "store": storeLogs,
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
      style={{ width: outputsExpanded ? "0%" : "25%", transition: "width 200ms ease" }}
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
              className={`w-4 h-4 transform transition-transform ${inputsCollapsed ? "" : "rotate-90"} ${inputsCollapsed ? "ml-0" : "-ml-1"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-sm font-medium text-gray-900">Page Controls</h2>
          </div>
        </div>
        
        <div
          className="p-4"
          style={{
            maxHeight: inputsCollapsed ? 0 : 2000,
            opacity: inputsCollapsed ? 0 : 1,
            overflow: inputsCollapsed ? 'hidden' : 'visible',
            padding: inputsCollapsed ? 0 : 16,
            transition: 'max-height 200ms ease, opacity 200ms ease, padding 200ms ease'
          }}
        >
          <div className="space-y-4">
            {/* Advisor Image */}
            <div className="w-full h-64 bg-gray-100 border border-gray-200 rounded-md shadow-inner flex items-center justify-center text-gray-400 overflow-hidden">
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

            {/* Business Taxonomy Controls */}
            <div>
              <div className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-100">
                <span className="font-medium">Business Taxonomy Controls</span>
              </div>
            </div>

            {/* System Prompt Selection */}
            <div>
              <div className="relative group">
                <button type="button" onClick={() => setIsSystemPromptPreviewOpen(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                  <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{(systemPrompts.find(p => p.id === selectedSystemPromptId)?.data.name) || '-- Select a System Prompt --'}</span>
                </button>
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 max-h-64 overflow-auto">
                    <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => handleSystemPromptChange("")}>-- Select a System Prompt --</button>
                    {systemPrompts.map(prompt => (
                      <button
                        key={prompt.id}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => handleSystemPromptChange(prompt.id)}
                      >
                        {prompt.data.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Threshold */}
            <div>
              <div className="relative group">
                <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                  <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Threshold: {completionThreshold}%</span>
                </button>
                <div className="absolute left-0 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                  <div className="py-2 max-h-64 overflow-auto">
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(threshold => (
                      <button
                        key={threshold}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => setCompletionThreshold(threshold)}
                      >
                        {threshold}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls button */}
            <div>
              <button
                type="button"
                onClick={() => setIsControlsOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Controls</span>
              </button>
            </div>

            {/* Separator */}
            <div className="border-t border-gray-200"></div>

            {/* Top-Line Builder Controls */}
            <div>
              <div className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-100">
                <span className="font-medium">Top-Line Builder Controls</span>
              </div>
            </div>

            {/* Top-Line System Prompt Selection */}
            <div>
              <div className="relative group">
                <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                  <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{(systemPrompts.find(p => p.id === selectedTopLineSystemPromptId)?.data.name) || '-- Select a System Prompt --'}</span>
                </button>
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 max-h-64 overflow-auto">
                    <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => handleTopLineSystemPromptChange("")}>-- Select a System Prompt --</button>
                    {systemPrompts.map(prompt => (
                      <button
                        key={prompt.id}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => handleTopLineSystemPromptChange(prompt.id)}
                      >
                        {prompt.data.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Number of Months Selection */}
            <div>
              <div className="relative group">
                <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                  <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span># of Months: {numberOfMonths}</span>
                </button>
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 max-h-64 overflow-auto">
                    {[6, 12, 18, 24, 36].map(months => (
                      <button
                        key={months}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => setNumberOfMonths(months)}
                      >
                        {months} months
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top-Line Builder Controls button */}
            <div>
              <button
                type="button"
                onClick={() => setIsTopLineControlsOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Controls</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payload Modal */}
      {isPayloadModalOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-4xl mx-4 flex flex-col" style={{ aspectRatio: '16/9', fontFamily: 'Inter, system-ui, sans-serif' }}>
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

      {/* Controls Panel (no backdrop), matches Data Mapper */}
      {isControlsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl w-full" style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '672px' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm text-gray-900">Controls</h3>
              <button onClick={() => setIsControlsOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {/* LLM Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">LLM</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{llm}</span>
                </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral'].map(llmOption => (
                        <button key={llmOption} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => handleLlmChange(llmOption)}>
                          {llmOption}
                </button>
                      ))}
              </div>
            </div>
            </div>
          </div>

              {/* Model Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{model}</span>
                </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {modelsByLlm[llm]?.map(modelOption => (
                        <button key={modelOption} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setModel(modelOption)}>
                          {modelOption}
                </button>
                      ))}
              </div>
            </div>
                </div>
              </div>

              {/* Response Format */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Response Format</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{responseFormat === 'json_object' ? 'type: json_object' : `type: ${responseFormat}`}</span>
                          </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {(['json_object','text','xml'] as const).map(fmt => (
                        <button key={fmt} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setResponseFormat(fmt)}>
                          {fmt === 'json_object' ? 'type: json_object' : `type: ${fmt}`}
                            </button>
                      ))}
                        </div>
                      </div>
                        </div>
                      </div>
                      
              {/* Temperature */}
                            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{Number(temperature).toFixed(1)}</span>
                            </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[0,0.2,0.4,0.7,1.0,1.3,1.8,2.0].map(t => (
                        <button key={t} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setTemperature(t)}>
                          {t.toFixed(1)}
                        </button>
                      ))}
                              </div>
                            </div>
                </div>
                          </div>
                          
              {/* Top P */}
                            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Top P</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{Number(topP).toFixed(1)}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[0,0.1,0.2,0.3,0.5,0.7,0.9,1.0].map(p => (
                        <button key={p} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setTopP(p)}>
                          {p.toFixed(1)}
                        </button>
                      ))}
                              </div>
                  </div>
                              </div>
                            </div>
                            
              {/* Max Tokens */}
                            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Tokens</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{maxOutputTokens.toLocaleString()}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[1000,2000,2500,3000,4000,5000,8000,10000,16000,32000].map(tok => (
                        <button key={tok} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setMaxOutputTokens(tok)}>
                          {tok.toLocaleString()}
                        </button>
                      ))}
                              </div>
                            </div>
                          </div>
                            </div>
                            
              {/* Reasoning Effort */}
                              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reasoning Effort</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{reasoningEffort}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {(['low', 'medium', 'high'] as const).map(effort => (
                        <button key={effort} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setReasoningEffort(effort)}>
                          {effort}
                        </button>
                      ))}
                              </div>
                  </div>
                </div>
              </div>
                            
              {/* Verbosity */}
                            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verbosity</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{verbosity}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {(['low', 'medium', 'high'] as const).map(verb => (
                        <button key={verb} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setVerbosity(verb)}>
                          {verb}
                        </button>
                      ))}
                              </div>
                            </div>
                          </div>
                        </div>

              {/* Frequency Penalty */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Frequency Penalty</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{Number(frequencyPenalty).toFixed(1)}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.5, 2.0].map(penalty => (
                        <button key={penalty} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setFrequencyPenalty(penalty)}>
                          {penalty.toFixed(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                        </div>
                      </div>
                      
              {/* Presence Penalty */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Presence Penalty</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{Number(presencePenalty).toFixed(1)}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.5, 2.0].map(penalty => (
                        <button key={penalty} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setPresencePenalty(penalty)}>
                          {penalty.toFixed(1)}
                        </button>
                      ))}
                        </div>
                      </div>
                </div>
                      </div>
                      
              {/* Store Logs */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Store Logs</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{storeLogs ? 'On' : 'Off'}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setStoreLogs(true)}>
                        On
                      </button>
                      <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setStoreLogs(false)}>
                        Off
                      </button>
                    </div>
                </div>
            </div>
              </div>

              {/* Include Data Map Context */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Include Data Map Context</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{includeDataMapContext ? 'On' : 'Off'}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setIncludeDataMapContext(true)}>
                        On
                      </button>
                      <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setIncludeDataMapContext(false)}>
                        Off
                      </button>
                    </div>
                </div>
            </div>
              </div>
                    </div>
                        </div>
                </div>
              )}

      {/* Top-Line Builder Controls Panel (no backdrop) */}
      {isTopLineControlsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl w-full" style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '672px' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm text-gray-900">Top-Line Builder Controls</h3>
              <button onClick={() => setIsTopLineControlsOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {/* LLM Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">LLM</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{llm}</span>
                </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral'].map(llmOption => (
                        <button key={llmOption} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => handleLlmChange(llmOption)}>
                          {llmOption}
                </button>
                      ))}
              </div>
            </div>
            </div>
          </div>

              {/* Model Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{model}</span>
                </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {modelsByLlm[llm]?.map(modelOption => (
                        <button key={modelOption} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setModel(modelOption)}>
                          {modelOption}
                </button>
                      ))}
              </div>
            </div>
                </div>
              </div>

              {/* Response Format */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Response Format</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{responseFormat === 'json_object' ? 'type: json_object' : `type: ${responseFormat}`}</span>
                          </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {(['json_object','text','xml'] as const).map(fmt => (
                        <button key={fmt} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setResponseFormat(fmt)}>
                          {fmt === 'json_object' ? 'type: json_object' : `type: ${fmt}`}
                            </button>
                      ))}
                        </div>
                      </div>
                        </div>
                      </div>
                      
              {/* Temperature */}
                            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{Number(temperature).toFixed(1)}</span>
                            </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[0,0.2,0.4,0.7,1.0,1.3,1.8,2.0].map(t => (
                        <button key={t} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setTemperature(t)}>
                          {t.toFixed(1)}
                        </button>
                      ))}
                              </div>
                            </div>
                </div>
                          </div>
                          
              {/* Top P */}
                            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Top P</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{Number(topP).toFixed(1)}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[0,0.1,0.2,0.3,0.5,0.7,0.9,1.0].map(p => (
                        <button key={p} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setTopP(p)}>
                          {p.toFixed(1)}
                        </button>
                      ))}
                              </div>
                  </div>
                              </div>
                            </div>
                            
              {/* Max Tokens */}
                            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Tokens</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{maxOutputTokens.toLocaleString()}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[1000,2000,2500,3000,4000,5000,8000,10000,16000,32000].map(tok => (
                        <button key={tok} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setMaxOutputTokens(tok)}>
                          {tok.toLocaleString()}
                        </button>
                      ))}
                              </div>
                            </div>
                          </div>
                            </div>
                            
              {/* Reasoning Effort */}
                              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reasoning Effort</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{reasoningEffort}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {(['low', 'medium', 'high'] as const).map(effort => (
                        <button key={effort} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setReasoningEffort(effort)}>
                          {effort}
                        </button>
                      ))}
                              </div>
                  </div>
                </div>
              </div>
                            
              {/* Verbosity */}
                            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verbosity</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{verbosity}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {(['low', 'medium', 'high'] as const).map(verb => (
                        <button key={verb} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setVerbosity(verb)}>
                          {verb}
                        </button>
                      ))}
                              </div>
                            </div>
                          </div>
                        </div>

              {/* Frequency Penalty */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Frequency Penalty</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{Number(frequencyPenalty).toFixed(1)}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.5, 2.0].map(penalty => (
                        <button key={penalty} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setFrequencyPenalty(penalty)}>
                          {penalty.toFixed(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                        </div>
                      </div>
                      
              {/* Presence Penalty */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Presence Penalty</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{Number(presencePenalty).toFixed(1)}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.5, 2.0].map(penalty => (
                        <button key={penalty} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setPresencePenalty(penalty)}>
                          {penalty.toFixed(1)}
                        </button>
                      ))}
                        </div>
                      </div>
                </div>
                      </div>
                      
              {/* Store Logs */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Store Logs</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{storeLogs ? 'On' : 'Off'}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setStoreLogs(true)}>
                        On
                      </button>
                      <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setStoreLogs(false)}>
                        Off
                      </button>
                    </div>
                </div>
            </div>
              </div>

              {/* Include Data Map Context */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Include Data Map Context</label>
                <div className="relative group">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{includeDataMapContext ? 'On' : 'Off'}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2 max-h-64 overflow-auto">
                      <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setIncludeDataMapContext(true)}>
                        On
                      </button>
                      <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setIncludeDataMapContext(false)}>
                        Off
                      </button>
                    </div>
                </div>
            </div>
              </div>
                    </div>
                        </div>
                </div>
              )}

      {/* User Prompt Panel (no backdrop) */}
      {isUserPromptOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute top-40 left-1/2 -translate-x-1/2 pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl w-full max-w-3xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm text-gray-900">User Prompt</h3>
              <button onClick={() => setIsUserPromptOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={14}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                placeholder="Enter user prompt..."
              />
            </div>
          </div>
        </div>
      )}
      {/* System Prompt Preview Modal */}
      {isSystemPromptPreviewOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-3xl mx-4 flex flex-col" style={{ aspectRatio: '16/9', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {(systemPrompts.find(p => p.id === selectedSystemPromptId)?.data.name) || 'System Prompt'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const content = (systemPrompts.find(p => p.id === selectedSystemPromptId)?.data.content) || systemPrompt || '';
                      await navigator.clipboard.writeText(String(content));
                      setCopyPromptText('Copied!');
                      setTimeout(() => setCopyPromptText('Copy'), 2000);
                    } catch (e) {
                      setCopyPromptText('Failed');
                      setTimeout(() => setCopyPromptText('Copy'), 2000);
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    copyPromptText === 'Copied!'
                      ? 'bg-green-600 text-white'
                      : copyPromptText === 'Failed'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copyPromptText}
                </button>
                <button 
                  onClick={() => setIsSystemPromptPreviewOpen(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <pre className="text-sm font-mono bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {String((systemPrompts.find(p => p.id === selectedSystemPromptId)?.data.content) || systemPrompt || '')}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}