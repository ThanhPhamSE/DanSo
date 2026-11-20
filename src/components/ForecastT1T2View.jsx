import React, { useState, useMemo } from 'react';
import { Sparkles, Calendar, Target, Award, ShieldAlert, Sliders, ArrowRight, Percent, Info, CheckCircle2 } from 'lucide-react';
import { generateForecast } from '../forecasting/forecastService';
import { DEFAULT_WEIGHTS } from '../forecasting/scoringEngine';

export default function ForecastT1T2View({ historyData, savedSets = [], mode = 'de' }) {
  const [forecastHorizon, setForecastHorizon] = useState('t1'); // 't1' | 't2'
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showConfig, setShowConfig] = useState(false);

  const forecast = useMemo(() => {
    return generateForecast(historyData, savedSets, mode, weights);
  }, [historyData, savedSets, mode, weights]);

  const modeTitle = mode === 'g1' ? 'Giải Nhất (G1)' : 'Giải Đặc Biệt (ĐB)';

  if (!forecast) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 text-slate-400">
        Đang tải dữ liệu để phân tích dự phóng T+1 và T+2...
      </div>
    );
  }

  const { top20_T1, top20_T2, rankedSetsT1, rankedSetsT2, latestDate } = forecast;
  const currentList = forecastHorizon === 't1' ? top20_T1 : top20_T2;
  const currentSets = forecastHorizon === 't1' ? rankedSetsT1 : rankedSetsT2;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Mô Hình Dự Phóng Thống Kê & Điểm Số Tổng Hợp
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Phân Tích Dự Phóng Cho Ngày{' '}
              <span className={forecastHorizon === 't1' ? 'text-amber-400' : 'text-cyan-400'}>
                {forecastHorizon === 't1' ? 'Tiếp Theo (T+1)' : 'Kế Tiếp Nữa (T+2)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Điểm thống kê được tính dựa trên tần suất lịch sử, nhịp độ 30 ngày, tiệm cận chu kỳ và xác suất Bayes.
            </p>
          </div>

          {/* Horizon Selector Buttons */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setForecastHorizon('t1')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                forecastHorizon === 't1'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎯 Dự Báo Ngày T+1
            </button>
            <button
              onClick={() => setForecastHorizon('t2')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                forecastHorizon === 't2'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⏳ Dự Báo Ngày T+2
            </button>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Lưu ý thống kê:</strong> Đây là công cụ phân tích xác suất thống kê dựa trên dữ liệu lịch sử ({modeTitle}), không khẳng định có thể dự đoán chính xác kết quả tương lai. Các con số có điểm số cao thể hiện sự hội tụ về nhịp chu kỳ lịch sử.
          </div>
        </div>
      </div>

      {/* Ranked Numbers Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Bảng Xếp Hạng Top 20 Con Số Triển Vọng Nhất ({forecastHorizon === 't1' ? 'T+1' : 'T+2'})
            </h3>
            <span className="text-xs text-slate-400">
              Đánh giá từ 100 con số 00-99 theo bộ trọng số Scoring Engine
            </span>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all w-fit"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            {showConfig ? 'Đóng cấu hình trọng số' : 'Điều chỉnh trọng số điểm'}
          </button>
        </div>

        {/* Config Weights Accordion */}
        {showConfig && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-fadeIn text-xs">
            <h4 className="font-bold text-amber-300">Cấu hình trọng số Scoring Engine:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Tần suất lịch sử</label>
                <input
                  type="number"
                  step="0.05"
                  value={weights.w_hist}
                  onChange={(e) => setWeights({ ...weights, w_hist: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tần suất 30 ngày</label>
                <input
                  type="number"
                  step="0.05"
                  value={weights.w_rec}
                  onChange={(e) => setWeights({ ...weights, w_rec: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Chu kỳ tiệm cận</label>
                <input
                  type="number"
                  step="0.05"
                  value={weights.w_gap}
                  onChange={(e) => setWeights({ ...weights, w_gap: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Xác suất Bayes</label>
                <input
                  type="number"
                  step="0.05"
                  value={weights.w_prob}
                  onChange={(e) => setWeights({ ...weights, w_prob: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Độ ổn định</label>
                <input
                  type="number"
                  step="0.05"
                  value={weights.w_stab}
                  onChange={(e) => setWeights({ ...weights, w_stab: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Numbers Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Hạng</th>
                <th className="py-2.5 px-3">Con Số</th>
                <th className="py-2.5 px-3">Điểm Thống Kê</th>
                <th className="py-2.5 px-3">Mức Độ Tin Cậy</th>
                <th className="py-2.5 px-3">Gan Hiện Tại</th>
                <th className="py-2.5 px-3">Nổ 30 Ngày</th>
                <th className="py-2.5 px-3">Tổng Lần Nổ</th>
                <th className="py-2.5 px-3">P(Bayes)</th>
                <th className="py-2.5 px-3">Khoảng Tin Cậy 95%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {currentList.map((item, idx) => (
                <tr key={item.num} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 font-bold">#{idx + 1}</td>
                  <td className="py-2.5 px-3 font-black text-amber-400 text-sm">
                    {item.num}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {forecastHorizon === 't1' ? item.score : item.scoreT2} đ
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.confidence === 'Rất Cao' ? 'bg-emerald-500/20 text-emerald-300' :
                      item.confidence === 'Khá Cao' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {item.confidence}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{item.currentGan} ngày</td>
                  <td className="py-2.5 px-3 text-cyan-300">{item.hits30} lần</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.totalHits}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{item.pBayes}%</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    [{item.ci95[0]}% - {item.ci95[1]}%]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranked Sets Table */}
      {currentSets.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Bảng Xếp Hạng Khả Năng Nổ Của Các Dàn Số ({forecastHorizon === 't1' ? 'T+1' : 'T+2'})
            </h3>
            <span className="text-xs text-slate-400">
              Đánh giá tỷ lệ nổ lịch sử, gan hiện tại và xác suất độc lập của từng dàn
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Thứ Hạng</th>
                  <th className="py-2.5 px-3">Tên Dàn Số</th>
                  <th className="py-2.5 px-3">Số Lượng</th>
                  <th className="py-2.5 px-3">Điểm Dự Phóng</th>
                  <th className="py-2.5 px-3">P(Lý Thuyết)</th>
                  <th className="py-2.5 px-3">P(Khung 2 Ngày)</th>
                  <th className="py-2.5 px-3">Tỷ Lệ Ăn Lịch Sử</th>
                  <th className="py-2.5 px-3">Tỷ Lệ 30 Ngày</th>
                  <th className="py-2.5 px-3">Gan Hiện Tại</th>
                  <th className="py-2.5 px-3">Gan Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {currentSets.map((setItem, idx) => (
                  <tr key={setItem.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 font-bold">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-white">{setItem.name}</td>
                    <td className="py-2.5 px-3 text-amber-300">{setItem.count} số</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      {forecastHorizon === 't1' ? setItem.setScoreT1 : setItem.setScoreT2} đ
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{setItem.pSetSinglePercent}%</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{setItem.pSet2DayPercent}%</td>
                    <td className="py-2.5 px-3 text-emerald-400">{setItem.hitRateAll}%</td>
                    <td className="py-2.5 px-3 text-slate-300">{setItem.hitRate30}%</td>
                    <td className="py-2.5 px-3 text-amber-400">{setItem.currentGan} ngày</td>
                    <td className="py-2.5 px-3 text-rose-400">{setItem.maxGan} ngày</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
