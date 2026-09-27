import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TelemetryEvent, ProtocolEvent, Finding, ScenarioConfig, ScenarioResult, RunStage } from '../types';

interface VeilState {
  activeScenario: ScenarioConfig | null;
  runStage: RunStage;
  currentRunId: string | null;
  currentResult: ScenarioResult | null;
  isRunning: boolean;
  setActiveScenario: (s: ScenarioConfig | null) => void;
  setRunStage: (stage: RunStage) => void;
  setCurrentRunId: (id: string | null) => void;
  setCurrentResult: (r: ScenarioResult | null) => void;
  setIsRunning: (v: boolean) => void;
}

export const useVeilStore = create<VeilState>()((set) => ({
  activeScenario: null,
  runStage: 'idle',
  currentRunId: null,
  currentResult: null,
  isRunning: false,
  setActiveScenario: (s) => set({ activeScenario: s }),
  setRunStage: (stage) => set({ runStage: stage }),
  setCurrentRunId: (id) => set({ currentRunId: id }),
  setCurrentResult: (r) => set({ currentResult: r }),
  setIsRunning: (v) => set({ isRunning: v }),
}));

interface TelemetryState {
  events: TelemetryEvent[];
  protocolEvents: ProtocolEvent[];
  addEvent: (e: TelemetryEvent) => void;
  addProtocolEvent: (e: ProtocolEvent) => void;
  clearEvents: () => void;
}

export const useTelemetryStore = create<TelemetryState>()((set) => ({
  events: [],
  protocolEvents: [],
  addEvent: (e) => set((s) => {
    if (s.events.some(x => x.id === e.id)) return s;
    return { events: [e, ...s.events].slice(0, 500) };
  }),
  addProtocolEvent: (e) => set((s) => {
    if (s.protocolEvents.some(x => x.id === e.id)) return s;
    return { protocolEvents: [e, ...s.protocolEvents].slice(0, 200) };
  }),
  clearEvents: () => set({ events: [], protocolEvents: [] }),
}));

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },
    }),
    { name: 'veil-theme' }
  )
);
