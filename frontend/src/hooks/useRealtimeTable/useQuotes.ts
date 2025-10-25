import { useRealtimeTable } from "./useRealtimeTable";

interface Quote {
  id?: number;
  author: string;
  text: string;
  created_at?: string;
}

export const useQuotes = () => {
  return useRealtimeTable<Quote>("quotes");
};
