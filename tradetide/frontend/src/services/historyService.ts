import axios from "axios";
import type { HistoryRecord } from "../types/models";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
});

export async function getHistory(ticker?: string, limit = 20): Promise<HistoryRecord[]> {
  const { data } = await api.get<HistoryRecord[]>("/api/history", {
    params: { ticker, limit },
  });
  return data;
}