"use client";
import { useEffect, useState } from "react";
import NavigationHeader from "../components/NavigationHeader";
import InputsPanel from "../components/InputsPanel";
import OutputsPanel from "../components/OutputsPanel";

export default function FinancialModelBuilder() {
  const [outputsExpanded, setOutputsExpanded] = useState(false);
  const [advisorImageUrl, setAdvisorImageUrl] = useState<string | null>(null);
  const [advisorName, setAdvisorName] = useState<string>('Financial Advisor');
  const [howItWorksTexts, setHowItWorksTexts] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateResult, setSimulateResult] = useState<null | { ok: boolean; elapsedMs: number; startedAt: number; finishedAt: number }>(null);
  const [isInputsPanelBlinking, setIsInputsPanelBlinking] = useState(false);
  const [isOutputsPanelBlinking, setIsOutputsPanelBlinking] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  const [payloadText, setPayloadText] = useState('');
  const [isUploadingPayload, setIsUploadingPayload] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isRunningApiCall, setIsRunningApiCall] = useState(false);
  const [apiCallResult, setApiCallResult] = useState<string>('');

  const loadingMessages = [
    "Analyzing financial metrics…",
    "Calculating projections…",
    "Validating assumptions…",
    "Building model structure…",
    "Optimizing scenarios…",
  ];

  // Load advisor image and How It Works text assigned to this page via Tools & Pages
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const toolsRes = await fetch('/api/collections/tools-pages/records', { headers: { 'Content-Type': 'application/json' } });
        if (!toolsRes.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await toolsRes.json();
        const page = records.find(r => String((r.data as any)?.name || '').toLowerCase() === 'model builder');
        const advisorId = page?.data ? (page.data as any).mainAdvisorId : null;
        const hiw: string[] = page?.data ? [
          String((page.data as any).howItWorks1 || '').trim(),
          String((page.data as any).howItWorks2 || '').trim(),
          String((page.data as any).howItWorks3 || '').trim(),
          String((page.data as any).howItWorks4 || '').trim(),
        ].filter(Boolean) : [];
        if (!cancelled) setHowItWorksTexts(hiw);
        if (!advisorId) {
          return;
        }
        const advRes = await fetch(`/api/collections/advisors/records/${advisorId}`, { headers: { 'Content-Type': 'application/json' } });
        if (!advRes.ok) return;
        const advisor = await advRes.json();
        const raw = advisor?.data?.image ? String(advisor.data.image) : '';
        const img = raw
          ? (/^https?:\/\//i.test(raw) || raw.startsWith('/') ? raw : `/uploads/${raw}`)
          : '';
        const name = advisor?.data?.name ? String(advisor.data.name) : 'Financial Advisor';
        if (!cancelled) {
          setAdvisorImageUrl(img || null);
          setAdvisorName(name);
        }
      } catch (error) {
        console.error('Error loading advisor data:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSimulate() {
    try {
      setIsSimulating(true);
      setSimulateResult(null);
      const res = await fetch('/api/simulate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ from: 'financial-model-builder' }) 
      });
      const json = await res.json().catch(() => ({ ok: false }));
      setSimulateResult({ 
        ok: Boolean(json?.ok), 
        elapsedMs: Number(json?.elapsedMs || 0), 
        startedAt: Number(json?.startedAt || Date.now()), 
        finishedAt: Number(json?.finishedAt || Date.now()) 
      });
    } finally {
      setIsSimulating(false);
    }
  }

  function triggerSuccessSequence() {
    // Handle success sequence if needed
  }

  function triggerInputsPanelBlink() {
    setIsInputsPanelBlinking(true);
    // Stop blinking after 2 blinks (1 second total: 0.5s per blink)
    setTimeout(() => {
      setIsInputsPanelBlinking(false);
    }, 1000);
  }

  function triggerOutputsPanelBlink() {
    // Add delay before starting the blink
    setTimeout(() => {
      setIsOutputsPanelBlinking(true);
      // Stop blinking after 2 blinks (1.6 seconds total: 0.8s per blink, slower)
      setTimeout(() => {
        setIsOutputsPanelBlinking(false);
      }, 1600);
    }, 800); // 800ms delay before starting
  }

  async function handlePayloadUpload() {
    if (!payloadText.trim()) {
      setUploadStatus('❌ Please enter some payload text');
      setTimeout(() => setUploadStatus(''), 3000);
      return;
    }
    
    setIsUploadingPayload(true);
    setUploadStatus('🔄 Processing payload...');
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success feedback with debug info
      const payloadPreview = payloadText.substring(0, 100);
      const isCurlCommand = payloadText.includes('curl');
      const isApiCall = payloadText.includes('api.openai.com');
      
      setUploadStatus(`✅ Payload uploaded successfully! 
      
📊 Debug Info:
• Length: ${payloadText.length} characters
• Type: ${isCurlCommand ? 'Curl Command' : 'Text'}
• API Call: ${isApiCall ? 'Yes (OpenAI API)' : 'No'}
• Preview: "${payloadPreview}${payloadText.length > 100 ? '...' : ''}"`);
      
      // Auto-close after showing success
      setTimeout(() => {
        setIsPayloadModalOpen(false);
        setPayloadText('');
        setUploadStatus('');
      }, 4000);
      
    } catch (error) {
      setUploadStatus('❌ Error uploading payload. Please try again.');
      setTimeout(() => setUploadStatus(''), 3000);
    } finally {
      setIsUploadingPayload(false);
    }
  }

  function handleClosePayloadModal() {
    setIsPayloadModalOpen(false);
    setPayloadText('');
  }

  async function handleRunApiCall(taskPrompt: string) {
    setIsRunningApiCall(true);
    setApiCallResult('');
    
    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: taskPrompt,
          chatHistory: []
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiCallResult(data.response || 'No response received');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setApiCallResult(`Error: ${response.status} - ${errorData.error || 'Failed to get response'}`);
      }
    } catch (error) {
      console.error('Error running API call:', error);
      setApiCallResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningApiCall(false);
    }
  }

  // Hide layout header for this page
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-layout-header-financial';
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
      const styleElement = document.getElementById('hide-layout-header-financial');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className={`flex ${outputsExpanded ? "gap-0" : "gap-4"}`}>
          <InputsPanel
            outputsExpanded={outputsExpanded}
            isBlinking={isInputsPanelBlinking}
            advisorImageUrl={advisorImageUrl}
            advisorName={advisorName}
            onSimulate={handleSimulate}
            isSimulating={isSimulating}
            onOpenPayloadModal={() => setIsPayloadModalOpen(true)}
            onRunApiCall={handleRunApiCall}
          />
          
          <OutputsPanel
            outputsExpanded={outputsExpanded}
            onToggleExpanded={() => setOutputsExpanded((v) => !v)}
            isRunningApiCall={isRunningApiCall}
            apiCallResult={apiCallResult}
          />
        </div>
      </div>

      {/* Full Payload Upload Modal */}
      {isPayloadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Full Payload Upload</h2>
              <button
                onClick={handleClosePayloadModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Paste your payload text below:
              </label>
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                disabled={isUploadingPayload}
                className={`flex-1 border border-gray-300 rounded-md p-3 text-sm font-mono resize-none ${
                  isUploadingPayload ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Paste your payload text here..."
                rows={15}
              />
              
              {/* Debug Status Display */}
              {uploadStatus && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-sm font-mono whitespace-pre-wrap text-gray-700">
                    {uploadStatus}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleClosePayloadModal}
                  disabled={isUploadingPayload}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayloadUpload}
                  disabled={isUploadingPayload}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                    isUploadingPayload 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isUploadingPayload && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isUploadingPayload ? 'Uploading...' : 'Send to Chat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
