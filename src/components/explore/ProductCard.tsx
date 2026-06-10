"use client";

import { ShoppingBag, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Product } from "@/lib/types/product";

function getProductTag(metode: string | null | undefined): {
  label: string;
  color: string;
} {
  const m = metode?.toLowerCase() ?? "";
  if (m.includes("pre-order"))
    return { label: "Pre-order", color: "bg-amber-100 text-amber-700" };
  if (m.includes("keliling"))
    return { label: "Keliling", color: "bg-blue-100 text-blue-700" };
  return { label: "Ready Stock", color: "bg-emerald-100 text-emerald-700" };
}

interface ProductCardProps {
  product: Product;
  /** Used for staggered entrance animation; capped to avoid long delays */
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const tag = getProductTag(product.sub_toko?.metode_jualan);
  const orgName =
    product.sub_toko?.toko?.organisasi?.nama_organisasi ?? "-";
  const prokerName = product.sub_toko?.nama_proker ?? "-";

  return (
    <Link href={`/explore/${product.id_produk}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
        className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col h-full"
      >
        {/* Image */}
        <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
          {product.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.foto}
              alt={product.nama_produk}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <ShoppingBag className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
          )}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2 py-1 rounded-md text-xs font-bold ${tag.color}`}
            >
              {tag.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs font-semibold text-primary-600 mb-1 flex items-center gap-1 line-clamp-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {orgName} · {prokerName}
          </p>
          <h3 className="font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.nama_produk}
          </h3>
          <div className="mt-auto pt-4">
            <p className="text-xs text-slate-500 mb-1">Stok: {product.stok}</p>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-primary-600 text-lg">
                Rp {Number(product.harga).toLocaleString("id-ID")}
              </span>
              <button
                onClick={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
