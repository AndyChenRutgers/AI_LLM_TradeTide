import { create } from "zustand";
import type { AnalysisResponse, AgentView, WSEvent } from "../types/models";

interface AnalysisStore {
  result:        AnalysisResponse | null;
  streamedViews: AgentView[];
  isStreaming:   boolean;
  correctionSeen: boolean;

  setResult:       (result: AnalysisResponse) => void;
  applyWSEvent:    (event: WSEvent) => void;
  setStreaming:     (v: boolean) => void;
  reset:           () => void;
}

export const useAnalysisStore = create<AnalysisStore>()((set) => ({
  result:         null,
  streamedViews:  [],
  isStreaming:    false,
  correctionSeen: false,

  setResult: (result) => set({ result }),

  applyWSEvent: (event) => {
    if (event.event === "agent_result") {
      set((s) => ({
        streamedViews: [
          ...s.streamedViews,
          {
            agent:      event.agent,
            prediction: event.prediction,
            confidence: event.confidence,
            reasoning:  "",
          },
        ],
      }));
    }
    if (event.event === "self_correction") {
      set({ correctionSeen: true });
    }
  },

  setStreaming: (isStreaming) => set({ isStreaming }),

  reset: () =>
    set({ result: null, streamedViews: [], isStreaming: false, correctionSeen: false }),
}));