import { useRef, useCallback } from "react";
import type { AnalyzeRequest, WSEvent } from "../types/models";
import { useAnalysisStore } from "../state/analysisStore";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000";

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const { applyWSEvent, setStreaming, setResult } = useAnalysisStore();

  const connect = useCallback(
    (request: AnalyzeRequest) => {
      if (ws.current) ws.current.close();

      setStreaming(true);
      const socket = new WebSocket(`${WS_BASE}/api/ws/stream`);
      ws.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify(request));
      };

      socket.onmessage = (msg) => {
        const event: WSEvent = JSON.parse(msg.data);
        if (event.event === "synthesis" && event.data) {
          setResult(event.data as any);
          setStreaming(false);
        } else {
          applyWSEvent(event);
        }
      };

      socket.onerror = () => setStreaming(false);
      socket.onclose = () => setStreaming(false);
    },
    [applyWSEvent, setStreaming, setResult]
  );

  const disconnect = useCallback(() => {
    ws.current?.close();
    setStreaming(false);
  }, [setStreaming]);

  return { connect, disconnect };
}