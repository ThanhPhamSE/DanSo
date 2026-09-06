import React from 'react';
import { analyzeYearlyStats } from '../utils/lotteryEngine';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CalendarRange, TrendingUp, Award, ShieldAlert } from 'lucide-react';

export default function YearlyAnalysisPanel({ historyData, userSet, setName, mode }) {
  if (!historyData || historyData.length === 0 || !userSet || userSet.length === 0) {
    return null;
  }

  // 5 năm gần nhất theo yêu cầu người dùng
  const yearlyStats = analyzeYearlyStats(historyData, userSet, mode, 5);

  const chartData = [...yearlyStats].reverse().map(item => ({
    year: `Năm ${item.year}`,
    hitRate: item.hitRatePercent,
    hitDays: item.hitDaysCount,
    maxGan: item.maxGan
  }));

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-amber-400" />
            Thống Kê Tỉ Lệ Trúng 5 Năm Gần Nhất ({yearlyStats[yearlyStats.length - 1]?.year} - {yearlyStats[0]?.year})
          </h3>
          <p className="text-xs text-slate-400">
            Đánh giá tỉ lệ nổ & Gan Max của dàn <strong className="text-amber-300">{setName || 'Dàn 5X'}</strong> trong 5 năm gần đây
          </p>
        </div>

        <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold text-emerald-400">
          5 Năm Gần Nhất
        </div>
      </div>

      {/* Yearly Bar Chart */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1 font-sans">
                      <div className="font-bold text-amber-400">{data.year}</div>
                      <div>Tỉ lệ trúng: <strong className="text-emerald-400 font-mono">{data.hitRate}%</strong></div>
                      <div>Số ngày nổ: <strong className="text-white font-mono">{data.hitDays} ngày</strong></div>
                      <div>Gan Max năm đó: <strong className="text-rose-400 font-mono">{data.maxGan} ngày</strong></div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hitRate" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Yearly Details Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Năm</th>
              <th className="py-3 px-4">Số Ngày Quay</th>
              <th className="py-3 px-4">Số Ngày Trúng (Về)</th>
              <th className="py-3 px-4">Tỉ Lệ Trúng (%)</th>
              <th className="py-3 px-4">Gan Max Trong Năm</th>
              <th className="py-3 px-4">Chuỗi Ăn Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {yearlyStats.map((row) => (
              <tr key={row.year} className="hover:bg-slate-900/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-amber-400 font-sans text-sm">
                  Năm {row.year}
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  {row.totalDays} ngày
                </td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold">
                  {row.hitDaysCount} ngày
                </td>
                <td className="py-3.5 px-4 font-extrabold text-emerald-300 text-sm">
                  {row.hitRatePercent}%
                </td>
                <td className="py-3.5 px-4 text-rose-400 font-bold">
                  {row.maxGan} ngày xịt
                </td>
                <td className="py-3.5 px-4 text-amber-300 font-bold">
                  {row.maxWinStreak} ngày
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
