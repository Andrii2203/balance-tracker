// import { useEffect, useState } from "react";

// export type Row = Record<string, any>;

// export const useFetchData = (sheetName: string, url = "http://localhost:3001/api/excel", intervalMs = 600000) => {
//   const [data, setData] = useState<Row[]>([]);
//   const [loading, setLoading] = useState(true);
//   // console.log('data line 6 useFetch', data);
//   const fetchData = async () => {
//     try {
//       const res = await fetch(url);
//       const json = await res.json();
//       setData(json);
//       setLoading(false);
//     } catch (error) {
//       console.error("Помилка завантаження:", error);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, intervalMs);
//     return () => clearInterval(interval);
//   }, [sheetName, url]);

//   return { data, loading };
// };


import { useEffect, useState } from "react";
import { supabase } from '../../supabaseClient';
export type Row = Record<string, any>;

export function useFetchData(sheetName: string) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: supaData, error } = await supabase
        .from("statistics")
        .select("*")
        .order('id', { ascending: true });
        
        if(error) {
          console.error("Supabase fetch error:", error);
          setData([]);
        } else {
          setData(supaData || []);
        }
        setLoading(false);
    };
    fetchData();
  }, [sheetName]);
  return { data, loading };
}
