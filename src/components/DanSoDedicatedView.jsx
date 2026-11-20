import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Layers, Upload, Plus, Trash2, Copy, Check, Sparkles, Database,
  TrendingUp, Clock, AlertTriangle, FileSpreadsheet,
  CheckSquare, Square, Combine, BarChart2, ShieldCheck, Flame,
  Target, Calendar, Award, Star, ArrowRight, CheckCircle2, XCircle,
  HelpCircle, RefreshCw, Filter, ListFilter
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  TARGET_CONFIGS,
  getSetsForTarget,
  saveSetsForTarget,
  evaluateSetDeep,
  analyzeGanRhythm5Years,
  getDefaultPresetsForTarget
} from '../danSo/danSoService';
import { parseNumberSet, parseBulkSetsText, getPrizeForMode } from '../utils/lotteryEngine';

export default function DanSoDedicatedView({
  targetMode = 'db_tail',
  historyData = []
}) {
  const targetConfig = TARGET_CONFIGS[targetMode] || TARGET_CONFIGS.db_tail;

  // Local sets state specifically for this targetMode
  const [sets, setSets] = useState(() => getSetsForTarget(targetMode));
  const [selectedSetId, setSelectedSetId] = useState('');
  const [checkedSetIds, setCheckedSetIds] = useState(new Set());

  // Input Box States
  const [inputSetName, setInputSetName] = useState('');
  const [inputTextNumbers, setInputTextNumbers] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [showQuickGen, setShowQuickGen] = useState(false);
  const [quickGenTab, setQuickGenTab] = useState('cham'); // 'cham' | 'tong' | 'dau' | 'duoi' | 'chanle'
  const [selectedDigits, setSelectedDigits] = useState(new Set());

  // Status & Notification
  const [actionNotice, setActionNotice] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [batchCopied, setBatchCopied] = useState(false);

  // 5-Year Chart Filter Tab
  const [chartYearFilter, setChartYearFilter] = useState('all'); // 'all' | '2026' | '2025' | '2024' | '2023' | '2022' | '2021'
  const [chartMetric, setChartMetric] = useState('rhythm'); // 'rhythm' | 'timeline' | 'distribution'

  const fileInputRef = useRef(null);

  // Sync sets when targetMode changes
  useEffect(() => {
    const loaded = getSetsForTarget(targetMode);
    setSets(loaded);
    setSelectedSetId(loaded[0]?.id || '');
    setCheckedSetIds(new Set());
    setInputSetName('');
    setInputTextNumbers('');
    setSelectedDigits(new Set());
  }, [targetMode]);

  // Save changes
  const updateAndPersistSets = (newSets) => {
    setSets(newSets);
    saveSetsForTarget(targetMode, newSets);
  };

  // Evaluate all sets against current targetMode
  const evaluatedSets = useMemo(() => {
    return sets.map(set => {
      const stats = evaluateSetDeep(set.numbers, historyData, targetMode);
      return {
        ...set,
        stats
      };
    });
  }, [sets, historyData, targetMode]);

  // Selected Set
  const activeSet = useMemo(() => {
    return evaluatedSets.find(s => s.id === selectedSetId) || evaluatedSets[0] || null;
  }, [evaluatedSets, selectedSetId]);

  const activeStats = activeSet?.stats;
  const ganRhythm5Y = activeStats?.ganRhythm5Y;

  // Realtime valid count in input box
  const recognizedCount = useMemo(() => {
    return parseNumberSet(inputTextNumbers).length;
  }, [inputTextNumbers]);

  // Handler: Add new set from dedicated input box
  const handleAddNewSet = () => {
    const numbers = parseNumberSet(inputTextNumbers);
    if (numbers.length === 0) {
      setActionNotice({ type: 'error', message: 'Vui lòng nhập ít nhất 1 số hợp lệ (từ 00 đến 99).' });
      return;
    }

    const name = inputSetName.trim() || `Dàn ${targetConfig.short} ${numbers.length} Số`;
    const newSet = {
      id: `custom_${targetMode}_${Date.now()}`,
      name,
      numbers,
      target: targetMode,
      note: inputNote.trim() || `${numbers.length} số cho ${targetConfig.short}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newSet, ...sets];
    updateAndPersistSets(updated);
    setSelectedSetId(newSet.id);
    setInputSetName('');
    setInputTextNumbers('');
    setInputNote('');
    setActionNotice({ type: 'success', message: `Đã thêm thành công "${name}" (${numbers.length} số)!` });
  };

  // Handler: Quick generator toggle digit
  const handleToggleDigit = (d) => {
    const next = new Set(selectedDigits);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    setSelectedDigits(next);

    // Auto-generate preview into inputTextNumbers
    const digitsArr = Array.from(next);
    let generated = [];

    if (quickGenTab === 'cham') {
      const s = new Set();
      for (let i = 0; i < 100; i++) {
        const str = i.toString().padStart(2, '0');
        if (digitsArr.some(digit => str[0] === String(digit) || str[1] === String(digit))) {
          s.add(str);
        }
      }
      generated = Array.from(s).sort();
    } else if (quickGenTab === 'tong') {
      const s = new Set();
      for (let i = 0; i < 100; i++) {
        const sum = (Math.floor(i / 10) + (i % 10)) % 10;
        if (digitsArr.includes(sum)) {
          s.add(i.toString().padStart(2, '0'));
        }
      }
      generated = Array.from(s).sort();
    } else if (quickGenTab === 'dau') {
      const s = new Set();
      for (let i = 0; i < 100; i++) {
        if (digitsArr.includes(Math.floor(i / 10))) {
          s.add(i.toString().padStart(2, '0'));
        }
      }
      generated = Array.from(s).sort();
    } else if (quickGenTab === 'duoi') {
      const s = new Set();
      for (let i = 0; i < 100; i++) {
        if (digitsArr.includes(i % 10)) {
          s.add(i.toString().padStart(2, '0'));
        }
      }
      generated = Array.from(s).sort();
    }

    setInputTextNumbers(generated.join(', '));
    if (!inputSetName) {
      const typeLabel = quickGenTab === 'cham' ? 'Chạm' : quickGenTab === 'tong' ? 'Tổng' : quickGenTab === 'dau' ? 'Đầu' : 'Đuôi';
      setInputSetName(`Dàn ${targetConfig.short} ${typeLabel} ${digitsArr.join(',')}`);
    }
  };

  // Preset Buttons
  const handleQuickPreset = (type) => {
    let numbers = [];
    let name = '';

    if (type === '64_dau') {
      name = `Dàn ${targetConfig.short} 64 Số (Đầu 0-7)`;
      for (let i = 0; i < 80; i++) numbers.push(i.toString().padStart(2, '0'));
      numbers = numbers.slice(0, 64);
    } else if (type === '50_chan') {
      name = `Dàn ${targetConfig.short} 50 Số Tổng Chẵn`;
      for (let i = 0; i < 100; i++) {
        if ((Math.floor(i / 10) + (i % 10)) % 2 === 0) numbers.push(i.toString().padStart(2, '0'));
      }
    } else if (type === '50_le') {
      name = `Dàn ${targetConfig.short} 50 Số Tổng Lẻ`;
      for (let i = 0; i < 100; i++) {
        if ((Math.floor(i / 10) + (i % 10)) % 2 !== 0) numbers.push(i.toString().padStart(2, '0'));
      }
    } else if (type === '36_cham27') {
      name = `Dàn ${targetConfig.short} 36 Số Chạm 2,7`;
      for (let i = 0; i < 100; i++) {
        const str = i.toString().padStart(2, '0');
        if (str.includes('2') || str.includes('7')) numbers.push(str);
      }
    }

    setInputSetName(name);
    setInputTextNumbers(numbers.join(', '));
  };

  // Excel / File Upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      let importedSets = [];

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        rows.forEach((row, rIdx) => {
          if (!Array.isArray(row)) return;
          const text = row.join(' ');
          const nums = parseNumberSet(text);
          if (nums.length >= 3) {
            importedSets.push({
              id: `excel_${Date.now()}_${rIdx}`,
              name: `Dàn Excel ${targetConfig.short} (${nums.length} số)`,
              numbers: nums,
              target: targetMode,
              note: `Import từ file ${file.name}`,
              createdAt: new Date().toISOString()
            });
          }
        });
      });

      if (importedSets.length === 0) {
        setActionNotice({ type: 'error', message: `Không tìm thấy dàn số hợp lệ nào trong file "${file.name}".` });
        return;
      }

      const updated = [...importedSets, ...sets];
      updateAndPersistSets(updated);
      setSelectedSetId(importedSets[0].id);
      setActionNotice({ type: 'success', message: `Đã import thành công ${importedSets.length} dàn từ file "${file.name}"!` });
    } catch (err) {
      setActionNotice({ type: 'error', message: `Lỗi đọc file: ${err.message}` });
    }
  };

  // Reset to default presets
  const handleResetDefaults = () => {
    const defaults = getDefaultPresetsForTarget(targetMode);
    updateAndPersistSets(defaults);
    setSelectedSetId(defaults[0]?.id || '');
    setActionNotice({ type: 'success', message: `Đã khôi phục các dàn mẫu chuẩn cho ${targetConfig.fullName}!` });
  };

  // Single Copy (1-click)
  const handleCopySingle = (setItem, onlyNumbers = false) => {
    const text = onlyNumbers ? setItem.numbers.join(',') : `${setItem.name} (${setItem.numbers.length} số): ${setItem.numbers.join(',')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(setItem.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Batch Copy selected
  const handleCopySelected = () => {
    const selected = sets.filter(s => checkedSetIds.has(s.id));
    if (selected.length === 0) return;
    const text = selected.map(s => `${s.name} (${s.numbers.length} số): ${s.numbers.join(',')}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setBatchCopied(true);
    setTimeout(() => setBatchCopied(false), 2000);
  };

  // Batch Merge selected
  const handleMergeSelected = () => {
    const selected = sets.filter(s => checkedSetIds.has(s.id));
    if (selected.length <= 1) {
      setActionNotice({ type: 'error', message: 'Vui lòng chọn ít nhất 2 dàn để gộp.' });
      return;
    }

    const merged = new Set();
    selected.forEach(s => s.numbers.forEach(n => merged.add(n)));
    const sorted = Array.from(merged).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    const newSet = {
      id: `merged_${Date.now()}`,
      name: `Dàn Gộp ${targetConfig.short} (${selected.length} Dàn - ${sorted.length} Số)`,
      numbers: sorted,
      target: targetMode,
      note: `Gộp từ: ${selected.map(s => s.name).join(', ')}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newSet, ...sets];
    updateAndPersistSets(updated);
    setSelectedSetId(newSet.id);
    setCheckedSetIds(new Set());
    setActionNotice({ type: 'success', message: `Đã gộp ${selected.length} dàn thành 1 dàn mới gồm ${sorted.length} số!` });
  };

  // Batch Delete
  const handleDeleteSelected = () => {
    if (checkedSetIds.size === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${checkedSetIds.size} dàn đã chọn không?`)) return;

    const remaining = sets.filter(s => !checkedSetIds.has(s.id));
    updateAndPersistSets(remaining);
    setCheckedSetIds(new Set());
    setSelectedSetId(remaining[0]?.id || '');
    setActionNotice({ type: 'success', message: 'Đã xóa các dàn đã chọn thành công.' });
  };

  // Single Delete
  const handleDeleteSingle = (id) => {
    const remaining = sets.filter(s => s.id !== id);
    updateAndPersistSets(remaining);
    if (selectedSetId === id) setSelectedSetId(remaining[0]?.id || '');
  };

  // Toggle selection
  const toggleSelectSet = (id) => {
    const next = new Set(checkedSetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedSetIds(next);
  };

  const handleSelectAll = () => {
    const allChecked = sets.every(s => checkedSetIds.has(s.id));
    if (allChecked) {
      setCheckedSetIds(new Set());
    } else {
      setCheckedSetIds(new Set(sets.map(s => s.id)));
    }
  };

  // Latest draw prize for this target
  const latestDraw = historyData[0] || null;
  const latestPrize = getPrizeForMode(latestDraw, targetMode);

  // 5-Year Filtered Chart Data
  const filteredTimelineChart = useMemo(() => {
    if (!ganRhythm5Y?.monthlyTimelineChart) return [];
    if (chartYearFilter === 'all') return ganRhythm5Y.monthlyTimelineChart;
    return ganRhythm5Y.monthlyTimelineChart.filter(m => m.year === chartYearFilter);
  }, [ganRhythm5Y, chartYearFilter]);

  return (
    <div className="space-y-6">

      {/* 1. HERO TARGET IDENTIFICATION BANNER */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{targetConfig.icon}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${targetConfig.badgeClass}`}>
                {targetConfig.fullName}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                Dữ liệu Firebase 2010 - 2026 ({historyData.length.toLocaleString()} kỳ)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Phân Tích Dàn Số & Xác Suất: <span className="text-amber-400">{targetConfig.name}</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Hệ thống đánh giá chuyên sâu dàn số dành riêng cho <strong>{targetConfig.short}</strong>. Tự động kiểm tra chất lượng dàn, tỷ lệ nổ hôm nay (T), xác suất Ngày Mai (T+1), Ngày Kia (T+2) và <strong>Biểu đồ nhịp Gan 5 năm (2021-2026)</strong>.
            </p>
          </div>

          {/* Latest Draw Info Pill */}
          {latestDraw && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:px-4 flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Kỳ Quay Gần Nhất ({latestDraw.d})</div>
                <div className="text-xs text-slate-300 font-mono">
                  Giải: <strong className="text-white">{targetMode.startsWith('db') ? latestDraw.sp || latestDraw.db : latestDraw.fp || latestDraw.g1}</strong>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/20">
                <span className="text-[9px] uppercase tracking-tighter -mb-1">{targetConfig.prizeName}</span>
                <span className="text-lg font-mono leading-none">{latestPrize || '--'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            <span className="font-medium">{actionNotice.message}</span>
            <button onClick={() => setActionNotice(null)} className="text-xs opacity-70 hover:opacity-100 font-bold ml-2">✕</button>
          </div>
        )}
      </div>

      {/* 2. DEDICATED SET INPUT & GENERATOR PANEL (Ô NHẬP DÀN SỐ RIÊNG CHO MỤC TIÊU NÀY) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Ô Nhập Dàn Số Dành Riêng Cho <span className="text-amber-400">{targetConfig.short}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Nhập văn bản, tải file Excel hoặc chọn tạo nhanh theo Chạm, Tổng, Đầu, Đuôi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickGen(!showQuickGen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                showQuickGen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showQuickGen ? 'Ẩn Tạo Nhanh' : 'Bộ Tạo Dàn Nhanh'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nhập Excel / TXT</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.txt,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                e.target.value = '';
              }}
            />

            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700 transition-all"
              title="Khôi phục các dàn mẫu Firebase cho giải này"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Generator Sub-Panel */}
        {showQuickGen && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chọn số để tạo dàn nhanh:</span>
              </div>
              <div className="flex items-center gap-1">
                {['cham', 'tong', 'dau', 'duoi'].map(t => (
                  <button
                    key={t}
                    onClick={() => { setQuickGenTab(t); setSelectedDigits(new Set()); }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                      quickGenTab === t
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {t === 'cham' ? 'Chạm' : t === 'tong' ? 'Tổng' : t === 'dau' ? 'Đầu' : 'Đuôi'}
                  </button>
                ))}
              </div>
            </div>

            {/* Digits 0 to 9 Buttons */}
            <div className="grid grid-cols-10 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
                const isSelected = selectedDigits.has(d);
                return (
                  <button
                    key={d}
                    onClick={() => handleToggleDigit(d)}
                    className={`py-2 rounded-lg font-mono text-sm font-black transition-all ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30 scale-105'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Common Preset Fast Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold">Dàn mẫu nhanh:</span>
              <button
                onClick={() => handleQuickPreset('64_dau')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold"
              >
                Dàn 64 Số (Đầu 0-7)
              </button>
              <button
                onClick={() => handleQuickPreset('36_cham27')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold"
              >
                Dàn 36 Số (Chạm 2, 7)
              </button>
              <button
                onClick={() => handleQuickPreset('50_chan')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold"
              >
                Dàn 50 Số Tổng Chẵn
              </button>
              <button
                onClick={() => handleQuickPreset('50_le')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold"
              >
                Dàn 50 Số Tổng Lẻ
              </button>
            </div>
          </div>
        )}

        {/* Input Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1 space-y-2">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Tên Dàn Số</label>
              <input
                type="text"
                value={inputSetName}
                onChange={(e) => setInputSetName(e.target.value)}
                placeholder={`Ví dụ: Dàn ${targetConfig.short} 36 VIP`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Ghi Chú (Tùy Chọn)</label>
              <input
                type="text"
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                placeholder="Ghi chú chiến thuật..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">
                Danh Sách Số (00 - 99): Phân tách bằng dấu phẩy, khoảng trắng, chấm...
              </label>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                recognizedCount > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-500'
              }`}>
                Đã nhận diện: {recognizedCount} số
              </span>
            </div>

            <textarea
              rows={3}
              value={inputTextNumbers}
              onChange={(e) => setInputTextNumbers(e.target.value)}
              placeholder="Dán hoặc gõ dãy số vào đây, ví dụ: 01, 02, 05, 12, 19, 23, 27, 34, 45, 56, 67, 78, 89, 90..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setInputSetName(''); setInputTextNumbers(''); setSelectedDigits(new Set()); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Xóa Trắng
              </button>
              <button
                onClick={handleAddNewSet}
                className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Lưu Dàn Số Vào {targetConfig.short}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SETS LIST & MULTI-ACTION TOOLBAR */}
      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
            >
              {sets.length > 0 && sets.every(s => checkedSetIds.has(s.id)) ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-600" />
              )}
              <span>Chọn Tất Cả ({sets.length} Dàn)</span>
            </button>

            {checkedSetIds.size > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                Đã chọn: {checkedSetIds.size} dàn
              </span>
            )}
          </div>

          {/* Batch Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySelected}
              disabled={checkedSetIds.size === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              {batchCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{batchCopied ? 'Đã Sao Chép!' : 'Sao Chép Các Dàn Đã Chọn'}</span>
            </button>

            <button
              onClick={handleMergeSelected}
              disabled={checkedSetIds.size < 2}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-40"
            >
              <Combine className="w-3.5 h-3.5" />
              <span>Gộp Thành 1 Dàn Mới</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              disabled={checkedSetIds.size === 0}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Đã Chọn</span>
            </button>
          </div>
        </div>

        {/* Sets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">Chọn</th>
                <th className="py-3 px-3">Tên Dàn Số</th>
                <th className="py-3 px-3 text-center">Số Lượng ($k$)</th>
                <th className="py-3 px-3 text-center">Chất Lượng Dàn</th>
                <th className="py-3 px-3 text-center">Hôm Nay ($T$)</th>
                <th className="py-3 px-3 text-center">Gan Hiện Tại</th>
                <th className="py-3 px-3 text-center">Gan Max (10 Năm)</th>
                <th className="py-3 px-3 text-center">Xác Suất Ngày Mai ($T+1$)</th>
                <th className="py-3 px-3 text-center">Xác Suất Khung 2N ($T+2$)</th>
                <th className="py-3 px-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {evaluatedSets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Chưa có dàn số nào cho mục tiêu này. Vui lòng nhập dàn số hoặc bấm "Khôi phục mẫu Firebase".
                  </td>
                </tr>
              ) : (
                evaluatedSets.map(set => {
                  const isSelected = set.id === selectedSetId;
                  const isChecked = checkedSetIds.has(set.id);
                  const st = set.stats;

                  return (
                    <tr
                      key={set.id}
                      onClick={() => setSelectedSetId(set.id)}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-l-4 border-l-amber-500 font-medium'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => { e.stopPropagation(); toggleSelectSet(set.id); }}>
                        <button className="text-slate-400 hover:text-white">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Set Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-xs">{set.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 font-mono">
                          {set.numbers.join(', ')}
                        </div>
                      </td>

                      {/* Count k */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-300">
                        {set.numbers.length} số
                      </td>

                      {/* Quality Rating */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          st?.qualityScore >= 75
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : st?.qualityScore >= 60
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {st?.tier || 'Đang tính'}
                        </span>
                      </td>

                      {/* Today Result */}
                      <td className="py-3 px-3 text-center">
                        {st?.today?.isHit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> TRÚNG ({st.today.prize})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle className="w-3 h-3 text-slate-500" /> Trượt ({st?.today?.prize || '--'})
                          </span>
                        )}
                      </td>

                      {/* Current Gan */}
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          (st?.currentGan || 0) === 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : (st?.currentGan || 0) > (st?.avgGan || 5) * 1.5
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'text-slate-200'
                        }`}>
                          {st?.currentGan ?? '--'} ngày
                        </span>
                      </td>

                      {/* Max Gan */}
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {st?.maxGan ?? '--'} ngày
                      </td>

                      {/* T+1 Probability */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                        {st?.theoretical?.pT1Percent}%
                        <span className="text-[10px] text-slate-400 block font-sans">
                          (Thực nghiệm: {st?.empirical?.empiricalRateT1}%)
                        </span>
                      </td>

                      {/* T+2 Probability */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">
                        {st?.theoretical?.pT1orT2Percent}%
                        <span className="text-[10px] text-slate-400 block font-sans">
                          (Khung 2 ngày)
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopySingle(set, false)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                            title="Sao chép tên dàn và các số"
                          >
                            {copiedId === set.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopySingle(set, true)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-[10px] font-bold"
                            title="Chỉ sao chép dãy số 01,02,03..."
                          >
                            Số
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(set.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-all"
                            title="Xóa dàn này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DEEP INSPECTOR & 5-YEAR GAN RHYTHM CHART OF SELECTED SET */}
      {activeSet && (
        <div className="space-y-6">
          {/* Header of Active Set */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{activeSet.name}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {activeSet.numbers.length} số ({targetConfig.short})
                </span>
                <span className="text-sm">{activeStats?.stars}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono line-clamp-1">
                {activeSet.numbers.join(', ')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopySingle(activeSet, true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Dãy Số
              </button>
              <button
                onClick={() => handleCopySingle(activeSet, false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
              >
                Copy Đầy Đủ
              </button>
            </div>
          </div>

          {/* 4 Probability & Gan Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Ngày Mai T+1 */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase">
                <span>Khả Năng Về Ngày Mai (T+1)</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {activeStats?.theoretical?.pT1Percent}%
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Xác suất lý thuyết: <strong className="text-slate-200 font-mono">{activeSet.numbers.length}%</strong></div>
                <div>Thực nghiệm sau {activeStats?.currentGan} ngày gan: <strong className="text-amber-300 font-mono">{activeStats?.empirical?.empiricalRateT1}%</strong></div>
              </div>
            </div>

            {/* Card 2: Khung 2 Ngày T+2 */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase">
                <span>Khung 2 Ngày (T+1 & T+2)</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {activeStats?.theoretical?.pT1orT2Percent}%
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Tích lũy 2 ngày: <strong className="text-slate-200 font-mono">1 - (1-P)²</strong></div>
                <div>Thực nghiệm khung 2N: <strong className="text-cyan-300 font-mono">{activeStats?.empirical?.empiricalRateT1orT2}%</strong></div>
              </div>
            </div>

            {/* Card 3: Gan Hiện Tại & Gan Max */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-rose-400 font-bold uppercase">
                <span>Trạng Thái Gan & Kỷ Lục</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">{activeStats?.currentGan}</span>
                <span className="text-xs text-slate-400">ngày chưa về</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Gan Max 10 năm: <strong className="text-rose-400 font-mono">{activeStats?.maxGan} ngày</strong></div>
                <div className="line-clamp-1">Kỷ lục: {activeStats?.maxGanPeriod}</div>
              </div>
            </div>

            {/* Card 4: Nhịp Gan 5 Năm (2021-2026) */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
                <span>Hiệu Suất 5 Năm Gần Nhất</span>
                <Award className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {ganRhythm5Y?.hitRate5Y}%
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Nổ trong 5 năm: <strong className="text-slate-200 font-mono">{ganRhythm5Y?.totalHits} / {ganRhythm5Y?.total5YearsDays} ngày</strong></div>
                <div>Gan Max 5 năm: <strong className="text-amber-300 font-mono">{ganRhythm5Y?.maxGan5Y} ngày</strong> ({ganRhythm5Y?.maxGanPeriod5Y})</div>
              </div>
            </div>
          </div>

          {/* 5. BIỂU ĐỒ NHỊP GAN 5 NĂM (2021 - 2026) CHI TIẾT */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/70 shadow-xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h4 className="text-base font-black text-white">
                    Biểu Đồ Nhịp Gan & Chu Kỳ Trong Vòng 5 Năm (2021 - 2026)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    5 Năm Thực Tế Firebase
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Đo lường độ dài các nhịp Gan, các đỉnh Gan cực đại và tần suất nổ qua từng tháng/năm từ 2021 đến 2026.
                </p>
              </div>

              {/* View Switcher & Year Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Mode */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-bold">
                  <button
                    onClick={() => setChartMetric('rhythm')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      chartMetric === 'rhythm' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tiến Trình Gan 5 Năm
                  </button>
                  <button
                    onClick={() => setChartMetric('distribution')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      chartMetric === 'distribution' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Phân Bố Độ Dài Nhịp Gan
                  </button>
                </div>

                {/* Year Filter */}
                {chartMetric === 'rhythm' && (
                  <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
                    {['all', '2026', '2025', '2024', '2023', '2022', '2021'].map(yr => (
                      <button
                        key={yr}
                        onClick={() => setChartYearFilter(yr)}
                        className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                          chartYearFilter === yr
                            ? 'bg-slate-800 text-amber-400 shadow'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {yr === 'all' ? 'Toàn Bộ 5 Năm' : yr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CHART DISPLAY */}
            {chartMetric === 'rhythm' ? (
              <div className="space-y-2">
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredTimelineChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ganRhythmGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="hitsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1 font-sans">
                                <div className="font-bold text-amber-400">{d.time} ({d.month})</div>
                                <div>Số lần nổ trong tháng: <strong className="text-emerald-400 font-mono">{d.hits} / {d.draws} kỳ ({d.hitRate}%)</strong></div>
                                <div>Gan Max trong tháng: <strong className="text-rose-400 font-mono">{d.maxGan} ngày</strong></div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Area type="monotone" dataKey="maxGan" name="Đỉnh Gan Max Trong Tháng (Ngày)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#ganRhythmGrad)" />
                      <Area type="monotone" dataKey="hits" name="Số Lần Nổ Trong Tháng" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#hitsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500 text-center italic">
                  * Biểu đồ mô phỏng độ cao nhịp Gan (đường màu vàng) và số lần nổ theo từng tháng từ 2021 đến 2026.
                </p>
              </div>
            ) : (
              /* Distribution of Gan Cycle Lengths */
              <div className="space-y-2">
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ganRhythm5Y?.distributionChartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1 font-sans">
                                <div className="font-bold text-amber-400">Nhịp Gan: {d.name}</div>
                                <div>Số lần xuất hiện trong 5 năm: <strong className="text-white font-mono">{d.count} lần</strong></div>
                                <div>Tỷ trọng trên tổng số lần nổ: <strong className="text-emerald-400 font-mono">{d.rate}%</strong></div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" name="Số Lần Nổ Ở Nhịp Này" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500 text-center italic">
                  * Phân bố độ dài nhịp Gan: Thể hiện dàn số này thường nổ ở nhịp bao nhiêu ngày (nhịp 0 ngày = ăn thông liên tiếp, nhịp 1 ngày = nổ lại sau 1 ngày nghỉ).
                </p>
              </div>
            )}

            {/* YEARLY BREAKDOWN TABLE (2021 - 2026) */}
            <div className="pt-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Bảng Thống Kê Chi Tiết Nhịp Gan & Tỉ Lệ Trúng Qua Từng Năm (2021 → 2026)
              </h5>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Năm</th>
                      <th className="py-2.5 px-4 text-center">Số Kỳ Quay</th>
                      <th className="py-2.5 px-4 text-center">Số Kỳ Nổ (Trúng)</th>
                      <th className="py-2.5 px-4 text-center">Tỉ Lệ Trúng (%)</th>
                      <th className="py-2.5 px-4 text-center">Gan Cực Đại (Max)</th>
                      <th className="py-2.5 px-4 text-center">Gan Trung Bình</th>
                      <th className="py-2.5 px-4 text-center">Chuỗi Nổ Thông Dài Nhất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {ganRhythm5Y?.yearlyStats?.map(row => (
                      <tr key={row.year} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-amber-400 font-sans">
                          Năm {row.year}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-300">
                          {row.totalDays} kỳ
                        </td>
                        <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">
                          {row.hits} kỳ
                        </td>
                        <td className="py-2.5 px-4 text-center font-extrabold text-white">
                          <span className={row.hitRate >= (activeSet.numbers.length) ? 'text-emerald-400' : 'text-slate-300'}>
                            {row.hitRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-rose-400">
                          {row.maxGan} ngày
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-300">
                          {row.avgGan} ngày
                        </td>
                        <td className="py-2.5 px-4 text-center text-amber-300 font-bold">
                          {row.maxWinStreak} ngày liên tiếp
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 6. INDIVIDUAL NUMBERS BREAKDOWN INSIDE ACTIVE SET */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-cyan-400" />
                  Chi Tiết Từng Số Trong Dàn ({activeSet.numbers.length} số)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Số lần về của từng con số trong lịch sử từ 2010 đến nay đối với {targetConfig.short}.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Về Nhiều Nhất
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Về Ít Nhất
                </span>
              </div>
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 font-mono">
              {activeStats?.sortedNumbers?.map((item, idx) => {
                const isTop = idx < 5;
                const isBottom = idx >= (activeStats.sortedNumbers.length - 5);

                return (
                  <div
                    key={item.num}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      isTop
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : isBottom
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-base font-black leading-none">{item.num}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{item.count} lần</div>
                    <div className="text-[9px] opacity-75">{item.rate}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
