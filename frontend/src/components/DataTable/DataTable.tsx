import React from "react";
import { useTranslation } from "react-i18next";
import { TransformRow } from "../../helpers/types";

interface Props {
  headers: string[];
  filteredData: TransformRow[];
  translatedMonths: { [index:number]: string }
}

const DataTable: React.FC<Props> = ({ headers, filteredData, translatedMonths }) => {
  const { t } = useTranslation();

  return (
    <div>
      <table
        border={1}
        cellPadding={5}
        cellSpacing={0}
        className="hidden-table"
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
    </div>
  );
};

export default React.memo(DataTable);
