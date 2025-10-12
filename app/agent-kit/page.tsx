'use client';

import { ChatKit } from '@openai/chatkit-react';
import { useChatkit } from '@/features/chatkit/useChatkit';
import { useEffect, useRef } from 'react';

export default function AgentKitPage() {
  const { control } = useChatkit();
  const chatRef = useRef<any>(null);
  
  useEffect(() => {
    if (control && chatRef.current) {
      console.log('Attempting to start ChatKit...');
      // Try to trigger ChatKit
      if (typeof control.start === 'function') {
        control.start();
      }
    }
  }, [control]);
  
  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ChatKit ref={chatRef} control={control} />
      </div>
    </div>
  );
}
