import { useMutation, useQuery } from "@tanstack/react-query";
import { analyze } from "../services/analysisService";
import { getHistory } from "../services/historyService";
import { getLLMProviders } from "../services/llmService";
import { useAnalysisStore } from "../state/analysisStore";
import type { AnalyzeRequest } from "../types/models";

export function useAnalyzeMutation() {
  const { setResult, setStreaming } = useAnalysisStore();

  return useMutation({
    mutationFn: (request: AnalyzeRequest) => analyze(request),
    onMutate:   () => setStreaming(true),
    onSuccess:  (data) => { setResult(data); setStreaming(false); },
    onError:    () => setStreaming(false),
  });
}

export function useHistory(ticker?: string, limit?: number) {
  return useQuery({
    queryKey: ["history", ticker, limit],
    queryFn:  () => getHistory(ticker, limit),
  });
}

export function useLLMProviders() {
  return useQuery({
    queryKey: ["llm-providers"],
    queryFn:  getLLMProviders,
    staleTime: Infinity, // provider list never changes at runtime
  });
}