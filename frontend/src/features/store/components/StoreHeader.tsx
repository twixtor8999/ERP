import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  MapPin,
  LogOut,
  Package,
} from "lucide-react";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

interface StoreHeaderProps {
  onSearch?: (q: string) => void;
  cartCount?: number;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ onSearch, cartCount = 0 }) => {
  const [searchInput, setSearchInput] = useState("");
  const { isAuthenticated, logout } = useCustomerAuthStore();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchInput);
    } else {
      navigate(`/shop?q=${encodeURIComponent(searchInput)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner */}
      <div className="bg-emerald-700 text-white text-xs py-1.5 px-4 font-medium flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-200" />
          <span>Fulfilling fresh from Siddeshwar Central Mart, Pune • Same-day Delivery</span>
        </div>
        <div className="hidden sm:flex space-x-4">
          <Link to="/shop" className="hover:text-emerald-100">Supermarket Catalog</Link>
          <span className="text-emerald-400">|</span>
          <a href="tel:+912025555555" className="hover:text-emerald-100">Support: +91 20 25555555</a>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/shop" className="flex items-center space-x-2 flex-shrink-0">
          <img
            src="/siddeshwar-logo.png"
            alt="Siddeshwar Enterprises Logo"
            className="w-10 h-10 rounded-full object-cover shadow-md shadow-emerald-500/20 border border-emerald-500/20"
          />
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
              AI Smart Bazar
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 tracking-wider uppercase block">
              Siddeshwar Enterprises
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-2 hidden sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search groceries, staples, spices, rice, oil..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            to="/cart"
            className="flex items-center space-x-1.5 px-3 py-2 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition relative font-medium text-sm"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden md:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/account/orders"
                className="hidden sm:flex items-center space-x-1 px-3 py-2 text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-lg text-sm font-medium"
              >
                <Package className="w-4 h-4 text-slate-500" />
                <span>Orders</span>
              </Link>
              <Link
                to="/account/addresses"
                className="hidden sm:flex items-center space-x-1 px-3 py-2 text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-lg text-sm font-medium"
              >
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Addresses</span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/customer/login"
                className="text-sm font-semibold text-slate-700 hover:text-emerald-600 px-3 py-2"
              >
                Login
              </Link>
              <Link
                to="/customer/register"
                className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
