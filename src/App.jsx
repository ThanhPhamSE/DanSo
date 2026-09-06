import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import TodayResultBanner from './components/TodayResultBanner';
import SetInputPanel from './components/SetInputPanel';
import MultiSetManager from './components/MultiSetManager';
import MultiSetMatrixView from './components/MultiSetMatrixView';
import StatsSummaryCards from './components/StatsSummaryCards';
import GanChart from './components/GanChart';
import AnalyticsPanel from './components/AnalyticsPanel';
import CapitalSimulatorPanel from './components/CapitalSimulatorPanel';
import HistoryTable from './components/HistoryTable';
import OptimizerPanel from './components/OptimizerPanel';
import YearlyAnalysisPanel from './components/YearlyAnalysisPanel';

import { parseNumberSet, parseBulkSetsText, analyzeLotterySet, analyzeMultiSets } from './utils/lotteryEngine';
import { BarChart2, PieChart, CircleDollarSign, History, Scissors, Layers, CalendarRange, AlertCircle, Grid } from 'lucide-react';

const DEFAULT_INPUT_TEXT = `84,89,93,94,98,41,42,46,47,01,14,23,24,64,74,78,90
28,37,55,73,82,91,01,04,31,48,51,59,71,81,93,03,30
00,02,04,06,08,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98`;

export default function App() {
  const [rawInputText, setRawInputText] = useState(() => {
    try {
      const stored = localStorage.getItem('danso_raw_input_v4');
      if (stored) return stored;
    } catch (e) {
      console.warn('LocalStorage access failed:', e);
    }
    return DEFAULT_INPUT_TEXT;
  });

  const [daysLimit, setDaysLimit] = useState('1825');
  const [mode, setMode] = useState('de');
  const [activeTab, setActiveTab] = useState('multisets');
  const [xsmbData, setXsmbData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSetId, setActiveSetId] = useState('');

  // Persist rawInputText
  useEffect(() => {
    try {
      localStorage.setItem('danso_raw_input_v4', rawInputText);
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }, [rawInputText]);

  // Derived savedSets from single input text
  const savedSets = useMemo(() => {
    return parseBulkSetsText(rawInputText);
  }, [rawInputText]);

  // Ensure activeSetId is valid
  useEffect(() => {
    if (savedSets.length > 0) {
      if (!activeSetId || !savedSets.some(s => s.id === activeSetId)) {
        setActiveSetId(savedSets[0].id);
      }
    }
  }, [savedSets, activeSetId]);

  const activeSet = useMemo(() => {
    return savedSets.find(s => s.id === activeSetId) || savedSets[0] || null;
  }, [savedSets, activeSetId]);

  // Load XSMB dataset on mount — local JSON first, then auto-sync online
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingData(true);

      // Helper: parse CSV text → array sorted newest-first
      const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length >= 28) {
            const date = cols[0].trim();
            const dbRaw = cols[1].padStart(2, '0');
            const db_2d = dbRaw.slice(-2);
            const lo_list = [];
            for (let k = 1; k < 28; k++) {
              const val = cols[k].padStart(2, '0');
              lo_list.push(val.slice(-2));
            }
            parsed.push({ d: date, db: db_2d, lo: lo_list });
          }
        }
        parsed.reverse(); // newest first
        return parsed;
      };

      let localData = [];

      // 1. Load local static file first (instant)
      try {
        const res = await fetch('/xsmb.json');
        if (res.ok) {
          localData = await res.json();
          setXsmbData(localData);
        }
      } catch (err) {
        console.warn('Local xsmb.json not found, will rely on online fetch.');
      }

      // 2. Always try to fetch latest online CSV to get today's draw
      try {
        setIsRefreshing(true);
        const res = await fetch(
          'https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/refs/heads/main/data/xsmb.csv',
          { cache: 'no-cache' }
        );
        if (res.ok) {
          const text = await res.text();
          const onlineData = parseCSV(text);
          if (onlineData.length > 0) {
            // Use online data if it's newer or local is empty
            const localLatest  = localData[0]?.d  || '0000-00-00';
            const onlineLatest = onlineData[0]?.d || '0000-00-00';
            if (onlineLatest >= localLatest) {
              setXsmbData(onlineData);
            }
          }
        }
      } catch (err) {
        console.warn('Auto online sync failed, using local data.', err);
      } finally {
        setIsRefreshing(false);
        setIsLoadingData(false);
      }
    }
    loadInitialData();
  }, []);


  // Multi-Set Comparative Analysis for all sets
  const multiSetAnalysis = useMemo(() => {
    if (!xsmbData || xsmbData.length === 0) return [];
    return analyzeMultiSets(xsmbData, savedSets, daysLimit, mode);
  }, [xsmbData, savedSets, daysLimit, mode]);

  // Single Active Set Stats Analysis
  const activeSetStats = useMemo(() => {
    if (!xsmbData || xsmbData.length === 0 || !activeSet) return null;
    return analyzeLotterySet(xsmbData, activeSet.numbers, daysLimit, mode);
  }, [xsmbData, activeSet, daysLimit, mode]);

  // Online refresh handler
  const handleRefreshOnline = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/refs/heads/main/data/xsmb.csv');
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n');

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length >= 28) {
            const date = cols[0];
            const dbRaw = cols[1].padStart(2, '0');
            const db_2d = dbRaw.slice(-2);
            const lo_list = [];
            for (let k = 1; k < 28; k++) {
              const val = cols[k].padStart(2, '0');
              lo_list.push(val.slice(-2));
            }
            parsed.push({ d: date, db: db_2d, lo: lo_list });
          }
        }
        parsed.reverse();
        if (parsed.length > 0) {
          setXsmbData(parsed);
        }
      }
    } catch (err) {
      console.warn('Online sync failed, using static historical dataset.', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const latestDate = xsmbData[0]?.d || '---';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header Bar */}
      <Header
        totalRecords={xsmbData.length}
        latestDate={latestDate}
        onRefresh={handleRefreshOnline}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 w-full">
        
        {/* Today's Winning Number Banner */}
        {xsmbData.length > 0 && (
          <TodayResultBanner
            latestData={xsmbData[0]}
            multiSetAnalysis={multiSetAnalysis}
          />
        )}

        {/* SINGLE MAIN SET INPUT PANEL */}
        <SetInputPanel
          rawInputText={rawInputText}
          setRawInputText={setRawInputText}
          daysLimit={daysLimit}
          setDaysLimit={setDaysLimit}
          mode={mode}
          setMode={setMode}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-thin">
          
          <button
            onClick={() => setActiveTab('multisets')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'multisets'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            ⚡ Tất Cả Dàn & Ma Trận Theo Ngày ({savedSets.length} Dàn)
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            disabled={!activeSet}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap disabled:opacity-40 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            📊 Soi Dàn Chi Tiết ({activeSet?.name || '---'})
          </button>
          
          <button
            onClick={() => setActiveTab('yearly')}
            disabled={!activeSet}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap disabled:opacity-40 ${
              activeTab === 'yearly'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            📅 Tỉ Lệ 5 Năm Gần Nhất
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            disabled={!activeSet}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap disabled:opacity-40 ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            📈 Phân Tích Số Trong Dàn
          </button>

          <button
            onClick={() => setActiveTab('capital')}
            disabled={!activeSet}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap disabled:opacity-40 ${
              activeTab === 'capital'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CircleDollarSign className="w-4 h-4" />
            💰 Giả Lập Vào Tiền (ROI)
          </button>

          <button
            onClick={() => setActiveTab('history')}
            disabled={!activeSet}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap disabled:opacity-40 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            📜 Nhật Ký Kết Quả
          </button>

          <button
            onClick={() => setActiveTab('optimize')}
            disabled={!activeSet}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap disabled:opacity-40 ${
              activeTab === 'optimize'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Scissors className="w-4 h-4" />
            🎯 Hạ Dàn Tối Ưu
          </button>

        </div>

        {/* Tab Contents */}
        {isLoadingData ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-3">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold">Đang nạp dữ liệu XSMB 7,500+ kỳ quay...</p>
          </div>
        ) : savedSets.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Chưa Có Dàn Số Nào</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Vui lòng dán danh sách các dàn số vào ô nhập phía trên (mỗi dàn 1 dòng).
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'multisets' && (
              <div className="space-y-6 animate-fadeIn">
                <MultiSetManager
                  multiSetAnalysis={multiSetAnalysis}
                  activeSetId={activeSetId}
                  onSelectActiveSet={(id) => {
                    setActiveSetId(id);
                    setActiveTab('overview');
                  }}
                />

                <MultiSetMatrixView
                  historyData={xsmbData}
                  savedSets={savedSets}
                  multiSetAnalysis={multiSetAnalysis}
                  onSelectActiveSet={(id) => {
                    setActiveSetId(id);
                    setActiveTab('overview');
                  }}
                />
              </div>
            )}

            {activeTab === 'overview' && activeSetStats && (
              <div className="space-y-6 animate-fadeIn">

                {/* ── Set Switcher Bar ── */}
                <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">📊 Đang soi: <span className="text-amber-400">{activeSet?.name}</span></h3>
                    <button
                      onClick={() => setActiveTab('multisets')}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      ← Về Tất Cả Dàn
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {savedSets.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSetId(s.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                          s.id === activeSetId
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:text-amber-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <StatsSummaryCards stats={activeSetStats} mode={mode} />
                <GanChart historyDetails={activeSetStats?.historyDetails} maxGan={activeSetStats?.maxGan} />
                <HistoryTable
                  historyDetails={activeSetStats?.historyDetails}
                  mode={mode}
                  stats={activeSetStats}
                />
              </div>
            )}

            {activeTab === 'yearly' && activeSet && (
              <div className="animate-fadeIn">
                <YearlyAnalysisPanel
                  historyData={xsmbData}
                  userSet={activeSet.numbers}
                  setName={activeSet.name}
                  mode={mode}
                />
              </div>
            )}

            {activeTab === 'analytics' && activeSetStats && (
              <div className="animate-fadeIn">
                <AnalyticsPanel stats={activeSetStats} />
              </div>
            )}

            {activeTab === 'capital' && activeSetStats && (
              <div className="animate-fadeIn">
                <CapitalSimulatorPanel
                  historyDetails={activeSetStats?.historyDetails}
                  dansoCount={activeSet.numbers.length}
                />
              </div>
            )}

            {activeTab === 'history' && activeSetStats && (
              <div className="animate-fadeIn">
                <HistoryTable
                  historyDetails={activeSetStats?.historyDetails}
                  mode={mode}
                />
              </div>
            )}

            {activeTab === 'optimize' && activeSetStats && (
              <div className="animate-fadeIn">
                <OptimizerPanel
                  stats={activeSetStats}
                  onApplyTrimmedSet={(trimmedText) => {
                    setRawInputText(trimmedText);
                    setActiveTab('overview');
                  }}
                />
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Soi Cầu Dàn Số 5X XSMB Pro — Hệ Thống Phân Tích Đa Dàn & Tỉ Lệ Hàng Ngày</span>
          <span className="text-slate-400 font-mono">Cơ sở dữ liệu 2005 - 2026</span>
        </div>
      </footer>

    </div>
  );
}
