import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { StoreHeader } from "./StoreHeader";
import { storeApi } from "../services/storeApi";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

export const StoreLayout: React.FC = () => {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useCustomerAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      storeApi
        .getCart()
        .then((c) => setCartCount(c.total_items))
        .catch(() => setCartCount(0));
    } else {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <StoreHeader cartCount={cartCount} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet context={{ refreshCart: () => storeApi.getCart().then((c) => setCartCount(c.total_items)) }} />
      </main>

      <footer className="bg-slate-900 text-slate-300 py-10 border-t border-slate-800 mt-12 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-bold text-white block mb-2">AI Smart Bazar</span>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Direct retail shopping and home delivery operated by Siddeshwar Enterprises.
              Delivered fresh by our verified shop staff with doorstep care.
            </p>
            <p className="text-xs text-slate-500">© 2026 Siddeshwar Enterprises. All rights reserved.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">Shop Categories</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Groceries & Daily Staples</li>
              <li>Pulses, Rice & Atta</li>
              <li>Edible Oils & Ghee</li>
              <li>Spices, Masalas & Seasonings</li>
              <li>Packaged Snacks & Beverages</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">Customer Care</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Order Tracking</li>
              <li>Delivery Service Areas</li>
              <li>Return & Refund Policy</li>
              <li>Direct Store Contact</li>
              <li>Help & FAQs</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">Fulfillment Branch</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              Siddeshwar Central Mart<br />
              Main Commercial Road, Shivajinagar<br />
              Pune, Maharashtra 411005
            </p>
            <p className="text-xs text-emerald-400 font-medium">Customer Support: +91 20 25555555</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

