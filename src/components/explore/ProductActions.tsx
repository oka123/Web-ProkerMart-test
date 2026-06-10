"use client";

import { useState } from "react";
import { ShoppingBag, Package, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  price: number;
  stock: number;
  productName: string;
}

export function ProductActions({ price, stock, productName }: ProductActionsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);

  const totalPrice = price * quantity;

  const handleAddToCart = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <>
      <div className="flex flex-col gap-6 flex-1">
        {/* Quantity Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" />
            Jumlah Pembelian
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-lg"
              >
                −
              </button>
              <span className="w-12 text-center font-semibold text-slate-800 text-sm">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-lg"
              >
                +
              </button>
            </div>
            <span className="text-sm text-slate-500">Maks. {stock} item</span>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-1">
          <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
            <span>Harga satuan</span>
            <span>Rp {price.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
            <span>Jumlah</span>
            <span>×{quantity}</span>
          </div>
          <hr className="border-blue-200 mb-2" />
          <div className="flex justify-between items-center font-bold text-slate-900">
            <span>Total</span>
            <span className="text-blue-600 text-lg">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={stock === 0}
            className="flex-1 md:flex-none md:w-40 bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
            Keranjang
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={stock === 0}
            className="flex-1 md:flex-none md:w-40 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">
            {productName} berhasil ditambahkan ke keranjang!
          </span>
        </div>
      )}
    </>
  );
}
