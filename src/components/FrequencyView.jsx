import React, { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, Search, ArrowUpDown, Flame, Snowflake, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { analyzeFrequency } from '../analytics/frequencyService';

export default function FrequencyView({ historyData, mode = 'de' }) {
  const [timeWindow, setTimeWindow] = useState('30'); // '7' | '30' | '60' | '90' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('hits'); // 'num' | 'hits' | 'rate'
  const [sortDir, setSortDir] = useState('desc');

  const freqList = useMemo(() => {
    return analyzeFrequency(historyData, mode);
  }, [historyData, mode]);

  // Prepared data based on time window
  const processedList = useMemo(() => {
    let list = freqList.map(item => {
      let hits = item.totalHits;
      let rate = item.rateAll;
      if (timeWindow === '7') { hits = item.hits7; rate = ((item.hits7 / 7) * 100).toFixed(1); }
      else if (timeWindow === '30') { hits = item.hits30; rate = item.rate30; }
      else if (timeWindow === '60') { hits = item.hits60; rate = ((item.hits60 / 60) * 100).toFixed(1); }
      else if (timeWindow === '90') { hits = item.hits90; rate = item.rate90; }

      return {
        ...item,
        currentHits: hits,
        currentRate: parseFloat(rate)
      };
    });

    if (searchTerm.trim()) {
      list = list.filter(item => item.num.includes(searchTerm.trim()));
    }

    list.sort((a, b) => {
      let valA = sortField === 'num' ? parseInt(a.num, 10) : (sortField === 'rate' ? a.currentRate : a.currentHits);
      let valB = sortField === 'num' ? parseInt(b.num, 10) : (sortField === 'rate' ? b.currentRate : b.currentHits);
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [freqList, timeWindow, searchTerm, sortField, sortDir]);

  // Top 15 chart data
  const chartData = useMemo(() => {
    return [...processedList]
      .sort((a, b) => b.currentHits - a.currentHits)
      .slice(0, 15)
      .map(item => ({
        num: item.num,
        hits: item.currentHits
      }));
  }, [processedList]);

  const modeTitle = mode === 'g1' ? 'Giải Nhất (G1)' : 'Giải Đặc Biệt (ĐB)';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <BarChart2 className="w-4 h-4" />
            Phân Tích Tần Suất Xuất Hiện
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Tần Suất 100 Con Số — <span className="text-amber-400">{modeTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            So sánh số lần nổ và tỷ lệ xuất hiện theo các khung thời gian 7, 30, 60, 90 ngày và toàn bộ lịch sử từ 2010.
          </p>
        </div>

        {/* Time Window Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: '7', label: '7 Ngày' },
            { id: '30', label: '30 Ngày' },
            { id: '60', label: '60 Ngày' },
            { id: '90', label: '90 Ngày' },
            { id: 'all', label: 'Toàn Bộ (Từ 2010)' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTimeWindow(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeWindow === opt.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          Biểu Đồ Top 15 Con Số Nổ Nhiều Nhất ({timeWindow === 'all' ? 'Toàn bộ lịch sử' : `${timeWindow} ngày qua`})
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="num" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(num) => `Con số: ${num}`}
                formatter={(val) => [`${val} lần nổ`, 'Tần suất']}
              />
              <Bar dataKey="hits" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm con số (00-99)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Sắp xếp:</span>
            <button
              onClick={() => {
                if (sortField === 'hits') setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                else { setSortField('hits'); setSortDir('desc'); }
              }}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:text-white font-bold flex items-center gap-1"
            >
              Số lần nổ <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (sortField === 'num') setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                else { setSortField('num'); setSortDir('asc'); }
              }}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:text-white font-bold flex items-center gap-1"
            >
              Con số <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Full Table */}
        <div className="overflow-x-auto scrollbar-thin max-h-[600px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Con Số</th>
                <th className="py-2.5 px-3">Số Lần Nổ ({timeWindow === 'all' ? 'Lịch sử' : `${timeWindow}d`})</th>
                <th className="py-2.5 px-3">Tỷ Lệ (%)</th>
                <th className="py-2.5 px-3">Nổ 7d</th>
                <th className="py-2.5 px-3">Nổ 30d</th>
                <th className="py-2.5 px-3">Nổ 60d</th>
                <th className="py-2.5 px-3">Nổ 90d</th>
                <th className="py-2.5 px-3">Tổng Từ 2010</th>
                <th className="py-2.5 px-3">Xu Hướng (30d vs All)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {processedList.map(item => (
                <tr key={item.num} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-2.5 px-3 font-black text-amber-400 text-sm">{item.num}</td>
                  <td className="py-2.5 px-3 font-bold text-white">{item.currentHits} lần</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{item.currentRate}%</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.hits7}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{item.hits30}</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.hits60}</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.hits90}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-bold">{item.totalHits}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.trend === 'rising' ? 'bg-rose-500/20 text-rose-300' :
                      item.trend === 'falling' ? 'bg-cyan-500/20 text-cyan-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {item.trend === 'rising' ? `🔥 Tăng (+${item.trendDiff}%)` :
                       item.trend === 'falling' ? `❄️ Giảm (${item.trendDiff}%)` : 'Bình thường'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
