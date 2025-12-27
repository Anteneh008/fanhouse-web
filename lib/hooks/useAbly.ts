'use client';

import { useEffect, useState, useRef } from 'react';
import Ably from 'ably';

// Ably message type
export type AblyMessage = {
  data: unknown;
  name: string;
  clientId: string;
  connectionId: string;
  id: string;
  timestamp: number;
};

interface UseAblyOptions {
  onMessage?: (message: AblyMessage) => void;
  onPresenceUpdate?: (presenceData: Ably.PresenceMessage[]) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
}

export function useAbly(
  threadId: string | null,
  options: UseAblyOptions = {}
) {
  const [ably, setAbly] = useState<Ably.Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presenceMembers, setPresenceMembers] = useState<Ably.PresenceMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!threadId) return;

    let mounted = true;

    // Initialize Ably client
    const initAbly = async () => {
      try {
        // Get token from API
        const tokenRes = await fetch('/api/ably/token');
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok) {
          console.warn('Ably token failed, real-time updates disabled:', tokenData.error);
          // Don't throw - allow app to work without Ably (messages will still appear via optimistic updates)
          return;
        }

        const client = new Ably.Realtime({
          authUrl: '/api/ably/token',
          authMethod: 'GET',
        });

        client.connection.on('connected', () => {
          if (mounted) setIsConnected(true);
        });

        client.connection.on('disconnected', () => {
          if (mounted) setIsConnected(false);
        });

        if (mounted) {
          setAbly(client);

          // Subscribe to thread channel
          const channel = client.channels.get(`thread:${threadId}`);
          channelRef.current = channel;

          // Subscribe to messages
          channel.subscribe('message', (message) => {
            if (options.onMessage && message.data !== undefined) {
              // Transform Ably message to our AblyMessage type
              const ablyMessage: AblyMessage = {
                data: message.data,
                name: message.name || '',
                clientId: message.clientId || '',
                connectionId: message.connectionId || '',
                id: message.id || '',
                timestamp: message.timestamp || Date.now(),
              };
              options.onMessage(ablyMessage);
            }
          });

          // Subscribe to presence channel
          const presenceChannel = client.channels.get(`presence:${threadId}`);
          presenceChannelRef.current = presenceChannel;

          // Enter presence
          const currentUserId = tokenData.clientId || client.connection.id || 'unknown';
          await presenceChannel.presence.enter({ userId: currentUserId });

          // Subscribe to presence updates
          presenceChannel.presence.subscribe('enter', (presenceMsg) => {
            if (mounted) {
              setPresenceMembers((prev) => {
                const updated = [...prev, presenceMsg];
                if (options.onPresenceUpdate) {
                  options.onPresenceUpdate(updated);
                }
                return updated;
              });
            }
          });

          presenceChannel.presence.subscribe('leave', (presenceMsg) => {
            if (mounted) {
              setPresenceMembers((prev) =>
                prev.filter((m) => m.clientId !== presenceMsg.clientId)
              );
            }
          });

          // Subscribe to typing indicators
          channel.subscribe('typing', (message) => {
            if (!message.data) return;
            const { userId, isTyping } = message.data as { userId: string; isTyping: boolean };
            if (mounted) {
              if (isTyping) {
                setTypingUsers((prev) => new Set(prev).add(userId));
                // Clear typing after 3 seconds
                if (typingTimeoutRef.current.has(userId)) {
                  clearTimeout(typingTimeoutRef.current.get(userId)!);
                }
                const timeout = setTimeout(() => {
                  if (mounted) {
                    setTypingUsers((prev) => {
                      const next = new Set(prev);
                      next.delete(userId);
                      return next;
                    });
                  }
                }, 3000);
                typingTimeoutRef.current.set(userId, timeout);
              } else {
                setTypingUsers((prev) => {
                  const next = new Set(prev);
                  next.delete(userId);
                  return next;
                });
              }
              if (options.onTyping) {
                options.onTyping(userId, isTyping);
              }
            }
          });
        }
      } catch (error) {
        console.error('Ably initialization error:', error);
      }
    };

    initAbly();

    return () => {
      mounted = false;
      // Cleanup
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (presenceChannelRef.current) {
        presenceChannelRef.current.presence.leave();
        presenceChannelRef.current.presence.unsubscribe();
      }
      if (ably) {
        ably.close();
      }
      // Clear typing timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [threadId]);

  const sendTypingIndicator = (isTyping: boolean) => {
    if (!channelRef.current || !ably) return;

    const currentUserId = ably.auth.clientId || ably.connection.id || 'unknown';
    channelRef.current.publish('typing', {
      userId: currentUserId,
      isTyping,
    });
  };

  return {
    ably,
    isConnected,
    presenceMembers,
    typingUsers,
    sendTypingIndicator,
  };
}

