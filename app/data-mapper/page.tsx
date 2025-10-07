"use client";
import React, { useEffect, useRef, useState } from "react";
import NavigationHeader from "../components/NavigationHeader";

export default function DataMapperPage() {
  const [outputsExpanded, setOutputsExpanded] = useState(false);
  const [inputsExpanded, setInputsExpanded] = useState(false);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [advisorImageUrl, setAdvisorImageUrl] = useState<string | null>(null);
  const [advisorName, setAdvisorName] = useState<string>('');
  const [howItWorksTexts, setHowItWorksTexts] = useState<string[]>([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [howItWorksStep, setHowItWorksStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateResult, setSimulateResult] = useState<null | { ok: boolean; elapsedMs: number; startedAt: number; finishedAt: number }>(null);
  const [ribbonHidden, setRibbonHidden] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [visibleActionCount, setVisibleActionCount] = useState(0);
  const actionsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMsgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, timestamp: Date, isUser: boolean}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [isInputsPanelBlinking, setIsInputsPanelBlinking] = useState(false);
  const [isOutputsPanelBlinking, setIsOutputsPanelBlinking] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // Seed greeting once advisorName is available and no messages yet
  useEffect(() => {
    if (chatMessages.length === 0 && advisorName && advisorName.toLowerCase() !== 'advisor') {
      setChatMessages([{ id: 'greet', text: `Hello, I am ${advisorName}.`, timestamp: new Date(), isUser: false }]);
    }
  }, [advisorName]);
  // Controls like Model Builder
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [llm, setLlm] = useState<string>('OpenAI');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [responseFormat, setResponseFormat] = useState<'json_object' | 'text' | 'xml'>('text');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [topP, setTopP] = useState<number>(1.0);
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(2500);
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const [verbosity, setVerbosity] = useState<'low' | 'medium' | 'high'>('medium');
  const [frequencyPenalty, setFrequencyPenalty] = useState<number>(0);
  const [presencePenalty, setPresencePenalty] = useState<number>(0);
  const [storeLogs, setStoreLogs] = useState<boolean>(true);
  const [completionThreshold, setCompletionThreshold] = useState<number>(80);
  const [structures, setStructures] = useState<Array<{ id: string; data: { name?: string; schema?: unknown } }>>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string>("");
  const [isSystemPromptPreviewOpen, setIsSystemPromptPreviewOpen] = useState(false);
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [preflightPayload, setPreflightPayload] = useState<any>(null);
  const [callResponse, setCallResponse] = useState<any>(null);
  const [isCallingApi, setIsCallingApi] = useState(false);

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

  const loadingMessages = [
    "Analyzing semantic intent…",
    "Calibrating vector embeddings…",
    "Mapping entities and relationships…",
    "Synthesizing optimal strategy…",
    "Validating constraints and edge cases…",
  ];

  // Dropdown options for each action
  const dropdownOptions = {
    add: [
      { label: 'Add to Projects', action: () => console.log('Add to Projects') },
      { separator: true },
      { label: 'Random', action: () => console.log('Add to Random') },
      { label: 'Project Alpha', action: () => console.log('Add to Project Alpha') },
      { label: 'Project Beta', action: () => console.log('Add to Project Beta') },
    ],
    save: [
      { label: 'To PC', action: () => console.log('Save to PC') },
      { label: 'To Projects', action: () => console.log('Save to Projects') },
      { label: 'To CSV', action: () => console.log('Save to CSV') },
      { label: 'To PDF', action: () => console.log('Save to PDF') },
    ],
    copy: [
      { label: 'To Clipboard', action: () => console.log('Copy to Clipboard') },
      { label: 'As Rich Text', action: () => console.log('Copy as Rich Text') },
      { label: 'As Plain Text', action: () => console.log('Copy as Plain Text') },
    ],
    code: [
      { label: 'Copy Raw Code', action: () => console.log('Copy Raw Code') },
      { label: 'Copy JSON', action: () => console.log('Copy JSON') },
      { label: 'Copy XML', action: () => console.log('Copy XML') },
    ],
    share: [
      { label: 'To Team', action: () => console.log('Send to Team') },
      { label: 'To WhatsApp', action: () => console.log('Send to WhatsApp') },
      { label: 'To Email', action: () => console.log('Send to Email') },
      { label: 'To Slack', action: () => console.log('Send to Slack') },
      { label: 'Generate Link', action: () => console.log('Generate Link') },
    ],
    download: [
      { label: 'Download PDF', action: () => console.log('Download PDF') },
      { label: 'Download Word', action: () => console.log('Download Word') },
      { label: 'Download Excel', action: () => console.log('Download Excel') },
      { label: 'Download ZIP', action: () => console.log('Download ZIP') },
    ],
  };

  const actionItems: Array<{ key: string; title: string; svg: React.JSX.Element }> = [
    {
      key: 'trash',
      title: 'Clear Outputs',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h2a2 2 0 012 2v2" />
        </svg>
      ),
    },
    {
      key: 'add',
      title: 'Add to Projects',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      key: 'save',
      title: 'Save',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l-4-4-4 4m8-8H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      key: 'copy',
      title: 'Copy',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16h8a2 2 0 002-2v-4M8 16v2a2 2 0 002 2h4" />
        </svg>
      ),
    },
    {
      key: 'code',
      title: 'Copy Raw',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6L2 12l6 6" />
        </svg>
      ),
    },
    {
      key: 'share',
      title: 'Send / Share',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4m4-4v14" />
        </svg>
      ),
    },
    {
      key: 'download',
      title: 'Download',
      svg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
      ),
    },
  ];
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

  // Load advisor image, How It Works, and System Prompts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const toolsRes = await fetch('/api/collections/pages/records', { headers: { 'Content-Type': 'application/json' } });
        if (!toolsRes.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await toolsRes.json();
        console.log('Pages records:', records);
        const page = records.find(r => String((r.data as any)?.name || '').toLowerCase() === 'data mapper');
        console.log('Data Mapper page record:', page);
        const advisorId = page?.data ? (page.data as any).mainAdvisorId : null;
        console.log('Advisor ID:', advisorId);
        const hiw: string[] = page?.data ? [
          String((page.data as any).howItWorks1 || '').trim(),
          String((page.data as any).howItWorks2 || '').trim(),
          String((page.data as any).howItWorks3 || '').trim(),
          String((page.data as any).howItWorks4 || '').trim(),
        ].filter(Boolean) : [];
        if (!cancelled) setHowItWorksTexts(hiw);
        if (!advisorId) {
          console.log('No advisor ID found for Data Mapper page');
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
        // Load system prompts
        const promptsRes = await fetch('/api/collections/system-prompts/records', { headers: { 'Content-Type': 'application/json' } });
        if (promptsRes.ok) {
          const records: Array<{ id: string; data?: Record<string, unknown> }> = await promptsRes.json();
          if (!cancelled) {
            setSystemPrompts(records as any);
            const def = (records as any[]).find(p => (p?.data as any)?.name === 'Data Mapper');
            if (def) {
              setSelectedSystemPromptId(def.id);
              const content = (def.data as any)?.content ? String((def.data as any).content) : '';
              setSystemPrompt(content);
            }
          }
        }
      } catch (error) {
        console.error('Error loading advisor image:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Cleanup any running typing interval on unmount
  useEffect(() => {
    return () => { if (typingIntervalRef.current) clearInterval(typingIntervalRef.current); };
  }, []);

  useEffect(() => {
  // Staggered show of action icons
    if (showActions) {
      setVisibleActionCount(0);
      if (actionsIntervalRef.current) clearInterval(actionsIntervalRef.current);
      actionsIntervalRef.current = setInterval(() => {
        setVisibleActionCount((c) => {
          if (c >= actionItems.length) {
            if (actionsIntervalRef.current) clearInterval(actionsIntervalRef.current);
            return c;
          }
          return c + 1;
        });
      }, 500);
    }
    return () => { if (actionsIntervalRef.current) clearInterval(actionsIntervalRef.current); };
  }, [showActions]);

  // Rotate loading messages every 2.5s while simulating
  useEffect(() => {
    if (isSimulating) {
      setLoadingMessageIndex(0);
      if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current);
      loadingMsgIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((i) => (i + 1) % loadingMessages.length);
      }, 2500);
    } else {
      if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current);
    }
    return () => { if (loadingMsgIntervalRef.current) clearInterval(loadingMsgIntervalRef.current); };
  }, [isSimulating]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle chat message sending
  async function handleSendMessage() {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      timestamp: new Date(),
      isUser: true
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTypingResponse(true);
    
    try {
      // Build payload with the new message
      const thresholdDecimal = completionThreshold / 100;
      const selectedStructure = structures.find(s => s.id === selectedStructureId);
      const schema = selectedStructure?.data?.schema || {};
      
      let processedSystemPrompt = systemPrompt;
      processedSystemPrompt = processedSystemPrompt.replace(/\{\{THRESHOLD\}\}/g, String(thresholdDecimal));
      processedSystemPrompt = processedSystemPrompt.replace(/\{\{BUSINESS_PLAN_STRUCTURE\}\}/g, JSON.stringify(schema, null, 2));
      
      const payload = {
        model: model,
        response_format: { type: responseFormat },
        temperature: temperature,
        max_tokens: maxOutputTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        messages: [
          { role: 'system', content: processedSystemPrompt },
          { role: 'user', content: userMessage.text }
        ]
      };
      
      console.log('=== DEBUG: Sending Payload ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('============================');
      
      // Call API
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Try to get detailed error from response body
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
      
      // Parse the response
      let responseText = '';
      if (result.output_text) {
        responseText = result.output_text;
      } else if (result.choices?.[0]?.message?.content) {
        responseText = result.choices[0].message.content;
      }
      
      const advisorMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText || 'No response received',
        timestamp: new Date(),
        isUser: false
      };
      
      setChatMessages(prev => [...prev, advisorMessage]);
      
    } catch (error) {
      console.error('=== DEBUG: Error Details ===');
      console.error(error);
      console.error('============================');
      
      const errorText = String(error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: `🔴 ERROR:\n\n${errorText}\n\n💡 Check browser console for full payload details.`,
        timestamp: new Date(),
        isUser: false
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTypingResponse(false);
    }
  }

  function handleChatKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // Debug: Copy all chat details for debugging
  function handleCopyChatDebug() {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      chatMessages: chatMessages,
      selectedSystemPrompt: systemPrompts.find(p => p.id === selectedSystemPromptId)?.data?.name || 'None',
      selectedStructure: structures.find(s => s.id === selectedStructureId)?.data?.name || 'None',
      threshold: completionThreshold,
      controls: {
        model,
        responseFormat,
        temperature,
        maxOutputTokens,
        topP,
        reasoningEffort,
        verbosity,
        frequencyPenalty,
        presencePenalty,
        storeLogs
      },
      preflightPayload: preflightPayload,
      callResponse: callResponse,
      isCallingApi,
      isTypingResponse
    };

    const debugText = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(debugText).then(() => {
      alert('Chat debug info copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy. See console for details.');
    });
  }

  function startTyping(text: string) {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setIsTyping(true);
    setTypedText("");
    let index = 0;
    typingIntervalRef.current = setInterval(() => {
      index += 1;
      setTypedText(text.slice(0, index));
      if (index >= text.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setIsTyping(false);
      }
    }, 15); // relatively quickly
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

  function handleShowHowItWorks() {
    if (!howItWorksTexts.length) return;
    setShowHowItWorks(true);
    setHowItWorksStep(0);
    startTyping(howItWorksTexts[0]);
  }

  function handleNextHowItWorks() {
    if (howItWorksStep + 1 < howItWorksTexts.length) {
      const next = howItWorksStep + 1;
      setHowItWorksStep(next);
      
      // Trigger blink effect when moving to second step (step 1, 0-indexed)
      if (next === 1) {
        triggerInputsPanelBlink();
      }
      
      // Trigger blink effect when moving to third step (step 2, 0-indexed)
      if (next === 2) {
        triggerOutputsPanelBlink();
      }
      
      startTyping(howItWorksTexts[next]);
          } else {
      // no more steps; keep showing last text
    }
  }

  function handleCloseHowItWorks() {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setIsTyping(false);
    setShowHowItWorks(false);
    setTypedText("");
    setHowItWorksStep(0);
  }

  function triggerSuccessSequence() {
    // 1) Fade out the How it Works ribbon, then 2) reveal actions
    setRibbonHidden(true);
    setTimeout(() => {
      setShowActions(true);
    }, 250);
  }

  function handleClearOutputs() {
    // Gradually hide icons
    if (actionsIntervalRef.current) {
      clearInterval(actionsIntervalRef.current);
    }
    const hideInterval = setInterval(() => {
      setVisibleActionCount((c) => {
        if (c <= 0) {
          clearInterval(hideInterval);
          setShowActions(false);
          return 0;
        }
        return c - 1;
      });
    }, 60);
    // Clear outputs area
    setSimulateResult(null);
    setShowHowItWorks(false);
    setTypedText("");
  }

  // System Prompt Selector
  const [systemPrompts, setSystemPrompts] = useState<Array<{ id: string; data: { name?: string; content?: string } }>>([]);
  const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const promptsRes = await fetch('/api/collections/system-prompts/records', { headers: { 'Content-Type': 'application/json' } });
        if (!promptsRes.ok) return;
        const records: Array<{ id: string; data?: { name?: string; content?: string } }> = await promptsRes.json();
        if (!cancelled) {
          setSystemPrompts(records as any);
          const def = records.find(p => p.data?.name === 'Data Mapper');
          if (def) {
            setSelectedSystemPromptId(def.id);
            setSystemPrompt(String(def.data?.content || ''));
          } else if (records.length > 0) {
            setSelectedSystemPromptId(records[0].id);
            setSystemPrompt(String(records[0].data?.content || ''));
          }
        }
    } catch (error) {
        console.error('Error loading system prompts:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load structures
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

  function handleSystemPromptChange(promptId: string) {
    setSelectedSystemPromptId(promptId);
    const found = (systemPrompts as any[]).find(p => p.id === promptId);
    const content = found?.data?.content ? String(found.data.content) : '';
    setSystemPrompt(content);
  }

  function handlePreflight() {
    // 1. Convert threshold percentage to decimal
    const thresholdDecimal = completionThreshold / 100;

    // 2. Get schema from selected structure
    const selectedStructure = structures.find(s => s.id === selectedStructureId);
    const schema = selectedStructure?.data?.schema || {};

    // 3. Replace placeholders in system prompt
    let processedSystemPrompt = systemPrompt;
    processedSystemPrompt = processedSystemPrompt.replace(/\{\{THRESHOLD\}\}/g, String(thresholdDecimal));
    processedSystemPrompt = processedSystemPrompt.replace(/\{\{BUSINESS_PLAN_STRUCTURE\}\}/g, JSON.stringify(schema, null, 2));

    // 4. Get user message from chat (last user message)
    const lastUserMessage = chatMessages.filter(m => m.isUser).slice(-1)[0];
    const userContent = lastUserMessage?.text || '';

    // 5. Build payload
    const payload = {
      model: model,
      response_format: { type: responseFormat },
      temperature: temperature,
      max_tokens: maxOutputTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      messages: [
        { role: 'system', content: processedSystemPrompt },
        { role: 'user', content: userContent }
      ]
    };

    setPreflightPayload(payload);
    setIsPreflightOpen(true);
  }

  async function handleCall() {
    if (!preflightPayload) {
      console.error('No preflight payload available');
      return;
    }

    try {
      setIsCallingApi(true);
      setCallResponse(null);

      console.log('=== DEBUG: Sending Preflight Payload ===');
      console.log(JSON.stringify(preflightPayload, null, 2));
      console.log('============================');

      // Send to OpenAI API
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preflightPayload)
      });

      if (!response.ok) {
        // Try to get detailed error from response body
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
      
      // Parse the output_text if it's JSON
      let parsedOutput = result;
      let responseText = '';
      
      if (result.output_text) {
        try {
          parsedOutput = JSON.parse(result.output_text);
          responseText = result.output_text;
        } catch (e) {
          parsedOutput = result.output_text;
          responseText = result.output_text;
        }
      } else if (result.choices?.[0]?.message?.content) {
        try {
          parsedOutput = JSON.parse(result.choices[0].message.content);
          responseText = result.choices[0].message.content;
        } catch (e) {
          parsedOutput = result.choices[0].message.content;
          responseText = result.choices[0].message.content;
        }
      }

      setCallResponse(parsedOutput);
      
      // Add response to chat as advisor message
      const advisorMessage = {
        id: Date.now().toString(),
        text: typeof responseText === 'string' ? responseText : JSON.stringify(parsedOutput, null, 2),
        timestamp: new Date(),
        isUser: false
      };
      setChatMessages(prev => [...prev, advisorMessage]);
      
    } catch (error) {
      console.error('=== DEBUG: Call Error Details ===');
      console.error(error);
      console.error('============================');
      
      const errorResponse = { error: String(error) };
      setCallResponse(errorResponse);
      
      // Add error to chat
      const errorText = String(error);
      const errorMessage = {
        id: Date.now().toString(),
        text: `🔴 ERROR:\n\n${errorText}\n\n💡 Check browser console for full payload details.`,
        timestamp: new Date(),
        isUser: false
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsCallingApi(false);
    }
  }

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className={`flex ${outputsExpanded || inputsExpanded ? "gap-0" : "gap-4"}`}>
          {/* Left Panel - 25% width, aligned with page name ribbon */}
          <div
            className="relative"
            style={{ 
              width: outputsExpanded ? "0%" : (inputsExpanded ? "100%" : "25%"), 
              transition: "width 200ms ease", 
              pointerEvents: outputsExpanded ? "none" : "auto" 
            }}
          >
            <div className={`bg-white rounded-md border border-gray-200 ${outputsExpanded ? "opacity-0" : "opacity-100"} transition-opacity duration-200 ${isInputsPanelBlinking ? "nb-anim-inputs-panel-blink" : ""}`}>
              <div className="w-full bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200 flex items-center justify-between hover:bg-gray-200 transition-colors min-h-[52px]">
              <button
                type="button"
                aria-label="Toggle Inputs visibility"
                aria-expanded={!inputsCollapsed}
                onClick={() => setInputsCollapsed((v) => !v)}
                  className="flex items-center gap-2 text-left"
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
                <button
                  type="button"
                  aria-label="Toggle Inputs width"
                  aria-expanded={inputsExpanded}
                  onClick={() => {
                    setInputsExpanded((v) => !v);
                    if (!inputsExpanded) setOutputsExpanded(false); // Collapse outputs when expanding inputs
                  }}
                  className="flex items-center"
                >
                  <svg
                    className={`w-4 h-4 transform transition-transform ${inputsExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
              </div>
              <div
                className="overflow-hidden"
                style={{
                  maxHeight: inputsCollapsed ? 0 : '2000px',
                  opacity: inputsCollapsed ? 0 : 1,
                  transition: 'max-height 300ms ease-in-out, opacity 250ms ease-in-out'
                }}
              >
                <div className={`p-4 ${inputsExpanded ? 'flex gap-4' : ''}`}>
                {/* Left column - advisor image and controls (stays fixed width when expanded) */}
                <div className={inputsExpanded ? 'flex-shrink-0' : ''} style={{ maxWidth: '320px', width: '100%' }}>
                {/* Image placeholder at top */}
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

                {/* System Prompt Selector (wired to collection) */}
                <div className="relative group mt-3">
                  <button onClick={() => setIsSystemPromptPreviewOpen(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{(systemPrompts.find(p => p.id === selectedSystemPromptId)?.data?.name) || 'System Prompt'}</span>
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                    <div className="py-2 max-h-64 overflow-auto">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => handleSystemPromptChange("")}
                        >
                        -- Select a System Prompt --
                        </button>
                      {systemPrompts.map(p => (
                        <button
                          key={p.id}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          onClick={() => handleSystemPromptChange(p.id)}
                        >
                          {p.data?.name || 'Unnamed'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Structure Selector */}
                <div className="relative group mt-3">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                      <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    <span>{(structures.find(s => s.id === selectedStructureId)?.data?.name) || 'Select Structure'}</span>
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                    <div className="py-2 max-h-64 overflow-auto">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={() => setSelectedStructureId("")}
                          >
                        -- Select a Structure --
                          </button>
                      {structures.map(s => (
                          <button
                          key={s.id}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          onClick={() => setSelectedStructureId(s.id)}
                          >
                          {s.data?.name || 'Unnamed'}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Threshold */}
                <div className="relative group mt-3">
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
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          onClick={() => setCompletionThreshold(threshold)}
                          >
                          {threshold}%
                    </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Controls button (like Model Builder) */}
                <div className="mt-3">
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
                <div className="border-t border-gray-200 my-3"></div>

                {/* Preflight and Call (match Model Builder styles) */}
                <div className="flex gap-2">
                <button
                  type="button"
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePreflight}
                    disabled={isCallingApi}
                  >
                    Preflight
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCall}
                    disabled={!preflightPayload || isCallingApi}
                  >
                    {isCallingApi ? 'Calling...' : 'Call'}
                </button>
            </div>
          </div>

                {/* Chat Box - expands to right when inputsExpanded is true */}
                <div className={`${inputsExpanded ? 'flex-1' : 'mt-3'}`}>
                <div className={`border border-gray-200 rounded-lg bg-white shadow-sm ${inputsExpanded && !isChatCollapsed ? 'h-full' : ''}`} style={inputsExpanded && !isChatCollapsed ? { height: 'calc(100vh - 120px)' } : {}}>
                  {/* Chat Header */}
                  <div 
                    className={`px-3 py-1.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${isChatCollapsed ? 'rounded-md' : 'border-b border-gray-100 rounded-t-md'}`}
                    onClick={() => setIsChatCollapsed(!isChatCollapsed)}
              >
                <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <svg
                          className={`w-4 h-4 text-gray-600 transform transition-transform duration-200 ${isChatCollapsed ? 'rotate-0' : 'rotate-90'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                        {isChatCollapsed && (
                          <span className="text-sm text-gray-700" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                            Chat to {advisorName || 'Advisor'}
                          </span>
                        )}
                  </div>
                      <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                            e.stopPropagation();
                            handleCopyChatDebug();
                    }}
                          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors font-mono"
                          title="Copy chat debug info"
                  >
                          &lt;&gt;
                  </button>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
                </div>

                  {/* Chat Content - Collapsible */}
                  {!isChatCollapsed && (
                    <>
                      {/* Chat Messages */}
                      <div 
                        ref={chatContainerRef}
                        className={`${inputsExpanded ? 'h-full' : 'max-h-64'} overflow-y-auto p-3 space-y-3`}
                        style={{ 
                          fontFamily: 'Inter, system-ui, sans-serif',
                          ...(inputsExpanded ? { height: 'calc(100vh - 220px)' } : {})
                        }}
                      >
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                            message.isUser
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.text}</div>
                          <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {isTypingResponse && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-sm px-3 py-2 text-sm">
                          <div className="flex items-center gap-1">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                    </div>
                            </div>
                          </div>
                        )}
                </div>

                  {/* Chat Input */}
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleChatKeyPress}
                        placeholder="Ask me about design..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        disabled={isTypingResponse}
                      />
                            <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isTypingResponse}
                        className="flex-shrink-0 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-10 h-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                            </button>
                          </div>
                                  </div>
                    </>
              )}
                                              </div>
                                        </div>
                                      </div>
                                  </div>
                          </div>
                        </div>

          {/* Right Panel - Outputs Panel */}
          <div
            className="overflow-hidden"
            style={{ 
              width: inputsExpanded ? "0%" : (outputsExpanded ? "100%" : "calc(75% - 0.5rem)"), 
              transition: "width 200ms ease",
              pointerEvents: inputsExpanded ? "none" : "auto"
            }}
          >
            <div className={`bg-white rounded-md border border-gray-200 transition-colors relative ${isOutputsPanelBlinking ? "nb-anim-outputs-panel-blink" : ""} ${inputsExpanded ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}>
              <div 
                className="bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors min-h-[52px] flex items-center"
                onClick={() => {
                  setOutputsExpanded((v) => !v);
                  if (!outputsExpanded) setInputsExpanded(false); // Collapse inputs when expanding outputs
                }}
                role="button"
                tabIndex={0}
                aria-label="Toggle Outputs width"
                aria-expanded={outputsExpanded}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOutputsExpanded((v) => !v);
                    if (!outputsExpanded) setInputsExpanded(false); // Collapse inputs when expanding outputs
                  }
                }}
              >
                <div className="flex items-center justify-between w-full">
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
                          <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the panel toggle
                      handleShowHowItWorks();
                    }}
                    className={`bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-normal text-xs hover:bg-blue-200 transition-all ${ribbonHidden ? 'opacity-0 scale-95' : 'opacity-100'} duration-200`}
                    aria-label="Show How it Works"
                  >
                    How it Works?
                          </button>
                                              </div>
                                        </div>
{(showHowItWorks || isSimulating || simulateResult || callResponse || isCallingApi) && (
              <div className="p-4">
                  {showHowItWorks && (
                    <div>
                      <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed min-h-24">
                        {typedText}
                        {isTyping && <span className="inline-block w-2 h-4 bg-gray-400 ml-1 align-baseline animate-pulse" />}
                                      </div>
                                  </div>
                  )}

                  {/* Simulation states */}
                  {isSimulating && (
                    <div className="my-3 flex justify-center">
                      <div className="w-1/2">
                        <div className="border border-gray-200 bg-gray-50 rounded-md h-9 px-4 flex items-center justify-center overflow-hidden">
                          <div key={loadingMessageIndex} className="text-sm text-gray-700 nb-anim-loading-line">
                            {loadingMessages[loadingMessageIndex]}
                            </div>
                        </div>
                      </div>
                        </div>
                        )}
                  {!isSimulating && simulateResult && (
                    <div className="mt-3 text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        <span>Simulation complete in {Math.round(simulateResult.elapsedMs)} ms</span>
                        </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {new Date(simulateResult.startedAt).toLocaleTimeString()} • Finished: {new Date(simulateResult.finishedAt).toLocaleTimeString()}
                      </div>
                  </div>
                )}

                  {/* API Call States */}
                  {isCallingApi && (
                    <div className="my-3">
                      <div className="text-sm text-gray-700 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Calling API...</span>
                        </div>
                      </div>
                          )}

                  {!isCallingApi && callResponse && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-sm font-medium text-gray-900">API Response:</span>
                    </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-auto">
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                          {JSON.stringify(callResponse, null, 2)}
                        </pre>
                  </div>
                  </div>
                )}
              </div>
                          )}
              {showHowItWorks && (
                <div className="absolute right-3 bottom-3">
                  {howItWorksStep + 1 >= howItWorksTexts.length ? (
                    <button
                      type="button"
                      onClick={handleCloseHowItWorks}
                      className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 border border-blue-300"
                    >
                      Close
                    </button>
                  ) : (
                          <button
                      type="button"
                      onClick={handleNextHowItWorks}
                      className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 border border-blue-300"
                    >
                      {howItWorksStep + 1} / {howItWorksTexts.length} Next
                          </button>
                  )}
                </div>
              )}
              {/* Action icons top-right */}
              {showActions && (
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  {actionItems.slice(0, visibleActionCount).map((a, idx) => (
                    <div key={a.key} className="relative group">
                      <button
                        title={a.title}
                        className="bg-blue-100 text-blue-800 border border-blue-300 rounded-md p-1 shadow-sm hover:bg-blue-200 transition-all nb-anim-fade-slide-in"
                        style={{ animationDelay: `${idx * 60}ms` }}
                        onClick={a.key === 'trash' ? handleClearOutputs : undefined}
                      >
                        {a.svg}
                      </button>
                      
                      {/* Hover Dropdown */}
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
                        <div className="py-2">
                          {dropdownOptions[a.key as keyof typeof dropdownOptions]?.map((option, optIdx) => (
                            'separator' in option && option.separator ? (
                              <hr key={`sep-${optIdx}`} className="my-1 border-gray-200" />
                            ) : (
                              <button
                                key={`opt-${optIdx}`}
                                onClick={'action' in option ? option.action : undefined}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                              >
                                {'label' in option ? option.label : ''}
                              </button>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel (no backdrop), matches Model Builder styling */}
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
                    </div>
                        </div>
                </div>
              )}

      {/* System Prompt Preview - centered */}
      {isSystemPromptPreviewOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl flex flex-col"
            style={{ fontFamily: 'Inter, system-ui, sans-serif', width: '72rem', maxWidth: '90vw', aspectRatio: '16/9' }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm text-gray-900">System Prompt</h3>
              <button onClick={() => setIsSystemPromptPreviewOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <div className="text-sm bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-gray-900">
                {String(systemPrompt || '')}
                      </div>
                      </div>
                    </div>
                </div>
              )}

      {/* Preflight Payload Preview - centered */}
      {isPreflightOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl flex flex-col"
            style={{ fontFamily: 'Inter, system-ui, sans-serif', width: '72rem', maxWidth: '90vw', aspectRatio: '16/9' }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm text-gray-900">Preflight Payload</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(preflightPayload, null, 2));
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
              </button>
                <button onClick={() => setIsPreflightOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <pre className="text-xs bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-gray-900 font-mono">
                {JSON.stringify(preflightPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

    </>
  );
}