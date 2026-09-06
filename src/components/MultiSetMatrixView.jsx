import React, { useState, useMemo } from 'react';
import { buildMultiSetDailyMatrix } from '../utils/lotteryEngine';
import { Calendar, Eye, Sparkles, TrendingDown } from 'lucide-react';

// ─── Helper: compute monthly summary matrix ───────────────────────────────────
// Returns array of { monthKey: 'YYYY-MM', label: 'T01/26', setResults: { setId: {hits, total} } }
function buildMonthlyMatrix(historyData, setList, limitDays, mode = 'de') {
  const sliced = historyData.slice(0, limitDays);
  const monthMap = {};

  sliced.forEach(day => {
    const monthKey = day.d.substring(0, 7);
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { monthKey, total: 0, setResults: {} };
      setList.forEach(s => { monthMap[monthKey].setResults[s.id] = { hits: 0, total: 0, hitNums: [] }; });
    }
    monthMap[monthKey].total++;
    setList.forEach(setItem => {
      const setObj = new Set(setItem.numbers);
      monthMap[monthKey].setResults[setItem.id].total++;
      let dayHits = [];
      if (mode === 'de') {
        if (setObj.has(day.db)) dayHits.push(day.db);
      } else {
        dayHits = day.lo.filter(n => setObj.has(n));
      }
      monthMap[monthKey].setResults[setItem.id].hits += dayHits.length > 0 ? 1 : 0;
      if (dayHits.length > 0) monthMap[monthKey].setResults[setItem.id].hitNums.push(...dayHits);
    });
  });

  return Object.values(monthMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

// ─── Filter options ────────────────────────────────────────────────────────────
const DAY_OPTS = [
  { label: '15N', days: 15 },
  { label: '30N', days: 30 },
  { label: '45N', days: 45 },
  { label: '60N', days: 60 },
];
const YEAR_OPTS = [
  { label: '1 Năm', days: 365 },
  { label: '2 Năm', days: 730 },
  { label: '3 Năm', days: 1095 },
  { label: '4 Năm', days: 1460 },
  { label: '5 Năm', days: 1825 },
];

export default function MultiSetMatrixView({ historyData, savedSets, multiSetAnalysis, onSelectActiveSet }) {
  const [selectedDays, setSelectedDays] = useState(30);
  const isYearMode = selectedDays >= 365;

  if (!historyData || historyData.length === 0 || !savedSets || savedSets.length === 0) return null;

  // Daily matrix (for ≤60d views)
  const dailyMatrix = useMemo(() => {
    if (isYearMode) return [];
    return buildMultiSetDailyMatrix(historyData, savedSets, selectedDays, 'de');
  }, [historyData, savedSets, selectedDays, isYearMode]);

  // Monthly matrix (for year views)
  const monthlyMatrix = useMemo(() => {
    if (!isYearMode) return [];
    return buildMonthlyMatrix(historyData, savedSets, selectedDays);
  }, [historyData, savedSets, selectedDays, isYearMode]);

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════════════════════════════
          BẢNG MA TRẬN KIỂU THỜI KHÓA BIỂU
          ══════════════════════════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Bảng VỀ / XỊT — Kiểu Thời Khóa Biểu
            </h3>
            <p className="text-xs text-slate-400">
              {isYearMode
                ? 'Tổng hợp theo tháng · Số trong ô = số ngày ĂN / tổng ngày'
                : 'Từng ngày quay · Cột = ngày | Hàng = từng dàn số'}
            </p>
          </div>

          {/* ── Filter Buttons ── */}
          <div className="flex flex-col gap-1.5 items-end">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <span>NGÀY:</span>
              <div className="bg-slate-900 p-0.5 rounded-xl border border-slate-800 flex">
                {DAY_OPTS.map(opt => (
                  <button key={opt.label} onClick={() => setSelectedDays(opt.days)}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold ${
                      selectedDays === opt.days
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <span>NĂM:</span>
              <div className="bg-slate-900 p-0.5 rounded-xl border border-slate-800 flex">
                {YEAR_OPTS.map(opt => (
                  <button key={opt.label} onClick={() => setSelectedDays(opt.days)}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold ${
                      selectedDays === opt.days
                        ? 'bg-violet-500 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-10 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black shadow">ĂN</span>
            Dàn về
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-10 h-6 rounded-md bg-rose-700 flex items-center justify-center text-white text-[10px] font-black shadow">XỊT</span>
            Không về
          </span>
          {isYearMode && (
            <span className="flex items-center gap-1.5">
              <span className="w-12 h-6 rounded-md bg-amber-600/40 border border-amber-500/40 flex items-center justify-center text-amber-200 text-[9px] font-black">3/26</span>
              Số ngày ĂN / tổng tháng
            </span>
          )}
        </div>

        {/* ══ DAILY TABLE (≤60 ngày) ═══════════════════════════════════ */}
        {!isYearMode && (
          <div className="overflow-x-auto rounded-xl border border-slate-800 select-none">
            <table className="text-xs border-collapse" style={{ minWidth: `${160 + dailyMatrix.length * 54}px` }}>
              <thead>
                <tr className="bg-slate-900/95 border-b border-slate-800">
                  <th className="sticky left-0 z-20 bg-slate-900 px-4 py-3 text-left text-slate-400 font-bold min-w-[160px] border-r border-slate-800">
                    Dàn Số \ Ngày
                  </th>
                  {dailyMatrix.map((row) => (
                    <th key={row.date} className="px-1 py-2 text-center min-w-[52px] border-r border-slate-800/50">
                      <div className="text-[10px] text-slate-400 font-semibold">{row.date.slice(5)}</div>
                      <div className="text-amber-300 font-black font-mono text-xs">{row.db}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savedSets.map((setItem, rowIdx) => (
                  <tr key={setItem.id} className={`border-b border-slate-800/60 ${rowIdx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40'}`}>
                    <td className="sticky left-0 z-10 px-3 py-2 border-r border-slate-800 min-w-[160px]"
                        style={{ background: rowIdx % 2 === 0 ? '#030712' : 'rgba(15,23,42,0.6)' }}>
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <div className="font-bold text-white text-xs leading-tight">{setItem.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{setItem.numbers.length} số</div>
                        </div>
                        <button onClick={() => onSelectActiveSet(setItem.id)}
                          className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex-shrink-0">
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    {dailyMatrix.map((row) => {
                      const res = row.setResults?.[setItem.id];
                      const isHit = res?.isHit;
                      const hits = res?.dayHits || [];
                      return (
                        <td key={row.date} className="p-0.5 text-center border-r border-slate-800/30"
                            title={`${row.date}: ${isHit ? `VỀ SỐ ${hits.join(',')}` : 'XỊT'}`}>
                          {isHit ? (
                            <div className="flex flex-col items-center justify-center rounded-md bg-emerald-500 hover:bg-emerald-400 transition-colors h-9">
                              <span className="text-[8px] font-black text-white leading-none">ĂN</span>
                              <span className="text-[11px] font-black text-white leading-none font-mono">{hits[0]}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center rounded-md bg-rose-700/70 hover:bg-rose-600/80 transition-colors h-9">
                              <span className="text-[9px] font-black text-rose-100 leading-none">XỊT</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ MONTHLY TABLE (year mode) ════════════════════════════════ */}
        {isYearMode && (
          <div className="overflow-x-auto rounded-xl border border-slate-800 select-none">
            <table className="text-xs border-collapse" style={{ minWidth: `${160 + monthlyMatrix.length * 72}px` }}>
              <thead>
                <tr className="bg-slate-900/95 border-b border-slate-800">
                  <th className="sticky left-0 z-20 bg-slate-900 px-4 py-3 text-left text-slate-400 font-bold min-w-[160px] border-r border-slate-800">
                    Dàn Số \ Tháng
                  </th>
                  {monthlyMatrix.map(m => (
                    <th key={m.monthKey} className="px-1.5 py-2 text-center min-w-[72px] border-r border-slate-800/50">
                      <div className="text-[10px] text-slate-300 font-bold">
                        {m.monthKey.slice(5)}/{m.monthKey.slice(2, 4)}
                      </div>
                      <div className="text-[9px] text-slate-500">{m.total} ngày</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savedSets.map((setItem, rowIdx) => (
                  <tr key={setItem.id} className={`border-b border-slate-800/60 ${rowIdx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40'}`}>
                    <td className="sticky left-0 z-10 px-3 py-2 border-r border-slate-800 min-w-[160px]"
                        style={{ background: rowIdx % 2 === 0 ? '#030712' : 'rgba(15,23,42,0.6)' }}>
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <div className="font-bold text-white text-xs leading-tight">{setItem.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{setItem.numbers.length} số</div>
                        </div>
                        <button onClick={() => onSelectActiveSet(setItem.id)}
                          className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex-shrink-0">
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    {monthlyMatrix.map(m => {
                      const res = m.setResults[setItem.id];
                      const hitPct = res ? Math.round((res.hits / res.total) * 100) : 0;
                      const hitCount = res?.hits || 0;
                      const noHit = hitCount === 0;

                      // Color intensity based on hit rate
                      let bgClass = 'bg-rose-800/60';
                      let textClass = 'text-rose-200';
                      if (!noHit) {
                        if (hitPct >= 70) { bgClass = 'bg-emerald-500'; textClass = 'text-white'; }
                        else if (hitPct >= 40) { bgClass = 'bg-emerald-600/80'; textClass = 'text-emerald-100'; }
                        else { bgClass = 'bg-emerald-800/60'; textClass = 'text-emerald-200'; }
                      }

                      return (
                        <td key={m.monthKey} className="p-0.5 text-center border-r border-slate-800/30"
                            title={`${m.monthKey}: ${hitCount} ngày ĂN / ${res?.total || 0} ngày | ${hitPct}%`}>
                          <div className={`flex flex-col items-center justify-center rounded-md ${bgClass} transition-colors h-10 px-1`}>
                            {noHit ? (
                              <span className="text-[9px] font-black text-rose-300 leading-none">XỊT</span>
                            ) : (
                              <>
                                <span className={`text-[10px] font-black ${textClass} leading-none`}>{hitCount}/{res?.total}</span>
                                <span className={`text-[9px] font-bold ${textClass} opacity-80 leading-none`}>{hitPct}%</span>
                              </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-slate-500 text-right">
          * Bảng có thể cuộn ngang · Click <Eye className="w-3 h-3 inline text-amber-400" /> để soi phân tích riêng từng dàn
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          THẺ CHI TIẾT TỪNG DÀN — KPI + Max Gan + 10 Kỳ gần nhất
          ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Chi Tiết Từng Dàn
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {multiSetAnalysis?.map((setItem) => {
            const stats = setItem.stats;
            const history10 = stats?.historyDetails?.slice(0, 10) || [];
            const todayHit = setItem.todayResult.isHit;
            const mgp = stats?.maxGanPeriod;

            return (
              <div key={setItem.id}
                className={`glass-card rounded-2xl p-4 border space-y-3 transition-all hover:border-amber-500/40 ${
                  todayHit ? 'border-emerald-500/40 bg-emerald-500/[0.03]' : 'border-slate-800'
                }`}
              >
                {/* Set Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-white">{setItem.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        todayHit
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {todayHit ? `🎯 HÔM NAY VỀ ${setItem.todayResult.hits.join(',')}` : '❌ HÔM NAY XỊT'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{setItem.count} số · {stats?.totalDays} ngày phân tích</p>
                  </div>
                  <button onClick={() => onSelectActiveSet(setItem.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1 transition-all flex-shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    Soi chi tiết
                  </button>
                </div>

                {/* KPIs row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Tỉ Lệ Trúng</div>
                    <div className="text-sm font-extrabold text-emerald-400 font-mono">{stats?.hitRatePercent}%</div>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Gan Hiện Tại</div>
                    <div className={`text-sm font-bold font-mono ${
                      (stats?.currentGan || 0) >= (stats?.maxGan || 99) * 0.8 ? 'text-rose-400' :
                      (stats?.currentGan || 0) > 3 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {stats?.currentGan} ngày
                    </div>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Avg Chu Kỳ</div>
                    <div className="text-sm font-bold text-violet-400 font-mono">{stats?.avgInterval}N</div>
                  </div>
                </div>

                {/* ── MAX GAN BOX ── */}
                {mgp && (
                  <div className="rounded-xl bg-rose-950/50 border border-rose-800/50 p-3 flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-rose-300 font-bold uppercase tracking-wide">Gan Dài Nhất (Max Gan)</div>
                      <div className="text-sm font-extrabold text-rose-300 font-mono">
                        {mgp.maxGan} ngày liên tiếp xịt
                      </div>
                      <div className="text-[10px] text-rose-400/80 font-mono mt-0.5">
                        Từ <span className="text-rose-200 font-bold">{mgp.startDate}</span>
                        {' → '}
                        <span className="text-rose-200 font-bold">{mgp.endDate}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Numbers chips */}
                <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto p-1.5 rounded-lg bg-slate-950/60 border border-slate-900">
                  {setItem.numbers.map(num => (
                    <span key={num} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[10px] font-bold">
                      {num}
                    </span>
                  ))}
                </div>

                {/* 10-day mini TKB strip */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 mb-1.5">10 kỳ quay gần nhất:</div>
                  <div className="flex gap-1">
                    {history10.map((hDay) => (
                      <div key={hDay.date}
                        title={`${hDay.date}: ${hDay.isHit ? `VỀ ${hDay.db}` : 'XỊT'}`}
                        className={`flex-1 rounded-md flex flex-col items-center justify-center py-1.5 border ${
                          hDay.isHit
                            ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/20'
                            : 'bg-rose-700/70 border-rose-600/50'
                        }`}>
                        <span className="text-[8px] font-bold text-white/80">{hDay.date?.slice(8)}</span>
                        <span className="text-[10px] font-black text-white leading-tight">
                          {hDay.isHit ? hDay.db : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
