"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Store,
  TrendingUp,
  Users,
  ArrowUpRight,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  AlignLeft,
  UploadCloud,
  Loader2,
  AlertCircle,
  Target
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Seminar & Talkshow",
  "Kompetisi / Lomba",
  "Pentas Seni / Konser",
  "Bakti Sosial / Pengabdian",
  "Pelatihan / Workshop",
  "Lainnya"
];

export default function OrgDashboardPage() {
  // State untuk form modal pendaftaran
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentProker, setCurrentProker] = useState<any>({});

  const stats = [
    {
      name: "Total Pendapatan Organisasi",
      value: "Rp 12.850.000",
      change: "+24.5%",
      icon: TrendingUp,
    },
    {
      name: "Total Toko (Proker)",
      value: "5 Aktif",
      change: "1 Selesai",
      icon: Store,
    },
    {
      name: "Total Anggota Kepanitiaan",
      value: "145 Orang",
      change: "+12",
      icon: Users,
    },
    {
      name: "Total Pesanan Seluruh Proker",
      value: "432",
      change: "+18%",
      icon: Building2,
    },
  ];

  const subTokos = [
    {
      name: "Dies Natalis ke-30",
      status: "Aktif",
      revenue: "Rp 5.250.000",
      orders: 145,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      name: "LKMM Dasar 2026",
      status: "Aktif",
      revenue: "Rp 3.100.000",
      orders: 89,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      name: "Bakti Sosial Desa",
      status: "Aktif",
      revenue: "Rp 4.500.000",
      orders: 198,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      name: "Penyambutan Maba",
      status: "Selesai",
      revenue: "Rp 8.900.000",
      orders: 350,
      color: "bg-slate-100 text-slate-700",
    },
  ];

  // Fungsi untuk membuka modal penambahan proker
  const openAddModal = () => {
    setCurrentProker({
      nama: "",
      kategori: "Seminar & Talkshow",
      status: "Aktif",
      tanggalMulai: "",
      tanggalSelesai: "",
      targetOmzet: "",
      deskripsi: "",
    });
    setIsModalOpen(true);
  };

  // Fungsi untuk menangani simpan (Submit form)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulasi request API selama 1 detik
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      
      // Tampilkan toast notifikasi sukses
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">Proker baru berhasil didaftarkan!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Selamat datang, BEM FMIPA
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ini adalah ringkasan performa seluruh program kerja Organisasi Anda (Rekap Toko Organisasi).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Daftarkan Proker Baru
        </button>
      </div>

      {/* Aggregate Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sub-Toko Performance List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              Performa Toko (Proker)
            </h2>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              Lihat Laporan Lengkap
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Nama Proker</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Pesanan</th>
                  <th className="px-6 py-4">Omzet Total</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subTokos.map((store, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {store.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${store.color}`}
                      >
                        {store.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {store.orders} Pesanan
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {store.revenue}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href="/dashboard"
                        className="inline-flex text-slate-400 group-hover:text-primary-600 transition-colors p-1 rounded-md hover:bg-primary-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Validation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Menunggu Tindakan
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Verifikasi Akun Proker
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Panitia &quot;Seminar Nasional&quot; meminta akses ke
                  platform.
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg">
                    Setujui
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg">
                    Tolak
                  </button>
                </div>
              </div>
            </div>

            <button className="mt-auto w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Pusat Bantuan Organisasi
            </button>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE ADD MODAL (Diduplikasi dari StoreManagementPage) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Daftarkan Proker Baru
                    </h2>
                    <p className="text-xs text-slate-500">
                      Buat sub-toko untuk proker baru
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-slate-400 hover:bg-slate-200 rounded-full disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-6 space-y-6">
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                    <div className="text-sm leading-relaxed">
                      <strong>Info:</strong> Proker yang didaftarkan akan otomatis membuat sub-toko. Anda dapat menugaskan panitia di menu Manajemen Anggota nanti.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Input Nama Proker */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Nama Program Kerja <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={currentProker.nama || ""}
                        onChange={(e) => setCurrentProker({...currentProker, nama: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white" 
                        placeholder="Contoh: Dies Natalis Fakultas ke-30"
                      />
                    </div>

                    {/* Input Kategori */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Kategori Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={currentProker.kategori || "Seminar & Talkshow"}
                        onChange={(e) => setCurrentProker({...currentProker, kategori: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Input Status */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Status Operasional
                      </label>
                      <select
                        value={currentProker.status || "Aktif"}
                        onChange={(e) => setCurrentProker({ ...currentProker, status: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white cursor-pointer"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Ditangguhkan">Ditangguhkan</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>

                    {/* Input Periode Mulai */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Tanggal Mulai
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <input 
                          type="date" 
                          value={currentProker.tanggalMulai || ""}
                          onChange={(e) => setCurrentProker({...currentProker, tanggalMulai: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white" 
                        />
                      </div>
                    </div>

                    {/* Input Periode Selesai */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Tanggal Selesai
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <input 
                          type="date" 
                          value={currentProker.tanggalSelesai || ""}
                          onChange={(e) => setCurrentProker({...currentProker, tanggalSelesai: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white" 
                        />
                      </div>
                    </div>

                    {/* Input Deskripsi */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Deskripsi Singkat <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <AlignLeft className="h-4 w-4 text-slate-400" />
                        </div>
                        <textarea 
                          required
                          rows={3}
                          value={currentProker.deskripsi || ""}
                          onChange={(e) => setCurrentProker({...currentProker, deskripsi: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white resize-y" 
                          placeholder="Ceritakan secara singkat mengenai tujuan program kerja ini..."
                        />
                      </div>
                    </div>
                    
                    {/* Input Logo / Cover */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Logo / Cover Proker (Opsional)
                      </label>
                      <div className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                        <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-primary-500 mb-2 transition-colors" />
                        <p className="text-sm font-medium text-slate-600">Klik atau seret file gambar</p>
                        <p className="text-[11px] text-slate-400 mt-1">Maks. ukuran file 2MB (JPG, PNG)</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-400 min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Daftarkan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}