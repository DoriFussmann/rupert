'use client';
<<<<<<< HEAD

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useState } from 'react';

export default function AgentKitPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { control } = useChatKit({
    api: {
      async getClientSecret(currentSecret: string | null) {
        try {
          // Only create new session if we don't have a secret
          if (!currentSecret) {
            const response = await fetch('/api/chatkit/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to create session');
            }

            const data = await response.json();
            return data.client_secret;
          }

          // Return existing secret for session continuity
          return currentSecret;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          throw err;
        }
      },
    },
  });

  useEffect(() => {
    // Check if ChatKit web component is loaded
    const checkChatKitLoaded = () => {
      if (window.customElements?.get('openai-chatkit')) {
        setIsLoading(false);
      } else {
        setTimeout(checkChatKitLoaded, 100);
      }
    };
    checkChatKitLoaded();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Chat</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AgentKit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold">AgentKit Assistant</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatKit 
          control={control} 
          className="w-full h-full"
        />
      </main>
=======

import { ChatKit } from '@openai/chatkit-react';
import { useChatkit } from '@/features/chatkit/useChatkit';

export default function AgentKitPage() {
  const { control } = useChatkit();
  
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <ChatKit control={control} />
>>>>>>> 79f0e5871b4c3eee4345b8fedc843105a254939e
    </div>
  );
}

