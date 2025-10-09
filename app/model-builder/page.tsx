"use client";
import { useEffect, useState, useRef } from "react";
import NavigationHeader from "../components/NavigationHeader";
import InputsPanel from "../components/InputsPanel";
import OutputsPanel from "../components/OutputsPanel";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

export default function ModelBuilderPage() {
  const [outputsExpanded, setOutputsExpanded] = useState(false);
  const [isRunningApiCall, setIsRunningApiCall] = useState(false);
  const [apiCallResult, setApiCallResult] = useState<string | null>(null);
  const [apiCallDebugInfo, setApiCallDebugInfo] = useState<any>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  
  // Company data for context
  const [companyData, setCompanyData] = useState<any>(null);
  
  // Ref to access InputsPanel controls (we'll pass this as a callback)
  const getControlsRef = useRef<(() => any) | null>(null);
  
  // Debug state
  const [lastSentPayload, setLastSentPayload] = useState<any>(null);
  const [lastApiResponse, setLastApiResponse] = useState<any>(null);
  const [finalOutput, setFinalOutput] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isSavingDataMap, setIsSavingDataMap] = useState(false);
  const [saveDataMapMessage, setSaveDataMapMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [dataMapSaved, setDataMapSaved] = useState(false);
  const [isInModelBuildStep, setIsInModelBuildStep] = useState(false);
  
  // Separate chat for Top-Line Builder
  const [topLineChatMessages, setTopLineChatMessages] = useState<ChatMessage[]>([]);
  const [isTopLineTypingResponse, setIsTopLineTypingResponse] = useState(false);

  // Fetch user's company data
  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const meResponse = await fetch('/api/auth/me');
        if (!meResponse.ok) {
          console.error('Failed to fetch user data');
          return;
        }
        
        const userData = await meResponse.json();
        console.log('=== USER DATA ===');
        console.log('User:', userData);
        console.log('User object:', userData.user);
        console.log('User company ID:', userData.user?.company);
        console.log('=================');
        
        if (!userData.user?.company) {
          console.warn('User has no company assigned');
          return;
        }
        
        // Fetch company record
        const companyResponse = await fetch(`/api/collections/companies/records/${userData.user.company}`);
        if (companyResponse.ok) {
          const company = await companyResponse.json();
          console.log('=== COMPANY DATA ===');
          console.log('Company Record:', company);
          console.log('Company ID:', company.id);
          console.log('Company data object:', company.data);
          console.log('Company data keys:', company.data ? Object.keys(company.data) : 'No data object');
          console.log('dataMap exists?:', !!company.data?.dataMap);
          console.log('data_map exists?:', !!company.data?.data_map);
          console.log('DataMap exists?:', !!company.data?.DataMap);
          if (company.data) {
            console.log('All company.data fields:', JSON.stringify(company.data, null, 2));
          }
          console.log('====================');
          setCompanyData(company);
        } else {
          console.error('Failed to fetch company record:', companyResponse.status);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    }
    fetchCompanyData();
  }, []);

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

  // Handle saving business classification to company data map
  async function handleUpdateBusinessDataMap() {
    if (!finalOutput) {
      setSaveDataMapMessage({ type: 'error', text: 'No classification data to save' });
      return;
    }

    setIsSavingDataMap(true);
    setSaveDataMapMessage(null);

    try {
      const response = await fetch('/api/companies/update-data-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataMap: finalOutput })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update data map');
      }

      setSaveDataMapMessage({ type: 'success', text: 'Business classification saved successfully!' });
      setDataMapSaved(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveDataMapMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving data map:', error);
      setSaveDataMapMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save classification' 
      });
    } finally {
      setIsSavingDataMap(false);
    }
  }

  // Handle Top-Line Builder chat message sending
  async function handleTopLineSendMessage(messageText: string) {
    if (!messageText.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: messageText.trim(),
      timestamp: new Date(),
      isUser: true
    };
    
    setTopLineChatMessages(prev => [...prev, userMessage]);
    setIsTopLineTypingResponse(true);
    
    try {
      // Get current controls from InputsPanel (Top-Line Builder controls)
      const controls = getControlsRef.current ? getControlsRef.current() : null;
      if (!controls) {
        throw new Error('Controls not available');
      }
      
      // Use Top-Line System Prompt instead of Business Taxonomy
      let processedSystemPrompt = controls.topLineSystemPrompt || '';
      
      // Add company data map context if enabled
      if (controls.includeDataMapContext && companyData?.data?.dataMap) {
        const dataMapContext = `\n\n## Business Data Map Context\n\nThe following is the business data map for the company:\n\n${JSON.stringify(companyData.data.dataMap, null, 2)}`;
        processedSystemPrompt += dataMapContext;
      }
      
      // Build messages: system + prior chat + new user message
      const messages = [
        { role: 'system', content: processedSystemPrompt },
        ...topLineChatMessages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: messageText }
      ];

      const payload: any = {
        model: controls.model || 'gpt-4o-mini',
        temperature: controls.temperature ?? 0.2,
        max_tokens: controls.maxOutputTokens || 2500,
        top_p: controls.topP ?? 1.0,
        frequency_penalty: controls.frequencyPenalty ?? 0,
        presence_penalty: controls.presencePenalty ?? 0,
        messages
      };
      
      if (controls.responseFormat) {
        payload.response_format = { type: controls.responseFormat };
      }
      
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      let responseText = result.response || result.output_text || result.choices?.[0]?.message?.content || '';
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
        timestamp: new Date(),
        isUser: false
      };
      
      setTopLineChatMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Top-Line chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date(),
        isUser: false
      };
      setTopLineChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTopLineTypingResponse(false);
    }
  }

  // Build chat debug info
  function buildChatDebugInfo() {
    const controls = getControlsRef.current ? getControlsRef.current() : null;
    return {
      timestamp: new Date().toISOString(),
      chatMessages: chatMessages,
      selectedSystemPrompt: controls?.systemPrompt ? 'Loaded' : 'None',
      threshold: controls?.completionThreshold || 80,
      includeDataMapContext: controls?.includeDataMapContext || false,
      hasCompanyData: !!companyData,
      hasCompanyDataMap: !!companyData?.data?.dataMap,
      companyDataMapPreview: companyData?.data?.dataMap ? JSON.stringify(companyData.data.dataMap).substring(0, 200) + '...' : 'No dataMap',
      companyId: companyData?.id || 'No company',
      dataMapContextStatus: (controls?.includeDataMapContext && companyData?.data?.dataMap) ? '✅ Data Map is being sent' : '❌ Data Map is NOT being sent',
      controls: controls ? {
        model: controls.model,
        responseFormat: controls.responseFormat,
        temperature: controls.temperature,
        maxOutputTokens: controls.maxOutputTokens,
        topP: controls.topP,
        reasoningEffort: controls.reasoningEffort,
        verbosity: controls.verbosity,
        frequencyPenalty: controls.frequencyPenalty,
        presencePenalty: controls.presencePenalty,
        storeLogs: controls.storeLogs
      } : null,
      lastSentPayload: lastSentPayload,
      lastApiResponse: lastApiResponse
    };
  }

  // Handle chat message sending
  async function handleSendMessage(messageText: string) {
    if (!messageText.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: messageText.trim(),
      timestamp: new Date(),
      isUser: true
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setIsTypingResponse(true);
    
    try {
      // Get current controls from InputsPanel
      const controls = getControlsRef.current ? getControlsRef.current() : null;
      if (!controls) {
        throw new Error('Controls not available');
      }
      
      // Calculate threshold decimal once for reuse
      const thresholdDecimal = (controls.completionThreshold || 80) / 100;
      
      let processedSystemPrompt = controls.systemPrompt || '';
      
      // Replace threshold placeholder
      processedSystemPrompt = processedSystemPrompt.replace(/\{\{THRESHOLD\}\}/g, String(thresholdDecimal));
      
      // Debug logging
      console.log('=== DATA MAP CONTEXT DEBUG ===');
      console.log('includeDataMapContext:', controls.includeDataMapContext);
      console.log('Threshold:', controls.completionThreshold, '% (', thresholdDecimal, ')');
      console.log('Has companyData:', !!companyData);
      console.log('Has dataMap:', !!companyData?.data?.dataMap);
      if (companyData?.data?.dataMap) {
        console.log('DataMap preview:', JSON.stringify(companyData.data.dataMap).substring(0, 200) + '...');
      }
      console.log('============================');
      
      // If includeDataMapContext is On and we have company data, add it to the system prompt
      if (controls.includeDataMapContext && companyData?.data?.dataMap) {
        const dataMapContext = `\n\n## Business Data Map Context\n\nThe following is the business data map for the company:\n\n${JSON.stringify(companyData.data.dataMap, null, 2)}`;
        processedSystemPrompt += dataMapContext;
        console.log('✅ Data Map Context ADDED to system prompt');
      } else {
        console.log('❌ Data Map Context NOT added. Reason:', !controls.includeDataMapContext ? 'includeDataMapContext is OFF' : !companyData?.data?.dataMap ? 'No dataMap found on company' : 'Unknown');
      }
      
      // Build messages: system + prior chat + new user message
      const messages = [
        { role: 'system', content: processedSystemPrompt },
        ...chatMessages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: userMessage.text }
      ];

      const payload: any = {
        model: controls.model || 'gpt-4o-mini',
        temperature: controls.temperature ?? 0.2,
        max_tokens: controls.maxOutputTokens || 2500,
        top_p: controls.topP ?? 1.0,
        frequency_penalty: controls.frequencyPenalty ?? 0,
        presence_penalty: controls.presencePenalty ?? 0,
        messages
      };
      
      if (controls.responseFormat) {
        payload.response_format = { type: controls.responseFormat };
      }
      
      // Save the payload for debugging
      setLastSentPayload(payload);
      
      console.log('=== DEBUG: Sending Payload ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('============================');
      
      // Call API via backend
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorBody = await response.json();
          errorDetails = JSON.stringify(errorBody, null, 2);
          console.error('API Error Details:', errorBody);
        } catch (e) {
          errorDetails = await response.text();
          console.error('API Error Text:', errorDetails);
        }
        throw new Error(`API call failed (${response.status} ${response.statusText}): ${errorDetails}`);
      }

      const result = await response.json();
      
      // Save the response for debugging
      setLastApiResponse(result);
      
      // Parse the response
      let responseText = result.response || result.output_text || result.choices?.[0]?.message?.content || '';
      
      // Replace dynamic placeholders in the response
      responseText = responseText.replace(/\[Admin\.taxonomyThreshold\]/g, String(thresholdDecimal));
      
      // Check if this is a finalize response and try to parse JSON
      const isFinalize = /\[\[FINALIZE\]\]/i.test(messageText) || /\b(finalize)\b/i.test(messageText);
      let jsonParsed = false;
      
      if (isFinalize && typeof responseText === 'string') {
        try {
          const parsed = JSON.parse(responseText);
          setFinalOutput(parsed);
          jsonParsed = true;
          console.log('=== DEBUG: Setting finalOutput ===');
          console.log('Parsed data:', parsed);
          console.log('============================');
          
          // Show success message in chat instead of raw JSON
          const successMessage: ChatMessage = {
            id: `success-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: `✅ Successfully parsed business taxonomy classification. View the structured output below.`,
            timestamp: new Date(),
            isUser: false
          };
          setChatMessages(prev => [...prev, successMessage]);
        } catch (e) {
          console.log('Could not parse as JSON, displaying as text');
        }
      }
      
      // Check if confidence exceeds threshold (parse confidence from response)
      const confidenceMatch = responseText.match(/Confidence:\s*(0?\.\d+|\d+\.\d+)/i);
      if (confidenceMatch) {
        const confidence = parseFloat(confidenceMatch[1]);
        console.log('=== CONFIDENCE CHECK ===');
        console.log('Detected confidence:', confidence);
        console.log('Threshold:', thresholdDecimal);
        console.log('Exceeds threshold?:', confidence >= thresholdDecimal);
        console.log('========================');
        
        // If confidence exceeds threshold, automatically trigger finalization
        if (confidence >= thresholdDecimal) {
          console.log('✅ Confidence threshold met! Auto-sending finalization request...');
          // Automatically send a finalization message to the AI after a short delay
          setTimeout(() => {
            const finalizeText = "[[FINALIZE]] Please provide the final classification with all details.";
            const finalizeUserMessage: ChatMessage = {
              id: `user-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: finalizeText,
              timestamp: new Date(),
              isUser: true
            };
            
            // Update messages and send finalization request
            setChatMessages(prev => {
              const updatedMessages = [...prev, finalizeUserMessage];
              
              // Send the finalization request with updated message history
              setIsTypingResponse(true);
              
              (async () => {
                try {
                  const controls = getControlsRef.current?.() || null;
                  if (!controls) return;
                  
                  const thresholdDecimal = (controls.completionThreshold || 80) / 100;
                  let processedSystemPrompt = controls.systemPrompt || '';
                  processedSystemPrompt = processedSystemPrompt.replace(/\{\{THRESHOLD\}\}/g, String(thresholdDecimal));
                  
                  if (controls.includeDataMapContext && companyData?.data?.dataMap) {
                    const dataMapContext = `\n\n## Business Data Map Context\n\nThe following is the business data map for the company:\n\n${JSON.stringify(companyData.data.dataMap, null, 2)}`;
                    processedSystemPrompt += dataMapContext;
                  }
                  
                  const messages = [
                    { role: 'system', content: processedSystemPrompt },
                    ...updatedMessages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text }))
                  ];

                  const payload: any = {
                    model: controls.model || 'gpt-4o-mini',
                    temperature: controls.temperature ?? 0.2,
                    max_tokens: controls.maxOutputTokens || 2500,
                    top_p: controls.topP ?? 1.0,
                    frequency_penalty: controls.frequencyPenalty ?? 0,
                    presence_penalty: controls.presencePenalty ?? 0,
                    messages
                  };
                  
                  if (controls.responseFormat) {
                    payload.response_format = { type: controls.responseFormat };
                  }
                  
                  setLastSentPayload(payload);
                  
                  const response = await fetch('/api/openai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });

                  if (response.ok) {
                    const result = await response.json();
                    setLastApiResponse(result);
                    let responseText = result.response || result.output_text || result.choices?.[0]?.message?.content || '';
                    responseText = responseText.replace(/\[Admin\.taxonomyThreshold\]/g, String(thresholdDecimal));
                    
                    // Try to parse JSON from finalized response
                    try {
                      const parsed = JSON.parse(responseText);
                      setFinalOutput(parsed);
                      console.log('=== DEBUG: Auto-finalize - Setting finalOutput ===');
                      console.log('Parsed data:', parsed);
                      console.log('============================');
                      
                      // Show success message in chat
                      const successMessage: ChatMessage = {
                        id: `success-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        text: `✅ Successfully parsed business taxonomy classification. View the structured output below.`,
                        timestamp: new Date(),
                        isUser: false
                      };
                      setChatMessages(prev => [...prev, successMessage]);
                    } catch (e) {
                      // If not JSON, just display the text response
                      const aiMessage: ChatMessage = {
                        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        text: responseText,
                        timestamp: new Date(),
                        isUser: false
                      };
                      
                      setChatMessages(prev => [...prev, aiMessage]);
                    }
                  }
                } catch (error) {
                  console.error('Auto-finalize error:', error);
                } finally {
                  setIsTypingResponse(false);
                }
              })();
              
              return updatedMessages;
            });
          }, 1500); // Wait 1.5 seconds before auto-finalizing
        }
      }
      
      // Add AI response to chat (only if not already added as success message from JSON parsing)
      if (!jsonParsed) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: responseText,
          timestamp: new Date(),
          isUser: false
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
        isUser: false
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTypingResponse(false);
    }
  }

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
            onRegisterGetControls={(getControls: () => any) => {
              getControlsRef.current = getControls;
            }}
          />
          <OutputsPanel
            outputsExpanded={outputsExpanded}
            onToggleExpanded={() => setOutputsExpanded((v) => !v)}
            isRunningApiCall={isRunningApiCall}
            apiCallResult={apiCallResult}
            apiCallDebugInfo={apiCallDebugInfo}
            chatMessages={chatMessages}
            isTypingResponse={isTypingResponse}
            onSendMessage={handleSendMessage}
            lastSentPayload={lastSentPayload}
            buildChatDebugInfo={buildChatDebugInfo}
            finalOutput={finalOutput}
            expandedSections={expandedSections}
            onToggleSection={(key: string) => {
              setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
            }}
            isSavingDataMap={isSavingDataMap}
            saveDataMapMessage={saveDataMapMessage}
            dataMapSaved={dataMapSaved}
            onUpdateBusinessDataMap={handleUpdateBusinessDataMap}
            isInModelBuildStep={isInModelBuildStep}
            onNextModelBuildStep={() => {
              setIsInModelBuildStep(true);
              // Auto-select Top-Line System Prompt based on classification
              if (finalOutput?.classification?.classification) {
                const classificationType = finalOutput.classification.classification;
                console.log('=== AUTO-SELECT SYSTEM PROMPT ===');
                console.log('Classification:', classificationType);
                
                // Notify InputsPanel to auto-select the matching system prompt
                const controls = getControlsRef.current?.();
                if (controls && controls.autoSelectTopLinePrompt) {
                  controls.autoSelectTopLinePrompt(classificationType);
                }
              }
            }}
            topLineChatMessages={topLineChatMessages}
            isTopLineTypingResponse={isTopLineTypingResponse}
            onTopLineSendMessage={handleTopLineSendMessage}
          />
        </div>
      </div>
    </>
  );
}


