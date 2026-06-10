import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/Logo";

export default function Page() {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-700 via-primary-600 to-primary-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-white/5 rounded-full" />

        {/* Top branding */}
        <div className="relative z-10">
          <Logo theme="white" />
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Satu Platform,
            <br />
            Seribu Produk Ormawa
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Temukan dan beli produk menarik dari berbagai Organisasi Mahasiswa
            kampus Anda. Dukung kegiatan mereka dengan berbelanja di ProkerMart.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "🛒 Belanja produk eksklusif Ormawa",
              "📍 Temukan penjual terdekat di kampus",
              "💳 Pembayaran mudah & aman",
              "🎯 Dukung program kerja mahasiswa",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3"
              >
                <p className="text-white text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-primary-300 text-sm relative z-10">
          © 2026 ProkerMart. Marketplace Ormawa Kampus.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
