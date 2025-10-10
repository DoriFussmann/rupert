import { useChatKit } from '@openai/chatkit-react';

/**
 * Returns { control } for <ChatKit control={control} />
 * Implements getClientSecret(currentClientSecret):
 *  - If no current secret: POST /api/chatkit/start
 *  - Else: POST /api/chatkit/refresh with { currentClientSecret }
 */
export function useChatkit() {
  const { control } = useChatKit({
    api: {
      async getClientSecret(currentClientSecret: string | null): Promise<string> {
        if (!currentClientSecret) {
          const res = await fetch('/api/chatkit/start', { method: 'POST' });
          if (!res.ok) throw new Error('Failed to start ChatKit session');
          const { client_secret } = await res.json();
          return client_secret;
        }
        const res = await fetch('/api/chatkit/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentClientSecret }),
        });
        if (!res.ok) throw new Error('Failed to refresh ChatKit session');
        const { client_secret } = await res.json();
        return client_secret;
      },
    },
  });

  return { control };
}

