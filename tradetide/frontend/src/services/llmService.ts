import axios from "axios";
import type { LLMProvidersResponse } from "../types/models";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
});

export async function getLLMProviders(): Promise<LLMProvidersResponse> {
  const { data } = await api.get<LLMProvidersResponse>("/api/llms");
  return data;
}