import React, { useMemo } from 'react';
import { RotateCcw, TrendingUp, Info, AlertCircle, ArrowUpDown } from 'lucide-react';
import { analyzeCycles } from '../analytics/cycleService';

export default function CycleView({ historyData, mode = 'de' }) {
  const cycleList = useMemo(() => {
    return analyzeCycles(historyData, mode);
  }, [historyData, mode]);

  const modeTitle = mode === 'g1' ? 'Giải Nhất (G1)' : 'Giải Đặc Biệt (ĐB)';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <RotateCcw className="w-4 h-4" />
            Phân Tích Chu Kỳ Xuất Hiện & Độ Lệch Chuẩn
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Chu Kỳ & Tỷ Lệ Tái Xuất Hiện — <span className="text-amber-400">{modeTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Phân tích khoảng cách giữa các lần nổ: Chu kỳ trung bình, trung vị, độ lệch chuẩn ($\sigma$) và tỷ lệ rơi lại sau 1, 2, 3, 5, 7 ngày.
          </p>
        </div>
      </div>

      {/* Explanatory notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1.5">
          <span className="text-xs font-bold text-amber-300">Độ Lệch Chuẩn Chu Kỳ ($\sigma$)</span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            $\sigma$ càng nhỏ thể hiện con số có chu kỳ nổ rất đều đặn theo thời gian. $\sigma$ lớn thể hiện số nổ thất thường (lúc dồn dập, lúc gan kéo dài).
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1.5">
          <span className="text-xs font-bold text-cyan-300">Tỷ Lệ Tái Xuất Hiện (Rơi lại)</span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Đo lường xác suất con số sau khi vừa nổ hôm nay thì sẽ nổ lại tiếp tục trong vòng 1 ngày (bệt), 2 ngày, 3 ngày hoặc 7 ngày sau.
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1.5">
          <span className="text-xs font-bold text-emerald-300">Hệ Số Phân Kỳ Chu Kỳ</span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Tỷ số giữa Số ngày chưa về hiện tại / Chu kỳ trung bình. Hệ số &gt; 1.0 cho thấy số này đã quá hạn chu kỳ bình thường.
          </p>
        </div>
      </div>

      {/* Cycle Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Danh sách 100 con số sắp xếp theo: <strong className="text-white">Độ phân kỳ chu kỳ cao nhất</strong></span>
          <span className="text-[11px] text-slate-500">Dữ liệu từ 2010 đến nay</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin max-h-[600px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Con Số</th>
                <th className="py-2.5 px-3">Khoảng Cách Hiện Tại</th>
                <th className="py-2.5 px-3">Chu Kỳ TB</th>
                <th className="py-2.5 px-3">Chu Kỳ Trung Vị</th>
                <th className="py-2.5 px-3">Độ Lệch Chuẩn ($\sigma$)</th>
                <th className="py-2.5 px-3">Hệ Số Phân Kỳ</th>
                <th className="py-2.5 px-3">Rơi Sau 1 Ngày (Bệt)</th>
                <th className="py-2.5 px-3">Rơi Trong 2 Ngày</th>
                <th className="py-2.5 px-3">Rơi Trong 3 Ngày</th>
                <th className="py-2.5 px-3">Rơi Trong 7 Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {cycleList.map(item => (
                <tr key={item.num} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-2.5 px-3 font-black text-amber-400 text-sm">{item.num}</td>
                  <td className="py-2.5 px-3 font-bold text-white">{item.currentGap} ngày</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold">{item.meanCycle} d</td>
                  <td className="py-2.5 px-3 text-slate-300">{item.medianCycle} d</td>
                  <td className="py-2.5 px-3 text-slate-400">±{item.stdDev}</td>
                  <td className="py-2.5 px-3 font-bold">
                    <span className={item.divergenceRatio >= 1.5 ? 'text-rose-400' : (item.divergenceRatio >= 1.0 ? 'text-amber-400' : 'text-emerald-400')}>
                      {item.divergenceRatio}x
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{item.returnRate1d}%</td>
                  <td className="py-2.5 px-3 text-slate-300">{item.returnRate2d}%</td>
                  <td className="py-2.5 px-3 text-slate-300">{item.returnRate3d}%</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{item.returnRate7d}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
