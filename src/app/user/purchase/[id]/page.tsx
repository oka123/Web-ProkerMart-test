"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Store,
  MapPin,
  Receipt,
  Clock,
  Info,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Package,
  Truck,
  Star,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface OrderDetail {
  id_pesanan: string;
  isRated: boolean;
  id: string; // kode_unik
  kode_unik: string;
  total_harga: number;
  status_pesanan: string;
  tgl_pesan: string;
  tgl_ambil: string | null;
  alamat_pengambilan: string;
  metode_pengambilan: string;
  storeName: string;
  storeId: string; // sub_toko id
  tokoId: string; // toko id
  items: Array<{
    id_produk: any;
    id: string;
    name: string;
    image: string;
    variation: string;
    quantity: number;
    price: number;
  }>;
  payment: {
    method: string;
    status: string;
    date: string | null;
  } | null;
  shippingFee: number;
  serviceFee: number;
  discount: number;
  ratingDetail?: {
    rating: number;
    komentar: string | null;
  } | null;
}

const mapStatusToStepIndex = (status: string) => {
  switch (status) {
    case "menunggu_pembayaran":
      return 0;
    case "menunggu_konfirmasi":
      return 1;
    case "diproses":
      return 2;
    case "siap_diambil":
    case "dikirim":
      return 3;
    case "selesai":
      return 4;
    case "dibatalkan":
      return -1;
    default:
      return 0;
  }
};

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <OrderDetailContent />
    </Suspense>
  );
}

function OrderDetailContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rating Modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isReadOnlyRating, setIsReadOnlyRating] = useState(false);

  async function fetchOrderDetail() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: pesanan, error } = await supabase
        .from("pesanan")
        .select(
          `
          id_pesanan,
          kode_unik,
          total_harga,
          status_pesanan,
          metode_pembayaran,
          tgl_pesan,
          tgl_ambil,
          alamat_pengambilan,
          metode_pengambilan,
          id_sub_toko,
          sub_toko (
            id_toko,
            nama_proker,
            toko (id_toko, nama_toko)
          ),
          ulasan (
            id_ulasan,
            rating,
            komentar
          ),
          detail_pesanan (
            id_detail,
            jumlah,
            harga_satuan,
            produk (
              id_produk,
              nama_produk,
              foto,
              kategori
            )
          )
        `,
        )
        .eq("kode_unik", id)
        .eq("id_pengguna", user.id)
        .single();

      if (error || !pesanan) {
        console.error("Order not found", error);
        router.push("/user/purchase");
        return;
      }

      const subTokoObj = Array.isArray(pesanan.sub_toko)
        ? pesanan.sub_toko[0]
        : pesanan.sub_toko;
      const storeName = subTokoObj?.nama_proker || "Toko";
      const tokoId = subTokoObj?.id_toko || "";

      // Dummy calculations for UI completeness based on screenshots
      const itemsTotal = pesanan.detail_pesanan.reduce(
        (sum: number, dp: any) => sum + dp.jumlah * dp.harga_satuan,
        0,
      );
      const shippingFee = pesanan.metode_pengambilan === "pickup" ? 0 : 12000;
      const serviceFee = 1000;
      const discount = pesanan.metode_pengambilan === "pickup" ? 0 : -12000;

      const formattedOrder: OrderDetail = {
        id_pesanan: pesanan.id_pesanan,
        isRated: pesanan.ulasan && pesanan.ulasan.length > 0,
        id: pesanan.kode_unik,
        kode_unik: pesanan.kode_unik,
        total_harga: pesanan.total_harga, // Should equal itemsTotal + shippingFee + serviceFee + discount
        status_pesanan: pesanan.status_pesanan,
        tgl_pesan: pesanan.tgl_pesan,
        tgl_ambil: pesanan.tgl_ambil,
        alamat_pengambilan:
          pesanan.alamat_pengambilan || "Alamat tidak tersedia",
        metode_pengambilan: pesanan.metode_pengambilan,
        storeName: storeName,
        storeId: pesanan.id_sub_toko,
        tokoId: tokoId,
        items: pesanan.detail_pesanan.map((dp: any) => ({
          id: dp.id_detail,
          id_produk: dp.produk.id_produk,
          name: dp.produk?.nama_produk || "Produk",
          image:
            dp.produk?.foto || "https://placehold.co/100x100?text=No+Image",
          variation: dp.produk?.kategori || "Umum",
          quantity: dp.jumlah,
          price: dp.harga_satuan,
        })),
        payment: pesanan.metode_pembayaran
          ? {
              method: pesanan.metode_pembayaran,
              status:
                pesanan.status_pesanan === "menunggu_pembayaran"
                  ? "menunggu"
                  : "dibayar",
              date: null, // tgl_bayar tidak diambil lagi dari tabel pembayaran
            }
          : null,
        shippingFee,
        serviceFee,
        discount,
        ratingDetail:
          pesanan.ulasan && pesanan.ulasan.length > 0
            ? {
                rating: pesanan.ulasan[0].rating,
                komentar: pesanan.ulasan[0].komentar,
              }
            : null,
      };

      setOrder(formattedOrder);
    } catch (error) {
      console.error("Error", error);
      router.push("/user/purchase");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id, router, supabase]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("pesanan")
        .update({ status_pesanan: "dibatalkan" })
        .eq("id_pesanan", order.id_pesanan);

      if (error) throw error;
      alert("Pesanan berhasil dibatalkan.");
      await fetchOrderDetail();
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Gagal membatalkan pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;
    if (
      !confirm(
        "Apakah Anda yakin sudah menerima pesanan ini dan ingin menyelesaikannya?",
      )
    )
      return;
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("pesanan")
        .update({ status_pesanan: "selesai" })
        .eq("id_pesanan", order.id_pesanan);

      if (error) throw error;
      alert("Pesanan berhasil diselesaikan.");
      await fetchOrderDetail();
    } catch (err) {
      console.error("Error completing order:", err);
      alert("Gagal menyelesaikan pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyAgain = async (items: Array<{ id_produk: string; quantity: number }>) => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Sesi Anda telah habis. Silakan login kembali.");
        return;
      }

      for (const item of items) {
        const { data: existingCartItem, error: fetchError } = await supabase
          .from("keranjang")
          .select("id_keranjang, jumlah")
          .eq("id_pengguna", user.id)
          .eq("id_produk", item.id_produk)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingCartItem) {
          const { error: updateError } = await supabase
            .from("keranjang")
            .update({ jumlah: existingCartItem.jumlah + item.quantity })
            .eq("id_keranjang", existingCartItem.id_keranjang);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("keranjang")
            .insert({
              id_pengguna: user.id,
              id_produk: item.id_produk,
              jumlah: item.quantity,
            });

          if (insertError) throw insertError;
        }
      }

      router.push("/cart");
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Gagal menambahkan produk ke keranjang. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRatingModal = (readOnly: boolean = false) => {
    if (readOnly && order?.ratingDetail) {
      setRatingValue(order.ratingDetail.rating);
      setRatingComment(order.ratingDetail.komentar || "");
      setIsReadOnlyRating(true);
    } else {
      setRatingValue(5);
      setRatingComment("");
      setIsReadOnlyRating(false);
    }
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!order) return;
    try {
      setIsSubmittingRating(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Sesi Anda telah habis. Silakan login kembali.");
        return;
      }

      const { error } = await supabase.from("ulasan").insert({
        id_pengguna: user.id,
        id_sub_toko: order.storeId,
        id_pesanan: order.id_pesanan,
        rating: ratingValue,
        komentar: ratingComment || null,
      });

      if (error) throw error;

      alert("Terima kasih atas penilaian Anda!");
      setShowRatingModal(false);
      await fetchOrderDetail();
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Gagal menyimpan ulasan. Silakan coba lagi.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("Rp", "Rp");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString)
      .toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\./g, ":");
  };

  const formatPaymentMethod = (method: string | undefined) => {
    if (!method) return "-";
    switch (method.toLowerCase()) {
      case "qris":
        return "QRIS";
      case "transfer":
        return "Transfer Bank";
      case "tunai":
        return "Bayar Tunai (COD)";
      default:
        return method.toUpperCase();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Disalin ke clipboard!");
  };

  const handleOpenChat = () => {
    if (!order) return;
    const event = new CustomEvent("openProkerChat", {
      detail: {
        id_sub_toko: order.storeId,
        name: order.storeName,
        type: "toko",
        avatar: `https://placehold.co/100x100?text=${encodeURIComponent(order.storeName.charAt(0))}`,
      },
    });
    window.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = mapStatusToStepIndex(order.status_pesanan);
  const isCanceled = order.status_pesanan === "dibatalkan";

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block shrink-0">
            <UserSidebar />
          </aside>

          <div className="relative flex-1 min-w-0 flex flex-col gap-3 md:gap-4">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white px-4 py-3 sticky top-0 z-40 shadow-sm flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>
              <h1 className="font-semibold text-lg flex-1">Rincian Pesanan</h1>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between bg-white p-4 md:rounded-sm shadow-sm">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-primary-600 font-medium"
              >
                <ChevronLeft className="w-5 h-5" /> KEMBALI
              </button>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-slate-500">
                  NO. PESANAN. {order.kode_unik}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-primary-600 uppercase">
                  {order.status_pesanan.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Stepper Status (Desktop & Mobile combined layout) */}
            {!isCanceled && (
              <div className="bg-white p-6 md:rounded-sm shadow-sm overflow-x-auto">
                <div className="min-w-150 md:min-w-0">
                  <div className="flex items-start justify-between relative px-4">
                    <div className="absolute left-8 right-8 top-6 h-1 bg-slate-200 -z-10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 transition-all duration-500"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                      ></div>
                    </div>

                    {[
                      {
                        icon: Receipt,
                        label: "Pesanan Dibuat",
                        time: order.tgl_pesan
                          ? formatDate(order.tgl_pesan)
                          : "",
                      },
                      {
                        icon: Clock,
                        label: "Pesanan Dibayarkan",
                        time: order.payment?.date
                          ? formatDate(order.payment.date)
                          : "",
                      },
                      { icon: Package, label: "Sedang Dikemas", time: "" },
                      {
                        icon:
                          order.metode_pengambilan === "pickup" ? Store : Truck,
                        label:
                          order.metode_pengambilan === "pickup"
                            ? "Siap Diambil"
                            : "Dikirim",
                        time: "",
                      },
                      { icon: Star, label: "Belum Dinilai", time: "" },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-2 w-24 text-center"
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${idx <= currentStep ? "bg-primary-50 border-primary-600 text-primary-600" : "bg-white border-slate-200 text-slate-300"} transition-colors duration-500`}
                        >
                          <step.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-xs font-medium ${idx <= currentStep ? "text-slate-800" : "text-slate-400"}`}
                          >
                            {step.label}
                          </span>
                          {step.time && (
                            <span className="text-[10px] text-slate-400 mt-1">
                              {step.time}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Status Banner if pending payment */}
            {order.status_pesanan === "menunggu_pembayaran" && (
              <div className="lg:hidden bg-emerald-600 text-white p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-lg">Menunggu Pembayaran</h2>
                    <p className="text-sm opacity-90 mt-1">
                      Lakukan pembayaran sebelum batas waktu berakhir.
                    </p>
                  </div>
                  <Clock className="w-8 h-8 opacity-50" />
                </div>
              </div>
            )}

            {/* Address Section */}
            <div className="bg-white md:rounded-sm shadow-sm relative border-t-2 border-primary-600">
              <div className="absolute top-0 left-0 w-full h-1 opacity-60"></div>

              <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 text-lg text-slate-800 font-medium">
                    <MapPin className="w-5 h-5" />
                    <h3>Alamat Pengiriman</h3>
                  </div>
                  <div className="text-sm text-slate-600 pl-7 space-y-1">
                    {/* <p className="font-bold text-slate-800">
                      {order.alamat_pengambilan?.split(",")[0] || "Oka"}
                    </p> */}
                    <p>{order.alamat_pengambilan}</p>
                  </div>
                </div>

                {/* Logic: "ketika status pesanan dikirim atau siap diambil hanya tampilkan alamat saja tanpa pelacakan pesanan" */}
                {/* {(order.status_pesanan === "dikirim" ||
                  order.status_pesanan === "siap_diambil") && (
                  <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-sm">
                    <p className="font-bold text-emerald-600 mb-1">
                      Pesanan Dalam Pengiriman
                    </p>
                    <p className="text-slate-500">
                      Pelacakan logistik tidak tersedia untuk metode ini.
                      Silakan hubungi penjual jika pesanan belum tiba.
                    </p>
                  </div>
                )} */}
              </div>
            </div>

            {/* Order Items Section */}
            <div className="bg-white md:rounded-sm shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div
                  className="flex items-center gap-2 font-bold text-sm text-slate-800 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/organizations/${order.tokoId}/${order.storeId}`,
                    )
                  }
                >
                  <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Star+
                  </span>
                  {order.storeName}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenChat}
                    className="flex items-center gap-1.5 border border-primary-600 text-primary-600 px-3 py-1 rounded text-xs font-medium hover:bg-primary-50"
                  >
                    Chat
                  </button>
                  <Link
                    href={`/organizations/${order.tokoId}/${order.storeId}`}
                    className="hidden md:flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1 rounded text-xs font-medium hover:bg-slate-50"
                  >
                    Kunjungi Toko
                  </Link>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-slate-100 rounded border border-slate-200 relative shrink-0 cursor-pointer">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                        unoptimized
                        onClick={() =>
                          router.push(`/explore/${item.id_produk}`)
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-sm font-medium text-slate-800 line-clamp-2 hover:text-primary-600 cursor-pointer"
                        onClick={() =>
                          router.push(`/explore/${item.id_produk}`)
                        }
                      >
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Variasi: {item.variation}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        x{item.quantity}
                      </p>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                      <span className="text-sm text-primary-600 font-medium">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <div className="flex items-center gap-4 text-sm w-full md:w-auto">
                  <div className="text-slate-600 flex-1 md:flex-none">
                    Total Pesanan:
                  </div>
                  <div className="font-bold text-primary-600 text-lg">
                    {formatPrice(order.total_harga)}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary (Details) */}
            <div className="bg-white md:rounded-sm shadow-sm p-4 text-sm space-y-3">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Produk</span>
                <span>
                  {formatPrice(
                    order.items.reduce((s, i) => s + i.price * i.quantity, 0),
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Pengiriman</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {order.discount !== 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    Total Diskon Pengiriman <Info className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-emerald-600">
                    {formatPrice(order.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1">
                  Biaya Layanan <Info className="w-3.5 h-3.5" />
                </span>
                <span>{formatPrice(order.serviceFee)}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  Total Pembayaran
                </span>
                <span className="text-xl font-bold text-primary-600">
                  {formatPrice(order.total_harga)}
                </span>
              </div>
            </div>

            {/* Order Details Footer */}
            <div className="bg-white md:rounded-sm shadow-sm p-4 text-xs md:text-sm text-slate-600 space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">No. Pesanan</span>
                <div className="flex items-center gap-2 font-medium text-slate-800 uppercase">
                  {order.kode_unik}
                  <button
                    onClick={() => copyToClipboard(order.kode_unik)}
                    className="text-primary-600 font-bold ml-2"
                  >
                    SALIN
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Waktu Pemesanan</span>
                <span>{formatDate(order.tgl_pesan)}</span>
              </div>
              {/* {order.payment?.date && (
                <div className="flex justify-between items-center">
                  <span>Waktu Pembayaran</span>
                  <span>{formatDate(order.payment.date)}</span>
                </div>
              )} */}
              <div className="flex justify-between items-center">
                <span>Metode Pembayaran</span>
                <span className="font-medium text-slate-800">
                  {formatPaymentMethod(order.payment?.method)}
                </span>
              </div>
            </div>

            {/* Action Buttons: Sticky Bottom on Mobile, static right on Desktop */}
            <div className="sticky bottom-4 left-0 right-0 bg-white border-t border-slate-100 p-3 md:p-0 md:bg-transparent md:border-none z-50">
              <div className="max-w-7xl mx-auto flex justify-end gap-3 md:gap-4 md:bg-white md:p-4 md:shadow-sm md:rounded-sm">
                {order.status_pesanan === "menunggu_pembayaran" && (
                  <>
                    <button
                      onClick={handleCancelOrder}
                      className="flex-1 md:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors"
                    >
                      Batalkan Pesanan
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-2.5 bg-primary-600 text-white font-medium rounded hover:bg-primary-700 shadow-md transition-colors">
                      Bayar Sekarang
                    </button>
                  </>
                )}

                {order.status_pesanan === "selesai" && (
                  <>
                    <button
                      onClick={() =>
                        handleBuyAgain(
                          order.items.map((item) => ({
                            id_produk: item.id_produk,
                            quantity: item.quantity,
                          })),
                        )
                      }
                      className="flex-1 md:flex-none px-6 py-2.5 bg-primary-600 text-white font-medium rounded hover:bg-primary-700 shadow-md transition-colors"
                    >
                      Beli Lagi
                    </button>
                    {order.isRated ? (
                      <button
                        onClick={() => handleOpenRatingModal(true)}
                        className="flex-1 md:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors"
                      >
                        Lihat Penilaian
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenRatingModal(false)}
                        className="flex-1 md:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors"
                      >
                        Beri Penilaian
                      </button>
                    )}
                  </>
                )}

                {(order.status_pesanan === "dikirim" ||
                  order.status_pesanan === "siap_diambil") && (
                  <>
                    <button
                      onClick={handleOpenChat}
                      className="flex-1 md:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Hubungi Penjual
                    </button>
                    <button
                      onClick={handleCompleteOrder}
                      className="flex-1 md:flex-none px-6 py-2.5 bg-primary-600 text-white font-medium rounded hover:bg-primary-700 shadow-md transition-colors"
                    >
                      Pesanan Selesai
                    </button>
                  </>
                )}

                {(order.status_pesanan === "diproses" ||
                  order.status_pesanan === "menunggu_konfirmasi") && (
                  <button
                    onClick={handleOpenChat}
                    className="flex-1 md:flex-none px-6 py-2.5 border border-primary-600 text-primary-600 font-medium rounded hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Store className="w-5 h-5" /> Hubungi Penjual
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-sm shadow-lg max-w-md w-full overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                {isReadOnlyRating ? "Detail Penilaian" : "Penilaian Pesanan"}
              </h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  {isReadOnlyRating ? "Sub-toko yang Dinilai" : "Menilai Sub-toko"}
                </p>
                <p className="font-bold text-slate-800 text-base">
                  {order.storeName}
                </p>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !isReadOnlyRating && setRatingValue(star)}
                    disabled={isReadOnlyRating}
                    className={`focus:outline-none transition-transform ${
                      isReadOnlyRating ? "cursor-default" : "active:scale-95"
                    }`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingValue
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Ulasan / Komentar
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => !isReadOnlyRating && setRatingComment(e.target.value)}
                  disabled={isReadOnlyRating}
                  placeholder={
                    isReadOnlyRating
                      ? "Tidak ada komentar."
                      : "Bagikan pengalaman Anda berbelanja di sub-toko ini..."
                  }
                  className="w-full h-24 p-2 text-sm border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none text-slate-800 disabled:bg-slate-50"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50">
              {isReadOnlyRating ? (
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-sm hover:bg-primary-700 transition-colors shadow-md"
                >
                  Tutup
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    disabled={isSubmittingRating}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-sm hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitRating}
                    disabled={isSubmittingRating}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-sm hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-md"
                  >
                    {isSubmittingRating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Penilaian"
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
