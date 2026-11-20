import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Plus,
  Check,
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  Tag,
} from "lucide-react";
import { storeApi } from "../services/storeApi";
import type { CategoryItem, ProductCard, ProductVariantCard } from "../types";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

export const StoreCatalogPage: React.FC = () => {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const { isAuthenticated } = useCustomerAuthStore();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{ refreshCart?: () => void }>();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      storeApi.getProducts({
        q: searchQuery || undefined,
        category_id: selectedCategory || undefined,
      }),
      storeApi.getCategories(),
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.items);
        setCategories(catRes);
      })
      .catch((err) => {
        console.error("Failed to fetch catalog:", err);
      })
      .finally(() => setLoading(false));
  }, [searchQuery, selectedCategory]);

  const handleAddToCart = async (_product: ProductCard, variant: ProductVariantCard) => {
    if (!isAuthenticated) {
      navigate("/customer/login");
      return;
    }

    setAddingId(variant.id);
    try {
      await storeApi.addToCart(variant.id, 1);
      if (outletCtx?.refreshCart) {
        outletCtx.refreshCart();
      }
      setSuccessId(variant.id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to add to cart");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Smart Bazar • Siddeshwar Enterprises</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Fresh Groceries Delivered Directly From Our Shop
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Delivered directly to your door by our trusted store staff. No hidden third-party fees,
            fair transparent retail prices, and fresh quality guaranteed.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium text-emerald-200">
            <div className="flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-emerald-300" />
              <span>Doorstep Delivery in 2-4 Hours</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>100% Genuine Quality</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-300" />
              <span>Cash on Delivery & UPI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="space-y-2">
        <h2 className="text-base font-bold text-slate-800">Browse Categories</h2>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedCategory === null
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.name} ({cat.product_count})
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">
            {searchQuery ? `Search results for "${searchQuery}"` : "Supermarket Essentials"}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing {products.length} product{products.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
                <div className="h-40 bg-slate-100 rounded-lg"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any products matching your search or selected category.
            </p>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Clear filters and show all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const primaryVariant = p.variants[0];
              const isAdding = primaryVariant && addingId === primaryVariant.id;
              const isSuccess = primaryVariant && successId === primaryVariant.id;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Media Header */}
                  <div className="relative p-4 pb-0">
                    <div className="w-full h-40 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-emerald-50/50 transition">
                      <ShoppingBag className="w-16 h-16 text-slate-300 group-hover:text-emerald-400 transition" />
                    </div>

                    {p.discount_percentage > 0 && (
                      <span className="absolute top-6 left-6 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{p.discount_percentage}% OFF</span>
                      </span>
                    )}

                    <span
                      className={`absolute top-6 right-6 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.in_stock
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {p.in_stock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      {p.category_name && (
                        <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                          {p.category_name}
                        </span>
                      )}
                      <Link to={`/shop/product/${p.id}`} className="hover:text-emerald-600 transition">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                      </Link>
                      {p.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing and Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-lg font-extrabold text-slate-900">
                            ₹{Number(p.selling_price).toFixed(2)}
                          </span>
                          {Number(p.mrp) > Number(p.selling_price) && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{Number(p.mrp).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {primaryVariant && (
                          <span className="text-[11px] text-slate-500 block">
                            {primaryVariant.variant_name}
                          </span>
                        )}
                      </div>

                      {primaryVariant && p.in_stock ? (
                        <button
                          onClick={() => handleAddToCart(p, primaryVariant)}
                          disabled={isAdding}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                            isSuccess
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                          }`}
                        >
                          {isSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAdding ? "Adding..." : "Add"}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-rose-500 font-semibold">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
