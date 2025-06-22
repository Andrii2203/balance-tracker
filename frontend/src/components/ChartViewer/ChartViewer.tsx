import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { TransformRow } from "../../helpers/types";
import i18n from "../../i18n";
import { translateMonth } from "../../locales/monthTranslator/monthTranslator";
import { useTranslation } from "react-i18next";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
    sheetName: string;
    data: TransformRow[];
}

const ChartViewer: React.FC<Props> = ({ data }) => {
    const { t } = useTranslation();
    const [chartKey, setChartKey] = useState<string>("initial");

    useEffect(() => {
        setChartKey(Date.now().toString());
    }, [data, i18n.language])

    const labels = data.map((row) => translateMonth(row.month));
    const actualGoalData = data.map((row) => row.actualGoal);
    const perfectGoalData = data.map((row) => row.perfectGoal);
    const actualPecentData = data.map((row) => row.actualPecent);
    const ourMoney = data.map((row) => row.ourMoney);
    const maxY = ourMoney.length ? Math.max(...ourMoney) : 100;

    const chartConfig = {
        labels,
        datasets: [
            {
                label: t("perfectGoal"),
                data: perfectGoalData,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
            {
                label: t("actualGoal"),
                data: actualGoalData,
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
            legend: {
                position: "top" as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const datasetLabel = context.dataset.label || '';
                        const index = context.dataIndex;
                        
                        if (context.dataset.label === t("perfectGoal")) {
                            return `${datasetLabel} : $${context.raw}`;
                        } else {
                            const percent = actualPecentData[index];
                            return `${t("actualGoal")} ${percent} : $${context.raw}`;
                        }
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value: number | string) {
                        if (Number(value) === maxY) {
                            return `🤑${value}`;
                        }
                        return value;
                    },
                    color: (ctx: { tick: { value: number } }) => {
                        const value = ctx.tick.value;
                        return value === maxY ? "#FF0000" : "#666";
                    },
                },
            },
        },
    };

    return (
        <div style={{ width: "100%", overflowX: "auto", margin: '0' }}>
            <div style={{ 
                minWidth: `${Math.max(perfectGoalData.length * 20, 100)}px`,
            }}>
                <p>{t('ourMoney')}: ${maxY}</p>
                <Bar key={chartKey} data={chartConfig} options={options} />
            </div>
        </div>
    );
};

export default ChartViewer;