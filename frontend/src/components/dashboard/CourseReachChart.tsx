import React, { useEffect, useMemo, useState } from "react";
import { _Card, _CardContent } from "../ui/card";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart
} from "recharts";

interface CourseReachChartProps {
  // Optional: leads data for dual line chart (analytics mode)
  leadsValues?: number[];
  // Optional: chart title override
  title?: string;
  // Optional: show legend (for analytics mode)
  showLegend?: boolean;
  onDataPointClick?: (point: { index: number; value: number; timeRange: string }) => void;
  // Optional: external filters
  timeRange?: string;
  _course?: string;
  // Optional real-time stream endpoint (SSE). If not provided, we will poll /api/course-reach
  sseUrl?: string;
  pollMs?: number;
  // New: direct backend-provided series to render
  values?: number[];
  yTicksOverride?: number[];
  // New: optional async callback to fetch yearly data when year changes
  onRequestYearData?: (year: number) => Promise<number[]>;
  // New: custom x-axis labels
  xLabels?: string[];
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const CourseReachChart: React.FC<CourseReachChartProps> = ({
  onDataPointClick,
  timeRange,
  _course,
  sseUrl,
  pollMs = 5000,
  values,
  leadsValues,
  title,
  showLegend = false,
  yTicksOverride,
  onRequestYearData,
  xLabels
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const currentYearMax = new Date().getFullYear();

  console.log('DEBUG: CourseReachChart render:', { values, leadsValues, chartData });

  // Process data into Recharts format
  useEffect(() => {
    const rawViews = values || new Array(12).fill(0);
    const rawLeads = leadsValues || new Array(12).fill(0);
    const labels = xLabels && xLabels.length > 0 ? xLabels : MONTHS;

    // Ensure we don't crash if lengths mismatch, map to labels length
    const processed = labels.map((label, index) => ({
      name: label,
      views: rawViews[index] || 0,
      leads: rawLeads[index] || 0,
      index: index
    }));

    setChartData(processed);
  }, [values, leadsValues, xLabels]);

  const trySetYear = async (targetYear: number) => {
    if (targetYear > currentYearMax) {
      setCurrentYear(currentYearMax);
      return;
    }
    if (targetYear === currentYear) return;

    // If going backward and we have a data loader, probe before switching
    if (targetYear < currentYear && onRequestYearData) {
      try {
        const next = await onRequestYearData(targetYear);
        // We only get values back, we need to handle this update. 
        // But props.values is driven by parent. 
        // If parent controls data, this component shouldn't manage state for it unless we lift state up or use local override.
        // For now, let's assume parent handles year change via some mechanism or we just skip unless props update?
        // Actually, the original component had local state for chartData. 
        // But now we are driven by 'values' prop from InstituteDashboard.
        // InstituteDashboard doesn't seem to pass a year change handler?
        // Only onRequestYearData prop exists.

        // If we want to support previous years, we need to update the parent's data or local data.
        // Since InstituteDashboard passes `values`, we rely on it.
        // If onRequestYearData works, it returns arrays. We can use it to override local data display?
        // But better is if parent handles it.
        // Let's assume we just trigger callback?
        // Actually original code sets local state. Let's do that for fallback.
        // The Recharts implementation will rely on 'chartData' state which we calculate in useEffect above.
        // If we want to support year navigation fetch:
        // We'll update the values dependency? NO, we can't update props.
        // We can force update the processed data.

        // Wait, current implementation of 'onRequestYearData' in original code sets 'chartData' state.
        // So we can do the same here if we use local state priority.
        // But `useEffect` above overwrites it when `values` prop changes.
        // Let's respect `values` prop, but if `onRequestYearData` is called, we update our local state?
        // It's a bit conflicting.
        // Given 'values' comes from a context in InstituteDashboard (which is Yearly/Monthly/Weekly), year navigation might not make sense for Weekly/Monthly.
        // Year navigation really only makes sense for "Yearly" view.

        // If timeRange is not Yearly, ignore year nav?
        if (timeRange && timeRange.toLowerCase() !== 'yearly') return;

        // If we get here, fetch specific year
        if (onRequestYearData) {
          const nextValues = await onRequestYearData(targetYear);
          // We need to re-process this into chartData
          const labels = xLabels || MONTHS;
          const processed = labels.map((label, index) => ({
            name: label,
            views: nextValues[index] || 0,
            leads: 0, // No lead history support in that callback prop currently
            index: index
          }));
          setChartData(processed);
          setCurrentYear(targetYear);
        }

      } catch (e) {
        console.error("Failed to fetch year data", e);
      }
    } else {
      // Just set year
      setCurrentYear(targetYear);
    }
  };

  const hasAnyData = useMemo(() => {
    return chartData.some(d => d.views > 0 || d.leads > 0);
  }, [chartData]);

  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <_Card className="m-5 border-none bg-gray-50 shadow-sm rounded-2xl border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
        <_CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 w-full">
            <div className="text-[22px] font-semibold text-gray-900 dark:text-gray-100">{title || "Program Reach Over Time"}</div>

            {/* Only show Year nav if we are in Yearly mode or if no timeRange specified (legacy) */}
            {(!timeRange || timeRange.toLowerCase() === 'yearly') && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <button className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => trySetYear(currentYear - 1)} aria-label="Previous Year">⟨</button>
                  <span className="text-sm font-medium" aria-live="polite">{currentYear}</span>
                  <button className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => trySetYear(currentYearMax)} aria-label="Next Year">⟩</button>
                </div>
              </div>
            )}

            {showLegend && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Leads</span>
                </div>
              </div>
            )}
          </div>

          {!hasAnyData && (
            <div className="w-full py-6 text-center text-sm text-gray-500 dark:text-gray-400">No data for the current period</div>
          )}

          {/* Recharts Container */}
          <div className="w-full h-[25rem] bg-white rounded-2xl border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700 pt-4 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  ticks={yTicksOverride}
                  domain={yTicksOverride ? [0, Math.max(...yTicksOverride)] : [0, 'auto']}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                />

                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="views"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  onClick={(data: any) => {
                    if (onDataPointClick && data) {
                      const idx = data.index;
                      const val = data.views || data.value;
                      // Ensure we have a valid index
                      if (typeof idx === 'number') {
                        onDataPointClick({ index: idx, value: Number(val || 0), timeRange: timeRange || 'Weekly' });
                      }
                    }
                  }}
                />
                {showLegend && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="leads"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </_CardContent>
      </_Card>
    </motion.div>
  );
};

export default CourseReachChart;
