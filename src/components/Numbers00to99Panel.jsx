import React, { useState, useMemo } from 'react';
import { Grid, Flame, Snowflake, Clock, Filter, Search, ArrowUpDown, CheckCircle, Copy, Check } from 'lucide-react';
import { analyzeNumbers00to99 } from '../utils/lotteryEngine';

export default function Numbers00to99Panel({ historyData, mode = 'de', onAddNumberToInput }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'hot' | 'cold' | 'gan' | 'dau' | 'duoi' | 'tong'
  const [filterValue, setFilterValue] = useState(0); // 0-9 for dau, duoi, tong
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNum, setSelectedNum] = useState(null);
  const [copied, setCopied] = useState(false);

  // Analysis of all 100 numbers
  const allNumbersStats = useMemo(() => {
    return analyzeNumbers00to99(historyData, mode, 'all');
  }, [historyData, mode]);

  // Filtered numbers
  const filteredList = useMemo(() => {
    let list = [...allNumbersStats];

    if (filterType === 'hot') {
      list = list.filter(item => item.status === 'hot').slice(0, 30);
    } else if (filterType === 'cold') {
      list = list.filter(item => item.status === 'cold').slice(0, 30);
    } else if (filterType === 'gan') {
      list.sort((a, b) => b.currentGan - a.currentGan);
      list = list.slice(0, 30);
    } else if (filterType === 'dau') {
      list = list.filter(item => parseInt(item.num[0], 10) === filterValue);
    } else if (filterType === 'duoi') {
      list = list.filter(item => parseInt(item.num[1], 10) === filterValue);
    } else if (filterType === 'tong') {
      list = list.filter(item => (parseInt(item.num[0], 10) + parseInt(item.num[1], 10)) % 10 === filterValue);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim();
      list = list.filter(item => item.num.includes(q));
    }

    return list;
  }, [allNumbersStats, filterType, filterValue, searchTerm]);

  // Selected number details
  const activeDetail = useMemo(() => {
    if (!selectedNum) return allNumbersStats[0] || null;
    return allNumbersStats.find(n => n.num === selectedNum) || null;
  }, [allNumbersStats, selectedNum]);

  const modeTitle = mode === 'g1' ? 'Giải Nhất (G1)' : (mode === 'de' ? 'Giải Đặc Biệt (ĐB)' : 'Lô (27 Giải)');

  const handleCopyNumbers = (nums) => {
    const text = nums.map(n => n.num).join(',');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Grid className="w-4 h-4" />
            Thống kê Tần Suất & Gan Chu Kỳ (00 - 99)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Phân Tích Chi Tiết 100 Con Số — <span className="text-amber-400">{modeTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dữ liệu tổng hợp từ hơn 7.600 kỳ quay: Tần suất xuất hiện, Chu kỳ trung bình, Gan hiện tại và Gan Max.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopyNumbers(filteredList)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copied ? 'Đã sao chép' : `Sao chép ${filteredList.length} số`}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterType === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Tất Cả (00-99)
            </button>
            <button
              onClick={() => setFilterType('hot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                filterType === 'hot'
                  ? 'bg-rose-500 text-white border-rose-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-rose-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Top Hay Về (Hot)
            </button>
            <button
              onClick={() => setFilterType('cold')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                filterType === 'cold'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-cyan-400'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
              Top Ít Về (Cold)
            </button>
            <button
              onClick={() => setFilterType('gan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                filterType === 'gan'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Top Gan Lâu Nhất
            </button>
            <button
              onClick={() => setFilterType('dau')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterType === 'dau'
                  ? 'bg-violet-500 text-white border-violet-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Lọc Theo Đầu
            </button>
            <button
              onClick={() => setFilterType('duoi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterType === 'duoi'
                  ? 'bg-violet-500 text-white border-violet-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Lọc Theo Đuôi
            </button>
            <button
              onClick={() => setFilterType('tong')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterType === 'tong'
                  ? 'bg-violet-500 text-white border-violet-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Lọc Theo Tổng
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm số (00-99)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* 0-9 Selector subrow when Dau, Duoi or Tong is chosen */}
        {['dau', 'duoi', 'tong'].includes(filterType) && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold uppercase mr-2">
              Chọn {filterType === 'dau' ? 'Đầu' : (filterType === 'duoi' ? 'Đuôi' : 'Tổng')}:
            </span>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => setFilterValue(num)}
                className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${
                  filterValue === num
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layout: Numbers Grid + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Numbers Cards Grid */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Hiển thị: <strong className="text-white">{filteredList.length} con số</strong> (Click vào số để xem chi tiết)
            </span>
            <span className="text-[11px] text-slate-500">Màu viền: Đỏ = Hot, Xanh lá = Gan thấp, Vàng = Gan cao</span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {filteredList.map(item => {
              const isSelected = activeDetail?.num === item.num;
              let borderClass = 'border-slate-800 bg-slate-900/60 hover:border-slate-700';
              if (item.status === 'hot') borderClass = 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500';
              else if (item.status === 'gan_high') borderClass = 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500';
              else if (item.currentGan === 0) borderClass = 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500';

              if (isSelected) {
                borderClass = 'ring-2 ring-amber-400 bg-amber-500/20 border-amber-400';
              }

              return (
                <button
                  key={item.num}
                  onClick={() => setSelectedNum(item.num)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${borderClass}`}
                >
                  <span className="font-mono font-black text-sm text-white">{item.num}</span>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                    G:{item.currentGan}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Active Number Detail Inspector */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Hồ sơ thống kê số</span>
              {activeDetail?.status === 'hot' && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                  🔥 Đang Nổ Nhiều
                </span>
              )}
              {activeDetail?.status === 'gan_high' && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  ⏳ Đang Gan Cao
                </span>
              )}
              {activeDetail?.currentGan === 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  ✨ Vừa Nổ Hôm Qua
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black font-mono text-3xl shadow-lg">
                {activeDetail?.num || '--'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Số {activeDetail?.num}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Đầu {activeDetail?.num[0]} • Đuôi {activeDetail?.num[1]} • Tổng {(parseInt(activeDetail?.num[0] || '0') + parseInt(activeDetail?.num[1] || '0')) % 10}
                </p>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Về gần nhất: <strong className="text-slate-200">{activeDetail?.lastSeenDate || '---'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Metric list */}
          <div className="space-y-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Tổng số lần xuất hiện:</span>
              <strong className="text-white font-mono text-sm">{activeDetail?.count.toLocaleString()} lần</strong>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Tần suất xuất hiện:</span>
              <strong className="text-amber-400 font-mono text-sm">{activeDetail?.hitRate}%</strong>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Gan hiện tại:</span>
              <div className="text-right">
                <span className={`font-mono text-sm font-bold ${activeDetail?.currentGan > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeDetail?.currentGan} ngày
                </span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Gan Max lịch sử:</span>
              <strong className="text-rose-400 font-mono text-sm">{activeDetail?.maxGan} ngày</strong>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Chu kỳ xuất hiện trung bình:</span>
              <strong className="text-cyan-400 font-mono text-sm">{activeDetail?.avgCycle} ngày/lần</strong>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Độ lệch chuẩn (Z-Score):</span>
              <strong className="text-slate-300 font-mono text-sm">{activeDetail?.zScore}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
