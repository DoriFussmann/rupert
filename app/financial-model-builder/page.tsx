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
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, timestamp: Date, isUser: boolean}>>([]);

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
        const page = records.find(r => String((r.data as any)?.name || '').toLowerCase() === 'financial model builder');
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

  async function handleSendPayloadToChat(message: string) {
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      timestamp: new Date(),
      isUser: true
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    // Send to OpenAI for processing
    try {
      console.log('Sending message to OpenAI API...');
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: message,
          chatHistory: chatMessages
        })
      });
      
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: data.response || 'I\'ve processed your message and here are my insights...',
          timestamp: new Date(),
          isUser: false
        };
        
        setChatMessages(prev => [...prev, aiResponse]);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('API Error:', errorData);
        const errorMessage = errorData.error || errorData.details || 'Unknown error';
        throw new Error(`API Error: ${response.status} - ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error while processing your message: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
        isUser: false
      };
      setChatMessages(prev => [...prev, errorResponse]);
    }
  }

  function handlePayloadUpload() {
    if (!payloadText.trim()) {
      alert('Please enter some payload text');
      return;
    }
    
    // Send payload to chat with special formatting
    const payloadMessage = `📄 **Payload Uploaded:**\n\n${payloadText}`;
    handleSendPayloadToChat(payloadMessage);
    
    // Close modal and clear text
    setIsPayloadModalOpen(false);
    setPayloadText('');
  }

  function handleClosePayloadModal() {
    setIsPayloadModalOpen(false);
    setPayloadText('');
  }

  function handleClearChat() {
    setChatMessages([]);
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
          />
          
          <OutputsPanel
            outputsExpanded={outputsExpanded}
            onToggleExpanded={() => setOutputsExpanded((v) => !v)}
            isBlinking={isOutputsPanelBlinking}
            howItWorksTexts={howItWorksTexts}
            onTriggerSuccessSequence={triggerSuccessSequence}
            isSimulating={isSimulating}
            simulateResult={simulateResult}
            loadingMessages={loadingMessages}
            onTriggerInputsPanelBlink={triggerInputsPanelBlink}
            onTriggerOutputsPanelBlink={triggerOutputsPanelBlink}
            chatMessages={chatMessages}
            onSendPayloadToChat={handleSendPayloadToChat}
            onClearChat={handleClearChat}
            advisorName={advisorName}
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
                className="flex-1 border border-gray-300 rounded-md p-3 text-sm font-mono resize-none"
                placeholder="Paste your payload text here..."
                rows={15}
              />
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleClosePayloadModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayloadUpload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Send to Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
