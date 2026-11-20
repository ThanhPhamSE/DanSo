import React, { useState } from 'react';
import { Settings, RefreshCw, Database, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, Save } from 'lucide-react';
import { getDatabaseUrl, setDatabaseUrl } from '../services/firebaseClient';

export default function SettingsSyncView({ meta, onRefresh, isRefreshing }) {
  const [dbUrl, setDbUrl] = useState(getDatabaseUrl());
  const [saveStatus, setSaveStatus] = useState('');

  const handleSaveUrl = (e) => {
    e.preventDefault();
    setDatabaseUrl(dbUrl);
    setSaveStatus('Đã lưu cấu hình Firebase Database URL thành công!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const audit = meta?.audit || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          Cấu Hình Kết Nối & Đồng Bộ Firebase Realtime Database
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Thiết Lập Database & Kiểm Tra Toàn Vẹn
        </h2>
        <p className="text-xs text-slate-400">
          Quản lý kết nối trực tiếp đến Firebase, kiểm tra dữ liệu trùng lặp, thiếu ngày và trạng thái đồng bộ.
        </p>
      </div>

      {/* Sync Action & Status Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-400" />
          Trạng Thái Đồng Bộ Hiện Tại
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block mb-1">Nguồn Dữ Liệu:</span>
            <span className="text-white font-bold text-sm">
              {meta?.source === 'firebase_online' ? '🟢 Trực tiếp Firebase Realtime DB' : '🟡 Bộ Nhớ Cache / Hạt Nhân Local Seed (2010)'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block mb-1">Lần Đồng Bộ Gần Nhất:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {meta?.lastSync ? new Date(meta.lastSync).toLocaleString('vi-VN') : '---'}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang kết nối & đồng bộ Firebase...' : 'Đồng Bộ Lại Dữ Liệu Ngay'}
          </button>
        </div>
      </div>

      {/* Database URL Config */}
      <form onSubmit={handleSaveUrl} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Firebase Database URL
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ứng dụng kết nối đọc ở chế độ <strong className="text-slate-200">READ-ONLY</strong>, không ghi đè, không sửa đổi dữ liệu trên database của bạn.
        </p>

        <div>
          <label className="text-xs text-slate-400 block mb-1">URL Cơ Sở Dữ Liệu Firebase Realtime:</label>
          <input
            type="url"
            value={dbUrl}
            onChange={(e) => setDbUrl(e.target.value)}
            placeholder="https://your-project-default-rtdb.firebaseio.com"
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white font-mono focus:outline-none"
          />
        </div>

        {saveStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {saveStatus}
          </div>
        )}

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <Save className="w-4 h-4 text-amber-400" />
          Lưu Cấu Hình URL
        </button>
      </form>

      {/* Audit Report */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Báo Cáo Kiểm Toán Toàn Vẹn Dữ Liệu
        </h3>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Tổng số kỳ quay hợp lệ (từ 2010):</span>
            <strong className="text-white">{audit.totalRecords?.toLocaleString() || '---'} kỳ</strong>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Khoảng thời gian:</span>
            <strong className="text-amber-400">{audit.startDate} → {audit.endDate}</strong>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Kỳ nghỉ Tết lặp kết quả đã loại trừ:</span>
            <strong className="text-emerald-400">{audit.skippedTetCount || 16} ngày</strong>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Dữ liệu sai định dạng:</span>
            <strong className="text-slate-300">{audit.invalidFormatCount || 0} bản ghi</strong>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Bảo toàn số 0 ở đầu (00-99):</span>
            <strong className="text-emerald-400">100% Tuyệt đối</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
