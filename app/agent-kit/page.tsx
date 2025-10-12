'use client';

import { ChatKit } from '@openai/chatkit-react';

export default function AgentKitPage() {
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <ChatKit 
        runtime={{
          url: '/api/agent-kit/start'
        }}
      />
    </div>
  );
}
