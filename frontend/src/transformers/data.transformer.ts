import { TransformRow } from "../helpers/types";
import { translateMonth } from "../locales/monthTranslator/monthTranslator";

export interface Row {
    [key: string]: any;
}

export const DataTransformer = {
    /**
     * Transforms raw database rows into a structured format for UI consumption.
     * This decouples the database schema from the component props.
     */
    transformStatistics(data: Row[]): TransformRow[] {
        if (!data.length) return [];

        // Using a more robust mapping that doesn't rely strictly on index if possible,
        // but for now keeping the logic while encapsulating it.
        const columnMap = this._mapColumns(data[0]);

        return data.map((row) => ({
            perfectGoal: row[columnMap.perfectGoal] || 0,
            ourMoney: row[columnMap.ourMoney] || 0,
            actualGoal: row[columnMap.actualGoal] || 0,
            actualPecent: row[columnMap.actualPecent] || 0,
            month: row[columnMap.month] || "",
            translatedMonth: translateMonth(row[columnMap.month]),
        }));
    },

    _mapColumns(row: Row) {
        const allKeys = Object.keys(row);
        return {
            perfectGoal: allKeys[2],
            ourMoney: allKeys[4],
            actualGoal: allKeys[3],
            actualPecent: allKeys[5],
            month: allKeys[1],
        };
    }
};
