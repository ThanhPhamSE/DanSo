import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Activity, TrendingUp, Info } from 'lucide-react';

export default function GanChart({ historyDetails, maxGan }) {
  if (!historyDetails || historyDetails.length === 0) return null;

  // Prepare chart data (Chronological order: Oldest to Newest, max 60 data points for readability)
  const displayData = [...historyDetails].reverse().slice(-60).map(item => ({
    date: item.date.slice(5), // "MM-DD"
    fullDate: item.date,
    gan: item.ganAtDay,
    isHit: item.isHit ? 1 : 0,
    hitCount: item.hitCount,
    hitNumStr: item.dayHits?.join(', ') || 'Xịt'
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/90 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 font-sans">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
            <span>Ngày {data.fullDate}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${data.isHit ? 'bg-emerald-500/20 text-emerald-300 font-extrabold' : 'bg-rose-500/20 text-rose-400'}`}>
              {data.isHit ? '🎯 TRÚNG' : '❌ XỊT'}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Số ngày Gan thời điểm đó: </span>
            <strong className="text-amber-300 font-mono text-sm">{data.gan} ngày</strong>
          </div>
          {data.isHit && (
            <div>
              <span className="text-slate-400">Số nổ trong dàn: </span>
              <strong className="text-emerald-400 font-mono">{data.hitNumStr}</strong>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Biểu Đồ Nhịp Gan & Chu Kỳ Nổ Dàn 5X
          </h3>
          <p className="text-xs text-slate-400">
            Cột xanh: Ngày trúng đề | Vùng đỏ/vàng: Nhịp gan tăng dần khi dàn xịt 연속
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400 shadow-sm"></span>
            <span className="text-slate-300 font-medium">Trúng</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/60 shadow-sm"></span>
            <span className="text-slate-300 font-medium">Biến động Gan</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ganGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={[0, 'dataMax + 2']}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference Line for Max Gan */}
            <ReferenceLine
              y={maxGan}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: `Gan Max = ${maxGan}d`,
                fill: '#f87171',
                fontSize: 10,
                position: 'top'
              }}
            />

            {/* Gan Area graph */}
            <Area
              type="monotone"
              dataKey="gan"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#ganGrad)"
            />

            {/* Hit indicator bar */}
            <Bar
              dataKey="isHit"
              barSize={6}
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          Hiển thị 60 kỳ quay gần nhất để tối ưu quan sát chu kỳ
        </span>
        <span className="font-mono text-slate-300">
          Đỉnh Gan Max: <strong className="text-rose-400 font-bold">{maxGan} ngày</strong>
        </span>
      </div>
    </div>
  );
}
