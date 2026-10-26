"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { money } from "../lib/dateUtils";

const PALETTE = [
  "#4F46E5",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#F43F5E",
  "#3B82F6",
  "#14B8A6",
];

export default function ChartsSection({
  categories,
  entries,
  cycleDates,
  theme,
}) {
  const pieCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#CBD5E1" : "#64748B";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9";

    // Aggregate category data and daily data
    const catData = {};
    const dailyData = {};
    cycleDates.forEach((d) => (dailyData[d] = 0));
    categories.forEach((c) => (catData[c] = 0));

    cycleDates.forEach((d) => {
      categories.forEach((cat) => {
        const amt = Number(entries[`${cat}|${d}`]) || 0;
        catData[cat] += amt;
        dailyData[d] += amt;
      });
    });

    const activeLabels = categories.filter((c) => catData[c] > 0);
    const activeVals = activeLabels.map((c) => catData[c]);

    // 1. Doughnut Chart
    if (pieChartRef.current) {
      pieChartRef.current.destroy();
    }
    if (pieCanvasRef.current) {
      const ctx = pieCanvasRef.current.getContext("2d");
      pieChartRef.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: activeLabels.length ? activeLabels : ["No Expenses Yet"],
          datasets: [
            {
              data: activeVals.length ? activeVals : [1],
              backgroundColor: activeVals.length
                ? PALETTE.slice(0, activeVals.length).concat(
                    PALETTE.slice(0, Math.max(0, activeVals.length - PALETTE.length))
                  )
                : [isDark ? "#1E293B" : "#E2E8F0"],
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "72%",
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: textColor,
                font: { family: "Inter", size: 11, weight: "500" },
                boxWidth: 10,
                boxHeight: 10,
                borderRadius: 5,
                useBorderRadius: true,
                padding: 12,
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${money(ctx.raw)}`,
              },
            },
          },
        },
      });
    }

    // 2. Bar Chart
    if (barChartRef.current) {
      barChartRef.current.destroy();
    }
    if (barCanvasRef.current) {
      const dLabels = Object.keys(dailyData).map((d) =>
        new Date(d + "T00:00:00").getDate()
      );
      const dVals = Object.values(dailyData);
      const ctx = barCanvasRef.current.getContext("2d");

      barChartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: dLabels,
          datasets: [
            {
              label: "Daily Spend",
              data: dVals,
              backgroundColor: isDark
                ? "rgba(99, 102, 241, 0.85)"
                : "rgba(79, 70, 229, 0.85)",
              hoverBackgroundColor: isDark ? "#818CF8" : "#4338CA",
              borderRadius: 5,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: textColor,
                font: { family: "Inter", size: 10.5 },
              },
            },
            y: {
              border: { display: false },
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: "Inter", size: 10.5 },
                callback: (v) => "₹" + v,
              },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Spend: ${money(ctx.raw)}`,
              },
            },
          },
        },
      });
    }

    return () => {
      if (pieChartRef.current) pieChartRef.current.destroy();
      if (barChartRef.current) barChartRef.current.destroy();
    };
  }, [categories, entries, cycleDates, theme]);

  return (
    <div className="charts-grid">
      <div className="chart-box">
        <div className="chart-header">
          <h3>Category Breakdown</h3>
        </div>
        <div className="chart-container">
          <canvas ref={pieCanvasRef}></canvas>
        </div>
      </div>

      <div className="chart-box">
        <div className="chart-header">
          <h3>Daily Spending Trend</h3>
        </div>
        <div className="chart-container">
          <canvas ref={barCanvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}
