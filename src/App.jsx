import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardOverview from './components/DashboardOverview';
import ForecastT1T2View from './components/ForecastT1T2View';
import FrequencyView from './components/FrequencyView';
import GanView from './components/GanView';
import CycleView from './components/CycleView';
import DanSoDedicatedView from './components/DanSoDedicatedView';
import Khung2NgayView from './components/Khung2NgayView';
import BaCangAnalyticsView from './components/BaCangAnalyticsView';
import BacktestView from './components/BacktestView';
import HistoryResultView from './components/HistoryResultView';
import SettingsSyncView from './components/SettingsSyncView';

import { loadLotteryData, clearDataCache, checkAndSyncNewDraws, addOrUpdateManualRecord } from './services/dataService';

export default function App() {
  const [activeTab, setActiveTab] = useState('danso_db_tail');
  const [mode, setMode] = useState('db_tail'); // 'db_tail' | 'db_head' | 'g1_tail' | 'g1_head'
  const [historyData, setHistoryData] = useState([]);
  const [syncMeta, setSyncMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoSyncStatus, setAutoSyncStatus] = useState(null); // { type, message }

  // Helper: get today in Vietnam (UTC+7)
  const getTodayVN = () => {
    const now = new Date();
    const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return utc7.toISOString().slice(0, 10);
  };

  // Initial load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const { records, meta } = await loadLotteryData(false);
        setHistoryData(records);
        setSyncMeta(meta);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Auto-refresh: lightweight check every 60 seconds directly against Firebase Realtime DB
  useEffect(() => {
    if (isLoading || historyData.length === 0) return;

    const currentLatest = historyData[0]?.d;

    const runAutoCheck = async () => {
      try {
        const res = await checkAndSyncNewDraws(currentLatest);
        if (res.hasNew && res.records && res.records.length > 0) {
          setHistoryData(res.records);
          setSyncMeta(res.meta);
          setAutoSyncStatus({
            type: 'success',
            message: `🎉 Tự động cập nhật kỳ quay mới ngày ${res.newDate}! (Tổng ${res.records.length.toLocaleString()} kỳ)`
          });
          setTimeout(() => setAutoSyncStatus(null), 6000);
        }
      } catch (err) {
        console.warn('Auto check error:', err);
      }
    };

    // Run first check 2 seconds after load
    const initialTimer = setTimeout(runAutoCheck, 2000);
    // Poll every 60 seconds for 24/7 realtime updates
    const interval = setInterval(runAutoCheck, 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [historyData, isLoading]);

  // Handle manual refresh (force full sync from Firebase)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setAutoSyncStatus({ type: 'info', message: 'Đang kết nối Firebase và đồng bộ dữ liệu...' });
    try {
      const { records, meta } = await loadLotteryData(true);
      if (records && records.length > 0) {
        setHistoryData(records);
        setSyncMeta(meta);
        setAutoSyncStatus({
          type: 'success',
          message: `✅ Đồng bộ thành công! Dữ liệu mới nhất: ${records[0]?.d} (${records.length.toLocaleString()} kỳ).`
        });
        setTimeout(() => setAutoSyncStatus(null), 5000);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setAutoSyncStatus({ type: 'error', message: `Lỗi đồng bộ: ${err.message}` });
      setTimeout(() => setAutoSyncStatus(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle clear cache + hard reload
  const handleHardReset = async () => {
    clearDataCache();
    setHistoryData([]);
    setSyncMeta(null);
    setIsLoading(true);
    try {
      const { records, meta } = await loadLotteryData(true);
      setHistoryData(records);
      setSyncMeta(meta);
    } catch (err) {
      console.error('Hard reset failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAddRecord = (record) => {
    const res = addOrUpdateManualRecord(record);
    if (res && res.records) {
      setHistoryData(res.records);
      setSyncMeta(res.meta);
      setAutoSyncStatus({
        type: 'success',
        message: `✅ Đã bổ sung thành công kết quả ngày ${record.d}! (ĐB: ${record.sp}, G1: ${record.fp})`
      });
      setTimeout(() => setAutoSyncStatus(null), 6000);
    }
  };

  // 4 dedicated Dàn Số screens mapped to their targetMode
  const dansoScreens = [
    { tabId: 'danso_db_tail', targetMode: 'db_tail' },
    { tabId: 'danso_db_head', targetMode: 'db_head' },
    { tabId: 'danso_g1_tail', targetMode: 'g1_tail' },
    { tabId: 'danso_g1_head', targetMode: 'g1_head' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      {/* Navigation & Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={mode}
        setMode={setMode}
        meta={syncMeta}
        onRefresh={handleRefresh}
        onHardReset={handleHardReset}
        isRefreshing={isRefreshing}
        autoSyncStatus={autoSyncStatus}
        latestDate={historyData[0]?.d || ''}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="glass-card rounded-2xl p-16 text-center border border-slate-800 space-y-4 my-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="text-base font-bold text-white">Đang tải và chuẩn hóa dữ liệu từ Firebase...</h3>
            <p className="text-xs text-slate-400">Khảo sát hơn 6.000 kỳ quay từ năm 2010 đến nay</p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4 my-12">
            <p className="text-sm text-rose-400 font-bold">Chưa tải được dữ liệu xổ số từ Firebase.</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Thử Lại
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn">

            {/* ===================== 4 MÀN DÀN SỐ RIÊNG BIỆT ===================== */}
            {dansoScreens.map(({ tabId, targetMode }) =>
              activeTab === tabId ? (
                <DanSoDedicatedView
                  key={tabId}
                  targetMode={targetMode}
                  historyData={historyData}
                />
              ) : null
            )}

            {/* ===================== MÀN DÀN 92-93 SỐ KHUNG MAX 2 NGÀY ===================== */}
            {activeTab === 'danso_khung2ngay' && (
              <Khung2NgayView
                historyData={historyData}
                currentMode={mode}
                setMode={setMode}
              />
            )}

            {/* ===================== MÀN XÁC SUẤT 3 CÀNG (ĐB & G1) ===================== */}
            {activeTab === 'bacang' && (
              <BaCangAnalyticsView
                historyData={historyData}
              />
            )}

            {/* ===================== DASHBOARD ===================== */}
            {activeTab === 'dashboard' && (
              <DashboardOverview
                historyData={historyData}
                mode={mode}
                savedSets={[]}
                meta={syncMeta}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* ===================== FORECAST T+1 & T+2 ===================== */}
            {activeTab === 'forecast' && (
              <ForecastT1T2View
                historyData={historyData}
                savedSets={[]}
                mode={mode}
              />
            )}

            {/* ===================== FREQUENCY 00-99 ===================== */}
            {activeTab === 'frequency' && (
              <FrequencyView
                historyData={historyData}
                mode={mode}
              />
            )}

            {/* ===================== GAN STATS ===================== */}
            {activeTab === 'gan' && (
              <GanView
                historyData={historyData}
                mode={mode}
              />
            )}

            {/* ===================== CYCLE ANALYSIS ===================== */}
            {activeTab === 'cycle' && (
              <CycleView
                historyData={historyData}
                mode={mode}
              />
            )}

            {/* ===================== BACKTEST ===================== */}
            {activeTab === 'backtest' && (
              <BacktestView
                historyData={historyData}
                mode={mode}
              />
            )}

            {/* ===================== HISTORY ===================== */}
            {activeTab === 'history' && (
              <HistoryResultView
                historyData={historyData}
                mode={mode}
              />
            )}

            {/* ===================== FIREBASE SYNC SETTINGS ===================== */}
            {activeTab === 'settings' && (
              <SettingsSyncView
                meta={syncMeta}
                onRefresh={handleRefresh}
                onHardReset={handleHardReset}
                onManualAdd={handleManualAddRecord}
                isRefreshing={isRefreshing}
                latestDate={historyData[0]?.d || ''}
              />
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Lottery Statistics & Probability Analytics • Dữ liệu chuẩn Firebase (Từ 2010 Đến Nay)</span>
          <span className="font-mono text-slate-400">
            {syncMeta?.audit?.totalRecords?.toLocaleString()} kỳ quay • ĐB & G1 • 4 Màn Dàn Số Riêng Biệt
          </span>
        </div>
      </footer>
    </div>
  );
}
