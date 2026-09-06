import React from 'react';
import { Target, AlertTriangle, ShieldAlert, Flame, Clock, Award, Activity, TrendingUp } from 'lucide-react';

export default function StatsSummaryCards({ stats, mode }) {
  if (!stats) return null;

  const {
    totalDays,
    dansoCount,
    hitDaysCount,
    missDaysCount,
    hitRatePercent,
    expectedRate,
    currentGan,
    maxGan,
    currentWinStreak,
    maxWinStreak,
    avgInterval,
    totalHitHits
  } = stats;

  // Gan Status Styling
  let ganStatusBg = 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 text-emerald-400';
  let ganStatusText = 'An toàn (Vừa về / Nổ gần đây)';
  if (currentGan >= 2 && currentGan < 4) {
    ganStatusBg = 'from-amber-500/10 to-amber-500/5 border-amber-500/30 text-amber-400';
    ganStatusText = 'Cảnh báo: Đã gan ' + currentGan + ' ngày';
  } else if (currentGan >= 4) {
    ganStatusBg = 'from-rose-500/20 to-rose-500/10 border-rose-500/50 text-rose-400 animate-pulse';
    ganStatusText = 'BÁO ĐỘNG GAN CAO: ' + currentGan + ' ngày xịt liên tiếp!';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Tỉ lệ Trúng Win Rate Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-400" />
            Tỉ Lệ Trúng ({totalDays} Ngày)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
            Dàn {dansoCount} số
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-extrabold text-white font-mono glow-text-emerald">
            {hitRatePercent}%
          </span>
          <span className="text-xs text-slate-400 font-medium">
            ({hitDaysCount}/{totalDays} ngày nổ)
          </span>
        </div>

        {/* Theoretical comparison bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Tỉ lệ thực tế:</span>
            <span className="font-bold text-emerald-400 font-mono">{hitRatePercent}%</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Lý thuyết ({dansoCount} số):</span>
            <span className="font-bold text-slate-300 font-mono">{expectedRate}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(hitRatePercent, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Gan Hiện Tại (Current Gan) Card */}
      <div className={`glass-card glass-card-hover rounded-2xl p-5 border bg-gradient-to-b ${ganStatusBg} relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Gan Hiện Tại
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-800">
            {currentGan === 0 ? 'VỪA NỔ' : 'XỊT KEO'}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black font-mono">
            {currentGan}
          </span>
          <span className="text-sm font-semibold">ngày xịt</span>
        </div>

        <div className="text-[11px] font-bold mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
          <span>{ganStatusText}</span>
        </div>
      </div>

      {/* 3. Gan Max (Max Gan Streak) Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            GAN MAX (Cực Đại)
          </span>
          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            Quan trọng nuôi dàn
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-extrabold text-rose-400 font-mono">
            {maxGan}
          </span>
          <span className="text-xs text-slate-400 font-medium">ngày xịt liên tiếp</span>
        </div>

        <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 leading-snug">
          Khuyên dùng: Chuẩn bị vốn nuôi tối thiểu <strong className="text-amber-300 font-mono">{maxGan + 2} ngày</strong> để an toàn tuyệt đối.
        </p>
      </div>

      {/* 4. Nhịp & Chuỗi Ăn Max Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            Chuỗi Ăn & Nhịp Về
          </span>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Phong độ
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Ăn Max Liên Tiếp</div>
            <div className="text-2xl font-bold text-amber-300 font-mono">{maxWinStreak} <span className="text-xs text-slate-400">ngày</span></div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Nhịp Về TB</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{avgInterval} <span className="text-xs text-slate-400">ngày/lần</span></div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Tổng số lượt nổ ({mode === 'de' ? 'Đề' : 'Nháy lô'}):</span>
          <strong className="text-white font-mono">{totalHitHits} lượt</strong>
        </div>
      </div>

    </div>
  );
}
