'use client';

import { ChatKit } from '@openai/chatkit-react';
import { useChatkit } from '@/features/chatkit/useChatkit';

export default function AgentKitPage() {
  const { control } = useChatkit();
  
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <ChatKit control={control} />
    </div>
  );
}
