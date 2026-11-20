import React, { useMemo } from 'react';
import { Database, TrendingUp, Clock, Flame, Snowflake, Sparkles, Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import { analyzeFrequency, getTopRankings } from '../analytics/frequencyService';
import { analyzeGan } from '../analytics/ganService';
import { getPrizeForMode, getModeLabel } from '../utils/lotteryEngine';

export default function DashboardOverview({
  historyData,
  mode = 'db_tail',
  savedSets = [],
  meta,
  onNavigateTab,
  onSelectNumber
}) {
  const latest = historyData[0] || null;
  const prizeNum = getPrizeForMode(latest, mode);
  const modeName = getModeLabel(mode);

  const sp = latest?.sp || '';
  const fp = latest?.fp || '';
  const dbHead = sp.length === 5 ? sp.slice(0, 2) : '--';
  const dbTail = sp.length === 5 ? sp.slice(-2) : '--';
  const g1Head = fp.length === 5 ? fp.slice(0, 2) : '--';
  const g1Tail = fp.length === 5 ? fp.slice(-2) : '--';

  const freqList = useMemo(() => analyzeFrequency(historyData, mode), [historyData, mode]);
  const ganList = useMemo(() => analyzeGan(historyData, mode), [historyData, mode]);
  const rankings = useMemo(() => getTopRankings(freqList, 5), [freqList]);

  // Quick lookup maps
  const ganMap = useMemo(() => Object.fromEntries(ganList.map(g => [g.num, g])), [ganList]);
  const freqMap = useMemo(() => Object.fromEntries(freqList.map(f => [f.num, f])), [freqList]);

  const topGan5 = useMemo(() => ganList.slice(0, 5), [ganList]);

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Latest Result with all 4 targets preview */}
        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900 relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase">
            <span>Kỳ Gần Nhất ({latest?.d || '---'})</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400">Đang soi theo: <strong className="text-amber-300 font-sans">{modeName}</strong></div>
            <div className="text-3xl font-black font-mono text-white">
              {prizeNum || '--'}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[10px] font-mono">
            <span className={mode === 'db_head' ? 'text-amber-300 font-bold' : 'text-slate-400'}>
              Đầu ĐB: {dbHead}
            </span>
            <span className={mode === 'db_tail' ? 'text-amber-300 font-bold' : 'text-slate-400'}>
              Đuôi ĐB: {dbTail}
            </span>
            <span className={mode === 'g1_head' ? 'text-amber-300 font-bold' : 'text-slate-400'}>
              Đầu G1: {g1Head}
            </span>
            <span className={mode === 'g1_tail' ? 'text-amber-300 font-bold' : 'text-slate-400'}>
              Đuôi G1: {g1Tail}
            </span>
          </div>
        </div>

        {/* Card 2: Total records */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Dữ Liệu Lịch Sử (Từ 2010)</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {historyData.length.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Khoảng thời gian:</span>
            <strong className="text-slate-300 font-mono">
              {historyData[historyData.length - 1]?.d} → {latest?.d}
            </strong>
          </div>
        </div>

        {/* Card 3: Top Hot 30 Days */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Top Nổ Nhiều 30 Ngày</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {rankings.hot30.slice(0, 5).map(item => (
              <span
                key={item.num}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold"
                title={`${item.hits30} lần nổ trong 30 ngày`}
              >
                {item.num} ({item.hits30}x)
              </span>
            ))}
          </div>
          <div className="text-[11px] text-slate-400">Xu hướng nổ ngắn hạn tăng cao</div>
        </div>

        {/* Card 4: Top Highest Gan */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Top Đang Gan Lâu Nhất</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {topGan5.map(item => (
              <span
                key={item.num}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold"
                title={`Gan ${item.currentGan} ngày (Max lịch sử: ${item.maxGan} ngày)`}
              >
                {item.num} (G:{item.currentGan})
              </span>
            ))}
          </div>
          <div className="text-[11px] text-slate-400">Số ngày liên tiếp chưa xuất hiện</div>
        </div>
      </div>

      {/* 10x10 Heatmap Matrix 00-99 */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Bản Đồ Nhiệt Ma Trận 100 Con Số (00 đến 99) — {modeName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mỗi ô thể hiện: Số và Tần suất 30 ngày gần nhất (Dưới) cùng số ngày Gan hiện tại (G).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500"></span>
              Nổ nhiều (Hot 30d)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500"></span>
              Gan cao (&gt;30d)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500"></span>
              Vừa về (G:0)
            </span>
          </div>
        </div>

        {/* 10x10 Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
          {Array.from({ length: 100 }, (_, i) => {
            const num = i.toString().padStart(2, '0');
            const f = freqMap[num] || { hits30: 0, totalHits: 0 };
            const g = ganMap[num] || { currentGan: 0 };

            let bgClass = 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600';
            if (f.hits30 >= 3) {
              bgClass = 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:border-rose-400';
            } else if (g.currentGan >= 40) {
              bgClass = 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:border-amber-400';
            } else if (g.currentGan === 0) {
              bgClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:border-emerald-400';
            }

            return (
              <button
                key={num}
                onClick={() => onSelectNumber && onSelectNumber(num)}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 ${bgClass}`}
                title={`Số: ${num} | Về 30d: ${f.hits30} lần | Tổng về: ${f.totalHits} | Gan: ${g.currentGan} ngày`}
              >
                <span className="font-mono font-black text-sm">{num}</span>
                <span className="text-[10px] font-mono opacity-80 mt-0.5">
                  G:{g.currentGan}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Launchpad to other modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('forecast')}
          className="glass-card rounded-2xl p-5 border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer group bg-gradient-to-r from-amber-500/5 to-slate-900"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Dự Phóng T+1 & T+2
            </span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Xếp Hạng Số & Dàn Số Ngày Mai</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Xem ngay bảng xếp hạng Top 20 con số và xác suất nổ dàn trong khung 2 ngày.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('multisets')}
          className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Quản Lý Dàn Số
            </span>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Quản Lý & Ma Trận {savedSets.length} Dàn</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            So sánh tỷ lệ nổ, chu kỳ ăn/xịt và Gan của các dàn số bạn đang nuôi.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('backtest')}
          className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-violet-400 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Kiểm Định Lịch Sử
            </span>
            <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Backtesting Thuật Toán</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mô phỏng dự đoán trên dữ liệu quá khứ không Data Leakage, tính Brier Score và Hit Rate.
          </p>
        </div>
      </div>
    </div>
  );
}
