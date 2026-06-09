import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  const errorMessage = params?.error
    ? decodeURIComponent(params.error)
    : "Terjadi kesalahan yang tidak diketahui.";

  return (
    <p className="text-sm text-slate-500 leading-relaxed">{errorMessage}</p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="sm" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Oops, Ada Kesalahan!
        </h1>

        {/* Error description */}
        <div className="mb-6 px-2">
          <Suspense
            fallback={
              <p className="text-sm text-slate-400">Memuat detail...</p>
            }
          >
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/auth/login">
            <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
              Coba Masuk Kembali
            </button>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
