"use client";
import { useState, useEffect } from "react";

interface Question {
  id: string;
  text: string;
}

interface Subtopic {
  id: string;
  title: string;
  children: Question[];
}

interface Topic {
  id: string;
  title: string;
  children: Subtopic[];
}

interface TreeData {
  children: Topic[];
}

interface RecordData {
  title: string;
  description?: string;
  tree?: TreeData;
  compiled?: any;
  livePreview?: boolean;
}

interface CompileResult {
  topics: any[];
  unallocated: { id: string; text: string }[];
  unanswered: { id: string; questionId: string; text: string }[];
  outline: Record<string, string>;
  warnings: string[];
  meta: {
    recordId: string;
    saved: boolean;
  };
}

interface Props {
  recordId: string;
}

export default function StructureEditor({ recordId }: Props) {
  const [originalData, setOriginalData] = useState<RecordData>({ title: "" });
  const [tree, setTree] = useState<TreeData>({ children: [] });
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [savedCompileResult, setSavedCompileResult] = useState<CompileResult | null>(null);
  const [compiledAt, setCompiledAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);

  // Copy to clipboard function
  const copyToClipboard = async (content: any, type: string) => {
    try {
      const text = JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if desired
      console.log(`${type} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Load record data
  useEffect(() => {
    loadRecord();
  }, [recordId]);

  async function loadRecord() {
    try {
      setLoading(true);
      const response = await fetch(`/api/collections/structures/records/${recordId}`);
      if (!response.ok) throw new Error("Failed to load record");
      
      const record = await response.json();
      const data = record.data as RecordData;
      
      setOriginalData(data);
      setTree(data.tree || { children: [] });
      
      // Load saved compile result if it exists
      if (data.compiled) {
        setSavedCompileResult(data.compiled);
        setCompiledAt(record.updatedAt || record.createdAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load record");
    } finally {
      setLoading(false);
    }
  }

  // Save record
  async function saveRecord() {
    try {
      setLoading(true);
      const response = await fetch(`/api/collections/structures/records/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            ...originalData,
            tree
          }
        })
      });
      
      if (!response.ok) throw new Error("Failed to save record");
      
      const updated = await response.json();
      setOriginalData(updated.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setLoading(false);
    }
  }

  // Generate preview (compile without saving)
  async function generatePreview() {
    try {
      setLoading(true);
      const response = await fetch(`/api/collections/structures/records/${recordId}/compile`);
      if (!response.ok) throw new Error("Failed to compile structure");
      
      const result = await response.json();
      setCompileResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile structure");
    } finally {
      setLoading(false);
    }
  }

  // Save & Compile
  async function saveAndCompile() {
    try {
      setLoading(true);
      
      // First save the record
      await saveRecord();
      
      // Then compile and save to DB
      const response = await fetch(`/api/collections/structures/records/${recordId}/compile?save=true`);
      if (!response.ok) throw new Error("Failed to compile and save structure");
      
      const result = await response.json();
      setSavedCompileResult(result);
      setCompiledAt(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save and compile");
    } finally {
      setLoading(false);
    }
  }

  // Refresh from DB
  async function refreshFromDB() {
    await loadRecord();
  }

  // Add new topic
  function addTopic() {
    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      title: "New Topic",
      children: []
    };
    setTree(prev => ({
      children: [...prev.children, newTopic]
    }));
  }

  // Add new subtopic to topic
  function addSubtopic(topicIndex: number) {
    const newSubtopic: Subtopic = {
      id: `subtopic-${Date.now()}`,
      title: "New Subtopic",
      children: []
    };
    setTree(prev => ({
      children: prev.children.map((topic, index) =>
        index === topicIndex
          ? { ...topic, children: [...topic.children, newSubtopic] }
          : topic
      )
    }));
  }

  // Add new question to subtopic
  function addQuestion(topicIndex: number, subtopicIndex: number) {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      text: "New Question"
    };
    setTree(prev => ({
      children: prev.children.map((topic, tIndex) =>
        tIndex === topicIndex
          ? {
              ...topic,
              children: topic.children.map((subtopic, sIndex) =>
                sIndex === subtopicIndex
                  ? { ...subtopic, children: [...subtopic.children, newQuestion] }
                  : subtopic
              )
            }
          : topic
      )
    }));
  }

  // Update topic title
  function updateTopicTitle(topicIndex: number, title: string) {
    setTree(prev => ({
      children: prev.children.map((topic, index) =>
        index === topicIndex ? { ...topic, title } : topic
      )
    }));
  }

  // Update subtopic title
  function updateSubtopicTitle(topicIndex: number, subtopicIndex: number, title: string) {
    setTree(prev => ({
      children: prev.children.map((topic, tIndex) =>
        tIndex === topicIndex
          ? {
              ...topic,
              children: topic.children.map((subtopic, sIndex) =>
                sIndex === subtopicIndex ? { ...subtopic, title } : subtopic
              )
            }
          : topic
      )
    }));
  }

  // Update question text
  function updateQuestionText(topicIndex: number, subtopicIndex: number, questionIndex: number, text: string) {
    setTree(prev => ({
      children: prev.children.map((topic, tIndex) =>
        tIndex === topicIndex
          ? {
              ...topic,
              children: topic.children.map((subtopic, sIndex) =>
                sIndex === subtopicIndex
                  ? {
                      ...subtopic,
                      children: subtopic.children.map((question, qIndex) =>
                        qIndex === questionIndex ? { ...question, text } : question
                      )
                    }
                  : subtopic
              )
            }
          : topic
      )
    }));
  }

  if (loading && !originalData.title) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="h-full flex">
      {/* Left Pane - Editor */}
      <div className="flex-1 p-6 border-r overflow-y-auto max-h-full">
        <div className="mb-6">
          <h1 className="text-lg font-normal mb-4">Structure Editor</h1>
          
          {/* Title Input */}
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={originalData.title}
              onChange={(e) => setOriginalData(prev => ({ ...prev, title: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-sm px-3 py-2 text-sm"
              placeholder="Structure title"
            />
          </div>

        </div>

        {/* Tree Editor */}
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={addTopic}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Add Topic
            </button>
          </div>

          {tree.children.map((topic, topicIndex) => (
            <div key={topic.id} className="border rounded p-4">
              <div className="mb-3">
                <input
                  type="text"
                  value={topic.title}
                  onChange={(e) => updateTopicTitle(topicIndex, e.target.value)}
                  className="w-full font-medium border-b border-gray-300 bg-transparent text-sm"
                  placeholder="Topic title"
                />
                <button
                  onClick={() => addSubtopic(topicIndex)}
                  className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                >
                  Add Subtopic
                </button>
              </div>

              {topic.children.map((subtopic, subtopicIndex) => (
                <div key={subtopic.id} className="ml-4 border-l-2 border-gray-200 pl-4 mb-3">
                  <div className="mb-2">
                    <input
                      type="text"
                      value={subtopic.title}
                      onChange={(e) => updateSubtopicTitle(topicIndex, subtopicIndex, e.target.value)}
                      className="w-full border-b border-gray-300 bg-transparent text-sm"
                      placeholder="Subtopic title"
                    />
                    <button
                      onClick={() => addQuestion(topicIndex, subtopicIndex)}
                      className="mt-1 bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
                    >
                      Add Question
                    </button>
                  </div>

                  {subtopic.children.map((question, questionIndex) => (
                    <div key={question.id} className="ml-4 mb-2">
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestionText(topicIndex, subtopicIndex, questionIndex, e.target.value)}
                        className="w-full text-xs border-b border-gray-200 bg-transparent"
                        placeholder="Question text"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Save Buttons */}
        <div className="mt-6 pt-4 border-t flex gap-2">
          <button
            onClick={saveRecord}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={saveAndCompile}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-sm hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Saving & Compiling..." : "Save & Compile"}
          </button>
        </div>
      </div>

      {/* Right Pane - Preview */}
      <div className="flex-1 p-6 overflow-y-auto max-h-full">
        {/* Compiled Tree Section */}
        <div className="mb-6">
          <h2 className="text-base font-normal mb-4">Compiled Tree</h2>
        </div>

        <div>
          {/* Always show saved results section */}
          {savedCompileResult ? (
            <div className="space-y-4">
              {/* Warnings */}
              {savedCompileResult.warnings && savedCompileResult.warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                  <ul className="text-sm text-yellow-700">
                    {savedCompileResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Collapsible Outline */}
              {savedCompileResult.outline && (
                <div className="border border-gray-200 rounded-sm">
                  <div className="relative">
                    <button
                      onClick={() => setOutlineOpen(!outlineOpen)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                    >
                      <span className="text-sm font-normal">Outline</span>
                      <svg 
                        className={`w-4 h-4 transform transition-transform ${outlineOpen ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {/* Copy Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(savedCompileResult.outline, 'Outline');
                      }}
                      className="absolute top-2 right-10 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Copy outline to clipboard"
                    >
                      <svg 
                        className="w-4 h-4"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  {outlineOpen && (
                    <div className="border-t border-gray-200 p-3">
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto font-mono">
                        {JSON.stringify(savedCompileResult.outline, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Compiled Topics */}
              {savedCompileResult.topics && (
                <div className="border border-gray-200 rounded-sm">
                  <div className="relative">
                    <button
                      onClick={() => setTreeOpen(!treeOpen)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                    >
                      <span className="text-sm font-normal">Compiled Topics</span>
                      <svg 
                        className={`w-4 h-4 transform transition-transform ${treeOpen ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {/* Copy Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(savedCompileResult.topics, 'Compiled Topics');
                      }}
                      className="absolute top-2 right-10 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Copy compiled topics to clipboard"
                    >
                      <svg 
                        className="w-4 h-4"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  {treeOpen && (
                    <div className="border-t border-gray-200 p-3">
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto font-mono">
                        {JSON.stringify(savedCompileResult.topics, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Unallocated Items */}
              <div className="border border-gray-200 rounded-sm">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal">Unallocated Items</span>
                    <span className="text-xs text-gray-500">
                      {savedCompileResult.unallocated?.length || 0} items
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  {savedCompileResult.unallocated && savedCompileResult.unallocated.length > 0 ? (
                    <div className="space-y-2">
                      {savedCompileResult.unallocated.map((item, index) => (
                        <div key={index} className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="font-mono text-xs text-gray-500">{item.id}</div>
                          <div>{item.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No unallocated items</div>
                  )}
                </div>
              </div>

              {/* Unanswered Questions */}
              <div className="border border-gray-200 rounded-sm">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal">Unanswered Questions</span>
                    <span className="text-xs text-gray-500">
                      {savedCompileResult.unanswered?.length || 0} questions
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  {savedCompileResult.unanswered && savedCompileResult.unanswered.length > 0 ? (
                    <div className="space-y-2">
                      {savedCompileResult.unanswered.map((item, index) => (
                        <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                          <div className="font-mono text-xs text-gray-500">{item.id} → {item.questionId}</div>
                          <div>{item.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No unanswered questions</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-sm">No saved compilation results. Use "Save & Compile" to generate and save results to the database.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}


      </div>
    </div>
  );
}
