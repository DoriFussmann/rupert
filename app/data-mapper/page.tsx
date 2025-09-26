"use client";
import { useState, useEffect } from 'react';

interface Record {
  id: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
}

const OPENAI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

export default function DataMapperPage() {
  const [advisors, setAdvisors] = useState<Record[]>([]);
  const [tasks, setTasks] = useState<Record[]>([]);
  const [structures, setStructures] = useState<Record[]>([]);
  const [companies, setCompanies] = useState<Record[]>([]);
  
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [selectedStructure, setSelectedStructure] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4-turbo");
  const [maxTokens, setMaxTokens] = useState<number>(2000);
  const [temperature, setTemperature] = useState<number>(0.1);

  const [loading, setLoading] = useState(false);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    loadCollectionData();
  }, []);

  // Prevent body scroll when payload modal is open
  useEffect(() => {
    if (showPayloadModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [showPayloadModal]);

  async function loadCollectionData() {
    try {
      setLoading(true);
      const [advisorsRes, tasksRes, structuresRes, companiesRes] = await Promise.all([
        fetch('/api/collections/advisors/records'),
        fetch('/api/collections/tasks/records'),
        fetch('/api/collections/structures/records'),
        fetch('/api/collections/companies/records'),
      ]);

      let advisorsData: Record[] = [];
      let tasksData: Record[] = [];
      let structuresData: Record[] = [];
      let companiesData: Record[] = [];

      if (advisorsRes.ok) {
        advisorsData = await advisorsRes.json();
        setAdvisors(advisorsData);
        
        // Set default advisor to "Gideon" if found
        const gideonAdvisor = advisorsData.find(advisor => 
          advisor.data?.name?.toLowerCase().includes('gideon')
        );
        if (gideonAdvisor) {
          setSelectedAdvisor(gideonAdvisor.id);
        }
      }

      if (tasksRes.ok) {
        tasksData = await tasksRes.json();
        setTasks(tasksData);
        
        // Set default task to "map the data" if found
        const mapDataTask = tasksData.find(task => 
          task.data?.name?.toLowerCase().includes('map') && 
          task.data?.name?.toLowerCase().includes('data') ||
          task.data?.title?.toLowerCase().includes('map') && 
          task.data?.title?.toLowerCase().includes('data')
        );
        if (mapDataTask) {
          setSelectedTask(mapDataTask.id);
        }
      }

      if (structuresRes.ok) {
        structuresData = await structuresRes.json();
        setStructures(structuresData);
        
        // Set default structure to "business plan" if found
        const businessPlanStructure = structuresData.find(structure => 
          structure.data?.title?.toLowerCase().includes('business') && 
          structure.data?.title?.toLowerCase().includes('plan') ||
          structure.data?.name?.toLowerCase().includes('business') && 
          structure.data?.name?.toLowerCase().includes('plan')
        );
        if (businessPlanStructure) {
          setSelectedStructure(businessPlanStructure.id);
        }
      }

      if (companiesRes.ok) {
        companiesData = await companiesRes.json();
        setCompanies(companiesData);
        
        // Set default company to "AcmeTech" if found
        const acmeTechCompany = companiesData.find(company => 
          company.data?.name?.toLowerCase().includes('acmetech') ||
          company.data?.name?.toLowerCase().includes('acme tech')
        );
        if (acmeTechCompany) {
          setSelectedCompany(acmeTechCompany.id);
        }
      }
    } catch (error) {
      console.error('Failed to load collection data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Build the payload for the API call
  function buildPayload() {
    if (!selectedAdvisor || !selectedTask || !selectedStructure || !selectedCompany) {
      return null;
    }

    const advisor = advisors.find(a => a.id === selectedAdvisor);
    const task = tasks.find(t => t.id === selectedTask);
    const structure = structures.find(s => s.id === selectedStructure);
    const company = companies.find(c => c.id === selectedCompany);

    return {
      advisor: {
        name: advisor?.data?.name || 'Unknown Advisor',
        role: advisor?.data?.role || 'Unknown Role',
        prompt: advisor?.data?.prompt || ''
      },
      task: {
        name: task?.data?.name || task?.data?.title || 'Unknown Task',
        taskPrompt: task?.data?.taskPrompt || ''
      },
      structure: {
        outline: structure?.data?.outline || structure?.data?.compiled?.outline || {}
      },
      company: {
        name: company?.data?.name || 'Unknown Company',
        rawData: company?.data?.rawData || ''
      },
      parameters: {
        model: selectedModel,
        maxTokens,
        temperature
      }
    };
  }

  // Copy payload to clipboard
  async function copyPayload() {
    const payload = buildPayload();
    if (!payload) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      // You could add a toast notification here instead of alert
      alert('Payload copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy payload:', err);
      alert('Failed to copy payload to clipboard');
    }
  }

  // Copy API response to clipboard
  async function copyApiResponse() {
    if (!apiResult) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(apiResult, null, 2));
      alert('API response copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy API response:', err);
      alert('Failed to copy API response to clipboard');
    }
  }

  // Clear API results
  function clearApiResults() {
    setApiResult(null);
  }

  async function handleApiCall() {
    if (!selectedAdvisor || !selectedTask || !selectedStructure || !selectedCompany) {
      alert('Please select an advisor, task, structure, and company before making the API call.');
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    try {
      setLoading(true);
      setApiResult(null);

      const response = await fetch('/api/data-mapper/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();
      setApiResult(result);
    } catch (error) {
      console.error('API call failed:', error);
      setApiResult({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nb-container py-8">
        <div className="flex gap-8">
          {/* Left Content Area - Title and Selection Boxes */}
          <div className="w-80">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Data Mapper</h1>
              <p className="mt-2 text-gray-600">
                Transform and map data between different formats and structures.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Advisor Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Advisor
                </label>
                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Choose an advisor...</option>
                  {advisors.map((advisor) => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.data?.name || `Advisor ${advisor.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Task
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Choose a task...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.data?.name || task.data?.title || `Task ${task.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Structure Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Structure
                </label>
                <select
                  value={selectedStructure}
                  onChange={(e) => setSelectedStructure(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Choose a structure...</option>
                  {structures.map((structure) => (
                    <option key={structure.id} value={structure.id}>
                      {structure.data?.title || structure.data?.name || `Structure ${structure.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Choose a company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.data?.name || `Company ${company.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {OPENAI_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                  min="1"
                  max="8192"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature ({temperature})
                </label>
                <input
                  type="range"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 (Focused)</span>
                  <span>2 (Creative)</span>
                </div>
              </div>

              {/* Payload Preview Button */}
              <div className="pt-4">
                <button
                  onClick={() => setShowPayloadModal(true)}
                  disabled={!selectedAdvisor || !selectedTask || !selectedStructure || !selectedCompany}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
                >
                  Show Payload
                </button>

                {/* API Call Button */}
                <button
                  onClick={handleApiCall}
                  disabled={loading || !selectedAdvisor || !selectedTask || !selectedStructure || !selectedCompany}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'API Call'}
                </button>
              </div>
            </div>
          </div>
          </div>

          {/* Right Content Area - Results */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {apiResult ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">API Results</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyApiResponse}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Raw
                    </button>
                    <button
                      onClick={clearApiResults}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                {apiResult.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{apiResult.error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Success</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>API call completed successfully</p>
                            {apiResult.result?.usage && (
                              <p className="mt-1">
                                Tokens used: {apiResult.result.usage.total_tokens} 
                                (prompt: {apiResult.result.usage.prompt_tokens}, completion: {apiResult.result.usage.completion_tokens})
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* OpenAI Response Content */}
                    {apiResult.result?.content && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-3">
                          AI Response from {apiResult.result.advisor}
                        </h4>
                        <div className="bg-white p-4 rounded border">
                          <div className="whitespace-pre-wrap text-sm text-gray-800">
                            {apiResult.result.content}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Processing Details */}
                    <div className="bg-gray-50 rounded-md p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Processing Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Task:</span>
                          <span className="ml-2 text-gray-600">{apiResult.result?.task}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Company:</span>
                          <span className="ml-2 text-gray-600">{apiResult.result?.company}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Model:</span>
                          <span className="ml-2 text-gray-600">{apiResult.result?.model}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Temperature:</span>
                          <span className="ml-2 text-gray-600">{apiResult.result?.parameters?.temperature}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Raw Response Data (Collapsible) */}
                    <details className="bg-gray-50 rounded-md p-4">
                      <summary className="text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-700">
                        View Raw Response Data
                      </summary>
                      <pre className="text-sm bg-white p-3 rounded border overflow-x-auto max-h-96 overflow-y-auto font-mono mt-3">
                        {JSON.stringify(apiResult, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg 
                    className="mx-auto h-16 w-16" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Data Mapping Results
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Select an advisor, task, and structure from the sidebar to begin data mapping.
                  Results will appear here after the API call.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payload Modal */}
        {showPayloadModal && buildPayload() && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50,
              overflow: 'hidden'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPayloadModal(false);
              }
            }}
          >
            <div 
              style={{
                width: '100%', maxWidth: '896px', aspectRatio: '16/9',
                backgroundColor: 'white', borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                display: 'flex', flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <h3 className="text-xl font-normal">Payload Preview</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyPayload}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      Copy
                    </button>
                    <button 
                      onClick={() => setShowPayloadModal(false)} 
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 rounded p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(buildPayload(), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
