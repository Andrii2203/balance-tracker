import React, { useEffect, useState } from "react";
import { useFetchData } from "../../hooks/useFetchData/useFetchData";
import { mapColumn } from "../../helpers/excelColumnMapper";
import ChartViewer from "../ChartViewer/ChartViewer";
import { TransformRow } from "../../helpers/types";
import { useTranslation } from "react-i18next";
import { translateMonth } from "../../locales/monthTranslator/monthTranslator";
import './DataViewer.css'
import Spinner from "../Spinner/Spinner";
import DataTable from "../DataTable/DataTable";

const DataViewer: React.FC = () => {
  const { i18n } = useTranslation();
  const { data, loading } = useFetchData("statistics");
  const [filteredData, setFilteredData] = useState<TransformRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [translatedMonths, setTranslatedMonths] = useState<{ [index: number]: string}>({});

  useEffect(() => {
    if (data.length) {
      const columnMap = mapColumn(data[0]);

      const transformed = data.map((row) => ({
        perfectGoal: row[columnMap.perfectGoal],
        ourMoney: row[columnMap.ourMoney] || 0,
        actualGoal: row[columnMap.actualGoal] || 0,
        actualPecent: row[columnMap.actualPecent] || 0,
        month: row[columnMap.month],
      }));

      setFilteredData(transformed);
      setHeaders(['perfectGoal', 'ourMoney', 'actualGoal', 'actualPecent', 'month']);
    }
  }, [data]);

  useEffect(() => {
    const updated = filteredData.reduce((acc, row, index) => {
      acc[index] = translateMonth(row.month);
      return acc;
    }, {} as { [index: number]: string });
    setTranslatedMonths(updated);
  },[i18n.language, filteredData])

  useEffect(()=> { console.log('[DataViewer] mount'); return ()=>console.log('[DataViewer] unmount'); }, []);
  console.log('[DataViewer] render', { dataLength: data.length, loading });

  if (loading) return <Spinner />
  if (!data.length) return <p>No data</p>;

  return (
    <div>
      {/* <DataTable headers={headers} filteredData={filteredData} translatedMonths={translatedMonths}/> */}
      <ChartViewer data={filteredData} />
    </div>
  );
};

export default DataViewer;