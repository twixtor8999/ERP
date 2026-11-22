import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  MapPin,
  LogOut,
  Package,
  Menu,
  X,
  Phone,
  Store,
  User,
} from "lucide-react";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

interface StoreHeaderProps {
  onSearch?: (q: string) => void;
  cartCount?: number;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ onSearch, cartCount = 0 }) => {
  const [searchInput, setSearchInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { customer, user: customerUser, isAuthenticated, logout } = useCustomerAuthStore();
  const navigate = useNavigate();

  // Prevent background scrolling when mobile customer drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isMobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    if (onSearch) {
      onSearch(searchInput.trim());
    } else {
      navigate(`/shop?q=${encodeURIComponent(searchInput.trim())}`);
    }
    setIsMobileMenuOpen(false);
  };

  const mobileDrawer = isMobileMenuOpen ? (
    <div
      className="fixed inset-0 z-[9999] flex select-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: "100dvh",
        width: "100vw",
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsMobileMenuOpen(false)}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Customer Mobile Drawer */}
      <div
        className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-[290px] max-w-[85vw] flex-col bg-white border-r shadow-2xl animate-in slide-in-from-left duration-200 overflow-hidden"
        style={{ height: "100dvh", maxHeight: "100dvh" }}
      >
        {/* Drawer Header - Pinned */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/siddeshwar-logo.png"
              alt="Siddeshwar Enterprises Logo"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-emerald-300 shadow-xs"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm leading-tight text-white truncate">
                AI Smart Bazar
              </span>
              <span className="text-[10px] text-emerald-200 font-semibold truncate">
                Customer Storefront
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Search Input */}
        <div className="p-3 border-b bg-slate-50 shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search groceries, staples..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Scrollable Nav List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-contain touch-pan-y">
          <Link
            to="/shop"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
          >
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Supermarket Catalog</span>
          </Link>

          <Link
            to="/cart"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span>Shopping Cart</span>
            </div>
            {cartCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {cartCount} items
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                My Account
              </div>
              <Link
                to="/account/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <Package className="w-4 h-4 text-slate-500" />
                <span>My Past Orders</span>
              </Link>
              <Link
                to="/account/addresses"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Saved Addresses</span>
              </Link>
            </>
          ) : (
            <>
              <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Account
              </div>
              <Link
                to="/customer/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>Customer Login</span>
              </Link>
              <Link
                to="/customer/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
              >
                <span>Create New Account</span>
              </Link>
            </>
          )}

          <div className="pt-3 border-t border-slate-100 mt-2">
            <a
              href="tel:+912025555555"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-emerald-700 transition"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Support: +91 20 25555555</span>
            </a>
          </div>
        </div>

        {/* Drawer Footer - Pinned */}
        {isAuthenticated && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
            <div className="overflow-hidden">
              <p className="font-bold text-slate-900 truncate">
                {customer?.display_name || customerUser?.fullName || customerUser?.full_name || customer?.phone || customerUser?.phone || "Customer"}
              </p>
              <p className="text-[10px] text-emerald-600 font-medium">Verified Customer</p>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
                navigate("/shop");
              }}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner */}
      <div className="bg-emerald-700 text-white text-xs py-1.5 px-3 sm:px-4 font-medium flex justify-between items-center">
        <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
          <MapPin className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
          <span className="truncate">Siddeshwar Central Mart, Pune • Same-day Delivery</span>
        </div>
        <div className="hidden sm:flex space-x-4 shrink-0">
          <Link to="/shop" className="hover:text-emerald-100">Supermarket Catalog</Link>
          <span className="text-emerald-400">|</span>
          <a href="tel:+912025555555" className="hover:text-emerald-100">Support: +91 20 25555555</a>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu + Brand */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="sm:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0"
            aria-label="Open Store Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand */}
          <Link to="/shop" className="flex items-center space-x-2 flex-shrink-0">
            <img
              src="/siddeshwar-logo.png"
              alt="Siddeshwar Enterprises Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-md shadow-emerald-500/20 border border-emerald-500/20"
            />
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                AI Smart Bazar
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 tracking-wider uppercase block">
                Siddeshwar Enterprises
              </span>
            </div>
          </Link>
        </div>

        {/* Search Bar (Tablet / Desktop) */}
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
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link
            to="/cart"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition relative font-medium text-sm"
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
            <div className="flex items-center space-x-1 sm:space-x-2">
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
                className="hidden sm:block p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Link
                to="/customer/login"
                className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-600 px-2 sm:px-3 py-1.5"
              >
                Login
              </Link>
              <Link
                to="/customer/register"
                className="text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg shadow-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Portaled Mobile Customer Navigation Drawer */}
      {mobileDrawer && typeof document !== "undefined"
        ? createPortal(mobileDrawer, document.body)
        : null}
    </header>
  );
};
