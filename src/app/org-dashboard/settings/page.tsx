"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, Building2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgDashboard } from "@/lib/context/OrgDashboardContext";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { org } = useOrgDashboard();
  const [profile, setProfile] = useState({
    nama_organisasi: "",
    nomor_sk: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill form from context
  useEffect(() => {
    if (org) {
      setProfile({
        nama_organisasi: org.nama_organisasi,
        nomor_sk: org.nomor_sk ?? "",
        email: org.email,
      });
    }
  }, [org]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id_organisasi) return;

    setIsSaving(true);
    setErrorMsg(null);

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("organisasi")
        .update({
          nama_organisasi: profile.nama_organisasi,
          nomor_sk: profile.nomor_sk || null,
        })
        .eq("id_organisasi", org.id_organisasi);

      if (error) throw error;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("[OrgDashboard - Settings] Error:", err);
      setErrorMsg("Gagal menyimpan perubahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const verificationLabel =
    org.status_verifikasi === "verified"
      ? "Terverifikasi"
      : org.status_verifikasi === "pending"
        ? "Menunggu Verifikasi"
        : "Ditolak";

  const verificationBadgeColor =
    org.status_verifikasi === "verified"
      ? "bg-emerald-100 text-emerald-700"
      : org.status_verifikasi === "pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {isSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">
              Profil Organisasi berhasil diperbarui!
            </span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl shadow-lg border border-red-200"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-6">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
            <Building2 className="w-7 h-7 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              Profil Organisasi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola identitas utama dan klasifikasi lembaga Anda di platform.
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${verificationBadgeColor}`}
          >
            {verificationLabel}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-sm leading-relaxed">
              <strong>Catatan:</strong> Perubahan nama organisasi akan
              mempengaruhi tampilan toko Anda di halaman publik ProkerMart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Organisasi */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nama Organisasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.nama_organisasi}
                onChange={(e) =>
                  setProfile({ ...profile, nama_organisasi: e.target.value })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                placeholder="Contoh: BEM FMIPA Universitas X"
              />
            </div>

            {/* Nomor SK */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nomor SK
              </label>
              <input
                type="text"
                value={profile.nomor_sk}
                onChange={(e) =>
                  setProfile({ ...profile, nomor_sk: e.target.value })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                placeholder="Contoh: SK/BEM/2026/001"
              />
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Email Terdaftar
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">
                Email ini digunakan untuk login dan tidak dapat diubah langsung.
                Hubungi admin untuk mengganti.
              </p>
            </div>

            {/* Status Verifikasi (Read Only) */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Status Verifikasi
              </label>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center text-sm font-semibold px-4 py-2 rounded-xl ${verificationBadgeColor}`}
                >
                  {verificationLabel}
                </span>
                {org.status_verifikasi === "pending" && (
                  <p className="text-xs text-slate-500">
                    Menunggu verifikasi oleh admin. Proses biasanya memakan waktu
                    1-3 hari kerja.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-8 mt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (org) {
                  setProfile({
                    nama_organisasi: org.nama_organisasi,
                    nomor_sk: org.nomor_sk ?? "",
                    email: org.email,
                  });
                }
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}