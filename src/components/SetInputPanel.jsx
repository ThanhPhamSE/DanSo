import React, { useState, useRef } from 'react';
import { Sliders, Calendar, Sparkles, Trash2, FileText, CheckCircle2, FileSpreadsheet, Upload, Download, AlertCircle, FileUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseBulkSetsText } from '../utils/lotteryEngine';

export default function SetInputPanel({
  rawInputText,
  setRawInputText,
  daysLimit,
  setDaysLimit,
  mode,
  setMode
}) {
  const parsedSets = parseBulkSetsText(rawInputText);
  const fileInputRef = useRef(null);

  const [importStatus, setImportStatus] = useState(null); // { type: 'success'|'error', message: '' }
  const [isDragging, setIsDragging] = useState(false);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'

  const handleClear = () => {
    setRawInputText('');
    setImportStatus(null);
  };

  const handleLoadSampleText = () => {
    const sample = `84,89,93,94,98,41,42,46,47,01,14,23,24,64,74,78,90
28,37,55,73,82,91,01,04,31,48,51,59,71,81,93,03,30
00,02,04,06,08,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98`;
    setRawInputText(sample);
    setImportStatus({ type: 'success', message: 'Đã nạp dàn số mẫu thử thành công!' });
  };

  // Helper to process Excel File
  const processExcelFile = async (file) => {
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setImportStatus({
        type: 'error',
        message: 'File không hợp lệ! Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv).'
      });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      let extractedLines = [];

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        rows.forEach((row) => {
          if (!Array.isArray(row) || row.length === 0) return;

          // Join row items to find all 2-digit numbers
          const rowText = row
            .map(cell => String(cell).trim())
            .filter(Boolean)
            .join(' ');

          if (!rowText) return;

          // Find all 1 or 2 digit numbers
          const numbers = rowText.match(/\b\d{1,2}\b/g);
          if (numbers && numbers.length > 0) {
            const formattedRow = numbers.map(n => n.padStart(2, '0'));
            extractedLines.push(formattedRow.join(','));
          }
        });
      });

      if (extractedLines.length === 0) {
        setImportStatus({
          type: 'error',
          message: `Không tìm thấy dàn số hợp lệ nào trong file "${file.name}".`
        });
        return;
      }

      const newText = extractedLines.join('\n');

      if (importMode === 'replace' || !rawInputText.trim()) {
        setRawInputText(newText);
      } else {
        setRawInputText(prev => prev.trim() + '\n' + newText);
      }

      setImportStatus({
        type: 'success',
        message: `Đã nhập thành công ${extractedLines.length} dàn số từ file "${file.name}"!`
      });
    } catch (err) {
      console.error('Lỗi khi đọc file Excel:', err);
      setImportStatus({
        type: 'error',
        message: 'Lỗi khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file!'
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
    // Reset file input value so re-selecting same file triggers change
    if (e.target) e.target.value = '';
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // Export current sets to Excel sample
  const handleExportExcelSample = () => {
    const sampleData = [
      ['Tên Dàn (Tùy chọn)', 'Danh Sách Số (Cách nhau bởi dấu phẩy hoặc khoảng trắng)'],
      ['Dàn 1 - Dàn 17 số', '84, 89, 93, 94, 98, 41, 42, 46, 47, 01, 14, 23, 24, 64, 74, 78, 90'],
      ['Dàn 2 - Dàn 17 số', '28, 37, 55, 73, 82, 91, 01, 04, 31, 48, 51, 59, 71, 81, 93, 03, 30'],
      ['Dàn 3 - Dàn 50 số Chẵn', '00, 02, 04, 06, 08, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98']
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanSo_Mau');
    XLSX.writeFile(wb, 'DanSo_Mau_Nhap_Excel.xlsx');
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`glass-card rounded-2xl p-5 sm:p-6 border transition-all duration-300 relative overflow-hidden space-y-4 ${
        isDragging
          ? 'border-amber-400 bg-amber-500/10 shadow-2xl ring-4 ring-amber-500/20'
          : 'border-slate-800 shadow-xl'
      }`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center border-2 border-dashed border-amber-400 rounded-2xl p-6 text-center space-y-3">
          <Upload className="w-12 h-12 text-amber-400 animate-bounce" />
          <h3 className="text-lg font-bold text-white">Thả file Excel (.xlsx, .xls, .csv) vào đây</h3>
          <p className="text-xs text-amber-200/80">Hệ thống sẽ tự động trích xuất các dàn số</p>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            Nhập Các Dàn Số Soi Cầu (Mỗi Dàn 1 Dòng)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dán danh sách dàn số hoặc <strong className="text-amber-400">Import từ file Excel (.xlsx, .csv)</strong>.
          </p>
        </div>

        {/* Mode & Date Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mode Selector */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setMode('de')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'de'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎯 Đề (Giải ĐB)
            </button>
            <button
              onClick={() => setMode('lo')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'lo'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎰 Lô (27 Giải)
            </button>
          </div>

          {/* Year Limit Buttons */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { label: '1 Năm',  val: '365'  },
                { label: '2 Năm',  val: '730'  },
                { label: '3 Năm',  val: '1095' },
                { label: '4 Năm',  val: '1460' },
                { label: '5 Năm',  val: '1825' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setDaysLimit(opt.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    daysLimit === opt.val
                      ? 'bg-violet-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Import Status Alert Banner */}
      {importStatus && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
            importStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
          <button
            onClick={() => setImportStatus(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Excel Toolbar & Import Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
        {/* Left: Excel Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Nhập Từ Excel / CSV
          </button>

          <button
            onClick={handleExportExcelSample}
            title="Tải file mẫu Excel chuẩn"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Tải File Mẫu Excel
          </button>
        </div>

        {/* Right: Import Mode Selection */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 hidden sm:inline">Chế độ nạp Excel:</span>
          <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
            <button
              onClick={() => setImportMode('append')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                importMode === 'append'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ➕ Thêm tiếp vào dàn
            </button>
            <button
              onClick={() => setImportMode('replace')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                importMode === 'replace'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔄 Ghi đè thay thế
            </button>
          </div>
        </div>
      </div>

      {/* SINGLE TEXTAREA FOR ALL SETS */}
      <div className="relative">
        <textarea
          rows={6}
          value={rawInputText}
          onChange={(e) => setRawInputText(e.target.value)}
          placeholder={`Dán các dàn số vào đây hoặc kéo thả file Excel vào khung:

84,89,93,94,98,41,42,46,47,01,14,23,24,64,74,78,90
28,37,55,73,82,91,01,04,31,48,51,59,71,81,93,03,30
00,02,04,06,08,10,12,14,16,18,20,22,24,26,28,30,32,34...`}
          className="w-full bg-slate-950/90 border border-slate-800 focus:border-amber-500 rounded-xl p-4 text-xs font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-y placeholder:text-slate-600"
        />

        {/* Live Set Counter Badge */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono shadow-sm">
            Đã nạp: {parsedSets.length} dàn số
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSampleText}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Nạp Dàn Mẫu Thử
          </button>
          <button
            onClick={handleClear}
            disabled={!rawInputText}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa khung nhập
          </button>
        </div>

        <div className="text-slate-400 text-[11px]">
          Mẹo: Bạn có thể copy từ Zalo hoặc <strong className="text-slate-300">kéo thả file Excel trực tiếp</strong> vào khung trên.
        </div>
      </div>

    </div>
  );
}

