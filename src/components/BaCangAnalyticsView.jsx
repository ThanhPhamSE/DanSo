import React, { useState, useMemo } from 'react';
import {
  Sparkles, TrendingUp, Clock, Award, ShieldCheck, Flame, Copy, Check,
  Search, RefreshCw, BarChart2, PieChart, Layers, HelpCircle, CheckCircle2,
  XCircle, Filter, ArrowRight, Hash, Compass, Binary
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell
} from 'recharts';
import {
  extract3Cang,
  extractCangDigit,
  analyzeCangDigits,
  analyze3CangPatterns,
  analyze3CangSums,
  analyzeTop3CangRankings,
  searchSingle3Cang,
  evaluateCustom3CangSet,
  generate3CangFromMultiplication
} from '../analytics/baCangService';
import { parseNumberSet } from '../utils/lotteryEngine';

export default function BaCangAnalyticsView({ historyData = [] }) {
  const [target, setTarget] = useState('db'); // 'db' (Đặc Biệt) | 'g1' (Giải Nhất)
  const [activeSubTab, setActiveSubTab] = useState('cang_digits'); // 'cang_digits' | 'patterns' | 'sums' | 'rankings' | 'search' | 'builder'

  // Single search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Builder states (Ghép Càng x 2D)
  const [selectedCangs, setSelectedCangs] = useState(new Set([1, 3, 7]));
  const [input2DNumbers, setInput2DNumbers] = useState('02, 07, 12, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79');
  const [custom3CangCopied, setCustom3CangCopied] = useState(false);

  // Main analyses for current target
  const cangAnalysis = useMemo(() => analyzeCangDigits(historyData, target), [historyData, target]);
  const patternsAnalysis = useMemo(() => analyze3CangPatterns(historyData, target), [historyData, target]);
  const sumsAnalysis = useMemo(() => analyze3CangSums(historyData, target), [historyData, target]);
  const rankingsAnalysis = useMemo(() => analyzeTop3CangRankings(historyData, target), [historyData, target]);

  // Handler: Single 3 càng search
  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    const res = searchSingle3Cang(searchQuery, historyData, target);
    setSearchResult(res);
  };

  // Toggle Càng digit selection in builder
  const toggleCangSelect = (digit) => {
    const next = new Set(selectedCangs);
    if (next.has(digit)) next.delete(digit);
    else next.add(digit);
    setSelectedCangs(next);
  };

  // Generated 3 càng set from builder
  const generated3CangList = useMemo(() => {
    const nums2D = parseNumberSet(input2DNumbers);
    const cangsArr = Array.from(selectedCangs);
    return generate3CangFromMultiplication(cangsArr, nums2D);
  }, [selectedCangs, input2DNumbers]);

  // Evaluate generated 3 càng set
  const generatedStats = useMemo(() => {
    if (generated3CangList.length === 0) return null;
    return evaluateCustom3CangSet(generated3CangList, historyData, target);
  }, [generated3CangList, historyData, target]);

  // Copy generated 3 càng list
  const handleCopyGenerated = () => {
    if (generated3CangList.length === 0) return;
    navigator.clipboard.writeText(generated3CangList.join(', '));
    setCustom3CangCopied(true);
    setTimeout(() => setCustom3CangCopied(false), 2000);
  };

  const targetTitle = target === 'db' ? '3 CÀNG GIẢI ĐẶC BIỆT' : '3 CÀNG GIẢI NHẤT';
  const targetShort = target === 'db' ? 'Đặc Biệt (ĐB)' : 'Giải Nhất (G1)';

  return (
    <div className="space-y-6">

      {/* 1. HERO TARGET & BANNER */}
      <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                HỆ THỐNG PHÂN TÍCH XÁC SUẤT 3 CÀNG TOÀN DIỆN
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                Dữ Liệu Lịch Sử 16 Năm (2010 - 2026)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Phân Tích Tỷ Lệ & Xác Suất <span className="text-amber-400">{targetTitle}</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Khảo sát toàn bộ 1.000 con số 3 càng (000 – 999) và 10 chữ số Càng (0 – 9). Đánh giá tần suất, chu kỳ gan, phân bố Chẵn/Lẻ, Tài/Xỉu, dạng Kép, Tam Hoa, tổng 3 càng và bộ ghép càng thông minh.
            </p>
          </div>

          {/* Toggle Target: DB or G1 */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => { setTarget('db'); setSearchResult(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                target === 'db'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎯</span>
              <span>3 Càng Đặc Biệt</span>
            </button>

            <button
              onClick={() => { setTarget('g1'); setSearchResult(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                target === 'g1'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🥇</span>
              <span>3 Càng Giải Nhất</span>
            </button>
          </div>
        </div>

        {/* Latest Draw 3 Càng Preview Bar */}
        {cangAnalysis && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Kỳ Gần Nhất ({cangAnalysis.latestDrawDate}):</span>
              <span className="font-mono text-slate-300">
                Giải: <strong className="text-white">{target === 'db' ? historyData[0]?.sp : historyData[0]?.fp}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 font-mono font-bold">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-sans">3 Càng Vừa Nổ:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm">
                  {cangAnalysis.latest3Cang || '---'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-sans">Chữ Số Càng:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-sm">
                  Càng {cangAnalysis.latestCang ?? '-'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 hidden sm:flex">
                <span className="text-slate-400 font-sans">Dạng:</span>
                <span className="text-emerald-400 font-sans">
                  {cangAnalysis.parity.currentType} • {cangAnalysis.size.currentType}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="glass-card rounded-xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Xác Suất Lý Thuyết</div>
          <div className="text-2xl font-black text-white font-mono">0.10%</div>
          <p className="text-[10px] text-slate-400 font-sans">1 / 1.000 con số 3 càng</p>
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-[11px] font-bold text-emerald-400 uppercase">Càng Về Nhiều Nhất</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            Càng {cangAnalysis?.topCangAll[0]?.digit}
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            {cangAnalysis?.topCangAll[0]?.hits} lần ({cangAnalysis?.topCangAll[0]?.rateAll}%)
          </p>
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-[11px] font-bold text-rose-400 uppercase">Càng Đang Gan Nhất</div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            Càng {cangAnalysis?.topGanCang[0]?.digit}
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Gan {cangAnalysis?.topGanCang[0]?.currentGan} ngày chưa về
          </p>
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-[11px] font-bold text-cyan-400 uppercase">Phong Độ 30 Ngày</div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            Càng {cangAnalysis?.topCang30[0]?.digit}
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            {cangAnalysis?.topCang30[0]?.hits30} lần trong 30 kỳ quay
          </p>
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="text-[11px] font-bold text-amber-400 uppercase">Dự Phóng Ngày Mai (T+1)</div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            Càng {cangAnalysis?.topForecastCang[0]?.digit}
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Điểm nhịp: {cangAnalysis?.topForecastCang[0]?.forecastScore}/100
          </p>
        </div>
      </div>

      {/* 3. NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'cang_digits', label: '1. Thống Kê 10 Chữ Số Càng (0-9)', icon: Hash },
          { id: 'patterns', label: '2. Cấu Trúc 3 Càng (Kép, Tam Hoa)', icon: Binary },
          { id: 'sums', label: '3. Phân Bố Tổng 3 Càng (0-27)', icon: Compass },
          { id: 'rankings', label: '4. Bảng Xếp Hạng Top 3 Càng (000-999)', icon: Award },
          { id: 'search', label: '5. Tra Cứu 1 Số 3 Càng Bất Kỳ', icon: Search },
          { id: 'builder', label: '6. Ghép Càng & Tạo Dàn 3 Càng', icon: Layers, highlight: true }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? tab.highlight
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-white shadow border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: 10 CÀNG DIGITS ==================== */}
      {activeSubTab === 'cang_digits' && cangAnalysis && (
        <div className="space-y-6">
          {/* Bar Chart 10 Càng */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-400" />
                  Biểu Đồ So Sánh Tần Suất 10 Chữ Số Càng (0 - 9)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Số lần nổ của từng chữ số hàng trăm trong {cangAnalysis.totalDraws.toLocaleString()} kỳ quay lịch sử ({targetShort}).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                Lý thuyết: 10.0% mỗi Càng
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cangAnalysis.digitStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1 font-sans">
                            <div className="font-bold text-amber-400">{d.label}</div>
                            <div>Tổng số lần về: <strong className="text-white font-mono">{d.hits} lần ({d.rateAll}%)</strong></div>
                            <div>Về trong 30 ngày: <strong className="text-cyan-400 font-mono">{d.hits30} lần</strong></div>
                            <div>Gan hiện tại: <strong className="text-rose-400 font-mono">{d.currentGan} ngày</strong></div>
                            <div>Gan cực đại: <strong className="text-slate-300 font-mono">{d.maxGan} ngày</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hits" name="Số lần về" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Parity & Size Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Binary className="w-4 h-4 text-cyan-400" />
                Tỷ Lệ Càng Chẵn / Lẻ
              </h4>
              <div className="grid grid-cols-2 gap-3 text-center font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Càng Chẵn (0, 2, 4, 6, 8)</div>
                  <div className="text-xl font-black text-cyan-400 mt-1">{cangAnalysis.parity.evenRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{cangAnalysis.parity.evenCount.toLocaleString()} kỳ</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Càng Lẻ (1, 3, 5, 7, 9)</div>
                  <div className="text-xl font-black text-amber-400 mt-1">{cangAnalysis.parity.oddRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{cangAnalysis.parity.oddCount.toLocaleString()} kỳ</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400">
                Chuỗi bệt dài nhất: Chẵn bệt <strong className="text-white font-mono">{cangAnalysis.parity.maxEvenStreak} ngày</strong> • Lẻ bệt <strong className="text-white font-mono">{cangAnalysis.parity.maxOddStreak} ngày</strong>.
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                Tỷ Lệ Càng Tài / Xỉu
              </h4>
              <div className="grid grid-cols-2 gap-3 text-center font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Càng Xỉu (0, 1, 2, 3, 4)</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{cangAnalysis.size.smallRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{cangAnalysis.size.smallCount.toLocaleString()} kỳ</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Càng Tài (5, 6, 7, 8, 9)</div>
                  <div className="text-xl font-black text-purple-400 mt-1">{cangAnalysis.size.bigRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{cangAnalysis.size.bigCount.toLocaleString()} kỳ</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400">
                Cân bằng xác suất nhị phân gần như hoàn hảo 50% - 50%.
              </div>
            </div>
          </div>

          {/* Table of 10 Càng Digits */}
          <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Bảng Thống Kê Chi Tiết 10 Chữ Số Càng (0 - 9)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 text-center">Chữ Số Càng</th>
                    <th className="py-3 px-4 text-center">Tổng Số Lần Nổ</th>
                    <th className="py-3 px-4 text-center">Tỷ Lệ All-Time</th>
                    <th className="py-3 px-4 text-center">30 Ngày Gần Nhất</th>
                    <th className="py-3 px-4 text-center">90 Ngày Gần Nhất</th>
                    <th className="py-3 px-4 text-center">Gan Hiện Tại</th>
                    <th className="py-3 px-4 text-center">Gan Cực Đại (Max)</th>
                    <th className="py-3 px-4 text-center">Chu Kỳ Trung Bình</th>
                    <th className="py-3 px-4 text-center">Điểm Dự Phóng (T+1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {cangAnalysis.digitStats.map(item => (
                    <tr key={item.digit} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-sm flex items-center justify-center mx-auto">
                          {item.digit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {item.hits.toLocaleString()} lần
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {item.rateAll}%
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-cyan-400">
                        {item.hits30} lần ({item.rate30}%)
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {item.hits90} lần ({item.rate90}%)
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          item.currentGan === 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.currentGan > 20
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'text-slate-200'
                        }`}>
                          {item.currentGan} ngày
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {item.maxGan} ngày
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {item.avgCycle} ngày
                      </td>
                      <td className="py-3 px-4 text-center font-black">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          item.forecastScore >= 70
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : item.forecastScore >= 50
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.forecastScore}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: PATTERNS ==================== */}
      {activeSubTab === 'patterns' && patternsAnalysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Distinct */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase">
                <span>3 Số Khác Nhau</span>
                <span className="font-mono">Lý thuyết: 72%</span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {patternsAnalysis.distinct.rate}%
              </div>
              <p className="text-xs text-slate-400">
                Đã về: <strong className="text-slate-200 font-mono">{patternsAnalysis.distinct.count.toLocaleString()} kỳ</strong>
              </p>
              <p className="text-[11px] text-slate-500">Dạng phổ biến nhất (ví dụ: 760, 387, 125...)</p>
            </div>

            {/* Double / Kép */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase">
                <span>3 Càng Kép (Trùng 2)</span>
                <span className="font-mono">Lý thuyết: 27%</span>
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {patternsAnalysis.double.rate}%
              </div>
              <p className="text-xs text-slate-400">
                Đã về: <strong className="text-slate-200 font-mono">{patternsAnalysis.double.count.toLocaleString()} kỳ</strong>
              </p>
              <p className="text-[11px] text-slate-500">Dạng có 2 số giống nhau (ví dụ: 112, 121, 122...)</p>
            </div>

            {/* Triple / Tam Hoa */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-rose-400 font-bold uppercase">
                <span>Tam Hoa / Bão (000-999)</span>
                <span className="font-mono">Lý thuyết: 1.0%</span>
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono">
                {patternsAnalysis.triple.rate}%
              </div>
              <p className="text-xs text-slate-400">
                Đã về: <strong className="text-rose-300 font-mono">{patternsAnalysis.triple.count} kỳ</strong>
              </p>
              <p className="text-[11px] text-slate-500">Dạng cực hiếm (000, 111, 222, ..., 999)</p>
            </div>
          </div>

          {/* Tam Hoa History Table */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Lịch Sử Các Kỳ Nổ Tam Hoa / Bão (000 - 999) Cực Hiếm
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Ngày Quay</th>
                    <th className="py-2.5 px-4">Giải Đầy Đủ (5 Số)</th>
                    <th className="py-2.5 px-4 text-center">3 Càng Tam Hoa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {patternsAnalysis.triple.recentEvents.map((ev, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-300 font-sans">{ev.date}</td>
                      <td className="py-2.5 px-4 text-slate-400">{ev.full}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black text-sm">
                          {ev.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SUMS ==================== */}
      {activeSubTab === 'sums' && sumsAnalysis && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Đường Cong Phân Bố Xác Suất Tổng 3 Càng (0 Đến 27)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Phân bố hình chuông Gauss chuẩn: các tổng từ 11 đến 16 chiếm mật độ nổ cao nhất.
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...sumsAnalysis].sort((a, b) => a.sum - b.sum)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="sum" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1 font-sans">
                            <div className="font-bold text-cyan-400">Tổng 3 Càng: {d.sum}</div>
                            <div>Số lần về: <strong className="text-white font-mono">{d.count} lần ({d.rate}%)</strong></div>
                            <div>Gan hiện tại: <strong className="text-rose-400 font-mono">{d.currentGan} ngày</strong></div>
                            <div>Gan Max: <strong className="text-slate-300 font-mono">{d.maxGan} ngày</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" name="Số lần về" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sums Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 font-mono">
            {sumsAnalysis.map(item => (
              <div key={item.sum} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                <div className="text-xs font-black text-cyan-400">Tổng {item.sum}</div>
                <div className="text-sm font-bold text-white">{item.count} lần</div>
                <div className="text-[10px] text-slate-400">{item.rate}%</div>
                <div className="text-[10px] text-rose-400">Gan: {item.currentGan}N</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: RANKINGS ==================== */}
      {activeSubTab === 'rankings' && rankingsAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 20 Most Frequent */}
          <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                Top 20 Bộ 3 Càng Về Nhiều Nhất Lịch Sử
              </h4>
              <span className="text-[10px] text-slate-400">Từ năm 2010</span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Hạng</th>
                    <th className="py-2.5 px-3 text-center">3 Càng</th>
                    <th className="py-2.5 px-3 text-center">Số Lần Về</th>
                    <th className="py-2.5 px-3 text-center">Tỷ Lệ (%)</th>
                    <th className="py-2.5 px-3 text-center">Lần Cuối Về</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rankingsAnalysis.topHits.map((item, idx) => (
                    <tr key={item.val} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center text-slate-500 font-sans">{idx + 1}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-black">
                          {item.val}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-400">{item.count} lần</td>
                      <td className="py-2 px-3 text-center text-slate-300">{item.rate}%</td>
                      <td className="py-2 px-3 text-center text-[11px] text-slate-400">{item.lastDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 20 Coldest */}
          <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400" />
                Top 20 Bộ 3 Càng Gan Lâu Nhất Chưa Về
              </h4>
              <span className="text-[10px] text-slate-400">Gan hiện tại</span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Hạng</th>
                    <th className="py-2.5 px-3 text-center">3 Càng</th>
                    <th className="py-2.5 px-3 text-center">Gan Hiện Tại</th>
                    <th className="py-2.5 px-3 text-center">Tổng Lần Về</th>
                    <th className="py-2.5 px-3 text-center">Lần Cuối Về</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rankingsAnalysis.topGan.map((item, idx) => (
                    <tr key={item.val} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center text-slate-500 font-sans">{idx + 1}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-black">
                          {item.val}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-rose-400">{item.currentGan} ngày</td>
                      <td className="py-2 px-3 text-center text-slate-300">{item.count} lần</td>
                      <td className="py-2 px-3 text-center text-[11px] text-slate-400">{item.lastDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: SINGLE 3 CÀNG SEARCH ==================== */}
      {activeSubTab === 'search' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1 text-center">
            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              Tra Cứu Lịch Sử & Gan Của 1 Con Số 3 Càng Bất Kỳ (000 - 999)
            </h3>
            <p className="text-xs text-slate-400">
              Nhập 3 chữ số để xem số lần nổ từ năm 2010 đến nay, gan hiện tại, gan kỷ lục và danh sách các ngày trúng.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              maxLength={3}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập 3 số, ví dụ: 760"
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-center text-lg text-white font-mono font-black tracking-widest focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20"
            >
              Tra Cứu
            </button>
          </form>

          {searchResult && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans text-slate-400">Kết quả tra cứu con số:</span>
                  <span className="text-2xl font-black text-amber-400 bg-amber-500/10 px-3 py-0.5 rounded-xl border border-amber-500/30">
                    {searchResult.val}
                  </span>
                </div>
                <span className="text-xs font-sans text-slate-400">
                  {searchResult.totalDraws.toLocaleString()} kỳ quay ({targetShort})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Tổng Số Lần Về</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{searchResult.hits} lần</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Tỷ lệ: {searchResult.hitRate}%</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Gan Hiện Tại</div>
                  <div className="text-xl font-black text-amber-400 mt-1">{searchResult.currentGan} ngày</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">chưa nổ</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Gan Cực Đại (Max)</div>
                  <div className="text-xl font-black text-rose-400 mt-1">{searchResult.maxGan} ngày</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">kỷ lục lịch sử</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Chu Kỳ Trung Bình</div>
                  <div className="text-xl font-black text-cyan-400 mt-1">{searchResult.avgGan} ngày</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">nổ 1 lần</div>
                </div>
              </div>

              {/* Hit History */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold font-sans text-slate-300">
                  Các Lần Nổ Gần Nhất Của 3 Càng {searchResult.val}:
                </div>
                {searchResult.hitHistory.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/60 text-center text-xs text-slate-500 font-sans">
                    Con số {searchResult.val} chưa từng nổ trong toàn bộ lịch sử từ 2010 đến nay!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {searchResult.hitHistory.map((h, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300 font-sans">{h.date}</span>
                        <span className="text-amber-300 font-bold">{h.fullPrize}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 6: 3 CÀNG BUILDER (GHÉP CÀNG X 2D) ==================== */}
      {activeSubTab === 'builder' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Bộ Ghép Càng Thông Minh & Kiểm Định Lịch Sử (Càng x Dàn 2D)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Chọn các Càng ưu tiên (0-9) ghép với dàn số 2D để tự động sinh dàn 3 càng và kiểm tra ngay tỷ lệ nổ từ năm 2010.
                </p>
              </div>

              <button
                onClick={handleCopyGenerated}
                disabled={generated3CangList.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-40"
              >
                {custom3CangCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{custom3CangCopied ? 'Đã Sao Chép!' : `Copy ${generated3CangList.length} Số 3 Càng`}</span>
              </button>
            </div>

            {/* Step 1: Select Càng digits */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Bước 1: Chọn Chữ Số Càng ({selectedCangs.size} càng đã chọn):
              </label>
              <div className="grid grid-cols-10 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
                  const isSelected = selectedCangs.has(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleCangSelect(d)}
                      className={`py-2 rounded-xl font-mono text-sm font-black transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-105'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Càng {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Dàn 2D numbers */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300">
                  Bước 2: Nhập Dãy Số 2D (Cách nhau bằng dấu phẩy, khoảng trắng):
                </label>
                <span className="font-mono text-amber-400 font-bold">
                  {parseNumberSet(input2DNumbers).length} số 2D
                </span>
              </div>
              <textarea
                rows={3}
                value={input2DNumbers}
                onChange={(e) => setInput2DNumbers(e.target.value)}
                placeholder="Nhập dàn 2 số, ví dụ: 02, 07, 12, 17, 20, 21, 22..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Fast Presets for 2D */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold">Gợi ý dàn 2D:</span>
              <button
                onClick={() => setInput2DNumbers('02, 07, 12, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold"
              >
                Chạm 2, 7 (36 số)
              </button>
              <button
                onClick={() => setInput2DNumbers('00, 02, 04, 06, 08, 11, 13, 15, 17, 19, 20, 22, 24, 26, 28, 31, 33, 35, 37, 39, 40, 42, 44, 46, 48, 51, 53, 55, 57, 59, 60, 62, 64, 66, 68, 71, 73, 75, 77, 79, 80, 82, 84, 86, 88, 91, 93, 95, 97, 99')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold"
              >
                Tổng Chẵn (50 số)
              </button>
              <button
                onClick={() => setSelectedCangs(new Set([cangAnalysis?.topForecastCang[0]?.digit ?? 1, cangAnalysis?.topForecastCang[1]?.digit ?? 3, cangAnalysis?.topForecastCang[2]?.digit ?? 7]))}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
              >
                Chọn 3 Càng Phong Độ Cao Nhất
              </button>
            </div>
          </div>

          {/* Evaluation Results of Generated 3 Càng Set */}
          {generatedStats && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Kết Quả Kiểm Định Dàn 3 Càng Đã Ghép ({generatedStats.k} số)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {targetShort}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedCangs.size} càng × {parseNumberSet(input2DNumbers).length} số 2D = <strong className="text-white">{generatedStats.k} con 3 càng</strong>
                </div>
              </div>

              {/* 4 Quick Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Tổng Số Lần Nổ</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{generatedStats.hits} kỳ</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">Tỷ lệ: {generatedStats.hitRate}%</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Xác Suất Lý Thuyết</div>
                  <div className="text-xl font-black text-white mt-1">{generatedStats.pTheoretical}%</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">{generatedStats.k} / 1.000</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Gan Hiện Tại</div>
                  <div className="text-xl font-black text-amber-400 mt-1">{generatedStats.currentGan} ngày</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">chưa về</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Gan Cực Đại (Max)</div>
                  <div className="text-xl font-black text-rose-400 mt-1">{generatedStats.maxGan} ngày</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">kỷ lục lịch sử</div>
                </div>
              </div>

              {/* Textarea Preview & 1-Click Copy */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    Danh Sách {generated3CangList.length} Con 3 Càng Tạo Thành:
                  </span>
                  <button
                    onClick={handleCopyGenerated}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    {custom3CangCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{custom3CangCopied ? 'Đã Sao Chép!' : 'Sao Chép Toàn Bộ'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 max-h-40 overflow-y-auto leading-relaxed select-all">
                  {generated3CangList.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
