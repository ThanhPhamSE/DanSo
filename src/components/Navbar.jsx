import React from 'react';
import { RefreshCw, BarChart2, Clock, RotateCcw, Sparkles, History, Settings, FlaskConical, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { TARGET_MODES } from '../utils/lotteryEngine';

export default function Navbar({
  activeTab,
  setActiveTab,
  mode,
  setMode,
  meta,
  onRefresh,
  onHardReset,
  isRefreshing,
  autoSyncStatus,
  latestDate
}) {
  // 4 Dedicated Dàn Số Screens + Màn Dàn 92-93 Số Khung 2 Ngày
  const dansoTabs = [
    { id: 'danso_db_tail', targetMode: 'db_tail', label: 'Dàn Đuôi ĐB (Đề)', icon: '🎯', highlight: true },
    { id: 'danso_db_head', targetMode: 'db_head', label: 'Dàn Đầu ĐB', icon: '👑', highlight: true },
    { id: 'danso_g1_tail', targetMode: 'g1_tail', label: 'Dàn Đuôi G1', icon: '🥇', highlight: true },
    { id: 'danso_g1_head', targetMode: 'g1_head', label: 'Dàn Đầu G1', icon: '⭐', highlight: true },
    { id: 'danso_khung2ngay', targetMode: mode || 'db_tail', label: 'Dàn 92-93 Số (Khung 2N)', icon: '🔥', highlight: true, special: true }
  ];

  const generalTabs = [
    { id: 'dashboard', label: 'Tổng Quan', icon: BarChart2 },
    { id: 'forecast', label: 'Dự Phóng T+1 & T+2', icon: Sparkles },
    { id: 'frequency', label: 'Tần Suất 00-99', icon: BarChart2 },
    { id: 'gan', label: 'Thống Kê Gan', icon: Clock },
    { id: 'cycle', label: 'Chu Kỳ', icon: RotateCcw },
    { id: 'backtest', label: 'Kiểm Định Backtest', icon: FlaskConical },
    { id: 'history', label: 'Lịch Sử Kết Quả', icon: History },
    { id: 'settings', label: 'Đồng Bộ Firebase', icon: Settings }
  ];

  const handleSelectDansoTab = (tab) => {
    setActiveTab(tab.id);
    setMode(tab.targetMode);
  };

  // Determine data freshness badge
  const getTodayVN = () => {
    const utc7 = new Date(Date.now() + 7 * 60 * 60 * 1000);
    return utc7.toISOString().slice(0, 10);
  };
  const today = getTodayVN();
  const isDataFresh = latestDate === today;
  const isDataYesterday = latestDate === (() => {
    const d = new Date(today + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 transition-all shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Auto-Sync Status Banner */}
        {autoSyncStatus && (
          <div className={`py-2 px-4 text-xs font-bold flex items-center gap-2 border-b ${
            autoSyncStatus.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : autoSyncStatus.type === 'error'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
          }`}>
            {autoSyncStatus.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : autoSyncStatus.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-spin" />
            )}
            {autoSyncStatus.message}
          </div>
        )}

        {/* Top Header Row */}
        <div className="py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/60">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              XS
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Phân Tích Xác Suất <span className="text-amber-400">Xổ Số Lịch Sử</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Firebase Realtime
                </span>

                {/* Data freshness pill */}
                {latestDate && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    isDataFresh
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isDataYesterday
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {isDataFresh ? '🟢' : isDataYesterday ? '🟡' : '🔴'} Dữ liệu: {latestDate}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Từ <strong className="text-slate-200">2010 đến nay</strong> ({meta?.audit?.totalRecords?.toLocaleString() || '6.000+'} kỳ) •
                Đồng bộ: <strong className={meta?.source === 'firebase_online' || meta?.source === 'firebase_incremental' ? 'text-emerald-400' : 'text-amber-400'}>
                  {meta?.source === 'firebase_incremental' ? 'Cập nhật tự động' :
                   meta?.source === 'firebase_online' ? 'Firebase trực tiếp' :
                   meta?.source === 'cache_pending_today' ? 'Chờ kết quả hôm nay...' :
                   'Cache local'}
                </strong>
                {meta?.lastSync && (
                  <span className="text-slate-500"> • {new Date(meta.lastSync).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Target Mode Selector + Sync Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex flex-wrap items-center gap-1">
              {TARGET_MODES.map(tgt => {
                const isActive = mode === tgt.id;
                return (
                  <button
                    key={tgt.id}
                    onClick={() => {
                      setMode(tgt.id);
                      if (activeTab.startsWith('danso_')) {
                        setActiveTab(`danso_${tgt.id}`);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{tgt.icon}</span>
                    <span>{tgt.short}</span>
                  </button>
                );
              })}
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Đồng bộ dữ liệu mới nhất từ Firebase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Đang tải...' : 'Đồng bộ'}</span>
            </button>

            {/* Hard Reset Button */}
            {onHardReset && (
              <button
                onClick={onHardReset}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800 text-slate-500 hover:text-rose-400 text-xs transition-all disabled:opacity-50"
                title="Xóa cache & tải lại toàn bộ từ Firebase"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 overflow-x-auto scrollbar-thin">

          {/* Section 1: 4 MÀN DÀN SỐ RIÊNG BIỆT */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-900/90 p-1 rounded-xl border border-amber-500/30">
            <div className="px-2 text-[10px] font-black uppercase text-amber-400 tracking-wider hidden sm:block">
              4 MÀN DÀN SỐ:
            </div>
            {dansoTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectDansoTab(tab)}
                  className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section 2: CÁC CÔNG CỤ PHÂN TÍCH CHUNG */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
            {generalTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white shadow border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                  {tab.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </header>
  );
}
