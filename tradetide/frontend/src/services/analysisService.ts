import axios from "axios";
import type { AnalyzeRequest, AnalysisResponse } from "../types/models";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
});

export async function analyze(request: AnalyzeRequest): Promise<AnalysisResponse> {
  const { data } = await api.post<AnalysisResponse>("/api/analyze", request);
  return data;
}