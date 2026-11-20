import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Truck,
  ShieldCheck,
  Package,
  Plus,
  Minus,
} from "lucide-react";
import { storeApi } from "../services/storeApi";
import type { ProductCard } from "../types";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuthStore();

  const [product, setProduct] = useState<ProductCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    storeApi
      .getProduct(id)
      .then((p) => {
        setProduct(p);
      })
      .catch(() => {
        setError("Could not load product details. It may be unavailable.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate("/customer/login", { state: { from: { pathname: `/shop/product/${product.id}` } } });
      return;
    }

    setAdding(true);
    try {
      await storeApi.addToCart(product.id, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not add item to cart.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse" />
            <div className="h-20 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto my-10">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Product Unavailable</h2>
        <p className="text-sm text-slate-500 mb-6 mt-1">{error || "Product not found."}</p>
        <Link
          to="/shop"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const sellingPrice = parseFloat(String(product.selling_price));
  const mrp = product.mrp ? parseFloat(String(product.mrp)) : sellingPrice;
  const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const availableStock = product.available_stock ?? (product.variants?.[0]?.stock_quantity ? Number(product.variants[0].stock_quantity) : 10);
  const inStock = product.in_stock && availableStock > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link to="/shop" className="hover:text-emerald-600 flex items-center">
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Back to Supermarket
        </Link>
        <span>/</span>
        <span className="text-slate-400">{product.category_name}</span>
        <span>/</span>
        <span className="text-slate-700 font-medium truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
        {/* Left: Product Visual Presentation */}
        <div className="bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center relative border border-slate-100 min-h-[300px]">
          {discountPercent > 0 && (
            <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {discountPercent}% OFF MRP
            </div>
          )}

          <div className="w-36 h-36 rounded-3xl bg-white border border-slate-200/80 shadow-inner flex items-center justify-center text-emerald-600 mb-4">
            <Package className="w-20 h-20 stroke-[1.5]" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {product.category_name}
          </span>
          <span className="text-xs text-slate-400 font-mono mt-1">
            SKU: {product.sku ?? product.variants?.[0]?.sku ?? product.code}
          </span>
        </div>

        {/* Right: Pricing, Description & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {product.unit ?? "Standard"}
              </span>

              {inStock ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  In Stock ({Math.floor(availableStock)} available)
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {product.description && (
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price Box */}
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-baseline space-x-3">
              <span className="text-3xl font-extrabold text-slate-900">
                ₹{sellingPrice.toFixed(2)}
              </span>
              {mrp > sellingPrice && (
                <span className="text-base text-slate-400 line-through">
                  ₹{mrp.toFixed(2)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Save ₹{(mrp - sellingPrice).toFixed(2)}
                </span>
              )}
            </div>

            <div className="mt-2 text-[11px] text-slate-400">
              *Inclusive of all applicable GST taxes.
            </div>
          </div>

          {/* Quantity and Cart Buttons */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {inStock ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 p-1 self-start">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(Math.floor(availableStock), q + 1))
                    }
                    disabled={quantity >= availableStock}
                    className="p-2 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{adding ? "Adding..." : "Add to Cart"}</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
                This item is currently out of stock at your local branch.
              </div>
            )}

            {addedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
                <span>Added to cart successfully!</span>
                <Link to="/cart" className="underline font-bold hover:text-emerald-900">
                  View Cart & Checkout
                </Link>
              </div>
            )}

            {/* Value Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2.5 text-xs text-slate-600">
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Delivered by verified Siddeshwar staff</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% genuine sealed quality goods</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
