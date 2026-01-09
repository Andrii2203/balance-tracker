import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useStatisticsQuery } from "../../hooks/queries/useStatisticsQuery";
import { readCachedRecord } from '../../services/db';
// import { mapColumn } from "../../helpers/excelColumnMapper";
import { DataTransformer } from '../../transformers/data.transformer'
import ChartViewer from "../../components/ChartViewer/ChartViewer";
import { TransformRow } from "../../helpers/types";
import { useTranslation } from "react-i18next";
import { translateMonth } from "../../locales/monthTranslator/monthTranslator";
import './DataViewer.css'
import Spinner from "../../components/Spinner/Spinner";
import { BarChart3 } from "lucide-react";

const DataViewer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isApproved } = useUser();
  const { data: records, isLoading } = useStatisticsQuery({ enabled: isApproved });
  const [filteredData, setFilteredData] = useState<TransformRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [translatedMonths, setTranslatedMonths] = useState<{ [index: number]: string }>({});

  useEffect(() => {
    if (records && records.length && isApproved) {
      const columnMap = DataTransformer._mapColumns(records[0]);

      const transformed = records.map((row) => ({
        perfectGoal: row[columnMap.perfectGoal],
        ourMoney: row[columnMap.ourMoney] || 0,
        actualGoal: row[columnMap.actualGoal] || 0,
        actualPecent: row[columnMap.actualPecent] || 0,
        month: row[columnMap.month],
      }));

      setFilteredData(transformed);
      setHeaders(['perfectGoal', 'ourMoney', 'actualGoal', 'actualPecent', 'month']);
    }
  }, [records, isApproved]);

  // If offline, try to read cached statistics and use them so chart shows
  useEffect(() => {
    const tryLoadCached = async () => {
      if (navigator.onLine) return;
      try {
        const rec = await readCachedRecord('statistics');
        if (rec && rec.value && Array.isArray(rec.value)) {
          const cachedRecords = rec.value;
          const columnMap = DataTransformer._mapColumns(cachedRecords[0]);
          const transformed = cachedRecords.map((row: any) => ({
            perfectGoal: row[columnMap.perfectGoal],
            ourMoney: row[columnMap.ourMoney] || 0,
            actualGoal: row[columnMap.actualGoal] || 0,
            actualPecent: row[columnMap.actualPecent] || 0,
            month: row[columnMap.month],
          }));
          setFilteredData(transformed);
          setHeaders(['perfectGoal', 'ourMoney', 'actualGoal', 'actualPecent', 'month']);
        }
      } catch (err) {
        // ignore
      }
    };
    tryLoadCached();
  }, []);

  useEffect(() => {
    const updated = filteredData.reduce((acc, row, index) => {
      acc[index] = translateMonth(row.month);
      return acc;
    }, {} as { [index: number]: string });
    setTranslatedMonths(updated);
  }, [i18n.language, filteredData])

  if (isLoading) return <Spinner />

  if (!isApproved) {
    return (
      <div className="page-container">
        <header className="unified-header">
          <h2 className="page-title"><BarChart3 size={20} /> {t('charts')}</h2>
        </header>

        <div className="page-content">
          <div className="access-restricted-container glass-card">
            <p className="restricted-msg">{t('accessRestricted') || "Access Restricted"}</p>
            <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!records || !records.length) return <p className="no-data">No data</p>;

  return (
    <div>
      <ChartViewer data={filteredData} />
    </div>
  );
};

export default DataViewer;