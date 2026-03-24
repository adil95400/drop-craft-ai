import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SSEOptions {
  channels?: string[];
  onMetric?: (data: unknown) => void;
  onAlert?: (data: unknown) => void;
  onOrder?: (data: unknown) => void;
  onSnapshot?: (data: unknown) => void;
  enabled?: boolean;
  reconnectDelay?: number;
}

export function useSSE(options: SSEOptions = {}) {
  const {
    channels = ['metrics'],
    onMetric,
    onAlert,
    onOrder,
    onSnapshot,
    enabled = true,
    reconnectDelay = 5000,
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-sse?channels=${channels.join(',')}`;

      // EventSource doesn't support custom headers, use fetch-based SSE
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'text/event-stream',
        },
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      setConnected(true);
      setError(null);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;
            const eventMatch = block.match(/^event: (.+)$/m);
            const dataMatch = block.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;

            const event = eventMatch[1];
            try {
              const data = JSON.parse(dataMatch[1]);
              switch (event) {
                case 'metric': onMetric?.(data); break;
                case 'alert': onAlert?.(data); break;
                case 'order': onOrder?.(data); break;
                case 'snapshot': onSnapshot?.(data); break;
              }
            } catch { /* malformed data */ }
          }
        }

        // Stream ended, reconnect
        setConnected(false);
        if (enabled) {
          reconnectTimerRef.current = setTimeout(connect, reconnectDelay);
        }
      };

      processStream().catch(() => {
        setConnected(false);
        if (enabled) {
          reconnectTimerRef.current = setTimeout(connect, reconnectDelay);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SSE error');
      setConnected(false);
      if (enabled) {
        reconnectTimerRef.current = setTimeout(connect, reconnectDelay);
      }
    }
  }, [channels, onMetric, onAlert, onOrder, onSnapshot, enabled, reconnectDelay]);

  useEffect(() => {
    if (enabled) connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      eventSourceRef.current?.close();
    };
  }, [enabled, connect]);

  return { connected, error };
}
