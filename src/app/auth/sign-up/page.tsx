import { SignUpForm } from "@/components/sign-up-form";
import { Logo } from "@/components/Logo";

export default function Page() {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-700 via-primary-600 to-primary-800 flex-col gap-20 p-12 relative overflow-hidden">
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
            Bergabung &amp;
            <br />
            Mulai Berjualan
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Platform marketplace eksklusif untuk Organisasi Mahasiswa. Jual
            merchandise, makanan, dan layanan dari program kerja Anda.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-10">
            {[
              { label: "Organisasi Aktif", value: "50+" },
              { label: "Produk Tersedia", value: "200+" },
              { label: "Pembeli Terdaftar", value: "1K+" },
              { label: "Transaksi Selesai", value: "5K+" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-primary-200 text-sm mt-0.5">{stat.label}</p>
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
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
