"use client";
import { useEffect, useState } from "react";
import NavigationHeader from "../components/NavigationHeader";
import InputsPanel from "../components/InputsPanel";
import OutputsPanel from "../components/OutputsPanel";

export default function ModelBuilderPage() {
  const [outputsExpanded, setOutputsExpanded] = useState(false);
  const [isRunningApiCall, setIsRunningApiCall] = useState(false);
  const [apiCallResult, setApiCallResult] = useState<string | null>(null);
  const [apiCallDebugInfo, setApiCallDebugInfo] = useState<any>(null);

  // Hide layout header for this page
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-layout-header-model-builder';
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
    return () => { const el = document.getElementById('hide-layout-header-model-builder'); if (el) el.remove(); };
  }, []);

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className={`flex ${outputsExpanded ? "gap-0" : "gap-4"}`}>
          <InputsPanel
            outputsExpanded={outputsExpanded}
            onApiCallStart={() => setIsRunningApiCall(true)}
            onApiCallComplete={(result: string, debugInfo: any) => {
              setIsRunningApiCall(false);
              setApiCallResult(result);
              setApiCallDebugInfo(debugInfo);
            }}
          />
          <OutputsPanel
            outputsExpanded={outputsExpanded}
            onToggleExpanded={() => setOutputsExpanded((v) => !v)}
            isRunningApiCall={isRunningApiCall}
            apiCallResult={apiCallResult}
            apiCallDebugInfo={apiCallDebugInfo}
          />
        </div>
      </div>
    </>
  );
}


