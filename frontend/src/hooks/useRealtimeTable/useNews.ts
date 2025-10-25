import { useRealtimeTable } from "./useRealtimeTable";

interface NewsItem {
  id?: number;
  title: string;
  summary: string;
  date: string;
  created_at?: string;
}

export const useNews = () => {
  return useRealtimeTable<NewsItem>("news");
};
