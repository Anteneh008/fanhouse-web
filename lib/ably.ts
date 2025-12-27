import Ably from 'ably';

// Server-side Ably client (for publishing messages)
let ablyClient: Ably.Realtime | null = null;

export function getAblyClient(): Ably.Realtime {
  if (ablyClient) {
    return ablyClient;
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    throw new Error('ABLY_API_KEY environment variable is not set');
  }

  ablyClient = new Ably.Realtime({
    key: apiKey,
  });

  return ablyClient;
}

// Channel name helper
export function getThreadChannelName(threadId: string): string {
  return `thread:${threadId}`;
}

// Presence channel name helper
export function getPresenceChannelName(threadId: string): string {
  return `presence:${threadId}`;
}

