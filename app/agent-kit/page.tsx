'use client';

import { ChatKit } from '@openai/chatkit-react';
import { useChatkit } from '@/features/chatkit/useChatkit';

export default function AgentKitPage() {
  const { control } = useChatkit();
  
  return (
    <div style={{ height: 'calc(100vh - 64px)', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatKit control={control} />
      </div>
    </div>
  );
}
