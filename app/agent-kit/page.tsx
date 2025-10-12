'use client';

import { ChatKit } from '@openai/chatkit-react';
import { useChatkit } from '@/features/chatkit/useChatkit';
import { useEffect } from 'react';

export default function AgentKitPage() {
  const { control } = useChatkit();
  
  useEffect(() => {
    console.log('ChatKit control:', control);
  }, [control]);
  
  return (
    <div className="h-[calc(100vh-64px)] w-full bg-gray-100">
      <ChatKit control={control} />
    </div>
  );
}
