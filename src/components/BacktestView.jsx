import React, { useState } from 'react';
import { FlaskConical, Play, Award, ShieldCheck, CheckCircle2, XCircle, Info } from 'lucide-react';
import { runBacktest } from '../backtesting/backtestEngine';

export default function BacktestView({ historyData, mode = 'de' }) {
  const [testDays, setTestDays] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runBacktest(historyData, testDays, mode);
      setResult(res);
      setIsRunning(false);
    }, 100);
  };

  const modeTitle = mode === 'g1' ? 'Giải Nhất (G1)' : 'Giải Đặc Biệt (ĐB)';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            Kiểm Định Thuật Toán (Backtesting Engine)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Kiểm Định Giả Lập Lịch Sử — <span className="text-amber-400">{modeTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quy trình Walk-Forward không rò rỉ dữ liệu (No Data Leakage). Mô phỏng đưa ra dự báo ngày $T$ chỉ dựa trên dữ liệu trước ngày $T$.
          </p>
        </div>

        {/* Run Controls */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Số kỳ kiểm định:</span>
            <select
              value={testDays}
              onChange={(e) => setTestDays(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-white font-mono font-bold"
            >
              <option value={30}>30 kỳ gần nhất</option>
              <option value={60}>60 kỳ gần nhất</option>
              <option value={90}>90 kỳ gần nhất</option>
              <option value={180}>180 kỳ gần nhất</option>
            </select>
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-xs text-white flex items-center gap-2 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Đang kiểm định...' : 'Bắt Đầu Kiểm Định'}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && !result.error && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Tỷ Lệ Ăn Top 10 (T+1)</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {result.hitRateT1_Top10}%
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Baseline Ngẫu nhiên:</span>
                <span className="text-slate-300 font-mono">10.0%</span>
              </div>
              <div className="text-[11px] text-emerald-300 font-bold">
                Chênh lệch: +{result.t1EdgeTop10}% so với ngẫu nhiên
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Tỷ Lệ Ăn Top 20 (T+1)</span>
              <div className="text-3xl font-black text-cyan-400 font-mono">
                {result.hitRateT1_Top20}%
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Baseline Ngẫu nhiên:</span>
                <span className="text-slate-300 font-mono">20.0%</span>
              </div>
              <div className="text-[11px] text-cyan-300 font-bold">
                Chênh lệch: +{result.t1EdgeTop20}% so với ngẫu nhiên
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Độ Chuẩn Xác Brier Score</span>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {result.brierScore}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Thước đo sai số xác suất (Càng gần 0 mô hình càng chuẩn xác).
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Tổng Số Kỳ Đã Thử Nghiệm</span>
              <div className="text-3xl font-black text-white font-mono">
                {result.totalTestDays} kỳ
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Không rò rỉ dữ liệu tương lai.
              </p>
            </div>
          </div>

          {/* Detailed Verification Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Chi Tiết Từng Kỳ Quay Thử Nghiệm Đối Chiếu Kết Quả Thực Tế
            </h3>

            <div className="overflow-x-auto scrollbar-thin max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-950 z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2 px-3">Kỳ Quay Ngày</th>
                    <th className="py-2 px-3">Số Trúng Thực Tế</th>
                    <th className="py-2 px-3">Số Dự Đoán #1</th>
                    <th className="py-2 px-3">Nằm trong Top 10</th>
                    <th className="py-2 px-3">Nằm trong Top 20</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.testResults.map(item => (
                    <tr key={item.date} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-2 px-3 text-slate-300">{item.date}</td>
                      <td className="py-2 px-3 font-black text-amber-400 text-sm">{item.actualNumT1}</td>
                      <td className="py-2 px-3 text-slate-400">{item.topPredNum}</td>
                      <td className="py-2 px-3">
                        {item.hitT1_10 ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ăn Top 10
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Xịt
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {item.hitT1_20 ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ăn Top 20
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Xịt
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
