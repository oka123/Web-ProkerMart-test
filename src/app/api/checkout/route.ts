/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import midtransClient from "midtrans-client";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

async function bersihkanKeranjangJikaPerlu(
  supabase: any,
  jalur_checkout: string,
  idUserAsli: string,
  items: any[],
) {
  if (jalur_checkout !== "keranjang") return;

  try {
    const daftarIdProduk =
      items?.map((item: any) => item.produk?.id_produk) ?? [];
    if (daftarIdProduk.length > 0) {
      const { error: deleteCartError } = await supabase
        .from("keranjang")
        .delete()
        .eq("id_pengguna", idUserAsli)
        .in("id_produk", daftarIdProduk);

      if (deleteCartError) {
        console.error("Gagal menghapus keranjang:", deleteCartError.message);
      } else {
        console.log("Keranjang berhasil dibersihkan untuk user:", idUserAsli);
      }
    }
  } catch (cartError) {
    console.error("Terjadi kesalahan saat membersihkan keranjang:", cartError);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const body = await request.json();
    console.log("Struktur item[0]:", JSON.stringify(body.items?.[0], null, 2));
    const {
      total_harga,
      nama_kustomer,
      email_kustomer,
      items,
      metode_pengambilan,
      metode_pembayaran,
      jalur_checkout,
      alamat_pengambilan,
      tgl_ambil,
    } = body;

    const authResponse = await supabase.auth.getUser();
    const idUserAsli = authResponse.data.user?.id;

    if (!idUserAsli) {
      return NextResponse.json(
        { error: "Sesi login tidak ditemukan. Silakan login ulang." },
        { status: 401 },
      );
    }
    // ─── 1. Buat order_id unik yang akan menjembatani DB & Midtrans ──────────
    const order_id = `PROKERMART-${Date.now()}`;

    // Ambil id_sub_toko dari item pertama
    // Catatan: sesuaikan jika struktur item berbeda
    const id_sub_toko =
      items?.[0]?.produk?.sub_toko?.id_sub_toko ??
      items?.[0]?.produk?.id_sub_toko ??
      null;

    if (!id_sub_toko) {
      return NextResponse.json(
        {
          error:
            "Gagal membuat pesanan: Data toko tidak ditemukan pada item ini.",
        },
        { status: 400 },
      );
    }

    const dbDeliveryMethod = metode_pengambilan;

    if (metode_pembayaran === "cod") {
      console.log("Memulai proses simpan COD ke database...");
      const { data: insertedOrder, error: dbError } = await supabase
        .from("pesanan")
        .insert({
          kode_unik: order_id,
          total_harga: Math.round(total_harga),
          metode_pengambilan: dbDeliveryMethod,
          metode_pembayaran: "cod",
          status_pesanan: "menunggu_konfirmasi",
          tgl_pesan: new Date().toISOString(),
          id_sub_toko: id_sub_toko,
          id_pengguna: idUserAsli,
          alamat_pengambilan: alamat_pengambilan || null,
          tgl_ambil: tgl_ambil || null,
        })
        .select("id_pesanan")
        .single();

      if (dbError) {
        console.error("Gagal simpan pesanan COD ke DB:", dbError.message);
        return NextResponse.json(
          { error: "Gagal membuat pesanan COD", detail: dbError.message },
          { status: 500 },
        );
      }

      console.log(
        `Pesanan COD ${order_id} sukses disimpan ke database! ID: ${insertedOrder.id_pesanan}`,
      );

      // Simpan detail_pesanan
      const detailInserts = items.map((item: any) => ({
        id_pesanan: insertedOrder.id_pesanan,
        id_produk: item.produk?.id_produk ?? item.id_produk,
        jumlah: Number(item.jumlah),
        harga_satuan: Number(item.produk?.harga ?? item.harga),
        sub_total:
          Number(item.jumlah) * Number(item.produk?.harga ?? item.harga),
      }));

      const { error: detailError } = await supabase
        .from("detail_pesanan")
        .insert(detailInserts);

      if (detailError) {
        console.error(
          "Gagal simpan detail pesanan COD ke DB:",
          detailError.message,
        );
        return NextResponse.json(
          {
            error: "Gagal menyimpan item pesanan COD",
            detail: detailError.message,
          },
          { status: 500 },
        );
      }

      // Hapus produk dari keranjang setelah COD berhasil disimpan menggunakan helper
      await bersihkanKeranjangJikaPerlu(
        supabase,
        jalur_checkout,
        idUserAsli,
        items,
      );

      // JANGAN PANGGIL MIDTRANS. Langsung kembalikan respon sukses ke frontend
      return NextResponse.json({
        success: true,
        isCod: true,
        message: "Pesanan COD berhasil dibuat!",
      });
    }

    // ─── 2. Simpan pesanan ke Supabase dengan status 'pending' ───────────────
    //        Ini harus dilakukan SEBELUM minta token ke Midtrans,
    //        supaya saat webhook datang, data pesanannya sudah ada di DB.
    const { data: insertedOrder, error: dbError } = await supabase
      .from("pesanan")
      .insert({
        kode_unik: order_id,
        total_harga: Math.round(total_harga),
        metode_pengambilan: dbDeliveryMethod,
        metode_pembayaran: metode_pembayaran,
        status_pesanan: "menunggu_pembayaran",
        tgl_pesan: new Date().toISOString(),
        id_sub_toko: id_sub_toko,
        id_pengguna: idUserAsli,
        alamat_pengambilan: alamat_pengambilan || null,
        tgl_ambil: tgl_ambil || null,
      })
      .select("id_pesanan")
      .single();

    console.log("DB Error:", dbError);
    console.log("Order ID yang dicoba insert:", order_id);

    // Jika gagal simpan ke DB, hentikan proses — jangan lanjut ke Midtrans
    if (dbError) {
      console.error("Gagal simpan pesanan ke DB:", dbError.message);
      return NextResponse.json(
        { error: "Gagal membuat pesanan", detail: dbError.message },
        { status: 500 },
      );
    }

    // Simpan detail_pesanan
    const detailInserts = items.map((item: any) => ({
      id_pesanan: insertedOrder.id_pesanan,
      id_produk: item.produk?.id_produk ?? item.id_produk,
      jumlah: Number(item.jumlah),
      harga_satuan: Number(item.produk?.harga ?? item.harga),
      sub_total: Number(item.jumlah) * Number(item.produk?.harga ?? item.harga),
    }));

    const { error: detailError } = await supabase
      .from("detail_pesanan")
      .insert(detailInserts);

    if (detailError) {
      console.error("Gagal simpan detail pesanan ke DB:", detailError.message);
      return NextResponse.json(
        { error: "Gagal menyimpan item pesanan", detail: detailError.message },
        { status: 500 },
      );
    }

    // Logika Penghapusan barang di keranjang ketika sudah klik tambah pesanan (menggunakan helper)
    await bersihkanKeranjangJikaPerlu(
      supabase,
      jalur_checkout,
      idUserAsli,
      items,
    );

    // ─── 3. Baru minta token ke Midtrans dengan order_id yang sama ───────────
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
      clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    });

    const item_details =
      items?.map((item: any) => ({
        id: item.produk?.id_produk ?? "ITEM",
        price: Math.round(Number(item.produk?.harga)), // Pastikan dibulatkan jadi Integer
        quantity: Number(item.jumlah),
        name: item.produk?.nama_produk?.substring(0, 50) ?? "Produk", // Midtrans membatasi nama max 50 karakter
      })) ?? [];

    // 2. Hitung total harga murni dari seluruh barang
    const totalHargaBarang = item_details.reduce((total: number, item: any) => {
      return total + item.price * item.quantity;
    }, 0);

    // 3. Hitung apakah ada selisih antara total_harga dari frontend dengan total murni barang
    // (Misalnya karena ada ongkir atau biaya layanan)
    const gross_amount = Math.round(total_harga);
    const selisih = gross_amount - totalHargaBarang;

    // 4. Jika ada selisih (misal ongkir), masukkan selisih tersebut sebagai item tambahan
    if (selisih > 0) {
      item_details.push({
        id: "BIAYA-TAMBAHAN",
        price: selisih,
        quantity: 1,
        name: "Biaya Pengiriman / Layanan",
      });
    } else if (selisih < 0) {
      // Jika selisih minus (misal ada diskon), masukkan sebagai item potongan harga
      item_details.push({
        id: "DISKON",
        price: selisih, // Nilai minus diperbolehkan Midtrans untuk diskon
        quantity: 1,
        name: "Potongan Harga / Diskon",
      });
    }

    let enabled_payments: string[] = [];
    if (metode_pembayaran === "qris") {
      enabled_payments = ["gopay", "shopeepay", "ovo", "other_qris"];
    } else if (metode_pembayaran === "transfer") {
      enabled_payments = [
        "bca_va",
        "bni_va",
        "bri_va",
        "mandiri_va",
        "permata_va",
      ];
    }

    const origin = new URL(request.url).origin;

    // 5. Susun parameter Midtrans dengan data yang sudah sinkron 100%
    const parameter: any = {
      transaction_details: {
        order_id: order_id,
        gross_amount: gross_amount, // Dijamin sama dengan total sum dari item_details
      },
      customer_details: {
        first_name: nama_kustomer || "Pembeli",
        email: email_kustomer || "pembeli@prokermart.com",
      },
      item_details: item_details, // Tetap digunakan dengan aman!

      callbacks: {
        finish: `${origin}/user/purchase`,
        error: `${origin}/checkout`,
        pending: `${origin}/user/purchase`,
      },
    };

    if (enabled_payments.length > 0) {
      parameter.enabled_payments = enabled_payments;
    }

    const transaction = await snap.createTransaction(parameter);

    // Update snap_token di tabel pesanan
    const { error: updateTokenError } = await supabase
      .from("pesanan")
      .update({ snap_token: transaction.token })
      .eq("id_pesanan", insertedOrder.id_pesanan);

    if (updateTokenError) {
      console.error("Gagal update snap_token:", updateTokenError);
    }

    return NextResponse.json({ token: transaction.token });
  } catch (error: any) {
    console.error("Error di API checkout:", error.message);
    console.error("GAGAL DARI SDK MIDTRANS:", error.message);
    return NextResponse.json(
      { error: "Gagal memproses pembayaran", detail: error.message },
      { status: 500 },
    );
  }
}
