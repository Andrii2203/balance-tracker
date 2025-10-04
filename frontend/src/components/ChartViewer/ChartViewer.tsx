import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { TransformRow } from "../../helpers/types";
import { translateMonth } from "../../locales/monthTranslator/monthTranslator";
import { useTranslation } from "react-i18next";
import './ChartViewer.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
    data: TransformRow[];
}

const ChartViewer: React.FC<Props> = ({ data }) => {
    const { t, i18n } = useTranslation();

    const processedData = useMemo(() => {
        const labels = data.map(row => translateMonth(row.month));
        const actualGoalData = data.map(row => row.actualGoal);
        const perfectGoalData = data.map(row => row.perfectGoal);
        const actualPercentData = data.map(row => row.actualPecent);
        const ourMoney = data.map(row => row.ourMoney);

        const filteredMoney = ourMoney.filter(n => n !== 0);
        const lastMonthMoney = filteredMoney.length > 0 ? filteredMoney[filteredMoney.length - 1] : 0;
        const secondLastValue = filteredMoney.length > 1 ? filteredMoney[filteredMoney.length - 2] : 0;
        const differenceFromPrevMonth = lastMonthMoney - secondLastValue;
        const maxY = ourMoney.length ? Math.max(...ourMoney) : 100;

        return { labels, actualGoalData, perfectGoalData, actualPercentData, ourMoney, lastMonthMoney, secondLastValue, differenceFromPrevMonth, maxY };
    }, [data, i18n.language]);

    const ourMoneyText = useMemo(() => {
        return`${t('ourMoney')}: $${processedData.lastMonthMoney}`;
    }, [processedData.lastMonthMoney, t]);

    const chartConfig = useMemo(() => ({
        labels: processedData.labels,
        datasets: [
            {
                label: t("perfectGoal"),
                data: processedData.perfectGoalData,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
            {
                label: t("actualGoal"),
                data: processedData.actualGoalData,
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1,
            },
        ],
    }), [processedData, t]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
            legend: {
                position: "bottom" as const,
                align: 'start' as const,
                labels: { font: { size: 13 } }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const index = context.dataIndex;
                        if (context.dataset.label === t("perfectGoal")) {
                            return `${context.dataset.label} : $${context.raw}`;
                        } else {
                            const percent = processedData.actualPercentData[index];
                            return `${t("actualGoal")} ${percent}% : $${context.raw}`;
                        }
                    }
                }
            }
        },
        scales: {
            x: { ticks: { font: { size: 13 } } },
            y: {
                beginAtZero: true,
                ticks: {
                    font: { size: 15 },
                    callback: (value: number | string) => Number(value) === processedData.maxY ? `🤑${value}` : value,
                    color: (ctx: { tick: { value: number } }) => ctx.tick.value === processedData.maxY ? "#FF0000" : "#666",
                },
            },
        },
    }), [processedData, t]);

    return (
        <div className="chart-js-box">
            <div style={{ minWidth: `${Math.max(processedData.perfectGoalData.length * 20, 100)}px` }}>
                <p className="amarkets-p">AMarkets</p>
                <p className="our-money-p">{ourMoneyText}</p>
                <Bar data={chartConfig} options={options} />
                {processedData.differenceFromPrevMonth < 0 && (
                    <p className="difference-p">
                        {t('prevMonth')} ${processedData.secondLastValue} - {t('now').toLowerCase()} ${processedData.lastMonthMoney} = {t('ourMoney').toLowerCase()} ${processedData.differenceFromPrevMonth} {t('per').toLowerCase()} {t('month').toLowerCase()}
                    </p>
                )}
            </div>
        </div>
    );
};

export default React.memo(ChartViewer);