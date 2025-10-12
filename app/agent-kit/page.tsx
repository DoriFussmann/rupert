'use client';

import { ChatKit } from '@openai/chatkit-react';

export default function AgentKitPage() {
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <ChatKit 
        workflowId={process.env.NEXT_PUBLIC_WORKFLOW_ID!}
        apiKey={process.env.NEXT_PUBLIC_OPENAI_API_KEY!}
      />
    </div>
  );
}
