"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  CheckCircle2,
  Calendar,
  AlignLeft,
  UploadCloud,
  Loader2,
  AlertCircle,
  Target
} from "lucide-react";

// Tipe data diperbarui untuk menampung field dari form baru
type Proker = {
  id: string;
  nama: string;
  kategori?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  targetOmzet?: string;
  deskripsi: string;
  status: "Aktif" | "Selesai" | "Ditangguhkan";
  totalProduk: number;
};

const CATEGORIES = [
  "Seminar & Talkshow",
  "Kompetisi / Lomba",
  "Pentas Seni / Konser",
  "Bakti Sosial / Pengabdian",
  "Pelatihan / Workshop",
  "Lainnya"
];

export default function StoreManagementPage() {
  const [prokers, setProkers] = useState<Proker[]>([
    {
      id: "PRK-001",
      nama: "Dies Natalis ke-30",
      kategori: "Pentas Seni / Konser",
      deskripsi: "Kepanitiaan acara ulang tahun fakultas",
      status: "Aktif",
      totalProduk: 12,
    },
    {
      id: "PRK-002",
      nama: "LKMM Dasar 2026",
      kategori: "Pelatihan / Workshop",
      deskripsi: "Latihan Kepemimpinan Manajemen Mahasiswa",
      status: "Aktif",
      totalProduk: 5,
    },
    {
      id: "PRK-003",
      nama: "Bakti Sosial Desa",
      kategori: "Bakti Sosial / Pengabdian",
      deskripsi: "Program pengabdian masyarakat di desa mitra",
      status: "Aktif",
      totalProduk: 3,
    },
    {
      id: "PRK-004",
      nama: "Penyambutan Maba",
      kategori: "Seminar & Talkshow",
      deskripsi: "Kepanitiaan penerimaan mahasiswa baru",
      status: "Selesai",
      totalProduk: 15,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentProker, setCurrentProker] = useState<Partial<Proker>>({});
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const openAddModal = () => {
    setModalMode("add");
    setCurrentProker({ 
      status: "Aktif", 
      totalProduk: 0,
      kategori: "Seminar & Talkshow"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (proker: Proker) => {
    setModalMode("edit");
    setCurrentProker(proker);
    setIsModalOpen(true);
  };

  const openDeleteModal = (proker: Proker) => {
    setCurrentProker(proker);
    setIsDeleteModalOpen(true);
  };

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulasi loading request
    setTimeout(() => {
      if (modalMode === "add") {
        const newProker: Proker = {
          id: `PRK-00${prokers.length + 5}`,
          nama: currentProker.nama || "Proker Baru",
          kategori: currentProker.kategori || "Seminar & Talkshow",
          tanggalMulai: currentProker.tanggalMulai || "",
          tanggalSelesai: currentProker.tanggalSelesai || "",
          targetOmzet: currentProker.targetOmzet || "",
          deskripsi: currentProker.deskripsi || "",
          status: currentProker.status as "Aktif" | "Selesai" | "Ditangguhkan" || "Aktif",
          totalProduk: 0,
        };
        setProkers([...prokers, newProker]);
        showSuccessToast("Proker baru berhasil didaftarkan!");
      } else {
        setProkers(
          prokers.map((p) =>
            p.id === currentProker.id
              ? ({ ...p, ...currentProker } as Proker)
              : p,
          ),
        );
        showSuccessToast("Data proker berhasil diperbarui!");
      }
      
      setIsSubmitting(false);
      setIsModalOpen(false);
    }, 1000); // Simulasi delay 1 detik
  };

  const handleDelete = () => {
    setProkers(prokers.filter((p) => p.id !== currentProker.id));
    setIsDeleteModalOpen(false);
    showSuccessToast("Proker berhasil dihapus!");
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
            <span className="text-sm font-semibold">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manajemen Toko (Proker)
          </h1>
          <p className="text-sm text-slate-500">
            Kelola pendaftaran, edit data, atau nonaktifkan akun panitia proker
            Anda.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Daftarkan Proker Baru
        </button>
      </div>

      {/* Proker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prokers.map((proker) => (
          <motion.div
            key={proker.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            layout
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                    {proker.nama}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {proker.id}
                  </p>
                </div>
              </div>
              <div className="relative group">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
                {/* Dropdown Action (Hover based) */}
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col p-1">
                  <button
                    onClick={() => openEditModal(proker)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(proker)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 flex-1">
              {proker.kategori && (
                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wider rounded-md mb-3">
                  {proker.kategori}
                </span>
              )}
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {proker.deskripsi}
              </p>

              <div className="flex justify-between items-center mt-auto">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    proker.status === "Aktif"
                      ? "bg-emerald-100 text-emerald-700"
                      : proker.status === "Selesai"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {proker.status}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {proker.totalProduk} Produk
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* COMPREHENSIVE ADD/EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              // Mengubah max-w menjadi 2xl untuk mengakomodasi form 2 kolom
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
                      {modalMode === "add" ? "Daftarkan Proker Baru" : "Edit Data Proker"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {modalMode === "add" ? "Buat sub-toko untuk proker baru" : "Perbarui informasi sub-toko"}
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
                  
                  {modalMode === "add" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                      <div className="text-sm leading-relaxed">
                        <strong>Info:</strong> Proker yang didaftarkan akan otomatis membuat sub-toko. Anda dapat menugaskan panitia di menu Manajemen Anggota nanti.
                      </div>
                    </div>
                  )}

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
                        onChange={(e) => setCurrentProker({ ...currentProker, status: e.target.value as any })}
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
                        {modalMode === "add" ? <Target className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {modalMode === "add" ? "Daftarkan" : "Simpan"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Hapus Proker?
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Apakah Anda yakin ingin menghapus{" "}
                <strong>{currentProker.nama}</strong>? Semua produk dan data
                pesanan yang terkait tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}