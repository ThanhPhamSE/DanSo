import React, { useState } from 'react';
import { PieChart, Award, AlertCircle, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

export default function AnalyticsPanel({ stats }) {
  const [showFullTable, setShowFullTable] = useState(false);

  if (!stats) return null;

  const {
    headCounts,
    tailCounts,
    sumCounts,
    topHits,
    leastHits,
    sortedNumberStats,
    dansoCount,
    totalDays
  } = stats;

  return (
    <div className="space-y-6">
      
      {/* Top / Least Numbers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Top Hits Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Top 5 Số Về Nhiều Nhất Trong Dàn
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Phong độ cao
            </span>
          </div>

          <div className="space-y-2.5">
            {topHits.map((item, idx) => (
              <div key={item.num} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                    idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' : 'bg-slate-800 text-slate-300'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="text-base font-extrabold font-mono text-emerald-300">
                    {item.num}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">{item.count} lần</div>
                  <div className="text-[10px] text-slate-400">tỉ lệ {item.hitRate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Least Hits Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Top 5 Số Về Ít Nhất (Gan Số Trong Dàn)
            </h3>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Cần cân nhắc lọc
            </span>
          </div>

          <div className="space-y-2.5">
            {leastHits.map((item, idx) => (
              <div key={item.num} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-black flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-base font-extrabold font-mono text-amber-400">
                    {item.num}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-200 font-mono">{item.count} lần</div>
                  <div className="text-[10px] text-slate-400">tỉ lệ {item.hitRate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Head / Tail / Sum Distribution Grid */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Phân Bổ Đầu, Đuôi & Tổng Trong Dàn {dansoCount} Số
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Head Distribution */}
          <div>
            <div className="text-xs font-bold text-slate-300 mb-2 flex justify-between">
              <span>Phân bổ Đầu (0 - 9):</span>
              <span className="text-amber-400">Số lượng</span>
            </div>
            <div className="space-y-1">
              {headCounts.map((cnt, h) => (
                <div key={h} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-slate-400 font-mono font-bold">Đầu {h}:</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${(cnt / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-mono font-bold text-slate-200">{cnt} số</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tail Distribution */}
          <div>
            <div className="text-xs font-bold text-slate-300 mb-2 flex justify-between">
              <span>Phân bổ Đuôi (0 - 9):</span>
              <span className="text-cyan-400">Số lượng</span>
            </div>
            <div className="space-y-1">
              {tailCounts.map((cnt, t) => (
                <div key={t} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-slate-400 font-mono font-bold">Đuôi {t}:</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all"
                      style={{ width: `${(cnt / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-mono font-bold text-slate-200">{cnt} số</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sum Distribution */}
          <div>
            <div className="text-xs font-bold text-slate-300 mb-2 flex justify-between">
              <span>Phân bổ Tổng (0 - 9):</span>
              <span className="text-emerald-400">Số lượng</span>
            </div>
            <div className="space-y-1">
              {sumCounts.map((cnt, s) => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-slate-400 font-mono font-bold">Tổng {s}:</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{ width: `${(cnt / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-mono font-bold text-slate-200">{cnt} số</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Frequency Table toggle */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <button
          onClick={() => setShowFullTable(!showFullTable)}
          className="w-full flex items-center justify-between text-left text-sm font-bold text-white focus:outline-none"
        >
          <span className="flex items-center gap-2">
            📊 Bảng Thống Kê Tần Suất Nổ Từng Con Số Trong Dàn ({dansoCount} số)
          </span>
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <span>{showFullTable ? 'Thu gọn' : 'Xem chi tiết'}</span>
            {showFullTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showFullTable && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {sortedNumberStats.map((item) => (
                <div
                  key={item.num}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center flex flex-col items-center justify-center hover:border-amber-500/40 transition-all"
                >
                  <span className="text-lg font-black font-mono text-amber-300">
                    {item.num}
                  </span>
                  <span className="text-[11px] font-bold text-slate-200 mt-0.5">
                    {item.count} lần
                  </span>
                  <span className="text-[9px] text-slate-400">
                    ({item.hitRate}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
