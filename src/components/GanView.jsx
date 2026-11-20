import React, { useState, useMemo } from 'react';
import { Clock, Filter, AlertTriangle, ShieldCheck, Search, ArrowUpDown } from 'lucide-react';
import { analyzeGan } from '../analytics/ganService';

export default function GanView({ historyData, mode = 'de' }) {
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'low' | 'normal' | 'high' | 'historic_max'
  const [minGanFilter, setMinGanFilter] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const ganList = useMemo(() => {
    return analyzeGan(historyData, mode);
  }, [historyData, mode]);

  const filteredList = useMemo(() => {
    let list = [...ganList];

    if (categoryFilter !== 'all') {
      list = list.filter(item => item.category === categoryFilter);
    }

    if (minGanFilter > 0) {
      list = list.filter(item => item.currentGan >= minGanFilter);
    }

    if (searchTerm.trim()) {
      list = list.filter(item => item.num.includes(searchTerm.trim()));
    }

    return list;
  }, [ganList, categoryFilter, minGanFilter, searchTerm]);

  const modeTitle = mode === 'g1' ? 'Giải Nhất (G1)' : 'Giải Đặc Biệt (ĐB)';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            Phân Tích Gan & Số Ngày Chưa Xuất Hiện
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Thống Kê Gan Chuyên Sâu — <span className="text-amber-400">{modeTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Đo lường chính xác số ngày chưa về, Gan trung bình, Gan cực đại và các mốc tiệm cận lịch sử từ 2010.
          </p>
        </div>
      </div>

      {/* Threshold Filter Controls */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                categoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Tất Cả (00-99)
            </button>
            <button
              onClick={() => setCategoryFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                categoryFilter === 'low'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-emerald-400'
              }`}
            >
              Gan Thấp (Vừa nổ)
            </button>
            <button
              onClick={() => setCategoryFilter('normal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                categoryFilter === 'normal'
                  ? 'bg-slate-800 text-white border-slate-700 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Gan Bình Thường
            </button>
            <button
              onClick={() => setCategoryFilter('high')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                categoryFilter === 'high'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-400'
              }`}
            >
              Gan Cao (&gt; 1.5x Gan TB)
            </button>
            <button
              onClick={() => setCategoryFilter('historic_max')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                categoryFilter === 'historic_max'
                  ? 'bg-rose-500 text-white border-rose-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-rose-400'
              }`}
            >
              Vượt Đỉnh Gan Max Lịch Sử
            </button>
          </div>

          {/* Custom Min Gan Slider/Input */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Ngưỡng Gan tối thiểu:</span>
            <input
              type="number"
              min="0"
              max="200"
              value={minGanFilter}
              onChange={(e) => setMinGanFilter(parseInt(e.target.value, 10) || 0)}
              className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-1 text-white font-mono text-center"
            />
            <span>ngày</span>
          </div>
        </div>
      </div>

      {/* Gan Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Tìm thấy: <strong className="text-white">{filteredList.length} con số</strong></span>
          <span className="text-[11px] text-slate-500">Sắp xếp tự động từ Gan cao nhất đến thấp nhất</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin max-h-[600px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Con Số</th>
                <th className="py-2.5 px-3">Gan Hiện Tại</th>
                <th className="py-2.5 px-3">Phân Loại Trạng Thái</th>
                <th className="py-2.5 px-3">Gan Trung Bình</th>
                <th className="py-2.5 px-3">Gan Cực Đại (Max)</th>
                <th className="py-2.5 px-3">Giai Đoạn Gan Max</th>
                <th className="py-2.5 px-3">Lần Vượt Gan TB</th>
                <th className="py-2.5 px-3">Ngày Về Gần Nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredList.map(item => (
                <tr key={item.num} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-2.5 px-3 font-black text-amber-400 text-sm">{item.num}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-sm font-bold ${
                      item.currentGan > 50 ? 'text-rose-400' :
                      item.currentGan > 25 ? 'text-amber-400' :
                      item.currentGan === 0 ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {item.currentGan} ngày
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.category === 'historic_max' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      item.category === 'high' ? 'bg-amber-500/20 text-amber-300' :
                      item.category === 'low' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {item.categoryLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{item.avgGan} ngày</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">{item.maxGan} ngày</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.maxGanPeriod}</td>
                  <td className="py-2.5 px-3 text-slate-300">{item.timesExceededAvg} lần</td>
                  <td className="py-2.5 px-3 text-cyan-300">{item.lastHitDate || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
