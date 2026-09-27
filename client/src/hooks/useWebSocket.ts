import { useEffect, useRef } from 'react';
import { useTelemetryStore, useVeilStore } from '../store';
import type { TelemetryEvent, ProtocolEvent, ScenarioResult } from '../types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { addEvent, addProtocolEvent } = useTelemetryStore();
  const { setRunStage, setCurrentResult, setIsRunning } = useVeilStore();

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;

      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'telemetry') {
            const event = msg.data as TelemetryEvent;
            addEvent(event);
            if (event.event_type === 'scenario_start') setRunStage('initializing');
            else if (event.event_type === 'tools_request') setRunStage('tools_list');
            else if (event.event_type === 'hidden_instruction_detected' || event.event_type === 'trust_boundary_violation') setRunStage('detecting');
            else if (event.event_type === 'tool_call') setRunStage('tool_call');
            else if (event.event_type === 'scenario_complete') setRunStage('verified');
            else if (event.event_type === 'scenario_error') setRunStage('failed');
          } else if (msg.type === 'protocol') {
            addProtocolEvent(msg.data as ProtocolEvent);
          } else if (msg.type === 'scenario_complete') {
            setCurrentResult(msg.data as ScenarioResult);
            setIsRunning(false);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          timeoutId = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      wsRef.current?.close();
    };
  }, []);
}
