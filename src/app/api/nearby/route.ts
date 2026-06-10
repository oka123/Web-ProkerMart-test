import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const search = searchParams.get("search") ?? "";
  const radius = parseFloat(searchParams.get("radius") ?? "10"); // default 10km

  if (!latParam || !lngParam) {
    return NextResponse.json(
      { error: "Latitude dan longitude diperlukan" },
      { status: 400 }
    );
  }

  const userLat = parseFloat(latParam);
  const userLng = parseFloat(lngParam);

  try {
    const supabase = await createClient();

    // 1. Dapatkan daftar id_sub_toko dan jaraknya menggunakan RPC
    const { data: nearbyData, error: rpcError } = await supabase.rpc(
      "get_nearby_sub_toko",
      {
        user_lat: userLat,
        user_lon: userLng,
        max_distance_km: radius,
      }
    );

    if (rpcError) {
      console.error("[API - Nearby] RPC Error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (!nearbyData || nearbyData.length === 0) {
      return NextResponse.json({ shops: [] });
    }

    // 2. Ambil detail sub_toko, toko, dan produk
    const ids = nearbyData.map((n: { id_sub_toko: string }) => n.id_sub_toko);

    let query = supabase
      .from("sub_toko")
      .select(`
        id_sub_toko,
        nama_proker,
        foto_sampul,
        latitude,
        longitude,
        toko (
          nama_toko
        ),
        produk (
          kategori
        )
      `)
      .in("id_sub_toko", ids);

    // Filter pencarian
    if (search.trim()) {
      // Supabase tidak mendukug OR lintas tabel di PostgREST dengan mudah,
      // kita filter dari nama_proker.
      query = query.ilike("nama_proker", `%${search.trim()}%`);
    }

    const { data: shopsData, error: shopsError } = await query;

    if (shopsError) {
      console.error("[API - Nearby] Fetch Shops Error:", shopsError);
      return NextResponse.json({ error: shopsError.message }, { status: 500 });
    }

    // 3. Gabungkan data jarak dengan data toko dan format sesuai UI
    const formattedShops = (shopsData || [])
      .map((shop: any) => {
        // Cari jarak dari data RPC
        const distanceInfo = nearbyData.find(
          (n: any) => n.id_sub_toko === shop.id_sub_toko
        );
        const distanceKm = distanceInfo ? distanceInfo.distance_km : 0;

        // Ambil kategori unik dari produk
        const categories = Array.from(
          new Set((shop.produk || []).map((p: any) => p.kategori).filter(Boolean))
        ).join(", ");

        // Gabungkan nama toko dan proker
        const namaToko = shop.toko?.nama_toko || "Toko";
        const fullName = `${namaToko} - ${shop.nama_proker}`;

        // Jika pencarian text dipakai, bisa di-filter lagi di JS agar lebih akurat mencari nama_toko juga
        if (
          search.trim() &&
          !fullName.toLowerCase().includes(search.toLowerCase())
        ) {
          return null; // Akan dibuang di tahap filter
        }

        return {
          id: shop.id_sub_toko,
          name: fullName,
          categories: categories || "Lainnya",
          rating: 4.5 + Math.random() * 0.5, // Dummy rating untuk sementara karena belum ada tabel review
          reviewCount: Math.floor(Math.random() * 200) + 10,
          distanceKm: parseFloat(distanceKm.toFixed(1)),
          travelTimeMin: Math.round(distanceKm * 15) || 5, // Estimasi 15 menit per km
          imageUrl: shop.foto_sampul || "/placeholder.jpg",
          lat: shop.latitude,
          lng: shop.longitude,
          promoTag: Math.random() > 0.7 ? "Terlaris" : undefined, // Dummy promo
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm); // Urutkan berdasarkan jarak

    return NextResponse.json({ shops: formattedShops });
  } catch (err) {
    console.error("[API - Nearby] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
