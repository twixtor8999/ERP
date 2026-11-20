import { useState, useEffect, useRef, useCallback } from "react";
import { tokenStorage } from "@/lib/auth/token-storage";
import { apiClient } from "@/lib/api/client";

export interface RealtimeActivityEvent {
  event_id: string;
  type: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  branch_id?: string | null;
  branch_name?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type ConnectionStatus = "connected" | "connecting" | "polling" | "disconnected";

export interface UseRealtimeStreamOptions {
  branchId?: string | null;
  enabled?: boolean;
  onEvent?: (event: RealtimeActivityEvent) => void;
}

export function useRealtimeStream({
  branchId = null,
  enabled = true,
  onEvent,
}: UseRealtimeStreamOptions = {}) {
  const [events, setEvents] = useState<RealtimeActivityEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<RealtimeActivityEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const addEvent = useCallback(
    (ev: RealtimeActivityEvent) => {
      lastEventIdRef.current = ev.event_id;
      setLastEvent(ev);
      setEvents((prev) => {
        if (prev.some((e) => e.event_id === ev.event_id)) return prev;
        return [ev, ...prev].slice(0, 100);
      });
      if (onEvent) {
        onEvent(ev);
      }
    },
    [onEvent]
  );

  // Fallback Polling via HTTP
  const pollActivityStream = useCallback(async () => {
    try {
      const params: Record<string, string> = { limit: "20" };
      if (branchId) params.branch_id = branchId;
      if (lastEventIdRef.current) params.since_event_id = lastEventIdRef.current;

      const res = await apiClient.get<RealtimeActivityEvent[]>("/api/v1/analytics/activity-stream", {
        params,
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        res.data.forEach((ev) => addEvent(ev));
      }
    } catch {
      // Silently swallow polling errors
    }
  }, [branchId, addEvent]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    setStatus("polling");
    pollActivityStream();
    pollingIntervalRef.current = setInterval(pollActivityStream, 10000);
  }, [pollActivityStream]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || isUnmountedRef.current) return;

    const token = tokenStorage.getAccessToken();
    if (!token) {
      startPolling();
      return;
    }

    // Determine WS URL
    const envBase = import.meta.env.VITE_API_BASE_URL || "";
    let wsHost: string;
    let wsProtocol: string;

    if (envBase.startsWith("http://")) {
      wsProtocol = "ws:";
      wsHost = envBase.replace("http://", "");
    } else if (envBase.startsWith("https://")) {
      wsProtocol = "wss:";
      wsHost = envBase.replace("https://", "");
    } else {
      wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsHost = window.location.host;
    }

    const cleanHost = wsHost.endsWith("/") ? wsHost.slice(0, -1) : wsHost;
    let wsUrl = `${wsProtocol}//${cleanHost}/api/v1/ws/dashboard?token=${encodeURIComponent(token)}`;
    if (branchId) {
      wsUrl += `&branch_id=${encodeURIComponent(branchId)}`;
    }

    setStatus("connecting");

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) return;
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
        stopPolling();

        // Start ping heartbeat every 30s
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.event_id && payload.title) {
            addEvent(payload as RealtimeActivityEvent);
          }
        } catch {
          // ignore pong / non-json messages
        }
      };

      socket.onerror = () => {
        // Fall back to polling on socket error
        startPolling();
      };

      socket.onclose = () => {
        if (isUnmountedRef.current) return;
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Reconnect with backoff
        startPolling();
        const delay = Math.min(3000 * Math.pow(1.5, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    } catch {
      startPolling();
    }
  }, [enabled, branchId, addEvent, startPolling, stopPolling]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopPolling();
    };
  }, [connect, stopPolling]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return {
    events,
    status,
    lastEvent,
    clearEvents,
    refresh: pollActivityStream,
  };
}
