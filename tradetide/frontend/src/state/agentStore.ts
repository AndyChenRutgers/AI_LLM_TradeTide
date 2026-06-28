import { create } from "zustand";
import type { Prediction } from "../types/models";

interface AgentEntry {
  agent: string;
  prediction: Prediction;
  confidence: number;
  status: "pending" | "done";
}

interface AgentStore {
  agents: AgentEntry[];
  addAgent:    (agent: string, prediction: Prediction, confidence: number) => void;
  resetAgents: () => void;
}

export const useAgentStore = create<AgentStore>()((set) => ({
  agents: [],

  addAgent: (agent, prediction, confidence) =>
    set((s) => ({
      agents: [
        ...s.agents.filter((a) => a.agent !== agent), // dedupe on reconnect
        { agent, prediction, confidence, status: "done" },
      ],
    })),

  resetAgents: () => set({ agents: [] }),
}));