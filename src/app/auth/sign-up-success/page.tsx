import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        {/* Animated checkmark icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <MailCheck className="w-10 h-10 text-primary-600" />
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="sm" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Cek Email Anda!</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Akun Anda berhasil dibuat. Kami telah mengirimkan tautan konfirmasi ke email Anda.
          Klik tautan tersebut untuk mengaktifkan akun sebelum masuk.
        </p>

        {/* Tips */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-8">
          <p className="text-xs font-semibold text-slate-600 mb-2">Tips jika email tidak ditemukan:</p>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• Cek folder <span className="font-medium">Spam / Junk</span> email Anda</li>
            <li>• Pastikan alamat email yang didaftarkan sudah benar</li>
            <li>• Tunggu beberapa menit, pengiriman mungkin sedikit terlambat</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/auth/login">
            <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
              Masuk ke Akun
            </button>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
