import React, { useState } from 'react';
import { Sparkles, RefreshCw, BarChart2, BookOpen, ShieldCheck, Zap } from 'lucide-react';

export default function Header({ totalRecords, latestDate, onRefresh, isRefreshing }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
            5X
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Soi Cầu <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">Dàn 5X XSMB</span>
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hidden sm:inline-block">
                PRO 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Hệ thống phân tích tỉ lệ, tính Gan Max & Quản lý vốn chuyên nghiệp
            </p>
          </div>
        </div>

        {/* Data Badge & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Latest Data Badge */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-right hidden md:block">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Cơ sở dữ liệu XSMB
            </div>
            <div className="text-xs font-bold text-slate-200 font-mono">
              {latestDate || '---'} ({totalRecords ? totalRecords.toLocaleString() : 0} kỳ quay)
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Cập nhật kết quả XSMB mới nhất"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Đang tải...' : 'Cập nhật KQXS'}</span>
          </button>

          {/* User Guide Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"
            >
              ✕
            </button>
            <div className="flex items-center gap-2.5 mb-4 text-amber-400 font-bold text-lg border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-amber-400" />
              Hướng Dẫn Sử Dụng Phần Mềm Soi Cầu Dàn 5X
            </div>
            
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-bold text-amber-300 mb-1">1. Dàn 5X là gì?</h4>
                <p className="text-xs text-slate-400">
                  Dàn 5X là tập hợp gồm khoảng 50 đến 59 số (chiếm hơn 50% tổng số 100 con số từ 00 đến 99). Tỉ lệ trúng lý thuyết cho đề là ~50-56%.
                </p>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-bold text-amber-300 mb-1">2. Các chỉ số Soi Cầu quan trọng:</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                  <li><strong className="text-emerald-400">Tỉ lệ trúng (%):</strong> Tỉ lệ phần trăm nổ của dàn trong khoảng thời gian đã chọn.</li>
                  <li><strong className="text-amber-400">Gan Hiện Tại:</strong> Số ngày liên tiếp dàn CHƯA VỀ kể từ kỳ quay gần nhất.</li>
                  <li><strong className="text-rose-400">Gan Max (Gan Cực Đại):</strong> Chuỗi ngày xịt liên tục DÀI NHẤT trong lịch sử. Giúp người nuôi dàn tính toán lượng vốn dự phòng chống cháy tài khoản.</li>
                  <li><strong className="text-cyan-400">Chuỗi Ăn Max:</strong> Chuỗi ngày trúng liên tục dài nhất.</li>
                </ul>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-bold text-amber-300 mb-1">3. Giả lập vào tiền & Quản lý vốn:</h4>
                <p className="text-xs text-slate-400">
                  Hệ thống tự động mô phỏng dòng tiền lãi/lỗ theo 3 chiến thuật: Vào tiền đều, Gấp thếp (Martingale), hoặc Khung 3 ngày (1-2-4) giúp chọn phương án tối ưu lợi nhuận.
                </p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setShowHelp(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all"
              >
                Đã hiểu & Bắt đầu
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
