import { useRealtimeTable } from "./useRealtimeTable";

interface Quote {
  id?: number;
  author: string;
  text: string;
  created_at?: string;
}

export const useQuotes = (options?: { enabled?: boolean }) => {
  return useRealtimeTable<Quote>("quotes", options);
};
