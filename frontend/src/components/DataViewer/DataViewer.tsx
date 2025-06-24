import React, { useEffect, useState } from "react";
import { useFetchData } from "../../hooks/useFetchData/useFetchData";
import { mapColumn } from "../../helpers/excelColumnMapper";
import ChartViewer from "../ChartViewer/ChartViewer";
import { TransformRow } from "../../helpers/types";
import { useTranslation } from "react-i18next";
import { translateMonth } from "../../locales/monthTranslator/monthTranslator";
import './DataViewer.css'
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import Spinner from "../Spinner/Spinner";
import DataTable from "../DataTable/DataTable";

interface DataViewerProps {
  sheetName: string;
}

const DataViewer: React.FC<DataViewerProps> = ({ sheetName }) => {
  const { i18n } = useTranslation();
  const { data, loading } = useFetchData(sheetName);
  const [filteredData, setFilteredData] = useState<TransformRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [translatedMonths, setTranslatedMonths] = useState<{ [index: number]: string}>({});

  useEffect(() => {
    const userLang = navigator.language.split('-')[0];
    i18n.changeLanguage(userLang);
  },[])

  useEffect(() => {
    if (data.length) {
      const columnMap = mapColumn(data[0]);

      const transformed = data.map((row) => ({
        perfectGoal: row[columnMap.perfectGoal],
        ourMoney: row[columnMap.ourMoney] || 0,
        actualGoal: row[columnMap.actualGoal] || 0,
        actualPecent: row[columnMap.actualPecent] || 0,
        month: translateMonth(row[columnMap.month]),
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

  if (loading) return <Spinner />
  if (!data.length) return <p>No data</p>;

  return (
    <div>
      <LanguageSwitcher />
      <DataTable headers={headers} filteredData={filteredData} translatedMonths={translatedMonths}/>
      <ChartViewer sheetName={sheetName} data={filteredData} />
    </div>
  );
};

export default DataViewer;
