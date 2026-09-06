import React, { useState } from 'react';
import { simulateCapital } from '../utils/lotteryEngine';
import { CircleDollarSign, Calculator, TrendingUp, AlertOctagon, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function CapitalSimulatorPanel({ historyDetails, dansoCount }) {
  const [betPerNum, setBetPerNum] = useState(10000); // 10k VND per number
  const [payoutRatio, setPayoutRatio] = useState(99); // 1 ăn 99
  const [strategy, setStrategy] = useState('flat'); // 'flat', 'martingale', 'sch_1_2_4'

  if (!historyDetails || historyDetails.length === 0) return null;

  const simResult = simulateCapital(historyDetails, betPerNum, payoutRatio, strategy);
  if (!simResult) return null;

  const { totalInvested, totalPayout, netProfit, roi, maxDrawdown } = simResult;
  const dailyCostPerUnit = betPerNum * (dansoCount || 50);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-amber-400" />
            Giả Lập Quản Lý Vốn & Lợi Nhuận Dàn 5X
          </h3>
          <p className="text-xs text-slate-400">
            Tính toán dòng tiền thắng/thua thực tế theo tỉ lệ tiền vào và mức thưởng nhà cái
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Chi phí 1 ngày (1x):</span>
          <span className="text-sm font-bold text-amber-300 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {formatVND(dailyCostPerUnit)}
          </span>
        </div>
      </div>

      {/* Simulator Inputs Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
        
        {/* Bet Per Number */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Tiền đánh 1 số (VNĐ):
          </label>
          <select
            value={betPerNum}
            onChange={(e) => setBetPerNum(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs font-bold font-mono focus:outline-none focus:border-amber-500"
          >
            <option value={1000}>1.000 đ / số (Tổng {formatVND(1000 * dansoCount)}/ngày)</option>
            <option value={5000}>5.000 đ / số (Tổng {formatVND(5000 * dansoCount)}/ngày)</option>
            <option value={10000}>10.000 đ / số (Tổng {formatVND(10000 * dansoCount)}/ngày)</option>
            <option value={20000}>20.000 đ / số (Tổng {formatVND(20000 * dansoCount)}/ngày)</option>
            <option value={50000}>50.000 đ / số (Tổng {formatVND(50000 * dansoCount)}/ngày)</option>
            <option value={100000}>100.000 đ / số (Tổng {formatVND(100000 * dansoCount)}/ngày)</option>
          </select>
        </div>

        {/* Payout Ratio */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Tỉ lệ trả thưởng:
          </label>
          <select
            value={payoutRatio}
            onChange={(e) => setPayoutRatio(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs font-bold font-mono focus:outline-none focus:border-amber-500"
          >
            <option value={99}>1 ăn 99 (Lô đề Online chuẩn)</option>
            <option value={99.5}>1 ăn 99.5 (Nhà cái VIP)</option>
            <option value={80}>1 ăn 80 (Lô đề Truyền thống)</option>
            <option value={70}>1 ăn 70 (Truyền thống cũ)</option>
          </select>
        </div>

        {/* Strategy Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Chiến thuật vào tiền:
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-amber-500"
          >
            <option value="flat">1. Vào tiền đều hàng ngày (1x)</option>
            <option value="martingale">2. Gấp thếp khi xịt (1x - 2x - 4x...)</option>
            <option value="sch_1_2_4">3. Nuôi Khung 3 ngày (1x - 2x - 4x)</option>
          </select>
        </div>

      </div>

      {/* Simulator Results Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Profit Card */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          netProfit >= 0
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>LÃI / LỖ RÒNG</span>
            {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          </div>
          <div className="my-2">
            <div className="text-2xl font-black font-mono">
              {netProfit >= 0 ? '+' : ''}{formatVND(netProfit)}
            </div>
            <div className="text-[11px] opacity-80 font-medium">
              Tỉ lệ ROI: <strong className="font-mono">{roi}%</strong>
            </div>
          </div>
        </div>

        {/* Total Invested Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <div className="text-xs font-bold text-slate-400 uppercase">Tổng Vốn Đã Đánh</div>
          <div className="text-xl font-bold font-mono text-white my-1">
            {formatVND(totalInvested)}
          </div>
          <div className="text-[10px] text-slate-400">Tính trên {historyDetails.length} ngày</div>
        </div>

        {/* Total Payout Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <div className="text-xs font-bold text-slate-400 uppercase">Tổng Tiền Trúng Thu Về</div>
          <div className="text-xl font-bold font-mono text-emerald-400 my-1">
            {formatVND(totalPayout)}
          </div>
          <div className="text-[10px] text-slate-400">Đã trừ chi phí vào tiền</div>
        </div>

        {/* Max Drawdown Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <div className="text-xs font-bold text-slate-400 uppercase">Sụt Giảm Vốn Max (Drawdown)</div>
          <div className="text-xl font-bold font-mono text-rose-400 my-1">
            {formatVND(maxDrawdown)}
          </div>
          <div className="text-[10px] text-slate-400">Lượng vốn dự phòng đề xuất</div>
        </div>

      </div>

    </div>
  );
}
