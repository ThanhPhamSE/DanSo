import React, { useState, useMemo } from 'react';
import { Layers, CheckCircle2, XCircle, Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Sparkles } from 'lucide-react';

export default function MultiSetManager({
  multiSetAnalysis,
  activeSetId,
  onSelectActiveSet
}) {
  // Filter & Search & Pagination states
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'hit', 'miss'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'hitRate', 'gan', 'maxGan', 'status'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filtered & Sorted Multi-Set List
  const processedList = useMemo(() => {
    if (!multiSetAnalysis) return [];

    let list = multiSetAnalysis.filter(item => {
      if (filterMode === 'hit' && !item.todayResult.isHit) return false;
      if (filterMode === 'miss' && item.todayResult.isHit) return false;
      if (searchTerm) {
        const matchName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchNum = item.numbers.some(n => n.includes(searchTerm));
        return matchName || matchNum;
      }
      return true;
    });

    if (sortBy === 'hitRate') {
      list.sort((a, b) => (b.stats?.hitRatePercent || 0) - (a.stats?.hitRatePercent || 0));
    } else if (sortBy === 'gan') {
      list.sort((a, b) => (b.stats?.currentGan || 0) - (a.stats?.currentGan || 0));
    } else if (sortBy === 'maxGan') {
      list.sort((a, b) => (b.stats?.maxGan || 0) - (a.stats?.maxGan || 0));
    } else if (sortBy === 'status') {
      list.sort((a, b) => (b.todayResult.isHit ? 1 : 0) - (a.todayResult.isHit ? 1 : 0));
    }

    return list;
  }, [multiSetAnalysis, filterMode, searchTerm, sortBy]);

  const totalPages = Math.ceil(processedList.length / pageSize) || 1;
  const paginatedList = processedList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hitCountTotal = multiSetAnalysis?.filter(s => s.todayResult.isHit).length || 0;
  const missCountTotal = (multiSetAnalysis?.length || 0) - hitCountTotal;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Bảng Tổng Hợp Kết Quả Tất Cả Các Dàn ({multiSetAnalysis?.length || 0} Dàn)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
              {hitCountTotal} VỀ / {missCountTotal} XỊT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Xem rõ từng dàn có VỀ hay XỊT hôm nay | Bấm "Soi chi tiết" để xem Biểu đồ Gan & Tỉ lệ 5 Năm gần đây của riêng dàn đó
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => { setFilterMode('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({multiSetAnalysis?.length || 0})
          </button>
          <button
            onClick={() => { setFilterMode('hit'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterMode === 'hit' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            🟢 Chỉ Dàn VỀ ({hitCountTotal})
          </button>
          <button
            onClick={() => { setFilterMode('miss'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterMode === 'miss' ? 'bg-rose-500 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-rose-400'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            🔴 Chỉ Dàn XỊT ({missCountTotal})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm tên dàn hoặc số..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="default" className="bg-slate-900">Theo thứ tự nhập</option>
              <option value="status" className="bg-slate-900">Xếp Dàn VỀ trước</option>
              <option value="hitRate" className="bg-slate-900">Tỉ lệ trúng cao nhất</option>
              <option value="gan" className="bg-slate-900">Gan hiện tại cao nhất</option>
              <option value="maxGan" className="bg-slate-900">Gan Max lớn nhất</option>
            </select>
          </div>
        </div>

      </div>

      {/* Multi-Set Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Tên Dàn Số</th>
              <th className="py-3 px-4">Số Lượng Số</th>
              <th className="py-3 px-4">KẾT QUẢ HÔM NAY</th>
              <th className="py-3 px-4">Tỉ Lệ Trúng (100d)</th>
              <th className="py-3 px-4">Gan Hiện Tại</th>
              <th className="py-3 px-4">Gan Max</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedList.length > 0 ? (
              paginatedList.map((item) => {
                const isActive = item.id === activeSetId;
                const stats = item.stats;
                const todayHit = item.todayResult.isHit;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-900/80 transition-all ${
                      isActive ? 'bg-amber-500/[0.08] border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{item.name}</span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Đang soi
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                        {item.numbers.slice(0, 10).join(', ')}{item.numbers.length > 10 ? '...' : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                      {item.count} số
                    </td>

                    {/* Clear VỀ / XỊT Labels */}
                    <td className="py-3.5 px-4">
                      {todayHit ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/40 text-xs shadow-sm shadow-emerald-500/10">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                          🎯 VỀ (SỐ {item.todayResult.hits.join(', ')})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/40 text-xs">
                          <XCircle className="w-4 h-4 text-rose-400" />
                          ❌ XỊT (Gan {stats?.currentGan} ngày)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <strong className="text-emerald-400 text-sm font-extrabold">
                        {stats?.hitRatePercent}%
                      </strong>
                      <div className="text-[10px] text-slate-400">({stats?.hitDaysCount}/{stats?.totalDays} ngày)</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={`font-bold ${stats?.currentGan >= 4 ? 'text-rose-400 font-black animate-pulse' : stats?.currentGan > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {stats?.currentGan} ngày
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <strong className="text-rose-400 font-bold">
                        {stats?.maxGan} ngày
                      </strong>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onSelectActiveSet(item.id)}
                        className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1 transition-all mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Soi chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  Vui lòng dán danh sách các dàn số vào ô nhập phía trên.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-2">
        <div>
          Trang <strong className="text-white">{currentPage}</strong> / {totalPages} (Tổng {processedList.length} dàn)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
