import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, Calendar, ShieldAlert, Award, Clock, Target, ArrowRight, CheckCircle2, AlertTriangle, Layers, Percent } from 'lucide-react';
import { analyzeSetForecastT1T2 } from '../utils/lotteryEngine';

export default function ForecastT1T2Panel({ historyData, activeSet, mode = 'de' }) {
  const forecast = useMemo(() => {
    if (!historyData || !activeSet || !activeSet.numbers) return null;
    return analyzeSetForecastT1T2(historyData, activeSet.numbers, mode);
  }, [historyData, activeSet, mode]);

  if (!forecast || !activeSet) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-slate-400">
        Chưa đủ dữ liệu để tính toán dự phóng xác suất T+1 và T+2.
      </div>
    );
  }

  const {
    k,
    currentGan,
    maxGan,
    avgGan,
    avgCycle,
    theoretical,
    empirical,
    riskLevel,
    riskColor,
    advice,
    ganDistribution
  } = forecast;

  const modeName = mode === 'g1' ? 'Giải Nhất (G1)' : (mode === 'de' ? 'Giải Đặc Biệt (ĐB)' : 'Lô (27 Giải)');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Mô hình Xác suất Bernoulli & Geometric Forecast
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Dự Phóng Xác Suất Nổ Ngày <span className="text-amber-400">T+1</span> và <span className="text-yellow-300">T+2</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Đang phân tích: <strong className="text-white">{activeSet.name}</strong> ({k} số) cho phạm vi{' '}
              <strong className="text-amber-300">{modeName}</strong>
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Đánh giá rủi ro chu kỳ</span>
            <span className={`text-sm sm:text-base font-black ${riskColor}`}>{riskLevel}</span>
          </div>
        </div>

        {/* Advisory box */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300">Nhận định chu kỳ: </strong>
            {advice}
          </div>
        </div>
      </div>

      {/* Main Probability Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: P(T+1) Lý Thuyết */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Xác Suất Nổ Ngày T+1 (Lý Thuyết)</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {theoretical.pT1Percent}%
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Tỉ lệ ngẫu nhiên cho dàn {k}/100 số tại 1 kỳ quay duy nhất.
          </p>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Thực tế lịch sử:</span>
            <span className="font-bold text-emerald-400 font-mono">{empirical.empiricalRateT1}%</span>
          </div>
        </div>

        {/* Card 2: P(T+2) nếu trượt T+1 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Nổ tại T+2 (Sau khi trượt T+1)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-cyan-300 font-mono">
            {theoretical.pT2Percent}%
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Xác suất điều kiện: Trượt ngày $T+1$ và nổ gỡ lại ngay tại $T+2$.
          </p>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">P(Trượt T+1):</span>
            <span className="font-bold text-rose-400 font-mono">{(100 - theoretical.pT1Percent).toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 3: P(T+1 or T+2) Khung 2 Ngày */}
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">NỔ TRONG KHUNG 2 NGÀY [T+1, T+2]</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300 font-mono">
            {theoretical.pT1orT2Percent}%
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Xác suất ăn ít nhất 1 lần trong 2 ngày tới: $1 - (1 - P)^2$.
          </p>
          <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400/80">Thực tế lịch sử:</span>
            <span className="font-bold text-emerald-300 font-mono">{empirical.empiricalRateT1orT2}%</span>
          </div>
        </div>

        {/* Card 4: Chu Kỳ & Gan Hiện Tại */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Vị Trí Chu Kỳ Gan</span>
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">{currentGan}</span>
            <span className="text-xs text-slate-400">ngày chưa về</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Gan trung bình:</span>
            <strong className="text-slate-200 font-mono">{avgGan} ngày</strong>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Gan Max lịch sử:</span>
            <strong className="text-rose-400 font-mono">{maxGan} ngày</strong>
          </div>
        </div>
      </div>

      {/* Historical Empirical Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Empirical Evidence Table */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Kiểm Chứng Thực Nghiệm Lịch Sử Toàn Bộ Kỳ Quay
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trong toàn bộ hơn 7.600 kỳ quay lịch sử trên cơ sở dữ liệu Firebase:
          </p>

          <div className="space-y-3">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300">Số lần dàn chạm mốc Gan {currentGan} ngày:</span>
              <strong className="text-white font-mono text-sm">{empirical.timesReachedGan.toLocaleString()} lần</strong>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300">Số lần nổ ngay ở ngày tiếp theo (T+1):</span>
              <div className="text-right">
                <span className="text-emerald-400 font-mono font-bold text-sm">{empirical.empiricalHitT1.toLocaleString()} lần</span>
                <span className="text-xs text-slate-400 ml-2">({empirical.empiricalRateT1}%)</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300">Số lần nổ trong khung 2 ngày (T+1 hoặc T+2):</span>
              <div className="text-right">
                <span className="text-amber-400 font-mono font-bold text-sm">
                  {(empirical.empiricalHitT1 + empirical.empiricalHitT2).toLocaleString()} lần
                </span>
                <span className="text-xs text-slate-400 ml-2">({empirical.empiricalRateT1orT2}%)</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300">Chu kỳ xuất hiện trung bình:</span>
              <strong className="text-cyan-400 font-mono text-sm">{avgCycle} ngày/lần</strong>
            </div>
          </div>
        </div>

        {/* Investment Strategy Recommendation */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Chiến Thuật Vào Tiền Tối Ưu (Khung 2 Ngày T+1 & T+2)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dựa trên xác suất tích lũy {theoretical.pT1orT2Percent}%, tỷ lệ vào vốn khuyến nghị:
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-300">1. Chiến thuật Vào Tiền Đều (Flat 1 - 1)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Khuyên dùng</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Đánh đúng số điểm mỗi ngày (ví dụ 10k/số). Khi nổ ngày nào chốt lãi ngày đó. Hạn chế tối đa rủi ro drawdown khi thị trường đảo cầu.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-cyan-300">2. Chiến thuật Gấp Thếp Khung 2 Ngày (1 - 2)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">Cân nhắc</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ngày T+1 vào mức 1. Nếu trượt, ngày T+2 nhân hệ số 2. Xác suất ăn cả khung là {theoretical.pT1orT2Percent}%. Tuyệt đối không gấp quá ngày T+2 nếu xịt.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-300">3. Ngưỡng Cắt Lỗ Bắt Buộc</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">Kỷ luật</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Nếu dàn số vượt quá <strong className="text-rose-400">Gan {Math.min(maxGan, 6)} ngày</strong>, dừng vào tiền và chờ dàn nổ lại 1 kỳ để nhịp chu kỳ tái lập bình ổn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Numbers in the set preview */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Danh Sách {k} Con Số Trong Dàn Đang Phân Tích
          </h3>
          <span className="text-xs text-slate-400">Mỗi số có xác suất độc lập 1%</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {activeSet.numbers.map(num => (
            <span
              key={num}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/40 text-slate-200 font-mono font-bold text-xs transition-all cursor-default"
            >
              {num}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
