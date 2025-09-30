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
          />
        </div>
      </div>
    </>
  );
}
