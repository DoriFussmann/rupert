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
  outline: Record<string, string>;
  tree: any[];
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
    <div className="h-screen flex">
      {/* Left Pane - Editor */}
      <div className="flex-1 p-6 border-r overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-normal mb-4">Structure Editor</h1>
          
          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={originalData.title}
              onChange={(e) => setOriginalData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Structure title"
            />
          </div>

          {/* Save Buttons */}
          <div className="flex gap-2">
            <button
              onClick={saveRecord}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={saveAndCompile}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Saving & Compiling..." : "Save & Compile"}
            </button>
          </div>
        </div>

        {/* Tree Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Structure Tree</h2>
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
                  className="w-full font-medium border-b border-gray-300 bg-transparent"
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
                      className="w-full border-b border-gray-300 bg-transparent"
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
                        className="w-full text-sm border-b border-gray-200 bg-transparent"
                        placeholder="Question text"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane - Preview */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Live Preview Section */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Preview (Live)</h2>
          <button
            onClick={generatePreview}
            disabled={loading}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate JSON"}
          </button>
        </div>

        {/* Saved Preview Section */}
        <div className="mb-6 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium">Saved (from DB)</h2>
              {compiledAt && (
                <p className="text-sm text-gray-600">
                  Compiled at: {new Date(compiledAt).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={refreshFromDB}
              disabled={loading}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 disabled:opacity-50"
            >
              Refresh from DB
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Live Preview Results */}
        {compileResult && (
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-orange-700">Live Preview Results:</h3>
            
            {/* Warnings */}
            {compileResult.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                <ul className="text-sm text-yellow-700">
                  {compileResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Outline */}
            <div>
              <h4 className="font-medium mb-2">Outline:</h4>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(compileResult.outline, null, 2)}
              </pre>
            </div>

            {/* Compiled Tree */}
            <div>
              <h4 className="font-medium mb-2">Compiled Tree:</h4>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(compileResult.tree, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Saved Preview Results */}
        {savedCompileResult && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-green-700">Saved (DB) Results:</h3>
            
            {/* Warnings */}
            {savedCompileResult.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                <ul className="text-sm text-yellow-700">
                  {savedCompileResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Outline */}
            <div>
              <h4 className="font-medium mb-2">Outline:</h4>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(savedCompileResult.outline, null, 2)}
              </pre>
            </div>

            {/* Compiled Tree */}
            <div>
              <h4 className="font-medium mb-2">Compiled Tree:</h4>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(savedCompileResult.tree, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* No saved results message */}
        {!savedCompileResult && (
          <div className="border-t pt-4">
            <p className="text-gray-500 text-sm">No saved compilation results. Use "Save & Compile" to generate and save results to the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
