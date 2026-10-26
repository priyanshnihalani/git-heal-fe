import React, { useState } from 'react';
import type { DailyTokenUsage } from '../../types';
import { formatTokenCount, formatExactTokens } from '../../utils/tokenUtils';
import './UsageChart.css';

interface UsageChartProps {
  data: DailyTokenUsage[];
  dailyLimit: number | null;
}

export const UsageChart: React.FC<UsageChartProps> = ({ data, dailyLimit }) => {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    used: number;
    limit: number | null;
    x: number;
    y: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return <div className="chart-empty">No daily data available for this range.</div>;
  }

  const limit = dailyLimit ?? 500000;
  const maxUsed = Math.max(...data.map((d) => d.used), limit);
  // Chart coordinate space
  const chartWidth = 800;
  const chartHeight = 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const plotHeight = chartHeight - paddingBottom - paddingTop;

  const barCount = data.length;
  const slotWidth = chartWidth / barCount;
  const barWidth = Math.max(6, Math.min(24, slotWidth * 0.65));

  // Y coordinate for dashed limit line
  const limitY = paddingTop + plotHeight * (1 - limit / maxUsed);

  return (
    <div className="usage-chart-wrap" aria-label="Daily AI token consumption bar chart">
      <div className="chart-legend-row">
        <div className="chart-legend-items">
          <span className="legend-indicator">
            <span className="indicator-color bar-normal" aria-hidden="true" />
            <span>Normal usage (&lt; 90%)</span>
          </span>
          <span className="legend-indicator">
            <span className="indicator-color bar-high" aria-hidden="true" />
            <span>High usage (≥ 90%)</span>
          </span>
          {dailyLimit && (
            <span className="legend-indicator">
              <span className="indicator-line limit-line" aria-hidden="true" />
              <span>Daily limit ({formatTokenCount(dailyLimit)})</span>
            </span>
          )}
        </div>
      </div>

      <div className="svg-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="usage-svg"
          role="img"
          aria-label="Daily token usage bar graph"
        >
          {/* Dashed Daily Limit Line */}
          {dailyLimit && (
            <g className="limit-line-group" aria-hidden="true">
              <line
                x1="0"
                y1={limitY}
                x2={chartWidth}
                y2={limitY}
                stroke="#DC2626"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.75"
              />
              <text
                x={chartWidth - 8}
                y={limitY - 6}
                textAnchor="end"
                fill="#DC2626"
                fontSize="10"
                fontWeight="600"
              >
                Limit: {formatTokenCount(dailyLimit)}
              </text>
            </g>
          )}

          {/* Bars */}
          {data.map((day, idx) => {
            const barHeight = Math.max(4, (day.used / maxUsed) * plotHeight);
            const x = idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = paddingTop + plotHeight - barHeight;
            const isHighUsage = dailyLimit ? (day.used / dailyLimit) >= 0.9 : false;

            const dateObj = new Date(day.date);
            const dateLabel = new Intl.DateTimeFormat('en-US', {
              month: 'numeric',
              day: 'numeric',
            }).format(dateObj);

            // Show label every N days if many bars
            const showLabel =
              barCount <= 14 ||
              idx === 0 ||
              idx === barCount - 1 ||
              idx % Math.ceil(barCount / 7) === 0;

            const ariaText = `${day.date}: ${formatExactTokens(day.used)}${
              dailyLimit ? ` (${Math.round((day.used / dailyLimit) * 100)}% of limit)` : ''
            }`;

            return (
              <g key={day.date} className="bar-group">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  className={`chart-bar ${isHighUsage ? 'is-high' : 'is-normal'}`}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={ariaText}
                  onMouseEnter={() =>
                    setHoveredDay({
                      date: day.date,
                      used: day.used,
                      limit: dailyLimit,
                      x: x + barWidth / 2,
                      y,
                    })
                  }
                  onMouseLeave={() => setHoveredDay(null)}
                  onFocus={() =>
                    setHoveredDay({
                      date: day.date,
                      used: day.used,
                      limit: dailyLimit,
                      x: x + barWidth / 2,
                      y,
                    })
                  }
                  onBlur={() => setHoveredDay(null)}
                />

                {showLabel && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="inherit"
                  >
                    {dateLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover / Focus Tooltip */}
        {hoveredDay && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hoveredDay.x / chartWidth) * 100}%`,
              top: `${Math.max(10, (hoveredDay.y / chartHeight) * 100 - 15)}%`,
            }}
            role="tooltip"
          >
            <strong className="tooltip-date">{hoveredDay.date}</strong>
            <span className="tooltip-tokens">{formatExactTokens(hoveredDay.used)}</span>
            {hoveredDay.limit && (
              <span className="tooltip-percent">
                {Math.round((hoveredDay.used / hoveredDay.limit) * 100)}% of daily limit
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageChart;
