import React, { useState } from 'react';
import { History, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight, Copy, Check, TrendingDown, BarChart2 } from 'lucide-react';

export default function HistoryTable({ historyDetails, mode, stats }) {
  const [filterMode, setFilterMode] = useState('all');
  const [searchTerm, setSearchTerm]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const pageSize = 30;

  if (!historyDetails || historyDetails.length === 0) return null;

  const totalHits   = historyDetails.filter(d => d.isHit).length;
  const totalMisses = historyDetails.filter(d => !d.isHit).length;

  const filteredItems = historyDetails.filter(item => {
    if (filterMode === 'hit'  && !item.isHit) return false;
    if (filterMode === 'miss' &&  item.isHit) return false;
    if (searchTerm) {
      return (
        item.date.includes(searchTerm) ||
        item.db.includes(searchTerm) ||
        item.dayHits?.some(n => n.includes(searchTerm))
      );
    }
    return true;
  });

  const totalPages    = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopy = () => {
    const total = historyDetails.length;
    const hits  = historyDetails.filter(d => d.isHit).length;
    const rate  = ((hits / total) * 100).toFixed(2);
    const last10 = historyDetails.slice(0, 10)
      .map(d => `${d.date}: ${d.isHit ? '🎯 ĂN (' + d.dayHits.join(',') + ')' : '❌ XỊT'}`)
      .join('\n');
    navigator.clipboard.writeText(
      `📊 BÁO CÁO DÀN 5X XSMB\n- Tổng: ${total} ngày | Trúng: ${hits} ngày | Tỉ lệ: ${rate}%\n\n10 KỲ GẦN NHẤT:\n${last10}`
    );
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-5">

      {/* ── Stat banner ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-3 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 font-semibold">Tổng kỳ quay</div>
          <div className="text-xl font-extrabold text-white font-mono">{historyDetails.length}</div>
        </div>
        <div className="glass-card rounded-xl p-3 border border-emerald-800/40 bg-emerald-500/[0.03] text-center">
          <div className="text-[10px] text-emerald-400 font-semibold">Số ngày ĂN</div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">{totalHits}</div>
        </div>
        <div className="glass-card rounded-xl p-3 border border-rose-800/40 bg-rose-500/[0.03] text-center">
          <div className="text-[10px] text-rose-400 font-semibold">Số ngày XỊT</div>
          <div className="text-xl font-extrabold text-rose-400 font-mono">{totalMisses}</div>
        </div>
        <div className="glass-card rounded-xl p-3 border border-amber-800/40 bg-amber-500/[0.03] text-center">
          <div className="text-[10px] text-amber-400 font-semibold">Tỉ Lệ Trúng</div>
          <div className="text-xl font-extrabold text-amber-400 font-mono">
            {historyDetails.length > 0 ? ((totalHits / historyDetails.length) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* ── Max Gan row ────────────────────────────────────────── */}
      {stats?.maxGanPeriod && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-950/50 border border-rose-800/40 p-3">
          <TrendingDown className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-rose-300 font-bold uppercase">Max Gan (Gan dài nhất): </span>
            <span className="text-sm font-extrabold text-rose-300 font-mono">{stats.maxGanPeriod.maxGan} ngày xịt liên tiếp</span>
            <span className="text-[11px] text-rose-400/70 ml-2 font-mono">
              ({stats.maxGanPeriod.startDate} → {stats.maxGanPeriod.endDate})
            </span>
          </div>
        </div>
      )}

      {/* ── Controls ───────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Nhật Ký Kết Quả Chi Tiết Theo Ngày
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex text-xs font-bold">
              <button onClick={() => { setFilterMode('all');  setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'all'  ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                Tất Cả ({historyDetails.length})
              </button>
              <button onClick={() => { setFilterMode('hit');  setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'hit'  ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                ĂN ({totalHits})
              </button>
              <button onClick={() => { setFilterMode('miss'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'miss' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                XỊT ({totalMisses})
              </button>
            </div>

            <button onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all">
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSummary ? 'Đã copy!' : 'Copy Báo Cáo'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo ngày (YYYY-MM-DD) hoặc số (ví dụ: 37)..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none" />
        </div>

        {/* ── TKB-STYLE TABLE ─────────────────────────────────── */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 font-bold">
                <th className="py-3 px-3 w-8 text-center">#</th>
                <th className="py-3 px-3 min-w-[100px]">Ngày Quay</th>
                <th className="py-3 px-3 text-center min-w-[60px]">Giải ĐB</th>
                <th className="py-3 px-3 text-center min-w-[90px]">Kết Quả</th>
                <th className="py-3 px-3 text-center min-w-[80px]">Gan tại thời điểm</th>
                <th className="py-3 px-3 min-w-[80px]">Số ĂN trong dàn</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? paginatedItems.map((item, idx) => {
                const rowNum = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr key={item.date}
                    className={`border-b transition-colors ${
                      item.isHit
                        ? 'bg-emerald-500/10 border-emerald-900/40 hover:bg-emerald-500/15'
                        : idx % 2 === 0
                          ? 'bg-slate-950 border-slate-800/60 hover:bg-slate-900/60'
                          : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/70'
                    }`}>

                    {/* Row number */}
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{rowNum}</td>

                    {/* Date */}
                    <td className="py-2.5 px-3 font-bold text-slate-300 font-mono whitespace-nowrap">{item.date}</td>

                    {/* DB number */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-base font-extrabold font-mono tracking-wider ${item.isHit ? 'text-emerald-300' : 'text-amber-400'}`}>
                        {item.db}
                      </span>
                    </td>

                    {/* Status badge — TKB ĂN / XỊT style */}
                    <td className="py-2 px-3 text-center">
                      {item.isHit ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 text-white font-extrabold text-[11px] shadow-sm shadow-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> ĂN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-700 text-rose-100 font-extrabold text-[11px]">
                          <XCircle className="w-3 h-3" /> XỊT
                        </span>
                      )}
                    </td>

                    {/* Gan streak */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {item.ganAtDay > 0 ? (
                        <span className={`${item.ganAtDay >= 7 ? 'text-rose-400' : item.ganAtDay >= 4 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {item.ganAtDay} ngày
                        </span>
                      ) : (
                        <span className="text-emerald-400">NỔ</span>
                      )}
                    </td>

                    {/* Hit numbers */}
                    <td className="py-2.5 px-3">
                      {item.isHit ? (
                        <div className="flex flex-wrap gap-1">
                          {item.dayHits.map((num, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 font-mono text-[11px]">
                              {num}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-700 italic">---</span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-500">Không có kết quả phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400 font-medium">
          <div>
            Trang <strong className="text-slate-200">{currentPage}</strong> / {totalPages}
            <span className="ml-2 text-slate-500">({filteredItems.length} kết quả)</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = i + 1;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
                  }`}>
                  {page}
                </button>
              );
            })}
            {totalPages > 7 && <span className="text-slate-600">...</span>}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
