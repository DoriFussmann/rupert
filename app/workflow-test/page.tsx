"use client";
import WorkflowChat from "@/app/components/WorkflowChat";

export default function WorkflowTest() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1120px' }}>
        <div className="mx-auto" style={{ maxWidth: '1120px' }}>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Workflow Test</h1>
          <p className="mb-6 text-slate-600">
            Testing OpenAI Workflow integration with custom chat UI
          </p>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="h-[600px]">
              <WorkflowChat />
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Debug Info</h2>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Workflow ID:</strong> {process.env.NEXT_PUBLIC_WORKFLOW_ID || "Set in .env.local"}</p>
              <p><strong>API Endpoint:</strong> /api/chatkit/chat</p>
              <p><strong>Session Init:</strong> /api/chatkit/start</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

