"use client";
import { useEffect, useRef, useState } from "react";
import NavigationHeader from "../components/NavigationHeader";

export default function BusinessTaxonomy() {
  const [outputsExpanded, setOutputsExpanded] = useState(false);
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
  const [isOutputsPanelBlinking, setIsOutputsPanelBlinking] = useState(false);
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, timestamp: Date, isUser: boolean}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  
  // Controls like Model Builder
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(1.0);
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(2000);
  const [isSystemPromptPreviewOpen, setIsSystemPromptPreviewOpen] = useState(false);
  const [isUserPromptOpen, setIsUserPromptOpen] = useState(false);
  const [userPrompt, setUserPrompt] = useState<string>("Hi, I'd like you to figure out what kind of company I run. Ask me a few questions before deciding.");
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState(false);
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [apiResult, setApiResult] = useState<string | null>(null);
  const [extractedClassification, setExtractedClassification] = useState<string | null>(null);
  const [extractedDetails, setExtractedDetails] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSuccessInButton, setShowSuccessInButton] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [buttonFadingOut, setButtonFadingOut] = useState(false);

  // System Prompt Selector
  const [systemPrompts, setSystemPrompts] = useState<Array<{ id: string; data: { name?: string; content?: string } }>>([]);
  const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  
  // Send initial AI message based on System Prompt's opening line
  useEffect(() => {
    if (chatMessages.length === 0 && systemPrompt.trim()) {
      // Call API to get the opening message
      const sendOpeningMessage = async () => {
        try {
          const payload = {
            model: "gpt-4o-mini",
            temperature: temperature,
            top_p: topP,
            max_tokens: maxOutputTokens,
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: "Start the conversation with your opening line as instructed in your system prompt."
              }
            ]
          };
          
          const response = await fetch('/api/openai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            const data = await response.json();
            const result = data.response || `Hello, I am ${advisorName}.`;
            
            setChatMessages([{
              id: 'opening',
              text: result,
              timestamp: new Date(),
              isUser: false
            }]);
          }
        } catch (error) {
          console.error('Error getting opening message:', error);
          // Fallback to simple greeting
          setChatMessages([{
            id: 'opening',
            text: `Hello, I am ${advisorName}.`,
            timestamp: new Date(),
            isUser: false
          }]);
        }
      };
      
      sendOpeningMessage();
    }
  }, [systemPrompt, advisorName, temperature, topP, maxOutputTokens, chatMessages.length]);
  
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

  const actionItems: Array<{ key: string; title: string; svg: JSX.Element }> = [
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

  // Hide layout header for this page
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-layout-header-business-taxonomy';
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
      const el = document.getElementById('hide-layout-header-business-taxonomy');
      if (el) el.remove();
    };
  }, []);

  // Load advisor image, How It Works, and System Prompts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const toolsRes = await fetch('/api/collections/tools-pages/records', { headers: { 'Content-Type': 'application/json' } });
        if (!toolsRes.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await toolsRes.json();
        const page = records.find(r => String((r.data as any)?.name || '').toLowerCase() === 'business taxonomy');
        const advisorId = page?.data ? (page.data as any).mainAdvisorId : null;
        const hiw: string[] = page?.data ? [
          String((page.data as any).howItWorks1 || '').trim(),
          String((page.data as any).howItWorks2 || '').trim(),
          String((page.data as any).howItWorks3 || '').trim(),
          String((page.data as any).howItWorks4 || '').trim(),
        ].filter(Boolean) : [];
        if (!cancelled) setHowItWorksTexts(hiw);
        
        if (!advisorId) {
          console.log('No advisor ID found for Business Taxonomy page');
        } else {
          const advRes = await fetch(`/api/collections/advisors/records/${advisorId}`, { headers: { 'Content-Type': 'application/json' } });
          if (advRes.ok) {
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
          }
        }
        
        // Load system prompts
        const promptsRes = await fetch('/api/collections/system-prompts/records', { headers: { 'Content-Type': 'application/json' } });
        if (promptsRes.ok) {
          const records: Array<{ id: string; data?: Record<string, unknown> }> = await promptsRes.json();
          if (!cancelled) {
            setSystemPrompts(records as any);
            if (records.length > 0) {
              setSelectedSystemPromptId(records[0].id);
              setSystemPrompt(String((records[0].data as any)?.content || ''));
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
  }, [showActions, actionItems.length]);

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
  }, [isSimulating, loadingMessages.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-focus chat input after AI responds
  useEffect(() => {
    if (!isTypingResponse && !isChatCollapsed && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isTypingResponse, isChatCollapsed]);

  // Handle chat message sending
  // Extract business classification and details from AI response
  function extractClassificationData(text: string): { classification: string; details: string } | null {
    try {
      // Look for the default format: "✅ Classification: <category>"
      const emojiMatch = text.match(/✅\s*Classification:\s*(.+?)(?:\n|$)/i);
      if (emojiMatch && emojiMatch[1]) {
        const classification = emojiMatch[1].trim();
        
        // Extract the full output after the classification for additional details
        const detailsStart = text.indexOf('✅ Classification:');
        const details = text.substring(detailsStart);
        
        return { classification, details };
      }
      
      // Look for JSON format (when user types "export")
      const jsonMatch = text.match(/\{[\s\S]*"classification"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.classification) {
            // Format the JSON data as readable text for the details field
            const details = `Classification: ${parsed.classification}\n\n` +
              `Confidence: ${parsed.confidence || 'N/A'}\n\n` +
              `Rationale: ${parsed.rationale || 'N/A'}\n\n` +
              `Evidence:\n${(parsed.evidence || []).map((e: string) => `• ${e}`).join('\n')}\n\n` +
              `Modeling Implications:\n` +
              `• Revenue Drivers: ${parsed.modeling_implications?.revenue_drivers || 'N/A'}\n` +
              `• Direct Costs: ${parsed.modeling_implications?.direct_costs || 'N/A'}\n` +
              `• Scalability: ${parsed.modeling_implications?.scalability || 'N/A'}\n` +
              `• Key Focus: ${parsed.modeling_implications?.key_focus || 'N/A'}`;
            
            return { classification: parsed.classification, details };
          }
        } catch (e) {
          // Not valid JSON, continue
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting classification:', error);
      return null;
    }
  }

  // Handle updating the business profile
  async function handleUpdateBusinessProfile() {
    if (!extractedClassification) return;
    
    setIsUpdatingProfile(true);
    setUpdateMessage(null);
    setShowSuccessInButton(false);
    
    // Artificial 1 second delay for processing indicator
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const response = await fetch('/api/companies/update-classification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          classification: extractedClassification,
          details: extractedDetails
        })
      });
      
      if (response.ok) {
        setIsUpdatingProfile(false);
        setShowSuccessInButton(true);
        
        // Wait 1 second with success message, then fade out
        setTimeout(() => {
          setButtonFadingOut(true);
          
          // After fade animation completes, show Continue button
          setTimeout(() => {
            setShowContinueButton(true);
            setButtonFadingOut(false);
          }, 300); // Match fade duration
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setUpdateMessage({ type: 'error', text: errorData.error || 'Failed to update business profile' });
        setIsUpdatingProfile(false);
      }
    } catch (error) {
      console.error('Error updating business profile:', error);
      setUpdateMessage({ type: 'error', text: 'Failed to update business profile' });
      setIsUpdatingProfile(false);
    }
  }

  // Handle continue action
  function handleContinue() {
    // Reset states for next interaction
    setShowContinueButton(false);
    setShowSuccessInButton(false);
    setExtractedClassification(null);
    setExtractedDetails(null);
  }

  async function handleSendMessage() {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      timestamp: new Date(),
      isUser: true
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const userMessageText = chatInput.trim();
    setChatInput('');
    setIsTypingResponse(true);
    
    try {
      // Build API payload using chat message as user prompt
      const messages = [];
      
      // Add system message if present
      if (systemPrompt.trim()) {
        messages.push({
          role: "system",
          content: systemPrompt
        });
      }
      
      // Add conversation history
      chatMessages.forEach(msg => {
        messages.push({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text
        });
      });
      
      // Add current user message
      messages.push({
        role: "user",
        content: userMessageText
      });

      const payload = {
        model: "gpt-4o-mini",
        temperature: temperature,
        top_p: topP,
        max_tokens: maxOutputTokens,
        messages: messages
      };
      
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.response || 'No response received';
        
        const advisorMessage = {
          id: (Date.now() + 1).toString(),
          text: result,
          timestamp: new Date(),
          isUser: false
        };
        
        setChatMessages(prev => [...prev, advisorMessage]);
        
        // Try to extract business classification and details from the response
        const classificationData = extractClassificationData(result);
        if (classificationData) {
          setExtractedClassification(classificationData.classification);
          setExtractedDetails(classificationData.details);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: `Error: ${response.status} - ${errorData.error || 'Failed to get response'}`,
          timestamp: new Date(),
          isUser: false
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${errorMessage}`,
        timestamp: new Date(),
        isUser: false
      };
      setChatMessages(prev => [...prev, errorMsg]);
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

  function handleSystemPromptChange(promptId: string) {
    setSelectedSystemPromptId(promptId);
    const found = (systemPrompts as any[]).find(p => p.id === promptId);
    const content = found?.data?.content ? String(found.data.content) : '';
    setSystemPrompt(content);
  }

  // Simple markdown renderer for chat messages
  function renderMarkdown(text: string) {
    let html = text;
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    // Code: `text`
    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    return html;
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
    }, 15);
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
      startTyping(howItWorksTexts[next]);
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
    setRibbonHidden(true);
    setTimeout(() => {
      setShowActions(true);
    }, 250);
  }

  function handleClearOutputs() {
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
    setSimulateResult(null);
    setShowHowItWorks(false);
    setTypedText("");
    setApiResult(null);
  }

  // Build OpenAI API payload
  function buildPayload() {
    const messages = [];
    
    // Add system message if present
    if (systemPrompt.trim()) {
      messages.push({
        role: "system",
        content: systemPrompt
      });
    }
    
    // Add user message if present
    if (userPrompt.trim()) {
      messages.push({
        role: "user",
        content: userPrompt
      });
    }

    return {
      model: "gpt-4o-mini",
      temperature: temperature,
      top_p: topP,
      max_tokens: maxOutputTokens,
      messages: messages
    };
  }

  // Handle Preflight button
  function handlePreflight() {
    setIsPreflightModalOpen(true);
  }

  // Handle Call button
  async function handleCall() {
    setIsCallingApi(true);
    setApiResult(null);
    
    try {
      const payload = buildPayload();
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.response || 'No response received';
        setApiResult(result);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setApiResult(`Error: ${response.status} - ${errorData.error || 'Failed to get response'}`);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApiResult(`Error: ${errorMessage}`);
    } finally {
      setIsCallingApi(false);
    }
  }

  // Copy payload to clipboard
  const [copyPayloadButtonText, setCopyPayloadButtonText] = useState('Copy');
  
  async function copyPayloadToClipboard() {
    try {
      const payload = buildPayload();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyPayloadButtonText('Copied!');
      setTimeout(() => setCopyPayloadButtonText('Copy'), 2000);
    } catch (error) {
      console.error('Failed to copy payload:', error);
      setCopyPayloadButtonText('Failed');
      setTimeout(() => setCopyPayloadButtonText('Copy'), 2000);
    }
  }

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className={`flex ${outputsExpanded ? "gap-0" : "gap-4"}`}>
          {/* Left Panel - 25% width */}
          <div
            className="relative"
            style={{ width: outputsExpanded ? "0%" : "25%", transition: "width 200ms ease", pointerEvents: outputsExpanded ? "none" : "auto" }}
          >
          <div className={`bg-white rounded-md border border-gray-200 ${outputsExpanded ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}>
            <button
              type="button"
              aria-label="Toggle Inputs visibility"
              aria-expanded={!inputsCollapsed}
              onClick={() => setInputsCollapsed((v) => !v)}
              className="w-full bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200 flex items-center gap-2 text-left hover:bg-gray-200 transition-colors min-h-[52px]"
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
            <div
              className="overflow-hidden"
              style={{
                maxHeight: inputsCollapsed ? 0 : '2000px',
                opacity: inputsCollapsed ? 0 : 1,
                transition: 'max-height 300ms ease-in-out, opacity 250ms ease-in-out'
              }}
            >
              <div className="p-4">
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

              {/* User Prompt button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setIsUserPromptOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h8M8 12h8M8 18h8" />
                  </svg>
                  <span>User Prompt</span>
                </button>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-200 my-3"></div>

              {/* Preflight and Call (match Model Builder styles) */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={handlePreflight}
                >
                  Preflight
                </button>
                <button
                  type="button"
                  className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCall}
                  disabled={isCallingApi}
                >
                  {isCallingApi ? 'Calling...' : 'Call'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - 75% width, Outputs Panel */}
        <div
          className="overflow-hidden"
          style={{ width: outputsExpanded ? "100%" : "calc(75% - 0.5rem)", transition: "width 200ms ease" }}
        >
          <div className={`bg-white rounded-md border border-gray-200 transition-colors relative ${isOutputsPanelBlinking ? "nb-anim-outputs-panel-blink" : ""}`}>
            <div 
              className="bg-gray-100 rounded-t-md px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors min-h-[52px] flex items-center"
              onClick={() => setOutputsExpanded((v) => !v)}
              role="button"
              tabIndex={0}
              aria-label="Toggle Outputs width"
              aria-expanded={outputsExpanded}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOutputsExpanded((v) => !v);
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
                    e.stopPropagation();
                    handleShowHowItWorks();
                  }}
                  className={`bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-normal text-xs hover:bg-blue-200 transition-all ${ribbonHidden ? 'opacity-0 scale-95' : 'opacity-100'} duration-200`}
                  aria-label="Show How it Works"
                >
                  How it Works?
                </button>
              </div>
            </div>
            <div className="p-4">
              {/* Chat Box */}
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
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
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                {/* Chat Content - Collapsible */}
                {!isChatCollapsed && (
                  <>
                    {/* Chat Messages */}
                    <div 
                      ref={chatContainerRef}
                      className="max-h-[32rem] overflow-y-auto p-3 space-y-3"
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
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
                        <div 
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
                        />
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
                      ref={chatInputRef}
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleChatKeyPress}
                      placeholder="Ask me about business taxonomy..."
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

            {/* Update Business Profile Button - Outside Chat Box */}
            {extractedClassification && !showContinueButton && (
              <div className="mb-4 flex flex-col items-end px-4">
                <button
                  onClick={handleUpdateBusinessProfile}
                  disabled={isUpdatingProfile || showSuccessInButton}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-all duration-300 ${
                    showSuccessInButton 
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                  } ${buttonFadingOut ? 'opacity-0' : 'opacity-100'} ${
                    isUpdatingProfile || showSuccessInButton ? 'cursor-not-allowed' : ''
                  }`}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {isUpdatingProfile ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : showSuccessInButton ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Saved!
                    </span>
                  ) : (
                    'Update Business Profile'
                  )}
                </button>
                
                {/* Error Message */}
                {updateMessage && updateMessage.type === 'error' && (
                  <div className="mt-2 px-3 py-2 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
                    {updateMessage.text}
                  </div>
                )}
              </div>
            )}

            {/* Continue Button - Appears after success */}
            {showContinueButton && (
              <div className="mb-4 flex flex-col items-end px-4 animate-fade-in">
                <button
                  onClick={handleContinue}
                  className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 border border-blue-300 transition-colors"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Continue
                </button>
              </div>
            )}

            {(showHowItWorks || isSimulating || simulateResult || isCallingApi || apiResult) && (
              <div className="p-4 pt-0">
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

                {/* API Call states */}
                {isCallingApi && (
                  <div className="my-3 flex justify-center">
                    <div className="w-1/2">
                      <div className="border border-gray-200 bg-gray-50 rounded-md h-9 px-4 flex items-center justify-center overflow-hidden">
                        <div className="text-sm text-gray-700">
                          Calling OpenAI API...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!isCallingApi && apiResult && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-900 mb-2">API Response:</div>
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800">
                        {apiResult}
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
                          option.separator ? (
                            <hr key={`sep-${optIdx}`} className="my-1 border-gray-200" />
                          ) : (
                            <button
                              key={`opt-${optIdx}`}
                              onClick={option.action}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              {option.label}
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
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl w-full max-w-md" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm text-gray-900">Controls</h3>
              <button onClick={() => setIsControlsOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4 space-y-3">
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
                      {[1000,2000,3000,4000,5000,8000,10000,16000,32000].map(tok => (
                        <button key={tok} type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setMaxOutputTokens(tok)}>
                          {tok.toLocaleString()}
                        </button>
                      ))}
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

      {/* User Prompt Panel - centered, editable */}
      {isUserPromptOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-white border border-gray-200 rounded-md shadow-xl w-full max-w-3xl flex flex-col"
            style={{ fontFamily: 'Inter, system-ui, sans-serif', aspectRatio: '16/9' }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm text-gray-900">User Prompt</h3>
              <button onClick={() => setIsUserPromptOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full h-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                placeholder="Enter user prompt..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Preflight Payload Modal */}
      {isPreflightModalOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-4xl mx-4 flex flex-col" style={{ aspectRatio: '16/9', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pre-Flight API Payload</h2>
              <div className="flex gap-2">
                <button
                  onClick={copyPayloadToClipboard}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    copyPayloadButtonText === 'Copied!' 
                      ? 'bg-green-600 text-white' 
                      : copyPayloadButtonText === 'Failed'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copyPayloadButtonText}
                </button>
                <button 
                  onClick={() => setIsPreflightModalOpen(false)} 
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
    </>
  );
}