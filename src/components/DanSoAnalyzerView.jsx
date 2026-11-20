import React, { useState, useMemo, useRef } from 'react';
import {
  Layers, Upload, Plus, Trash2, Copy, Check, Sparkles, Database,
  TrendingUp, Clock, AlertTriangle, FileSpreadsheet,
  CheckSquare, Square, Combine, BarChart2, ShieldCheck, Flame,
  Target, Calendar, Award, Star, ArrowRight, CheckCircle2, XCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { evaluateSetDeep, saveSetsToStorage, SET_CATEGORIES } from '../danSo/danSoService';
import { parseNumberSet, parseBulkSetsText, getModeLabel, TARGET_MODES } from '../utils/lotteryEngine';
import firebasePresets from '../data/firebase_dan_so.json';

export default function DanSoAnalyzerView({ historyData, savedSets, setSavedSets, mode = 'db_tail' }) {
  const [activeCategoryTab, setActiveCategoryTab] = useState('all'); // 'all' | 'db_tail' | 'db_head' | 'g1_tail' | 'g1_head'
  const [selectedSetId, setSelectedSetId] = useState(savedSets[0]?.id || '');
  const [checkedSetIds, setCheckedSetIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [batchCopied, setBatchCopied] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [importTarget, setImportTarget] = useState('db_tail');
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawTextImport, setRawTextImport] = useState('');
  const fileInputRef = useRef(null);

  // Filter sets by selected category tab
  const filteredSets = useMemo(() => {
    if (activeCategoryTab === 'all') return savedSets;
    return savedSets.filter(s => (s.target || 'db_tail') === activeCategoryTab);
  }, [savedSets, activeCategoryTab]);

  // Evaluate all sets with deep probability and statistics
  const evaluatedSets = useMemo(() => {
    return savedSets.map(set => {
      // Evaluate against its own target, or fallback to current mode
      const target = set.target || mode || 'db_tail';
      return {
        ...set,
        target,
        stats: evaluateSetDeep(set.numbers, historyData, target)
      };
    });
  }, [savedSets, historyData, mode]);

  // Selected set detailed stats
  const activeSet = useMemo(() => {
    return evaluatedSets.find(s => s.id === selectedSetId) || evaluatedSets[0] || null;
  }, [evaluatedSets, selectedSetId]);

  // Single set copy
  const handleCopySingle = (setItem) => {
    const text = `${setItem.name}: ${setItem.numbers.join(',')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(setItem.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Batch copy selected
  const handleCopySelected = () => {
    const selected = savedSets.filter(s => checkedSetIds.has(s.id));
    if (selected.length === 0) return;
    const text = selected.map(s => `${s.name} (${s.target || 'db_tail'}): ${s.numbers.join(',')}`).join('\n');
    navigator.clipboard.writeText(text);
    setBatchCopied(true);
    setTimeout(() => setBatchCopied(false), 2000);
  };

  // Merge selected into 1 set
  const handleMergeSelected = () => {
    const selected = savedSets.filter(s => checkedSetIds.has(s.id));
    if (selected.length <= 1) return;

    const mergedNumbers = new Set();
    selected.forEach(s => s.numbers.forEach(n => mergedNumbers.add(n)));
    const sorted = Array.from(mergedNumbers).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    const newSet = {
      id: `merged_${Date.now()}`,
      name: `Dàn Gộp (${selected.length} Dàn - ${sorted.length} Số)`,
      numbers: sorted,
      target: selected[0]?.target || 'db_tail',
      note: `Gộp từ: ${selected.map(s => s.name).join(', ')}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newSet, ...savedSets];
    setSavedSets(updated);
    saveSetsToStorage(updated);
    setSelectedSetId(newSet.id);
    setCheckedSetIds(new Set());
    setImportStatus({ type: 'success', message: `Đã gộp ${selected.length} dàn thành công (${sorted.length} số)!` });
  };

  // Toggle selection
  const toggleSelectSet = (id) => {
    const next = new Set(checkedSetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedSetIds(next);
  };

  const handleSelectAll = () => {
    const currentList = filteredSets;
    const allChecked = currentList.every(s => checkedSetIds.has(s.id));
    const next = new Set(checkedSetIds);
    if (allChecked) {
      currentList.forEach(s => next.delete(s.id));
    } else {
      currentList.forEach(s => next.add(s.id));
    }
    setCheckedSetIds(next);
  };

  // Change target of a set
  const handleChangeSetTarget = (setId, newTarget) => {
    const updated = savedSets.map(s => s.id === setId ? { ...s, target: newTarget } : s);
    setSavedSets(updated);
    saveSetsToStorage(updated);
  };

  // Handle bulk text import
  const handleImportText = () => {
    if (!rawTextImport.trim()) return;
    const parsed = parseBulkSetsText(rawTextImport).map(s => ({
      ...s,
      target: importTarget
    }));

    if (parsed.length === 0) {
      setImportStatus({ type: 'error', message: 'Không tìm thấy dàn số hợp lệ nào trong văn bản.' });
      return;
    }

    const updated = importMode === 'replace' ? parsed : [...savedSets, ...parsed];
    setSavedSets(updated);
    saveSetsToStorage(updated);
    setSelectedSetId(parsed[0]?.id || '');
    setRawTextImport('');
    setShowImportModal(false);
    setImportStatus({ type: 'success', message: `Đã nạp thành công ${parsed.length} dàn số mới cho ${getModeLabel(importTarget)}!` });
  };

  // Handle Excel upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      let lines = [];

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        rows.forEach(row => {
          if (!Array.isArray(row)) return;
          const text = row.join(' ');
          const nums = parseNumberSet(text);
          if (nums.length >= 5) {
            lines.push(`Dàn Excel ${lines.length + 1}: ${nums.join(',')}`);
          }
        });
      });

      if (lines.length === 0) {
        setImportStatus({ type: 'error', message: `Không tìm thấy dàn số nào trong file "${file.name}".` });
        return;
      }

      const parsed = parseBulkSetsText(lines.join('\n')).map(s => ({ ...s, target: importTarget }));
      const updated = importMode === 'replace' ? parsed : [...savedSets, ...parsed];
      setSavedSets(updated);
      saveSetsToStorage(updated);
      setSelectedSetId(parsed[0]?.id || '');
      setShowImportModal(false);
      setImportStatus({ type: 'success', message: `Đã import thành công ${parsed.length} dàn từ file "${file.name}"!` });
    } catch (err) {
      setImportStatus({ type: 'error', message: `Lỗi đọc file Excel: ${err.message}` });
    }
  };

  // Load 9 Firebase presets distributed across targets
  const handleLoadFirebasePresets = () => {
    const presets = firebasePresets.map((item, idx) => {
      let target = 'db_tail';
      if (idx % 4 === 1) target = 'db_head';
      else if (idx % 4 === 2) target = 'g1_tail';
      else if (idx % 4 === 3) target = 'g1_head';

      return {
        id: item.id || `fb_set_${idx + 1}`,
        name: item.name || `Dàn ${idx + 10}`,
        numbers: item.numbers || [],
        target,
        note: item.note || `${(item.numbers || []).length} số`,
        createdAt: new Date().toISOString()
      };
    });

    setSavedSets(presets);
    saveSetsToStorage(presets);
    setSelectedSetId(presets[0]?.id || '');
    setImportStatus({ type: 'success', message: 'Đã nạp thành công 9 dàn số chuẩn từ Firebase phân chia theo 4 mục tiêu!' });
  };

  const activeStats = activeSet?.stats;

  // Chart data: Gan progression of last 60 draws
  const ganChartData = useMemo(() => {
    if (!activeStats?.timelineHistory) return [];
    return [...activeStats.timelineHistory.slice(0, 60)].reverse().map(item => ({
      date: item.date.slice(5),
      gan: item.ganAtDay,
      isHit: item.isHit ? 1 : 0
    }));
  }, [activeStats]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            Hệ Thống Phân Tích Dàn Số & Xác Suất Lịch Sử 10 Năm (2010 - 2026)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Phân Tích Chi Tiết 4 Loại Dàn Số & Dự Phóng Xác Suất
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Đánh giá chất lượng dàn số, tỷ lệ nổ ngày hôm nay (T), ngày tiếp theo (T+1), ngày kế tiếp (T+2) và chu kỳ Gan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadFirebasePresets}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            Nạp 9 Dàn Firebase
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-600/20"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Dàn Số Mới
          </button>
        </div>
      </div>

      {/* 4 CATEGORIES FILTER TABS */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-thin">
        {SET_CATEGORIES.map(cat => {
          const isActive = activeCategoryTab === cat.id;
          const count = cat.id === 'all'
            ? savedSets.length
            : savedSets.filter(s => (s.target || 'db_tail') === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryTab(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alert Status Banner */}
      {importStatus && (
        <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
          importStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{importStatus.message}</span>
          <button onClick={() => setImportStatus(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Batch Selection Action Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 font-bold text-slate-300 hover:text-white"
          >
            {filteredSets.length > 0 && filteredSets.every(s => checkedSetIds.has(s.id)) ? (
              <CheckSquare className="w-4 h-4 text-amber-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Chọn tất cả ({filteredSets.length} dàn trong mục này)</span>
          </button>

          <span className="text-slate-400">
            Đã chọn: <strong className="text-white font-mono">{checkedSetIds.size} dàn</strong>
          </span>
        </div>

        {/* Batch action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {checkedSetIds.size > 0 && (
            <>
              <button
                onClick={handleCopySelected}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow"
              >
                {batchCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{batchCopied ? 'Đã sao chép!' : `Sao chép ${checkedSetIds.size} dàn đã chọn`}</span>
              </button>

              {checkedSetIds.size >= 2 && (
                <button
                  onClick={handleMergeSelected}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  <Combine className="w-3.5 h-3.5" />
                  Gộp thành 1 dàn mới
                </button>
              )}

              <button
                onClick={() => {
                  const updated = savedSets.filter(s => !checkedSetIds.has(s.id));
                  setSavedSets(updated);
                  saveSetsToStorage(updated);
                  setCheckedSetIds(new Set());
                  if (checkedSetIds.has(selectedSetId)) setSelectedSetId(updated[0]?.id || '');
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa {checkedSetIds.size} dàn
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Left Sets List + Right Comprehensive Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sets List with Quick Copy and Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Danh sách ({filteredSets.length} dàn)</span>
            <span>Click để xem chi tiết</span>
          </div>

          <div className="space-y-2 max-h-[850px] overflow-y-auto scrollbar-thin pr-1">
            {filteredSets.map(setItem => {
              const isSelected = activeSet?.id === setItem.id;
              const isChecked = checkedSetIds.has(setItem.id);
              const target = setItem.target || 'db_tail';
              const targetObj = TARGET_MODES.find(t => t.id === target) || TARGET_MODES[0];
              const stats = evaluateSetDeep(setItem.numbers, historyData, target);

              return (
                <div
                  key={setItem.id}
                  onClick={() => setSelectedSetId(setItem.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelectSet(setItem.id); }}
                        className="text-slate-400 hover:text-white"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">
                            {setItem.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                            {targetObj.icon} {targetObj.short}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {setItem.numbers.length} số • {stats?.stars || '⭐⭐⭐'}
                        </span>
                      </div>
                    </div>

                    {/* Single Copy Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopySingle(setItem); }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                      title="Sao chép dàn này"
                    >
                      {copiedId === setItem.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-amber-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Set Quick Stats */}
                  {stats && (
                    <div className="grid grid-cols-4 gap-1 mt-3 pt-2.5 border-t border-slate-800/80 text-center font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Tỷ Lệ Ăn</span>
                        <span className="text-xs font-black text-emerald-400">{stats.hitRateAll}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Gan Hiện Tại</span>
                        <span className={`text-xs font-black ${stats.currentGan > stats.avgGan ? 'text-amber-400' : 'text-slate-200'}`}>
                          {stats.currentGan} d
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">P(T+1)</span>
                        <span className="text-xs font-black text-cyan-300">{stats.empirical.empiricalRateT1}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">P(Khung 2d)</span>
                        <span className="text-xs font-black text-yellow-300">{stats.empirical.empiricalRateT1orT2}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Full Probability & Historical Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {activeSet && activeStats ? (
            <>
              {/* Header Card with Quality Score & Target Selector */}
              <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Phân Tích Chi Tiết Dàn Số & Xác Suất
                      </span>
                      <span className={`text-xs font-bold ${activeStats.tierColor}`}>
                        • {activeStats.tier} ({activeStats.stars})
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                      {activeSet.name}
                      <span className="text-sm font-normal text-slate-400">({activeSet.numbers.length} số)</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySingle(activeSet)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
                    >
                      {copiedId === activeSet.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId === activeSet.id ? 'Đã Sao Chép Dãy Số!' : 'Sao Chép Dàn Này'}</span>
                    </button>
                  </div>
                </div>

                {/* Target switch for this set */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Đang đối chiếu với dữ liệu:</span>
                  <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex flex-wrap items-center gap-1">
                    {TARGET_MODES.map(tgt => (
                      <button
                        key={tgt.id}
                        onClick={() => handleChangeSetTarget(activeSet.id, tgt.id)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                          (activeSet.target || 'db_tail') === tgt.id
                            ? 'bg-amber-500 text-slate-950 font-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{tgt.icon}</span>
                        <span>{tgt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numbers pills preview */}
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-thin p-1 pt-2">
                  {activeSet.numbers.map(num => (
                    <span
                      key={num}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs font-bold"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              {/* Today, T+1, T+2 Probability Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Hôm nay (T) */}
                <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                    <span>Kết Quả Hôm Nay (Kỳ {activeStats.today.date})</span>
                    <Calendar className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    {activeStats.today.isHit ? (
                      <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-black flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ĂN SỐ {activeStats.today.prize}
                      </div>
                    ) : (
                      <div className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-sm font-black flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        XỊT (Về số {activeStats.today.prize})
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Đối chiếu với kỳ quay mới nhất.
                  </p>
                </div>

                {/* 2. Ngày Tiếp Theo (T+1) */}
                <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase">
                    <span>Dự Phóng Ngày Tiếp (T+1)</span>
                    <Target className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-white">
                      {activeStats.empirical.empiricalRateT1}%
                    </span>
                    <span className="text-xs text-amber-400 font-mono">
                      (LT: {activeStats.theoretical.pT1Percent}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Tỷ lệ nổ thực tế khi dàn chạm mốc Gan {activeStats.currentGan} ngày trong 10+ năm qua ({activeStats.empirical.empiricalHitT1}/{activeStats.empirical.timesReachedGan} lần).
                  </p>
                </div>

                {/* 3. Khung 2 Ngày (T+1 & T+2) */}
                <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
                    <span>Nổ Khung 2 Ngày [T+1, T+2]</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-emerald-400">
                      {activeStats.empirical.empiricalRateT1orT2}%
                    </span>
                    <span className="text-xs text-emerald-400/80 font-mono">
                      (LT: {activeStats.theoretical.pT1orT2Percent}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Xác suất ăn ít nhất 1 lần trong 2 ngày tiếp theo.
                  </p>
                </div>
              </div>

              {/* Gan Detailed Analytics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Gan Hiện Tại</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black font-mono ${
                      activeStats.currentGan >= activeStats.maxGan ? 'text-rose-500' :
                      activeStats.currentGan > activeStats.avgGan ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {activeStats.currentGan}
                    </span>
                    <span className="text-xs text-slate-400">ngày</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Số ngày xịt liên tiếp</span>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Gan Cực Đại (Max)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-rose-400">
                      {activeStats.maxGan}
                    </span>
                    <span className="text-xs text-slate-400">ngày</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block" title={activeStats.maxGanPeriod}>
                    {activeStats.maxGanPeriod}
                  </span>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Gan Trung Bình</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-cyan-400">
                      {activeStats.avgGan}
                    </span>
                    <span className="text-xs text-slate-400">ngày</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Nhịp xịt trung bình</span>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Chuỗi Ăn Liên Tiếp</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-yellow-300">
                      {activeStats.maxWinStreak}
                    </span>
                    <span className="text-xs text-slate-400">ngày</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Kỷ lục nổ liên tiếp</span>
                </div>
              </div>

              {/* Historical Consistency & Time Window Rates */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Đánh Giá Tần Suất Nổ Thường Xuyên Theo Thời Gian
                  </h4>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    Tổng: {activeStats.hitDaysCount} / {activeStats.totalDays} kỳ ({activeStats.hitRateAll}%)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 font-mono text-center text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">7 Ngày Qua</span>
                    <span className="text-base font-black text-white">{activeStats.hitRate7}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">30 Ngày Qua</span>
                    <span className="text-base font-black text-amber-400">{activeStats.hitRate30}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">60 Ngày Qua</span>
                    <span className="text-base font-black text-cyan-400">{activeStats.hitRate60}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">90 Ngày Qua</span>
                    <span className="text-base font-black text-emerald-400">{activeStats.hitRate90}%</span>
                  </div>
                </div>
              </div>

              {/* Gan Progression Chart */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Biểu Đồ Nhịp Gan Dàn Số (60 Kỳ Gần Nhất)
                </h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ganChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ganGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val) => [`${val} ngày`, 'Gan']}
                        labelFormatter={(d) => `Ngày: ${d}`}
                      />
                      <Area type="monotone" dataKey="gan" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#ganGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Number Breakdown inside Set */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Tần Suất Nổ Của Từng Con Số Trong Dàn (Từ 2010 Đến Nay)
                </h4>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 font-mono">
                  {activeStats.sortedNumbers.map(item => (
                    <div
                      key={item.num}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center"
                    >
                      <span className="text-sm font-black text-amber-400 block">{item.num}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.count} lần</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 text-slate-400">
              Chọn một dàn số bên trái để xem phân tích chi tiết.
            </div>
          )}
        </div>

      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Import Dàn Số Vào Hệ Thống
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Target Category Selection */}
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-bold">
                Chọn Loại Dàn Cho Các Dàn Số Này:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TARGET_MODES.map(tgt => (
                  <button
                    key={tgt.id}
                    type="button"
                    onClick={() => setImportTarget(tgt.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      importTarget === tgt.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">{tgt.icon}</div>
                    <div>{tgt.short}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Import Mode: Append or Replace */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Chế độ import:</span>
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    importMode === 'append' ? 'bg-amber-500 text-slate-950 shadow font-black' : 'text-slate-400'
                  }`}
                >
                  ➕ Thêm vào danh sách
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    importMode === 'replace' ? 'bg-rose-500 text-white shadow font-black' : 'text-slate-400'
                  }`}
                >
                  🔄 Ghi đè toàn bộ
                </button>
              </div>
            </div>

            {/* Excel Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center"
            >
              <FileSpreadsheet className="w-8 h-8 text-amber-400" />
              <span className="text-xs font-bold text-white">Bấm để chọn file Excel (.xlsx, .xls, .csv) hoặc kéo thả vào đây</span>
              <span className="text-[11px] text-slate-500">Tự động nhận diện các dàn số trong mọi sheet</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* Manual Text Paste Area */}
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-bold">
                Hoặc Dán Văn Bản Dàn Số Vào Đây (Mỗi Dàn 1 Dòng):
              </label>
              <textarea
                rows={6}
                value={rawTextImport}
                onChange={(e) => setRawTextImport(e.target.value)}
                placeholder={`Ví dụ:
Dàn 1: 01, 02, 05, 12, 14, 25, 36, 48, 59, 78, 89
Dàn Chẵn: 00, 02, 04, 06, 08, 10, 12, 14, 16, 18, 20...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500 resize-y"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportText}
                disabled={!rawTextImport.trim()}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all disabled:opacity-40"
              >
                Nhập Dàn Số
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
