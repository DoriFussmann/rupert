"use client";
import { ChatKit } from '@openai/chatkit-react';
import { useChatkit } from '@/features/chatkit/useChatkit';
import { useState, useEffect } from 'react';

export default function AgentKit() {
  const [error, setError] = useState<string | null>(null);
  const { control } = useChatkit();

  // Test if ChatKit is configured
  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch('/api/chatkit/start', { method: 'POST' });
        if (res.status === 503) {
          const data = await res.json();
          setError(data.error);
        }
      } catch (e) {
        console.error('ChatKit config check failed:', e);
      }
    }
    checkConfig();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="nb-container py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Agent Kit</h1>
          <p className="text-slate-600 mb-6">Chat with our AI agents to get help with strategy, financial modeling, and business planning.</p>
          
          {error ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-yellow-900">Configuration Required</h3>
                  <p className="text-sm text-yellow-800 mt-1">{error}</p>
                  <p className="text-sm text-yellow-700 mt-2">Add <code className="bg-yellow-100 px-1 py-0.5 rounded">WORKFLOW_ID</code> to your environment variables to enable ChatKit.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-[600px]">
                <ChatKit
                  control={control}
                  style={{ position: 'relative', zIndex: 1 }}
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 text-sm text-slate-500">
            <p>💡 <strong>Tip:</strong> You can ask about financial models, business strategy, market analysis, and more.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
