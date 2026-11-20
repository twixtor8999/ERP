import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { storeApi } from "../services/storeApi";
import type { Cart } from "../types";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

export const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { isAuthenticated } = useCustomerAuthStore();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{ refreshCart?: () => void }>();

  const loadCart = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const c = await storeApi.getCart();
      setCart(c);
      if (outletCtx?.refreshCart) {
        outletCtx.refreshCart();
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [isAuthenticated]);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      const updated = await storeApi.updateCartItem(itemId, newQty);
      setCart(updated);
      if (outletCtx?.refreshCart) {
        outletCtx.refreshCart();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update item quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      const updated = await storeApi.removeCartItem(itemId);
      setCart(updated);
      if (outletCtx?.refreshCart) {
        outletCtx.refreshCart();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your cart</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Log in with your registered mobile number to access your saved shopping cart and fast doorstep checkout.
        </p>
        <div className="pt-2 flex flex-col space-y-2">
          <Link
            to="/customer/login"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition text-sm"
          >
            Customer Login
          </Link>
          <Link
            to="/customer/register"
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl border border-slate-200 transition text-sm"
          >
            Create New Account
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Loading your cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your shopping cart is empty</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Explore our fresh groceries, grains, spices, and daily essentials delivered directly from Siddeshwar Mart.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm shadow-sm"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Shopping Cart</h1>
          <p className="text-xs text-slate-500">
            {cart.total_items} item{cart.total_items === 1 ? "" : "s"} in your basket
          </p>
        </div>
        <button
          onClick={() => storeApi.clearCart().then(setCart)}
          className="text-xs text-rose-600 hover:underline font-semibold flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Empty Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Line Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4"
            >
              {/* Product Info */}
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">{item.product_name}</h3>
                <span className="text-xs text-slate-500 block">{item.variant_name}</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-sm font-extrabold text-slate-900">
                    ₹{Number(item.unit_price).toFixed(2)}
                  </span>
                  {Number(item.mrp) > Number(item.unit_price) && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{Number(item.mrp).toFixed(2)}
                    </span>
                  )}
                  {Number(item.total_savings) > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Save ₹{Number(item.total_savings).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => handleUpdateQty(item.id, Number(item.quantity) - 1)}
                  disabled={updatingId === item.id || Number(item.quantity) <= 1}
                  className="w-7 h-7 rounded bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-slate-900">
                  {Number(item.quantity).toFixed(0)}
                </span>
                <button
                  onClick={() => handleUpdateQty(item.id, Number(item.quantity) + 1)}
                  disabled={updatingId === item.id}
                  className="w-7 h-7 rounded bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Line Total & Remove */}
              <div className="text-right space-y-1">
                <span className="text-base font-extrabold text-slate-900 block">
                  ₹{Number(item.total_price).toFixed(2)}
                </span>
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={updatingId === item.id}
                  className="text-xs text-slate-400 hover:text-rose-600 transition"
                  title="Remove from cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Delivery Note */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 flex items-center space-x-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              Orders packed and verified by Siddeshwar Mart staff. Standard delivery fee is ₹0 for local Pune pin codes.
            </span>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Bill Details
            </h2>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">₹{Number(cart.subtotal).toFixed(2)}</span>
              </div>
              {Number(cart.total_savings) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Product Discounts</span>
                  <span>-₹{Number(cart.total_savings).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated GST</span>
                <span className="font-semibold text-slate-900">₹{Number(cart.estimated_tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span className="font-semibold text-emerald-600">FREE (Local Store)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Payable</span>
              <span className="text-xl font-extrabold text-emerald-700">
                ₹{Number(cart.grand_total).toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/shop"
            className="block text-center text-xs text-slate-600 hover:text-emerald-600 font-semibold py-2"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
