import React from 'react';
import { Sparkles, CheckCircle2, XCircle, Trophy, Calendar } from 'lucide-react';

export default function TodayResultBanner({ latestData, multiSetAnalysis }) {
  if (!latestData || !multiSetAnalysis) return null;

  const { d: date, db } = latestData;
  const totalSets = multiSetAnalysis.length;
  const hitSets = multiSetAnalysis.filter(s => s.todayResult.isHit);
  const missSets = multiSetAnalysis.filter(s => !s.todayResult.isHit);

  return (
    <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 relative overflow-hidden shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Today's Winning Number Highlight */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex flex-col items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 border border-amber-300">
            <span className="text-[10px] font-black uppercase tracking-wider">ĐẮC BIỆT</span>
            <span className="text-2xl font-black font-mono leading-none">{db}</span>
          </div>

          <div>
            <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              KẾT QUẢ XSMB MỚI NHẤT: {date}
            </div>
            <h2 className="text-lg font-extrabold text-white mt-0.5">
              Số Đề Về Hôm Nay: <span className="text-amber-300 font-mono text-xl">{db}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Đối chiếu trực tiếp với <strong className="text-slate-200">{totalSets} dàn số</strong> của bạn
            </p>
          </div>
        </div>

        {/* Multi-Set Hit Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Dàn Nổ Hôm Nay</div>
            <div className="text-lg font-extrabold text-emerald-400 font-mono">
              {hitSets.length} / {totalSets} dàn
            </div>
          </div>

          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Dàn Xịt</div>
            <div className="text-lg font-extrabold text-rose-400 font-mono">
              {missSets.length} dàn
            </div>
          </div>
        </div>

      </div>

      {/* Multi-Set Live Hits Checklist */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
        {multiSetAnalysis.map(setItem => (
          <div
            key={setItem.id}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              setItem.todayResult.isHit
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {setItem.todayResult.isHit ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-500" />
            )}
            <span>{setItem.name}:</span>
            <strong className={setItem.todayResult.isHit ? 'text-emerald-300 font-mono' : 'text-slate-500 font-mono'}>
              {setItem.todayResult.isHit ? `NỔ SỐ ${setItem.todayResult.hits.join(', ')}` : 'XỊT'}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
