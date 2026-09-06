import React, { useState } from 'react';
import { Filter, Scissors, Copy, Check, Sparkles } from 'lucide-react';

export default function OptimizerPanel({ stats, onApplyTrimmedSet }) {
  const [targetCount, setTargetCount] = useState(40);
  const [copied, setCopied] = useState(false);

  if (!stats) return null;

  const { sortedNumberStats, dansoCount } = stats;

  // Filter top N numbers
  const trimmedSet = sortedNumberStats.slice(0, targetCount).map(item => item.num).sort((a, b) => parseInt(a) - parseInt(b));

  const handleCopyTrimmed = () => {
    navigator.clipboard.writeText(trimmedSet.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            Công Cụ Hạ Dàn Tối Ưu Tỉ Lệ (Hạ 5X xuống 4X, 3X)
          </h3>
          <p className="text-xs text-slate-400">
            Lọc ra các con số có tần suất phong độ nổ cao nhất trong dàn {dansoCount} số của bạn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-bold">Chọn số lượng muốn hạ:</span>
          <select
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-amber-400 rounded-xl px-3 py-1.5 text-xs font-bold font-mono focus:outline-none"
          >
            <option value={45}>Hạ xuống Dàn 45 số</option>
            <option value={40}>Hạ xuống Dàn 40 số (4X)</option>
            <option value={36}>Hạ xuống Dàn 36 số (3X)</option>
            <option value={30}>Hạ xuống Dàn 30 số</option>
            <option value={20}>Hạ xuống Dàn 20 số (VIP)</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Kết quả Dàn Hạ {trimmedSet.length} Số Phong Độ Cao:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApplyTrimmedSet(trimmedSet.join(', '))}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow"
            >
              Áp dụng phân tích dàn này
            </button>
            <button
              onClick={handleCopyTrimmed}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 max-h-32 overflow-y-auto">
          {trimmedSet.map(num => (
            <span key={num} className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs font-bold flex items-center justify-center">
              {num}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
