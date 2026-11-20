import React, { useState, useMemo } from 'react';
import { History, Search, Calendar, Filter } from 'lucide-react';

export default function HistoryResultView({ historyData, mode = 'de' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');

  const years = useMemo(() => {
    const set = new Set();
    historyData.forEach(d => set.add(d.d.substring(0, 4)));
    return Array.from(set).sort().reverse();
  }, [historyData]);

  const filtered = useMemo(() => {
    let list = historyData;

    if (yearFilter !== 'all') {
      list = list.filter(d => d.d.startsWith(yearFilter));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim();
      list = list.filter(d => (
        d.d.includes(q) ||
        (d.db && d.db.includes(q)) ||
        (d.g1 && d.g1.includes(q)) ||
        (d.sp && d.sp.includes(q)) ||
        (d.fp && d.fp.includes(q))
      ));
    }

    return list;
  }, [historyData, yearFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <History className="w-4 h-4" />
            Nhật Ký Kết Quả Xổ Số Lịch Sử (Từ 2010 Đến Nay)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Tra Cứu Kết Quả Giải Đặc Biệt & Giải Nhất
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Toàn bộ {historyData.length.toLocaleString()} kỳ quay lịch sử được chuẩn hóa, bảo toàn đủ 5 chữ số và 2 chữ số đuôi.
          </p>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Lọc theo năm:</span>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono font-bold"
          >
            <option value="all">Tất cả các năm ({years[years.length - 1]} - {years[0]})</option>
            {years.map(y => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo ngày (YYYY-MM-DD) hoặc số trúng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <span className="text-xs text-slate-400">
          Hiển thị: <strong className="text-white font-mono">{filtered.length.toLocaleString()}</strong> kỳ quay
        </span>
      </div>

      {/* History Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="overflow-x-auto scrollbar-thin max-h-[700px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Kỳ Quay Ngày</th>
                <th className="py-2.5 px-3">Đặc Biệt (5 Số)</th>
                <th className="py-2.5 px-3">2 Số Đầu ĐB</th>
                <th className="py-2.5 px-3">2 Số Đuôi ĐB</th>
                <th className="py-2.5 px-3">Giải Nhất (5 Số)</th>
                <th className="py-2.5 px-3">2 Số Đầu G1</th>
                <th className="py-2.5 px-3">2 Số Đuôi G1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map(row => {
                const sp = String(row.sp || '');
                const fp = String(row.fp || '');
                const dbHead = sp.length === 5 ? sp.slice(0, 2) : '--';
                const dbTail = sp.length === 5 ? sp.slice(-2) : (row.db || '--');
                const g1Head = fp.length === 5 ? fp.slice(0, 2) : '--';
                const g1Tail = fp.length === 5 ? fp.slice(-2) : (row.g1 || '--');

                return (
                  <tr key={row.d} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300 font-bold">{row.d}</td>
                    <td className="py-2.5 px-3 text-slate-400">{sp || '---'}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-300">{dbHead}</td>
                    <td className="py-2.5 px-3 font-black text-amber-400 text-sm">{dbTail}</td>
                    <td className="py-2.5 px-3 text-slate-400">{fp || '---'}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-300">{g1Head}</td>
                    <td className="py-2.5 px-3 font-black text-emerald-400 text-sm">{g1Tail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
