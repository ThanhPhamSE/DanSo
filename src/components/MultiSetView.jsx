import React, { useState } from 'react';
import { Layers, Plus, Trash2, Database, Sparkles, CheckCircle2, XCircle, Grid, Calendar } from 'lucide-react';
import { evaluateSetOnHistory, saveSetsToStorage } from '../danSo/danSoService';
import { parseNumberSet } from '../utils/lotteryEngine';
import firebasePresets from '../data/firebase_dan_so.json';

export default function MultiSetView({ historyData, savedSets, setSavedSets, mode = 'de' }) {
  const [newSetName, setNewSetName] = useState('');
  const [newSetNumbersText, setNewSetNumbersText] = useState('');
  const [activeSetId, setActiveSetId] = useState(savedSets[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add new set
  const handleAddSet = (e) => {
    e.preventDefault();
    const numbers = parseNumberSet(newSetNumbersText);
    if (numbers.length === 0) return;

    const newSet = {
      id: `custom_set_${Date.now()}`,
      name: newSetName.trim() || `Dàn ${savedSets.length + 1}`,
      numbers,
      target: mode === 'g1' ? 'HEAD' : 'TAIL',
      note: `${numbers.length} số`,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedSets, newSet];
    setSavedSets(updated);
    saveSetsToStorage(updated);
    setNewSetName('');
    setNewSetNumbersText('');
    setShowAddForm(false);
  };

  // Delete set
  const handleDeleteSet = (id) => {
    const updated = savedSets.filter(s => s.id !== id);
    setSavedSets(updated);
    saveSetsToStorage(updated);
    if (activeSetId === id) setActiveSetId(updated[0]?.id || '');
  };

  // Reset to 9 Firebase presets
  const handleLoadFirebasePresets = () => {
    const presets = firebasePresets.map((item, idx) => ({
      id: item.id || `fb_set_${idx + 1}`,
      name: item.name || `Dàn ${idx + 10}`,
      numbers: item.numbers || [],
      target: item.target || 'TAIL',
      note: item.note || `${(item.numbers || []).length} số`,
      createdAt: new Date().toISOString()
    }));
    setSavedSets(presets);
    saveSetsToStorage(presets);
    setActiveSetId(presets[0]?.id || '');
  };

  // Evaluate sets
  const evaluatedSets = savedSets.map(set => ({
    ...set,
    metrics: evaluateSetOnHistory(set.numbers, historyData, mode)
  }));

  const activeSet = evaluatedSets.find(s => s.id === activeSetId) || evaluatedSets[0] || null;

  // Recent 10 draws matrix
  const recentDraws = historyData.slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            Quản Lý & So Sánh Đa Dàn Số
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Theo Dõi & Đối Chiếu Các Dàn Số
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý các dàn số cá nhân hoặc sử dụng các dàn số chuẩn từ Firebase để đối chiếu tỷ lệ ăn và Gan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadFirebasePresets}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            Nạp 9 Dàn Firebase
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm Dàn Mới
          </button>
        </div>
      </div>

      {/* Add Set Form Accordion */}
      {showAddForm && (
        <form onSubmit={handleAddSet} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Tạo Dàn Số Mới
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs text-slate-400 block mb-1">Tên Dàn Số</label>
              <input
                type="text"
                placeholder="Ví dụ: Dàn 54s Chẵn, Dàn Lộc..."
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Danh Sách Số (00 - 99, cách nhau bởi dấu phẩy, khoảng trắng)</label>
              <input
                type="text"
                placeholder="Ví dụ: 03, 04, 06, 12, 14, 25, 48, 69..."
                value={newSetNumbersText}
                onChange={(e) => setNewSetNumbersText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Lưu Dàn Số
            </button>
          </div>
        </form>
      )}

      {/* Sets Comparative Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {evaluatedSets.map(setItem => {
          const isSelected = activeSet?.id === setItem.id;
          const { metrics } = setItem;

          return (
            <div
              key={setItem.id}
              onClick={() => setActiveSetId(setItem.id)}
              className={`glass-card rounded-2xl p-5 border transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{setItem.name}</h4>
                  <span className="text-xs text-amber-400 font-mono font-bold">{setItem.numbers.length} số</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSet(setItem.id); }}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title="Xóa dàn này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tỷ Lệ Ăn</span>
                  <span className="text-sm font-black text-emerald-400">{metrics.hitRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gan Hiện Tại</span>
                  <span className="text-sm font-black text-amber-400">{metrics.currentGan} d</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gan Max</span>
                  <span className="text-sm font-black text-rose-400">{metrics.maxGan} d</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Comparison Matrix */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          Ma Trận Đối Chiếu Trúng/Xịt Theo 15 Kỳ Quay Gần Nhất
        </h3>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Ngày</th>
                <th className="py-2.5 px-3">Số Về</th>
                {evaluatedSets.map(s => (
                  <th key={s.id} className="py-2.5 px-3 text-center">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentDraws.map(day => {
                const prize = mode === 'g1' ? day.g1 : day.db;
                return (
                  <tr key={day.d} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300">{day.d}</td>
                    <td className="py-2.5 px-3 font-black text-amber-400 text-sm">{prize}</td>
                    {evaluatedSets.map(s => {
                      const isHit = new Set(s.numbers).has(prize);
                      return (
                        <td key={s.id} className="py-2.5 px-3 text-center">
                          {isHit ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> ĂN
                            </span>
                          ) : (
                            <span className="text-slate-600 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Xịt
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
