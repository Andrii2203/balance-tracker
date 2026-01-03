import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";

export type Row = Record<string, any>;

interface CacheData {
  rows: Row[];
  timestamp: number;
}

export function useFetchData(tableName: string, enabled: boolean = true) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const dataRef = useRef<Row[]>([]);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    const cacheKey = `supabase_cache_${tableName}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { rows } = JSON.parse(cached) as CacheData;
      dataRef.current = rows;
      setData(rows);
      setLoading(false);
    }

    const fetchData = async () => {
      const { data: supaData, error } = await supabase
        .from(tableName)
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error(`Supabase fetch error (${tableName}):`, error);
        return;
      }

      if (supaData) {
        const newData = JSON.stringify(supaData);
        const oldData = JSON.stringify(dataRef.current);

        if (newData !== oldData) {
          dataRef.current = supaData;
          setData(supaData);
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              rows: supaData,
              timestamp: Date.now(),
            })
          );
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [tableName, enabled]);

  return { data, loading };
}



// import { useEffect, useState } from "react";
// import { supabase } from '../../supabaseClient';
// export type Row = Record<string, any>;

// export function useFetchData() {
//   const [data, setData] = useState<Row[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       const { data: supaData, error } = await supabase
//         .from("statistics")
//         .select("*")
//         .order('id', { ascending: true });
        
//         if(error) {
//           console.error("Supabase fetch error:", error);
//           setData([]);
//         } else {
//           setData(supaData || []);
//         }
//         setLoading(false);
//     };
//     fetchData();
//   }, []);
//   return { data, loading };
// }



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
