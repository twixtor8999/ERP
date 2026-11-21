import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, ArrowRight, ShieldCheck, AlertCircle, Phone, Lock } from "lucide-react";
import { storeApi } from "../services/storeApi";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

export const CustomerLoginPage: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useCustomerAuthStore((s) => s.setAuth);

  const from = (location.state as any)?.from?.pathname || "/shop";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const resp = await storeApi.login({ phone: cleanPhone, password });
      setAuth({
        token: resp.access_token,
        customer: resp.customer,
        user: resp.user,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Invalid mobile number or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/shop" className="inline-flex items-center space-x-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <ShoppingBag className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Welcome to AI Smart Bazar
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to access your cart, addresses and fast home delivery.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Mobile Number
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-500 ml-1.5 pr-2 border-r border-slate-200">
                    +91
                  </span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="block w-full pl-20 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition"
            >
              {loading ? "Signing in..." : "Sign In to Shop"}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              New customer?{" "}
              <Link to="/customer/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
                Create your shopping account
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              Store staff and managers must use the{" "}
              <Link to="/login" className="underline font-medium text-slate-700 hover:text-emerald-700">
                Staff Portal Login
              </Link>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

