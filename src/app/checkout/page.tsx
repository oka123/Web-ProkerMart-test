/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MapPin,
  Truck,
  CreditCard,
  QrCode,
  Wallet,
  CheckCircle,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Pencil,
} from "lucide-react";
import { toast } from "react-hot-toast";

function CheckoutContent() {
  const router = useRouter();
  const supabase = createClient();

  const [deliveryMethod, setDeliveryMethod] = useState<
    "pickup" | "delivery" | null
  >(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "qris" | "transfer" | "cod" | null
  >(null);

  // Real Address States
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Pick Up States
  const [pickupTime, setPickupTime] = useState("");
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);

  // States for Notifications/Modals
  const [showToast, setShowToast] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const searchParams = useSearchParams();
  const jalur = searchParams.get("jalur");

  // Load Saved Addresses
  const fetchAddresses = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.nama || "Pembeli");

      const { data: addrList, error } = await supabase
        .from("alamat_pembeli")
        .select("*")
        .eq("id_pengguna", user.id)
        .order("is_utama", { ascending: false });

      if (error) throw error;

      if (addrList && addrList.length > 0) {
        setAddresses(addrList);
        const primary = addrList.find((a) => a.is_utama) || addrList[0];
        setSelectedAddressId(primary.id_alamat);
      }
    } catch (err) {
      console.error("Gagal memuat alamat:", err);
    }
  }, [supabase]);

  useEffect(() => {
    const initAddresses = async () => {
      await Promise.resolve(); // Menghindari error set-state-in-effect
      await fetchAddresses();
    };
    initAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Product Data based on jalur
  useEffect(() => {
    const initItems = async () => {
      await Promise.resolve(); // Menghindari pemanggilan setState secara sinkron

      if (jalur === "langsung") {
        const savedItem = sessionStorage.getItem("directCheckoutItem");
        if (savedItem) {
          const parsedItem = JSON.parse(savedItem);
          setCheckoutItems(parsedItem);
        }
      } else {
        const savedItems = localStorage.getItem("checkoutItems");
        if (savedItems) {
          const parsed = JSON.parse(savedItems);
          setCheckoutItems(parsed);
        }
      }
    };

    initItems();
  }, [jalur]);

  // Menghitung subtotal dari seluruh barang yang ada di checkoutItems
  const subtotal = checkoutItems.reduce(
    (acc, item) =>
      acc + Number(item.produk?.harga ?? item.harga ?? 0) * item.jumlah,
    0,
  );
  const platformFee = 2000;
  const grandTotal = subtotal > 0 ? subtotal + platformFee : 0;

  const handlePaymentSelect = (method: "qris" | "transfer" | "cod") => {
    if (!deliveryMethod) {
      setShowPaymentAlert(true);
      return;
    }
    setShowPaymentAlert(false);
    setPaymentMethod(method);
  };

  const handleCheckout = async () => {
    if (!deliveryMethod || !paymentMethod) return;

    let alamatLengkapText = "";
    let tglAmbilText = null;

    if (deliveryMethod === "pickup") {
      if (!pickupTime) {
        alert("Pilih jam pengambilan terlebih dahulu!");
        return;
      }
      alamatLengkapText = "Ambil di Stand FMIPA, Gedung A Lt.1";
      tglAmbilText = pickupTime;
    } else {
      const selectedAddr = addresses.find(
        (a) => a.id_alamat === selectedAddressId,
      );
      if (!selectedAddr) {
        toast.error("Pilih alamat pengiriman terlebih dahulu!");
        return;
      }
      alamatLengkapText = `${selectedAddr.nama_penerima} (${selectedAddr.no_telepon}), ${selectedAddr.detail_jalan}, Kec. ${selectedAddr.kecamatan}, ${selectedAddr.kota}, ${selectedAddr.provinsi} ${selectedAddr.kode_pos}`;
    }

    try {
      setIsSavingAddress(true); // Re-use state loader
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total_harga: Math.round(grandTotal),
          nama_kustomer: userName,
          email_kustomer: userEmail,
          items: checkoutItems,
          metode_pengambilan: deliveryMethod,
          metode_pembayaran: paymentMethod,
          jalur_checkout: jalur === "langsung" ? "langsung" : "keranjang",
          alamat_pengambilan: alamatLengkapText,
          tgl_ambil: tglAmbilText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses pesanan");
      }

      if (data.isCod) {
        localStorage.removeItem("checkoutItems");
        sessionStorage.removeItem("directCheckoutItem");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          router.replace("/user/purchase");
        }, 2000);
      } else if (data.token) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            console.log("Berhasil!", result);
            localStorage.removeItem("checkoutItems");
            sessionStorage.removeItem("directCheckoutItem");
            router.replace("/user/purchase");
          },
          onPending: function (result: any) {
            console.log("Menunggu pembayaran!", result);
            localStorage.removeItem("checkoutItems");
            sessionStorage.removeItem("directCheckoutItem");
            router.replace("/user/purchase");
          },
          onError: function (result: any) {
            console.log("Gagal!", result);
            alert("Pembayaran gagal diproses. Silakan coba lagi.");
          },
          onClose: function () {
            console.log("Pop-up ditutup tanpa menyelesaikan pembayaran");
          },
        });
      } else {
        alert("Gagal mendapatkan token dari server. Silakan coba lagi.");
      }
    } catch (error: any) {
      console.error("Terjadi kesalahan saat memanggil API Midtrans:", error);
      alert(
        error.message ||
          "Terjadi kesalahan sistem. Pastikan server API berjalan.",
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-10">
        {/* Tombol Kembali */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition mb-6 font-medium text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-8">
          Checkout Pesanan
        </h1>

        <div className="space-y-6">
          {/* 1. Metode Pengambilan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Metode Pengambilan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Card Select: Pick Up */}
              <div
                onClick={() => setDeliveryMethod("pickup")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  deliveryMethod === "pickup"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-full ${deliveryMethod === "pickup" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${deliveryMethod === "pickup" ? "text-blue-900" : "text-slate-700"}`}
                    >
                      Pick Up
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ambil sendiri di stand
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Select: Delivery */}
              <div
                onClick={() => setDeliveryMethod("delivery")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  deliveryMethod === "delivery"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-full ${deliveryMethod === "delivery" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${deliveryMethod === "delivery" ? "text-blue-900" : "text-slate-700"}`}
                    >
                      Delivery
                    </h3>
                    <p className="text-xs text-slate-500">
                      Diantar ke lokasi Anda
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Content based on Delivery Method */}
            {deliveryMethod === "pickup" && (
              <div className="bg-slate-50 flex flex-col md:flex-row gap-4 rounded-xl p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mb-4 w-full md:w-1/2">
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">
                    Lokasi Stand
                  </h4>
                  <p className="text-sm text-slate-600">
                    Stand FMIPA, Gedung A Lt.1, Universitas Udayana
                  </p>
                </div>
                <div className="w-full md:w-1/2">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Pilih Jam Pengambilan
                  </h4>
                  <select
                    className="w-full md:w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    <option value="" disabled>
                      -- Pilih Jam --
                    </option>
                    <option value="09:00 - 11:00">09:00 - 11:00 WITA</option>
                    <option value="12:00 - 14:00">12:00 - 14:00 WITA</option>
                    <option value="15:00 - 17:00">15:00 - 17:00 WITA</option>
                  </select>
                  {deliveryMethod === "pickup" && pickupTime === "" && (
                    <p className="text-red-500 text-xs mt-1.5">
                      * Wajib memilih jam pengambilan
                    </p>
                  )}
                </div>
              </div>
            )}

            {deliveryMethod === "delivery" && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-slate-700">
                    Alamat Pengiriman
                  </h4>
                  <button
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    onClick={() =>
                      (window.location.href =
                        "/user/account/address?action=add&return_url=/checkout")
                    }
                  >
                    Tambah Alamat Baru
                  </button>
                </div>

                {addresses.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id_alamat}
                        className={`bg-white border rounded-lg p-3 text-left transition-all relative ${
                          selectedAddressId === addr.id_alamat
                            ? "border-blue-600 ring-2 ring-blue-100"
                            : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedAddressId(addr.id_alamat)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                              {addr.nama_penerima}
                              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {addr.tipe_alamat}
                              </span>
                              {addr.is_utama && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-semibold">
                                  Utama
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block mb-1">
                            {addr.no_telepon}
                          </span>
                          <p className="text-xs text-slate-600 pr-8">
                            {addr.detail_jalan}, Kec. {addr.kecamatan},{" "}
                            {addr.kota}, {addr.provinsi} {addr.kode_pos}
                          </p>
                          {addr.catatan_tambahan && (
                            <p className="text-[11px] text-slate-400 mt-1 italic">
                              Catatan: {addr.catatan_tambahan}
                            </p>
                          )}
                        </div>
                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/user/account/address?action=edit&id=${addr.id_alamat}&return_url=/checkout`;
                          }}
                          className="absolute top-3 right-3 text-slate-400 hover:text-blue-600 transition-colors bg-white p-1 rounded"
                          title="Ubah Alamat"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white rounded-lg border border-slate-200 border-dashed">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-4">
                      Belum ada alamat tersimpan.
                    </p>
                    <button
                      onClick={() =>
                        (window.location.href =
                          "/user/account/address?action=add&return_url=/checkout")
                      }
                      className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-100 transition-colors inline-block"
                    >
                      Tambah Alamat Sekarang
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Rincian Produk */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Rincian Produk ({checkoutItems.length} Item)
            </h2>

            <div className="space-y-4">
              {checkoutItems.map((item, index) => {
                const product = item.produk;
                const orgName =
                  product.sub_toko?.toko?.organisasi?.nama_organisasi ??
                  "Organisasi";

                return (
                  <div
                    key={index}
                    className="flex gap-4 items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden flex-none relative">
                      {product.foto ? (
                        <Image
                          src={product.foto}
                          alt={product.nama_produk}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">
                        {product.nama_produk}
                      </h3>
                      <p className="text-xs text-slate-500 mb-1">{orgName}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {item.jumlah} x Rp{" "}
                          {Number(product.harga).toLocaleString("id-ID")}
                        </span>
                        <span className="font-bold text-blue-600">
                          Rp{" "}
                          {(Number(product.harga) * item.jumlah).toLocaleString(
                            "id-ID",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rincian Subtotal & Biaya */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-slate-800">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Layanan</span>
                <span className="font-semibold text-slate-800">
                  Rp {platformFee.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Metode Pembayaran
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => handlePaymentSelect("qris")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "qris"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <QrCode
                  className={`w-6 h-6 ${paymentMethod === "qris" ? "text-blue-600" : "text-slate-400"}`}
                />
                <span
                  className={`text-sm font-semibold ${paymentMethod === "qris" ? "text-blue-900" : "text-slate-600"}`}
                >
                  QRIS
                </span>
              </div>

              <div
                onClick={() => handlePaymentSelect("transfer")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "transfer"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <CreditCard
                  className={`w-6 h-6 ${paymentMethod === "transfer" ? "text-blue-600" : "text-slate-400"}`}
                />
                <span
                  className={`text-sm font-semibold ${paymentMethod === "transfer" ? "text-blue-900" : "text-slate-600"}`}
                >
                  Transfer Bank
                </span>
              </div>

              <div
                onClick={() => handlePaymentSelect("cod")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "cod"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <Wallet
                  className={`w-6 h-6 ${paymentMethod === "cod" ? "text-blue-600" : "text-slate-400"}`}
                />
                <span
                  className={`text-sm font-semibold ${paymentMethod === "cod" ? "text-blue-900" : "text-slate-600"}`}
                >
                  COD (Tunai)
                </span>
              </div>
            </div>

            {showPaymentAlert && (
              <div className="text-red-500 text-sm mt-3 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Tolong pilih metode
                pengambilan terlebih dahulu.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500 mb-0.5">Total Pembayaran</p>
            <p className="text-xl font-extrabold text-blue-600">
              Rp {grandTotal.toLocaleString("id-ID")}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={!deliveryMethod || !paymentMethod || isSavingAddress}
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
              !deliveryMethod || !paymentMethod || isSavingAddress
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:shadow-md"
            }`}
          >
            {isSavingAddress ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </span>
            ) : (
              "Buat Pesanan"
            )}
          </button>
        </div>
      </div>

      {/* TOAST: COD Success */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">
            Pesanan COD berhasil dibuat! Mengalihkan...
          </span>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
