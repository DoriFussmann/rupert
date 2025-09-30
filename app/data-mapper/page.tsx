"use client";
import { useEffect, useMemo, useState, useRef } from 'react';
import NavigationHeader from '../components/NavigationHeader';

export default function DataMapperPage() {
  const [outputsExpanded, setOutputsExpanded] = useState(false);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Array<{ id: string; name: string; data?: any }>>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [structures, setStructures] = useState<Array<{ id: string; title: string; data?: any }>>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; data?: any }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const MODEL_OPTIONS: Record<string, string[]> = {
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    gemini: ["gemini-1.5-flash", "gemini-1.5-pro"],
  };
  const [model, setModel] = useState<string>("gpt-4o");
  const [maxTokens, setMaxTokens] = useState<number>(3000);
  const [temperature, setTemperature] = useState<number>(0.2);
  const MAX_TOKEN_OPTIONS = [128, 256, 512, 1024, 2048, 3000, 4096, 8192];
  const TEMP_OPTIONS = [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0];
  const [showPayload, setShowPayload] = useState(false);
  const [showFullPayload, setShowFullPayload] = useState(false);
  const [fullPayloadText, setFullPayloadText] = useState<string>("{\n  \"example\": \"value\"\n}");
  const [isRunningFullPayload, setIsRunningFullPayload] = useState(false);
  const [fullPayloadResult, setFullPayloadResult] = useState<any>(null);
  const [fullPayloadError, setFullPayloadError] = useState<string | null>(null);
  const [fullPayloadDebugInfo, setFullPayloadDebugInfo] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [parsedBusinessPlan, setParsedBusinessPlan] = useState<any>(null);
  const [showUnallocated, setShowUnallocated] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  
  // Preloader states
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMsgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadingMessages = [
    "Analyzing semantic intent…",
    "Calibrating vector embeddings…",
    "Mapping entities and relationships…",
    "Synthesizing optimal strategy…",
    "Validating constraints and edge cases…",
  ];

  // How it Works states
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [ribbonHidden, setRibbonHidden] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [visibleActionCount, setVisibleActionCount] = useState(0);
  const actionsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleShowHowItWorks() {
    setShowHowItWorks(true);
  }

  function triggerSuccessSequence() {
    // 1) Fade out the How it Works ribbon, then 2) reveal actions
    setRibbonHidden(true);
    setTimeout(() => {
      setShowActions(true);
    }, 250);
  }

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
      { label: 'To Clipboard', action: () => {
        const plainText = generatePlainTextPlan(parsedBusinessPlan);
        navigator.clipboard?.writeText(plainText);
      }},
      { label: 'As Rich Text', action: () => console.log('Copy as Rich Text') },
      { label: 'As Plain Text', action: () => {
        const plainText = generatePlainTextPlan(parsedBusinessPlan);
        navigator.clipboard?.writeText(plainText);
      }},
    ],
    code: [
      { label: 'Copy Raw Response', action: () => {
        navigator.clipboard?.writeText(JSON.stringify(fullPayloadResult, null, 2));
      }},
      { label: 'Copy JSON', action: () => {
        navigator.clipboard?.writeText(JSON.stringify(fullPayloadResult, null, 2));
      }},
      { label: 'Copy Content Only', action: () => {
        navigator.clipboard?.writeText(fullPayloadResult?.result?.content || '');
      }},
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const payload = useMemo(() => {
    const task = tasks.find(t => t.id === selectedTaskId);
    const structure = structures.find(s => s.id === selectedStructureId);
    const company = companies.find(c => c.id === selectedCompanyId);
    return {
      task: task ? { 
        id: task.id, 
        name: task.name,
        taskPrompt: task.data?.taskPrompt || task.data?.prompt || ''
      } : null,
      structure: structure ? { 
        id: structure.id, 
        title: structure.title,
        compiled: structure.data?.compiled || null
      } : null,
      company: company ? { 
        id: company.id, 
        name: company.name,
        rawData: company.data?.rawData || company.data?.data || ''
      } : null,
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
        const mapped = records.map(r => ({ 
          id: r.id, 
          name: String((r.data as any)?.name || 'Unnamed Task'),
          data: r.data
        }));
        setTasks(mapped);
      } catch {}
    }
    async function loadStructures() {
      try {
        const res = await fetch('/api/collections/structures/records', { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await res.json();
        const mapped = records.map(r => ({ 
          id: r.id, 
          title: String((r.data as any)?.title || 'Untitled Structure'),
          data: r.data
        }));
        setStructures(mapped);
      } catch {}
    }
    async function loadCompanies() {
      try {
        const res = await fetch('/api/collections/companies/records', { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await res.json();
        const mapped = records.map(r => ({ 
          id: r.id, 
          name: String((r.data as any)?.name || 'Unnamed Company'),
          data: r.data
        }));
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
      const c = companies.find(x => x.name?.toLowerCase?.().includes("lightssaas"));
      if (c) setSelectedCompanyId(c.id);
    }
  }, [companies]);

  // Keep model in sync with provider selection
  useEffect(() => {
    const defaults = MODEL_OPTIONS[provider] || [];
    if (!defaults.includes(model)) setModel(defaults[0] || "");
  }, [provider]);

  // Handle loading message cycling
  useEffect(() => {
    if (isRunningFullPayload) {
      setLoadingMessageIndex(0);
      loadingMsgIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 1500);
    } else {
      if (loadingMsgIntervalRef.current) {
        clearInterval(loadingMsgIntervalRef.current);
        loadingMsgIntervalRef.current = null;
      }
    }

    return () => {
      if (loadingMsgIntervalRef.current) {
        clearInterval(loadingMsgIntervalRef.current);
        loadingMsgIntervalRef.current = null;
      }
    };
  }, [isRunningFullPayload, loadingMessages.length]);

  // Staggered show of action icons
  useEffect(() => {
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

  // Parse AI response into structured format
  const parseBusinessPlanResponse = (content: string) => {
    try {
      const sections = {
        businessPlan: [],
        unallocated: [],
        unanswered: [],
        parseError: null
      };

      const lines = content.split('\n');
      let currentSection = '';
      let currentTopic = null;
      let currentSubtopic = null;

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Detect sections (tolerant matching)
        if (line.includes('=== BUSINESS PLAN ===')) {
          currentSection = 'businessPlan';
          continue;
        }
        if (line.includes('=== UNALLOCATED PROFESSIONALIZED DATA POINTS ===') || 
            line.includes('=== UNALLOCATED ===')) {
          currentSection = 'unallocated';
          continue;
        }
        if (line.includes('=== UNANSWERED QUESTIONS ===') || 
            line.includes('=== UNANSWERED ===')) {
          currentSection = 'unanswered';
          continue;
        }

        if (currentSection === 'businessPlan') {
          // Topic header: # Topic: Business Overview
          if (line.startsWith('# Topic:')) {
            currentTopic = {
              title: line.replace('# Topic:', '').trim(),
              subtopics: []
            };
            sections.businessPlan.push(currentTopic);
          }
          // Subtopic header: ## Subtopic: Company Description
          else if (line.startsWith('## Subtopic:')) {
            currentSubtopic = {
              title: line.replace('## Subtopic:', '').trim(),
              dataPoints: []
            };
            if (currentTopic) {
              currentTopic.subtopics.push(currentSubtopic);
            }
          }
          // Data point: - ([questionId]) Data point OR - Data point
          else if (line.startsWith('- ')) {
            const dataPointText = line.substring(2).trim();
            let questionId = '';
            let text = dataPointText;
            
            // Check for questionId pattern: ([questionId])
            const questionIdMatch = dataPointText.match(/^\(\[([^\]]+)\]\)\s*(.*)$/);
            if (questionIdMatch) {
              questionId = questionIdMatch[1];
              text = questionIdMatch[2];
            }
            
            if (currentSubtopic) {
              currentSubtopic.dataPoints.push({
                questionId,
                text,
                raw: dataPointText
              });
            }
          }
        }
        else if (currentSection === 'unallocated') {
          if (line.startsWith('- ')) {
            sections.unallocated.push(line.substring(2).trim());
          }
        }
        else if (currentSection === 'unanswered') {
          // Topic header: # Topic: Business Overview
          if (line.startsWith('# Topic:')) {
            currentTopic = {
              title: line.replace('# Topic:', '').trim(),
              subtopics: []
            };
            sections.unanswered.push(currentTopic);
          }
          // Subtopic header: ## Subtopic: Company Description
          else if (line.startsWith('## Subtopic:')) {
            currentSubtopic = {
              title: line.replace('## Subtopic:', '').trim(),
              questions: []
            };
            if (currentTopic) {
              currentTopic.subtopics.push(currentSubtopic);
            }
          }
          // Question: - 1.1.1 What is the question?
          else if (line.startsWith('- ')) {
            const question = line.substring(2).trim();
            if (currentSubtopic) {
              currentSubtopic.questions.push(question);
            }
          }
        }
      }

      return sections;
    } catch (error) {
      console.error('Error parsing business plan response:', error);
      return {
        businessPlan: [],
        unallocated: [],
        unanswered: [],
        parseError: error.message
      };
    }
  };

  // Generate plain text version for copying
  const generatePlainTextPlan = (parsed: any) => {
    if (!parsed) return '';
    
    let output = '';
    
    // Business Plan Section
    if (parsed.businessPlan.length > 0) {
      output += '=== BUSINESS PLAN ===\n\n';
      parsed.businessPlan.forEach((topic: any) => {
        output += `# Topic: ${topic.title}\n`;
        topic.subtopics.forEach((subtopic: any) => {
          output += `## Subtopic: ${subtopic.title}\n`;
          if (subtopic.dataPoints.length > 0) {
            subtopic.dataPoints.forEach((dp: any) => {
              if (dp.questionId) {
                output += `- ([${dp.questionId}]) ${dp.text}\n`;
              } else {
                output += `- ${dp.text}\n`;
              }
            });
          } else {
            output += '- No mapped data points.\n';
          }
          output += '\n';
        });
      });
    }
    
    // Unallocated Section
    if (parsed.unallocated.length > 0) {
      output += '=== UNALLOCATED PROFESSIONALIZED DATA POINTS ===\n';
      parsed.unallocated.forEach((item: string) => {
        output += `- ${item}\n`;
      });
      output += '\n';
    }
    
    // Unanswered Section
    if (parsed.unanswered.length > 0) {
      output += '=== UNANSWERED QUESTIONS ===\n';
      parsed.unanswered.forEach((topic: any) => {
        output += `# Topic: ${topic.title}\n`;
        topic.subtopics.forEach((subtopic: any) => {
          output += `## Subtopic: ${subtopic.title}\n`;
          subtopic.questions.forEach((question: string) => {
            output += `- ${question}\n`;
          });
          output += '\n';
        });
      });
    }
    
    return output.trim();
  };

  // Parse response when fullPayloadResult changes
  useEffect(() => {
    if (fullPayloadResult?.result?.content) {
      const parsed = parseBusinessPlanResponse(fullPayloadResult.result.content);
      setParsedBusinessPlan(parsed);
    } else {
      setParsedBusinessPlan(null);
    }
  }, [fullPayloadResult]);

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
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-black border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                      <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="whitespace-nowrap truncate">{maxTokens}</span>
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
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-black border border-gray-300 rounded-md hover:border-gray-400 transition-all">
                      <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="whitespace-nowrap truncate">{temperature}</span>
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
                    className="w-full px-3 py-1.5 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isRunningFullPayload || !selectedTaskId || !selectedStructureId || !selectedCompanyId}
                    onClick={async () => {
                      if (isRunningFullPayload) return;
                      
                      const debugInfo = {
                        timestamp: new Date().toISOString(),
                        request: {
                          url: '/api/data-mapper/process',
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: payload
                        },
                        response: null,
                        error: null,
                        parsedPayload: payload
                      };
                      
                      try {
                        setIsRunningFullPayload(true);
                        setFullPayloadError(null);
                        setFullPayloadResult(null);
                        setFullPayloadDebugInfo(null);
                        setShowDebugInfo(false);
                        
                        // Call the structured data mapper endpoint
                        const response = await fetch('/api/data-mapper/process', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
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
                          triggerSuccessSequence();
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
                        console.error('Structured payload API error:', error);
                        
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
                            : 'Network error occurred'
                        );
                        setFullPayloadDebugInfo(debugInfo);
                      } finally {
                        setIsRunningFullPayload(false);
                      }
                    }}
                  >
                    {isRunningFullPayload ? 'Running...' : 'Run'}
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
            <div className="bg-white rounded-md border border-gray-200 transition-colors relative">
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
                    
                    {parsedBusinessPlan ? (
                      <div className="space-y-4">
                        {/* Parse Error Warning */}
                        {parsedBusinessPlan.parseError && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <span className="text-sm font-medium text-yellow-800">Parsing Warning</span>
                            </div>
                            <div className="text-sm text-yellow-700 mt-1">
                              Some content may not have been parsed correctly: {parsedBusinessPlan.parseError}
                            </div>
                          </div>
                        )}

                        {/* Business Plan Structure */}
                        <div className="bg-green-50 border border-green-200 rounded-md">
                          <div className="px-3 py-2 border-b border-green-200 bg-green-100 flex items-center justify-between">
                            <span className="text-xs font-medium text-green-800">Structured Business Plan</span>
                            <button
                              className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300"
                              onClick={() => {
                                const plainText = generatePlainTextPlan(parsedBusinessPlan);
                                navigator.clipboard?.writeText(plainText);
                              }}
                            >
                              Copy Plan
                            </button>
                          </div>
                          <div className="p-3 space-y-4">
                            {parsedBusinessPlan.businessPlan.length > 0 ? (
                              parsedBusinessPlan.businessPlan.map((topic: any, topicIndex: number) => (
                                <div key={topicIndex} className="border border-gray-200 rounded-md">
                                  <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-900">{topic.title}</h3>
                                  </div>
                                  <div className="p-3 space-y-3">
                                    {topic.subtopics.map((subtopic: any, subtopicIndex: number) => (
                                      <div key={subtopicIndex} className="border-l-2 border-blue-200 pl-3">
                                        <h4 className="text-sm font-medium text-blue-800 mb-2">{subtopic.title}</h4>
                                        <div className="space-y-1">
                                          {subtopic.dataPoints.length > 0 ? (
                                            subtopic.dataPoints.map((dataPoint: any, dpIndex: number) => (
                                              <div key={dpIndex} className="text-sm text-gray-700 flex">
                                                <span className="text-blue-600 mr-2">•</span>
                                                <span>
                                                  {dataPoint.questionId && (
                                                    <span className="text-blue-600 font-mono text-xs mr-2">
                                                      ([{dataPoint.questionId}])
                                                    </span>
                                                  )}
                                                  {dataPoint.text || dataPoint.raw}
                                                </span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-xs text-gray-500 italic">No mapped data points.</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500 italic text-center py-4">
                                No business plan structure found.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unallocated Data Points */}
                        <div className="border border-gray-200 rounded-md">
                          <button
                            onClick={() => setShowUnallocated(!showUnallocated)}
                            className="w-full px-3 py-2 bg-yellow-50 border-b border-gray-200 flex items-center justify-between text-left hover:bg-yellow-100"
                          >
                            <span className="text-sm font-medium text-yellow-800">
                              Unallocated ({parsedBusinessPlan.unallocated?.length || 0})
                            </span>
                            <svg 
                              className={`w-4 h-4 transform transition-transform ${showUnallocated ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                          {showUnallocated && (
                            <div className="p-3 space-y-2">
                              {parsedBusinessPlan.unallocated && parsedBusinessPlan.unallocated.length > 0 ? (
                                parsedBusinessPlan.unallocated.map((item: string, index: number) => (
                                  <div key={index} className="text-sm text-gray-700 flex">
                                    <span className="text-yellow-600 mr-2">•</span>
                                    <span>{item}</span>
                </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500 italic">No unallocated data points</div>
                              )}
              </div>
                          )}
            </div>

                        {/* Unanswered Questions */}
                        <div className="border border-gray-200 rounded-md">
                          <button
                            onClick={() => setShowUnanswered(!showUnanswered)}
                            className="w-full px-3 py-2 bg-red-50 border-b border-gray-200 flex items-center justify-between text-left hover:bg-red-100"
                          >
                            <span className="text-sm font-medium text-red-800">
                              Unanswered ({parsedBusinessPlan.unanswered?.reduce((total: number, topic: any) => 
                                total + (topic.subtopics?.reduce((subTotal: number, subtopic: any) => subTotal + (subtopic.questions?.length || 0), 0) || 0), 0) || 0})
                            </span>
                            <svg 
                              className={`w-4 h-4 transform transition-transform ${showUnanswered ? 'rotate-90' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {showUnanswered && (
                            <div className="p-3 space-y-3">
                              {parsedBusinessPlan.unanswered && parsedBusinessPlan.unanswered.length > 0 ? (
                                parsedBusinessPlan.unanswered.map((topic: any, topicIndex: number) => (
                                  <div key={topicIndex}>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">{topic.title}</h4>
                                    {topic.subtopics && topic.subtopics.map((subtopic: any, subtopicIndex: number) => (
                                      <div key={subtopicIndex} className="border-l-2 border-red-200 pl-3 mb-2">
                                        <h5 className="text-sm font-medium text-red-800 mb-1">{subtopic.title}</h5>
                                        <div className="space-y-1">
                                          {subtopic.questions && subtopic.questions.length > 0 ? (
                                            subtopic.questions.map((question: string, qIndex: number) => (
                                              <div key={qIndex} className="text-sm text-gray-700 flex">
                                                <span className="text-red-600 mr-2">•</span>
                                                <span>{question}</span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-xs text-gray-500 italic">No unanswered questions in this subtopic</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500 italic">No unanswered questions</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : fullPayloadResult.result?.content ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-md">
                        <div className="px-3 py-2 border-b border-blue-200 bg-blue-100 text-xs font-medium text-blue-800">
                          AI Response Content (Raw)
                        </div>
                        <div className="p-3 text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-auto">
                          {fullPayloadResult.result.content}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : isRunningFullPayload ? (
                  <div className="flex justify-center py-8">
                    <div className="w-2/3">
                      <div className="border border-gray-200 bg-gray-50 rounded-md h-12 px-4 flex items-center justify-center overflow-hidden">
                        <div key={loadingMessageIndex} className="text-sm text-gray-700 nb-anim-loading-line">
                          {loadingMessages[loadingMessageIndex]}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    No output yet. Run an API call to see results here.
                  </div>
                )}
              </div>
              {showHowItWorks && (
                <div className="p-4 border-t border-gray-200 relative">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed min-h-24">
                    <div className="space-y-3">
                      <p><strong>Data Mapper - How it Works:</strong></p>
                      <p>1. <strong>Select Your Components:</strong> Choose a Task (with prompt instructions), Structure (compiled business plan template), and Company (raw data source).</p>
                      <p>2. <strong>Configure AI Settings:</strong> Set your preferred model (GPT-4o recommended), temperature (0.2 for consistency), and max tokens (3000 for comprehensive output).</p>
                      <p>3. <strong>Run Processing:</strong> Click "Run" to send structured data to OpenAI, or use "Full Payload" for custom JSON requests.</p>
                      <p>4. <strong>Review Results:</strong> The AI processes your company data according to the task instructions and structure template, producing organized business plans with allocated data points, unallocated items, and unanswered questions.</p>
                      <p>5. <strong>Export & Share:</strong> Copy the structured results or raw output for further use in your business planning workflow.</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => setShowHowItWorks(false)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
              {/* Action icons top-right */}
              {showActions && (
                <div className="absolute top-2 right-2 flex flex-row-reverse items-center gap-2">
                  {actionItems.slice(0, visibleActionCount).map((a, idx) => (
                    <div key={a.key} className="relative group">
                      <button
                        title={a.title}
                        className="bg-blue-100 text-blue-800 border border-blue-300 rounded-md p-1 shadow-sm hover:bg-blue-200 transition-all nb-anim-fade-slide-in"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        {a.svg}
                      </button>
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
            <div className="p-4 overflow-auto max-h-[60vh]">
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
                      triggerSuccessSequence();
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

