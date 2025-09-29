"use client";
import { useEffect, useMemo, useState } from 'react';
import NavigationHeader from '../components/NavigationHeader';

export default function DataMapperPage() {
  const [outputsExpanded, setOutputsExpanded] = useState(false);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [structures, setStructures] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const MODEL_OPTIONS: Record<string, string[]> = {
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    gemini: ["gemini-1.5-flash", "gemini-1.5-pro"],
  };
  const [model, setModel] = useState<string>(MODEL_OPTIONS["openai"][0]);
  const [maxTokens, setMaxTokens] = useState<number>(512);
  const [temperature, setTemperature] = useState<number>(0.1);
  const MAX_TOKEN_OPTIONS = [128, 256, 512, 1024, 2048, 4096, 8192];
  const TEMP_OPTIONS = [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0];
  const [showPayload, setShowPayload] = useState(false);
  const [showFullPayload, setShowFullPayload] = useState(false);
  const [fullPayloadText, setFullPayloadText] = useState<string>("{\n  \"example\": \"value\"\n}");
  const [isRunningFullPayload, setIsRunningFullPayload] = useState(false);
  const [fullPayloadResult, setFullPayloadResult] = useState<any>(null);
  const [fullPayloadError, setFullPayloadError] = useState<string | null>(null);
  const [fullPayloadDebugInfo, setFullPayloadDebugInfo] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const payload = useMemo(() => {
    const task = tasks.find(t => t.id === selectedTaskId);
    const structure = structures.find(s => s.id === selectedStructureId);
    const company = companies.find(c => c.id === selectedCompanyId);
    return {
      task: task ? { id: task.id, name: task.name } : null,
      structure: structure ? { id: structure.id, title: structure.title } : null,
      company: company ? { id: company.id, name: company.name } : null,
      llm: provider,
      model,
      maxTokens,
      temperature,
    };
  }, [tasks, selectedTaskId, structures, selectedStructureId, companies, selectedCompanyId, provider, model, maxTokens, temperature]);
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

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch('/api/collections/tasks/records', { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await res.json();
        const mapped = records.map(r => ({ id: r.id, name: String((r.data as any)?.name || 'Unnamed Task') }));
        setTasks(mapped);
      } catch {}
    }
    async function loadStructures() {
      try {
        const res = await fetch('/api/collections/structures/records', { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await res.json();
        const mapped = records.map(r => ({ id: r.id, title: String((r.data as any)?.title || 'Untitled Structure') }));
        setStructures(mapped);
      } catch {}
    }
    async function loadCompanies() {
      try {
        const res = await fetch('/api/collections/companies/records', { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await res.json();
        const mapped = records.map(r => ({ id: r.id, name: String((r.data as any)?.name || 'Unnamed Company') }));
        setCompanies(mapped);
      } catch {}
    }
    loadTasks();
    loadStructures();
    loadCompanies();
  }, []);

  // Set default selections if present in loaded data
  useEffect(() => {
    if (!selectedTaskId && tasks.length > 0) {
      const t = tasks.find(x => x.name?.toLowerCase?.().includes("map the data"));
      if (t) setSelectedTaskId(t.id);
    }
  }, [tasks]);
  useEffect(() => {
    if (!selectedStructureId && structures.length > 0) {
      const s = structures.find(x => x.title?.toLowerCase?.().includes("business plan"));
      if (s) setSelectedStructureId(s.id);
    }
  }, [structures]);
  useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      const c = companies.find(x => x.name?.toLowerCase?.().includes("acmetech"));
      if (c) setSelectedCompanyId(c.id);
    }
  }, [companies]);

  // Keep model in sync with provider selection
  useEffect(() => {
    const defaults = MODEL_OPTIONS[provider] || [];
    if (!defaults.includes(model)) setModel(defaults[0] || "");
  }, [provider]);

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className={`flex ${outputsExpanded ? "gap-0" : "gap-4"}`}>
          {/* Left Panel - 25% width, aligned with page name ribbon */}
          <div
            className="relative"
            style={{ width: outputsExpanded ? "0%" : "25%", transition: "width 200ms ease", pointerEvents: outputsExpanded ? "none" : "auto" }}
          >
            <div className={`${outputsExpanded ? "opacity-0" : "opacity-100"} bg-white rounded-md border border-gray-200 transition-opacity duration-200`}>
              <button
                type="button"
                aria-label="Toggle Inputs visibility"
                aria-expanded={!inputsCollapsed}
                onClick={() => setInputsCollapsed((v) => !v)}
                className="w-full bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200 flex items-center gap-2 text-left hover:bg-gray-200/60"
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
                {/* Dropdown Menu - identical to header Menu button */}
                <div className="relative group">
                  <div className="mb-1 text-xs font-medium text-gray-600">Task</div>
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  <span className="text-xs whitespace-nowrap truncate">{selectedTaskId ? (tasks.find(t => t.id === selectedTaskId)?.name || 'Select Task') : 'Select Task'}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                    <div className="py-2">
                      {tasks.map(t => (
                        <button
                          key={t.id}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          onClick={(e) => { e.preventDefault(); setSelectedTaskId(t.id); }}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Structure selector */}
                <div className="relative group mt-4">
                  <div className="mb-1 text-xs font-medium text-gray-600">Structure</div>
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  <span className="text-xs whitespace-nowrap truncate">{selectedStructureId ? (structures.find(s => s.id === selectedStructureId)?.title || 'Select Structure') : 'Select Structure'}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                    <div className="py-2">
                      {structures.map(s => (
                        <button
                          key={s.id}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          onClick={(e) => { e.preventDefault(); setSelectedStructureId(s.id); }}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Company selector */}
                <div className="relative group mt-4">
                  <div className="mb-1 text-xs font-medium text-gray-600">Company</div>
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  <span className="text-xs whitespace-nowrap truncate">{selectedCompanyId ? (companies.find(c => c.id === selectedCompanyId)?.name || 'Select Company') : 'Select Company'}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                    <div className="py-2">
                      {companies.map(c => (
                        <button
                          key={c.id}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          onClick={(e) => { e.preventDefault(); setSelectedCompanyId(c.id); }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LLM + Model row */}
                <div className="my-3 border-t border-gray-200" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* LLM Provider selector */}
                  <div className="relative group">
                    <div className="mb-1 text-xs font-medium text-gray-600">LLM</div>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                      <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs whitespace-nowrap truncate">{provider === "openai" ? "OpenAI" : "Gemini"}</span>
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                      <div className="py-2">
                        {[{id:"openai",label:"OpenAI"},{id:"gemini",label:"Gemini"}].map(p => (
                          <button
                            key={p.id}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            onClick={(e) => { e.preventDefault(); setProvider(p.id as any); }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Model selector (depends on provider) */}
                  <div className="relative group">
                    <div className="mb-1 text-xs font-medium text-gray-600">Model</div>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                      <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs whitespace-nowrap truncate">{model || "Select Model"}</span>
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000] max-h-64 overflow-auto">
                      <div className="py-2">
                        {(MODEL_OPTIONS[provider] || []).map(m => (
                          <button
                            key={m}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            onClick={(e) => { e.preventDefault(); setModel(m); }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tokens + Temperature row */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* Max Tokens dropdown */}
                  <div className="relative group">
                    <div className="mb-1 text-xs font-medium text-gray-600">Max Tokens</div>
                    <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-black border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                      <span className="whitespace-nowrap truncate">{maxTokens}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000] max-h-64 overflow-auto">
                      <div className="py-2">
                        {MAX_TOKEN_OPTIONS.map(v => (
                          <button key={v} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={(e)=>{e.preventDefault(); setMaxTokens(v);}}>{v}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Temperature dropdown */}
                  <div className="relative group">
                    <div className="mb-1 text-xs font-medium text-gray-600">Temp</div>
                    <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-black border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                      <span className="whitespace-nowrap truncate">{temperature}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000] max-h-64 overflow-auto">
                      <div className="py-2">
                        {TEMP_OPTIONS.map(v => (
                          <button key={v} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={(e)=>{e.preventDefault(); setTemperature(v);}}>{v}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show + Run row */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
                    onClick={() => setShowPayload(true)}
                  >
                    Show
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
                  >
                    Run
                  </button>
                </div>

                {/* Separator */}
                <div className="my-3 border-t border-gray-200" />

                {/* Full Payload Button */}
                <button
                  type="button"
                  className="w-full px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
                  onClick={() => setShowFullPayload(true)}
                >
                  Full Payload
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Right Panel - 75% width, Outputs Panel */}
          <div
            className="overflow-hidden"
            style={{ width: outputsExpanded ? "100%" : "calc(75% - 0.5rem)", transition: "width 200ms ease" }}
          >
            <div className="bg-white rounded-md border border-gray-200 transition-colors">
              <div className="bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Toggle Outputs width"
                    aria-expanded={outputsExpanded}
                    onClick={() => setOutputsExpanded((v) => !v)}
                    className={`p-1 ${outputsExpanded ? "ml-0" : "-ml-1"} text-gray-700 hover:text-gray-900 relative z-10`}
                  >
                    <svg
                      className={`w-4 h-4 transform transition-transform ${outputsExpanded ? "" : "rotate-180"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <h2 className="text-sm font-medium text-gray-900">Outputs Panel</h2>
                </div>
              </div>
              <div className="p-4">
                {fullPayloadResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">API Response</div>
                      <div className="flex gap-2">
                        <button
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          onClick={() => {
                            const rawResponse = JSON.stringify(fullPayloadResult, null, 2);
                            navigator.clipboard?.writeText(rawResponse);
                          }}
                        >
                          Copy Raw
                        </button>
                        <button
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          onClick={() => {
                            setFullPayloadResult(null);
                            setFullPayloadError(null);
                            setFullPayloadDebugInfo(null);
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-md">
                      <div className="px-3 py-2 border-b border-gray-200 bg-gray-100 text-xs font-medium text-gray-700">
                        Raw Response
                      </div>
                      <pre className="p-3 text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap">
                        {JSON.stringify(fullPayloadResult, null, 2)}
                      </pre>
                    </div>
                    
                    {fullPayloadResult.result?.content && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md">
                        <div className="px-3 py-2 border-b border-blue-200 bg-blue-100 text-xs font-medium text-blue-800">
                          AI Response Content
                        </div>
                        <div className="p-3 text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-auto">
                          {fullPayloadResult.result.content}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    No output yet. Run an API call to see results here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPayload && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPayload(false)} />
          <div className="relative bg-white w-[min(90vw,700px)] max-h-[80vh] rounded-lg border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">Pre-flight Payload</div>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => navigator.clipboard?.writeText(JSON.stringify(payload, null, 2))}
                >
                  Copy
                </button>
                <button
                  className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => setShowPayload(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto">
              <pre className="text-xs leading-5 text-gray-800 whitespace-pre-wrap">
{JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      {showFullPayload && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFullPayload(false)} />
          <div className="relative bg-white w-[min(95vw,800px)] h-[min(85vh,700px)] rounded-lg border border-gray-200 shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">Full Payload</div>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => navigator.clipboard?.writeText(fullPayloadText)}
                >
                  Copy
                </button>
                <button
                  className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => setShowFullPayload(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              {!fullPayloadResult && !fullPayloadError ? (
              <textarea
                className="w-full h-full text-xs leading-5 text-gray-800 border border-gray-300 rounded-md p-3 font-mono"
                value={fullPayloadText}
                onChange={(e) => setFullPayloadText(e.target.value)}
                  placeholder="Enter your custom JSON payload here..."
                />
              ) : (
                <div className="h-full overflow-auto">
                  {fullPayloadError ? (
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="text-sm font-medium text-red-800 mb-2">Error</div>
                        <div className="text-sm text-red-700 mb-3">{fullPayloadError}</div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <button
                            className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                            onClick={() => {
                              setFullPayloadError(null);
                              setFullPayloadResult(null);
                              setFullPayloadDebugInfo(null);
                              setShowDebugInfo(false);
                            }}
                          >
                            Try Again
                          </button>
                          
                          {fullPayloadDebugInfo && (
                            <button
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                              onClick={() => setShowDebugInfo(!showDebugInfo)}
                            >
                              {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {showDebugInfo && fullPayloadDebugInfo && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-800">Debug Information</div>
                            <button
                              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              onClick={() => {
                                const essentialDebug = {
                                  timestamp: fullPayloadDebugInfo.timestamp,
                                  error: {
                                    type: fullPayloadDebugInfo.error?.type,
                                    message: fullPayloadDebugInfo.error?.message,
                                    stage: fullPayloadDebugInfo.error?.stage,
                                    ...(fullPayloadDebugInfo.error?.details && { details: fullPayloadDebugInfo.error.details })
                                  },
                                  request: {
                                    url: fullPayloadDebugInfo.request?.url,
                                    method: fullPayloadDebugInfo.request?.method
                                  },
                                  ...(fullPayloadDebugInfo.response && {
                                    response: {
                                      status: fullPayloadDebugInfo.response.status,
                                      statusText: fullPayloadDebugInfo.response.statusText,
                                      error: fullPayloadDebugInfo.response.body?.error,
                                      details: fullPayloadDebugInfo.response.body?.details
                                    }
                                  })
                                };
                                const debugText = JSON.stringify(essentialDebug, null, 2);
                                navigator.clipboard?.writeText(debugText);
                              }}
                            >
                              Copy Debug Info
                            </button>
                          </div>
                          
                          <div className="space-y-3 text-xs">
                            <div>
                              <div className="font-medium text-gray-700 mb-1">Error Details:</div>
                              <div className="bg-white border rounded p-2">
                                <div><strong>Type:</strong> {fullPayloadDebugInfo.error?.type}</div>
                                <div><strong>Stage:</strong> {fullPayloadDebugInfo.error?.stage}</div>
                                <div><strong>Message:</strong> {fullPayloadDebugInfo.error?.message}</div>
                                {fullPayloadDebugInfo.error?.details && (
                                  <div><strong>Details:</strong> {fullPayloadDebugInfo.error.details}</div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <div className="font-medium text-gray-700 mb-1">Request:</div>
                              <pre className="bg-white border rounded p-2 text-xs overflow-auto max-h-32">
                                {JSON.stringify(fullPayloadDebugInfo.request, null, 2)}
                              </pre>
                            </div>
                            
                            {fullPayloadDebugInfo.response && (
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Response:</div>
                                <pre className="bg-white border rounded p-2 text-xs overflow-auto max-h-32">
                                  {JSON.stringify(fullPayloadDebugInfo.response, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            <div>
                              <div className="font-medium text-gray-700 mb-1">Timestamp:</div>
                              <div className="bg-white border rounded p-2">
                                {fullPayloadDebugInfo.timestamp}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : fullPayloadResult ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="text-sm font-medium text-green-800 mb-1">Success</div>
                        <div className="text-xs text-green-700">
                          API Call Type: {fullPayloadResult.apiCallType} | 
                          Model: {fullPayloadResult.result?.model} | 
                          Tokens: {fullPayloadResult.result?.usage?.total_tokens || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <div className="text-sm font-medium text-gray-800 mb-2">AI Response</div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-auto">
                          {fullPayloadResult.result?.content || 'No content returned'}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <div className="text-sm font-medium text-gray-800 mb-2">Full Response</div>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-auto">
                          {JSON.stringify(fullPayloadResult, null, 2)}
                        </pre>
                      </div>
                      
                      <button
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        onClick={() => {
                          setFullPayloadError(null);
                          setFullPayloadResult(null);
                        }}
                      >
                        Run Another Request
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                className={`text-sm px-3 py-1.5 border border-gray-300 rounded-md transition-colors ${
                  isRunningFullPayload 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                disabled={isRunningFullPayload}
                onClick={async () => {
                  if (isRunningFullPayload) return;
                  
                  const debugInfo = {
                    timestamp: new Date().toISOString(),
                    request: {
                      url: '/api/data-mapper/process-custom',
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: fullPayloadText
                    },
                    response: null,
                    error: null,
                    parsedPayload: null
                  };
                  
                  try {
                    setIsRunningFullPayload(true);
                    setFullPayloadError(null);
                    setFullPayloadResult(null);
                    setFullPayloadDebugInfo(null);
                    setShowDebugInfo(false);
                    
                    // Validate JSON first
                    try {
                      debugInfo.parsedPayload = JSON.parse(fullPayloadText);
                    } catch (parseError) {
                      debugInfo.error = {
                        type: 'JSON_PARSE_ERROR',
                        message: parseError instanceof Error ? parseError.message : 'Invalid JSON',
                        stage: 'validation'
                      };
                      throw parseError;
                    }
                    
                    // Call the correct endpoint
                    const response = await fetch('/api/data-mapper/process-custom', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: fullPayloadText
                    });
                    
                    debugInfo.response = {
                      status: response.status,
                      statusText: response.statusText,
                      headers: Object.fromEntries(response.headers.entries()),
                      url: response.url
                    };
                    
                    const result = await response.json();
                    debugInfo.response.body = result;
                    
                    if (response.ok) {
                      setFullPayloadResult(result);
                      setShowFullPayload(false); // Close the modal on success
                    } else {
                      debugInfo.error = {
                        type: 'API_ERROR',
                        message: result.error || 'API call failed',
                        details: result.details || null,
                        stage: 'api_response'
                      };
                      setFullPayloadError(result.error || 'API call failed');
                      setFullPayloadDebugInfo(debugInfo);
                    }
                    
                  } catch (error) {
                    console.error('Full payload API error:', error);
                    
                    if (!debugInfo.error) {
                      debugInfo.error = {
                        type: 'NETWORK_ERROR',
                        message: error instanceof Error ? error.message : 'Unknown network error',
                        stage: 'network'
                      };
                    }
                    
                    setFullPayloadError(
                      error instanceof Error 
                        ? error.message 
                        : 'Invalid JSON or network error'
                    );
                    setFullPayloadDebugInfo(debugInfo);
                  } finally {
                    setIsRunningFullPayload(false);
                  }
                }}
              >
                {isRunningFullPayload ? 'Running...' : 'Run Full Payload API Call'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

