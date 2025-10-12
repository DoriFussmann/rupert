'use client';

import { ChatKitProvider, ChatBox } from '@openai/chatkit-react';

export default function AgentKitPage() {
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <ChatKitProvider
        workflowId={process.env.NEXT_PUBLIC_WORKFLOW_ID!}
        apiKey={process.env.NEXT_PUBLIC_OPENAI_API_KEY!}
      >
        <ChatBox 
          className="h-full w-full"
          placeholder="Ask me anything..."
        />
      </ChatKitProvider>
    </div>
  );
}
