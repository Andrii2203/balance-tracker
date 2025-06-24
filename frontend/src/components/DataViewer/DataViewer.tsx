import React, { useEffect, useState } from "react";
import { useFetchData } from "../../hooks/useFetchData/useFetchData";
import { mapColumn } from "../../helpers/excelColumnMapper";
import ChartViewer from "../ChartViewer/ChartViewer";
import { TransformRow } from "../../helpers/types";
import { useTranslation } from "react-i18next";
import { translateMonth } from "../../locales/monthTranslator/monthTranslator";
import './DataViewer.css'
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

interface DataViewerProps {
  sheetName: string;
}

const DataViewer: React.FC<DataViewerProps> = ({ sheetName }) => {
  const { t, i18n } = useTranslation();
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
      // console.log('transformed', transformed);

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

  if (loading) {
    return (
      <div className="spinner-box">
        <div className="spinner"></div>
      </div>
    )
  }
  if (!data.length) return <p>No data</p>;

  return (
    <div>
      <LanguageSwitcher />
      <table
        border={1}
        cellPadding={5}
        cellSpacing={0}
        style={{ 
          display: 'none', 
          width: "100%", 
          borderCollapse: "collapse", 
          tableLayout: "fixed" 
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{t(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h}>
                  {h === 'month' ? translatedMonths[i] : row[h as keyof typeof row]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ChartViewer sheetName={sheetName} data={filteredData} />
    </div>
  );
};

export default DataViewer;
