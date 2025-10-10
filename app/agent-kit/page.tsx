"use client";
import { ChatKit } from '@openai/chatkit-react';
import { useChatkit } from '@/features/chatkit/useChatkit';

export default function AgentKit() {
  const { control } = useChatkit();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="nb-container py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Agent Kit</h1>
          <p className="text-slate-600 mb-6">Chat with our AI agents to get help with strategy, financial modeling, and business planning.</p>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-[600px]">
              <ChatKit
                control={control}
                placeholder="Ask me anything about strategy, financial modeling, or business planning..."
                style={{ position: 'relative', zIndex: 1 }}
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            <p>💡 <strong>Tip:</strong> You can ask about financial models, business strategy, market analysis, and more.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
