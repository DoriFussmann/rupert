"use client";
import { useEffect, useRef, useState } from "react";

interface Task {
  id: string;
  name: string;
  data?: Record<string, unknown>;
}

interface InputsPanelProps {
  outputsExpanded: boolean;
  isBlinking?: boolean;
  advisorImageUrl?: string | null;
  advisorName?: string;
  onSimulate?: () => Promise<void>;
  isSimulating?: boolean;
  onOpenPayloadModal?: () => void;
  onRunApiCall?: (taskPrompt: string) => Promise<void>;
}

export default function InputsPanel({ 
  outputsExpanded, 
  isBlinking = false,
  advisorImageUrl = null,
  advisorName = 'Advisor',
  onSimulate,
  isSimulating = false,
  onOpenPayloadModal,
  onRunApiCall
}: InputsPanelProps) {
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);

  // Load tasks from API
  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch('/api/collections/tasks/records', { 
          headers: { 'Content-Type': 'application/json' } 
        });
        if (!res.ok) return;
        const records: Array<{ id: string; data?: Record<string, unknown> }> = await res.json();
        const mapped = records.map(r => ({ 
          id: r.id, 
          name: String((r.data as any)?.name || 'Unnamed Task'),
          data: r.data
        }));
        setTasks(mapped);
        
        // Set first task as default if available
        if (mapped.length > 0 && !selectedTaskId) {
          setSelectedTaskId(mapped[0].id);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
    loadTasks();
  }, []);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div
      className="relative"
      style={{ width: outputsExpanded ? "0%" : "25%", transition: "width 200ms ease", pointerEvents: outputsExpanded ? "none" : "auto" }}
    >
      <div className={`bg-white rounded-md border border-gray-200 ${outputsExpanded ? "opacity-0" : "opacity-100"} transition-opacity duration-200 ${isBlinking ? "nb-anim-inputs-panel-blink" : ""}`}>
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
          {/* Image placeholder at top */}
          <div className="mb-4 w-full h-64 bg-gray-100 border border-gray-200 rounded-md shadow-inner flex items-center justify-center text-gray-400 overflow-hidden">
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

          {/* Tasks Dropdown */}
          <div className="relative group mt-3">
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all">
              <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{selectedTask ? selectedTask.name : 'Select Task'}</span>
            </button>
            
            {/* Tasks Dropdown Menu */}
            <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000]">
              <div className="py-2">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        selectedTaskId === task.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {task.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No tasks available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Task Button */}
          {selectedTask && (
            <button
              onClick={() => setIsTaskDetailsModalOpen(true)}
              className="w-full mt-3 px-3 py-1.5 text-sm text-black hover:text-gray-800 border border-gray-300 rounded-md hover:border-gray-400 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-blue-700">Content of Task</span>
            </button>
          )}

          {/* Run API Call Button */}
          {onRunApiCall && selectedTask && (
            <button
              type="button"
              onClick={() => {
                const taskPrompt = selectedTask.data?.taskPrompt ? String(selectedTask.data.taskPrompt) : '';
                if (taskPrompt) {
                  onRunApiCall(taskPrompt);
                }
              }}
              disabled={!selectedTask?.data?.taskPrompt}
              className="w-full mt-2 px-3 py-1.5 text-sm rounded-md transition-colors border text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Run API Call
            </button>
          )}

        </div>
    )}
      </div>

      {/* Task Details Modal */}
      {isTaskDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-6 w-full max-w-6xl mx-4 flex flex-col" style={{ aspectRatio: '16/9', transform: 'scale(1.5)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
              <div className="flex items-center gap-2">
                {selectedTask.data?.taskPrompt && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(selectedTask.data.taskPrompt));
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    title="Copy Task Prompt"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setIsTaskDetailsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {/* Task Name */}
                <div>
                  <label className="text-3xs font-medium text-gray-700">Task Name</label>
                  <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="text-3xs text-gray-900">{selectedTask.name}</div>
                  </div>
                </div>

                {/* Task Prompt */}
                {selectedTask.data?.taskPrompt && (
                  <div>
                    <label className="text-3xs font-medium text-gray-700">Task Prompt</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <div className="text-3xs text-gray-900 whitespace-pre-wrap">
                        {String(selectedTask.data.taskPrompt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsTaskDetailsModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
