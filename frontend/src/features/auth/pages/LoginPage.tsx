import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Users,
  Receipt,
  FileText,
  Package,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "../schemas/login.schema";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function resolveSmartRoute(role?: string, fallbackRoute?: string | null): string {
  if (!role) return fallbackRoute || "/home";
  const r = role.toLowerCase().replace(/[-\s]/g, "_");
  if (r.includes("cashier") || r.includes("pos")) return "/pos";
  if (r.includes("delivery")) return "/deliveries";
  if (r.includes("inventory")) return "/inventory";
  if (r.includes("crm") || r.includes("telecaller")) return "/crm";
  if (r.includes("super_admin") || r.includes("admin") || r.includes("owner")) return fallbackRoute || "/home";
  return fallbackRoute || "/home";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCrm =
    searchParams.get("portal") === "crm" ||
    location.pathname.startsWith("/crm") ||
    (typeof window !== "undefined" && window.location.hostname.includes("crm"));

  const { user, isAuthenticated, setUser } = useAuthStore();
  const { setAvailableBranches, setActiveBranch } = useBranchStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (isCrm) {
        navigate("/crm", { replace: true });
      } else {
        navigate(resolveSmartRoute(user.role, user.dashboardRoute), { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, isCrm]);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: true,
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authService.login(data);
      setUser(response.user);
      if (response.user.allowedBranches && response.user.allowedBranches.length > 0) {
        setAvailableBranches(response.user.allowedBranches);
        const defaultBranch = response.user.allowedBranches[0];
        if (defaultBranch) {
          setActiveBranch(defaultBranch);
        }
      }
      toast.success("Authentication Successful", {
        description: `Welcome back, ${response.user.fullName}`,
      });
      if (isCrm) {
        navigate("/crm", { replace: true });
      } else {
        navigate(resolveSmartRoute(response.user.role, response.user.dashboardRoute), { replace: true });
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error - typed axios response error
            err.response?.data?.detail || "Invalid mobile number or password."
          : "Could not connect to authentication service";
      toast.error("Authentication Failed", {
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCrm) {
    return (
      <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-[#f4f7fc] text-slate-800 antialiased p-4">
        {/* Curved Deep Navy Top Banner matching reference screenshot media_1795408708877_dea55063.jpg */}
        <div className="absolute top-0 left-0 right-0 h-[42vh] bg-gradient-to-b from-[#091b42] to-[#061536] rounded-b-[40px] sm:rounded-b-[70px] shadow-md z-0" />

        {/* Centered CRM Login Card */}
        <div className="relative z-10 w-full max-w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-4 my-auto">
          {/* Card Header: Ai Smart Bazar CRM */}
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Ai Smart Bazar <span className="text-[#f59e0b]">CRM</span>
            </h2>
            <div className="inline-block relative">
              <img
                src="/siddeshwar-logo.png"
                alt="Siddeshwar Enterprises Logo"
                className="w-20 h-20 rounded-full object-contain mx-auto"
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-[#162a52] uppercase">
                SIDDESHWAR ENTERPRISES
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Welcome back! Sign in to continue
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3.5 pt-1">
            {/* Mobile / Email / Username Input */}
            <div className="space-y-1">
              <Label htmlFor="crm-identifier" className="text-xs font-bold text-slate-700">
                Mobile / Email / Username
              </Label>
              <Input
                id="crm-identifier"
                type="text"
                placeholder="Registered mobile number / username"
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-sm h-10 rounded-lg shadow-none"
                disabled={isSubmitting}
                {...loginRegister("identifier")}
              />
              {loginErrors.identifier && (
                <p className="text-xs text-red-500 font-medium">{loginErrors.identifier.message}</p>
              )}
            </div>

            {/* Password Input with Hide/Show Toggle */}
            <div className="space-y-1">
              <Label htmlFor="crm-password" className="text-xs font-bold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="crm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-sm h-10 rounded-lg shadow-none pr-14"
                  disabled={isSubmitting}
                  {...loginRegister("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-xs font-bold text-[#1e3a8a] hover:text-blue-700 transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-xs text-red-500 font-medium">{loginErrors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <span className="text-xs text-[#1e3a8a] hover:underline font-bold cursor-pointer">
                Forgot password?
              </span>
            </div>

            {/* Sign In Button with Orange Arrow Circle */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0a1e4a] hover:bg-[#071638] text-white font-bold h-10 rounded-full shadow-sm transition-all flex items-center justify-between px-6"
            >
              <span className="flex-1 text-center font-bold text-sm pl-4">
                {isSubmitting ? "Signing in..." : "Sign In"}
              </span>
              <span className="w-6 h-6 rounded-full bg-[#e65100] text-white flex items-center justify-center shrink-0 shadow-xs">
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                )}
              </span>
            </Button>
          </form>

          {/* New phone? Create Owner account */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-xs font-bold text-[#1e3a8a] hover:underline cursor-pointer"
            >
              New phone? Create Owner account
            </button>
          </div>

          {/* Footer with Lock & Version 5.08 */}
          <div className="text-center pt-1 space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Secure login</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              5.08
            </p>
          </div>

          {/* Portal Switcher */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
            >
              ← Go to Main Store Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white text-slate-800 antialiased selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Top Application Header matching Screenshot 4 */}
      <header className="h-12 sm:h-14 px-4 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-[#d97706] text-sm sm:text-base tracking-tight">
              PK Ai Smart Bazar
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600">
              BILLING SOFTWARE
            </span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Canvas */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Retail Photography & Operations Value Prop matching Screenshot 4 */}
        <div className="relative hidden lg:flex lg:w-[60%] xl:w-[62%] bg-slate-900 overflow-hidden items-end p-6 xl:p-10 pb-8 shrink-0">
          <img
            src="/family-shopping.jpg"
            alt="Indian family shopping in supermarket aisle"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Subtle Dark Gradient Overlay for High Contrast Text */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Hero Branding Content */}
          <div className="relative z-10 space-y-4 max-w-xl">
            <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Run your store, <br />
              <span className="text-slate-100 font-bold">all in one app</span>
            </h2>

            {/* 5 Operational Badges matching Screenshot 4 */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e2e]/90 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-md">
                <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>CRM</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e2e]/90 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-md">
                <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Billing</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e2e]/90 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-md">
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>GST</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e2e]/90 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-md">
                <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Inventory</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e2e]/90 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-md">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Single Clean Login Card matching Screenshot 4 */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 bg-white overflow-y-auto lg:overflow-hidden">
          <div className="w-full max-w-sm sm:max-w-md">
            {/* Back to home link matching Screenshot 4 */}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="text-[#1e3a8a] hover:text-blue-800 font-bold text-xs flex items-center gap-1.5 mb-2 sm:mb-3 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </button>

            <div className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-sm p-4 sm:p-6 space-y-3 sm:space-y-3.5 relative">
              {/* Circular Siddeshwar Enterprises Temple Logo matching reference screenshot */}
              <div className="text-center space-y-1.5">
                <div className="inline-block relative">
                  <img
                    src="/siddeshwar-logo.png"
                    alt="Siddeshwar Enterprises Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-contain mx-auto"
                  />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-[#162a52] uppercase">
                    SIDDESHWAR ENTERPRISES
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">
                    Welcome back! Sign in to continue
                  </p>
                </div>
              </div>

            {/* Single Clean Login Form */}
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-2.5 sm:space-y-3">
              {/* Mobile / Email / Username Input */}
              <div className="space-y-1">
                <Label htmlFor="identifier" className="text-xs font-bold text-slate-700">
                  Mobile / Email / Username
                </Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Registered mobile number / username"
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-xs sm:text-sm h-9 sm:h-10 rounded-lg shadow-none"
                    disabled={isSubmitting}
                    {...loginRegister("identifier")}
                  />
                </div>
                {loginErrors.identifier && (
                  <p className="text-xs text-red-500 font-medium">{loginErrors.identifier.message}</p>
                )}
              </div>

              {/* Password Input with Hide/Show Toggle Inside Input */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-xs sm:text-sm h-9 sm:h-10 rounded-lg shadow-none pr-14"
                    disabled={isSubmitting}
                    {...loginRegister("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 sm:top-2.5 text-xs font-bold text-[#1e3a8a] hover:text-blue-700 transition cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-xs text-red-500 font-medium">{loginErrors.password.message}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-0.5">
                <span className="text-xs text-[#1e3a8a] hover:underline font-bold cursor-pointer">
                  Forgot password?
                </span>
              </div>

              {/* Sign In Button with Orange Arrow Circle matching Screenshot */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#132d5e] hover:bg-[#0f244a] text-white font-bold h-9 sm:h-10 rounded-full shadow-sm transition-all flex items-center justify-between px-5 sm:px-6 cursor-pointer"
              >
                <span className="flex-1 text-center font-bold text-xs sm:text-sm pl-4">
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </span>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#e65100] text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  )}
                </span>
              </Button>
            </form>

            {/* New phone? Create Owner account */}
            <div className="text-center pt-1.5">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-xs font-bold text-[#1e3a8a] hover:underline cursor-pointer"
              >
                New phone? Create Owner account
              </button>
            </div>

            {/* Footer with Lock & Version 5.08 matching Screenshot */}
            <div className="text-center pt-1.5 space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Secure login</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                5.08
              </p>
            </div>

            {/* Switch to CRM Portal Link */}
            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate("/crm/login")}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
              >
                Go to Ai Smart Bazar CRM Portal →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
