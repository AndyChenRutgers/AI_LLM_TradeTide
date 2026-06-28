import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LLMConfig, LLMProvider } from "../types/models";

interface LLMStore {
  config: LLMConfig;
  setProvider: (provider: LLMProvider) => void;
  setModel: (llm_model: string) => void;
  setTemp: (temperature: number) => void;
  setMaxTokens: (max_token: number) => void;
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set) => ({
      config: {
        provider: "anthropic",
        llm_model: "claude-sonnet-4-6",
        temperature: 0.7,
        max_token: 1024,
      },

      setProvider: (provider) =>
        set((s) => ({ config: { ...s.config, provider, llm_model: "" } })),

      setModel: (llm_model) =>
        set((s) => ({ config: { ...s.config, llm_model } })),

      setTemp: (temperature) =>
        set((s) => ({ config: { ...s.config, temperature } })),

      setMaxTokens: (max_token) =>
        set((s) => ({ config: { ...s.config, max_token } })),
    }),
    { name: "llm-config" }
  )
);