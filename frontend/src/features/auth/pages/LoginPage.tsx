import { useState } from "react";
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
  if (r.includes("super_admin") || r.includes("admin") || r.includes("owner")) return "/home";
  return "/home";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CRM wrong-portal modal state
  const [crmModal, setCrmModal] = useState<{
    visible: boolean;
    userName: string;
    role: string;
  }>({ visible: false, userName: "", role: "" });

  const isCrm =
    searchParams.get("portal") === "crm" ||
    location.pathname.startsWith("/crm");

  const { setUser } = useAuthStore();
  const { setAvailableBranches, setActiveBranch } = useBranchStore();

  // Note: We intentionally do NOT auto-redirect on page load so the login screen
  // never kicks the user into the app automatically while they are typing their details.
  // The user must explicitly tap the "Sign In" button to authenticate.

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

      const role = response.user.role?.toLowerCase().replace(/[-\s]/g, "_") || "";
      const isCrmRole = role.includes("crm") || role.includes("telecaller");

      // If a CRM/Telecaller user logs in on the admin page → show wrong-portal modal
      if (!isCrm && isCrmRole) {
        setCrmModal({
          visible: true,
          userName: response.user.fullName || "CRM User",
          role: response.user.role || "Telecaller/CRM",
        });
        setIsSubmitting(false);
        return;
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
      <div className="h-screen w-full relative flex flex-col items-center justify-start pt-2 sm:pt-3 bg-white text-slate-800 antialiased px-3 sm:px-4 overflow-hidden">
        {/* Exact Reference Curved Royal Blue Canopy Arc */}
        <div
          className="absolute pointer-events-none z-0"
          style={{
            top: 0,
            left: "-15%",
            right: "-15%",
            height: "42vh",
            minHeight: "260px",
            maxHeight: "380px",
            background: "linear-gradient(180deg, #0d369c 0%, #1149bd 100%)",
            borderRadius: "0 0 50% 50% / 0 0 28% 28%",
          }}
        />

        {/* Centered CRM Login Card matching reference 1:1 */}
        <div className="relative z-10 w-full max-w-[408px] bg-white rounded-[22px] shadow-[0_18px_50px_rgba(13,27,76,0.25)] border-0 px-6 py-6 sm:px-7 sm:py-7 space-y-3.5">
          {/* Card Header: Ai Smart Bazar CRM */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-[27px] font-black text-[#0d1b4c] tracking-tight">
              Ai Smart Bazar <span className="text-[#f59e0b]">CRM</span>
            </h2>
            <div className="inline-block relative pt-0.5">
              <img
                src="/siddeshwar-logo.png"
                alt="Siddeshwar Enterprises Logo"
                className="w-16 h-16 rounded-full object-contain mx-auto"
              />
            </div>
            <div className="pt-0.5">
              <h1 className="text-sm font-extrabold tracking-tight text-[#0d1b4c] uppercase">
                SIDDESHWAR ENTERPRISES
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Welcome back! Sign in to continue
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3">
            {/* Mobile / Email / Username Input */}
            <div className="space-y-1">
              <Label htmlFor="crm-identifier" className="text-xs font-bold text-slate-700">
                Mobile / Email / Username
              </Label>
              <Input
                id="crm-identifier"
                type="text"
                placeholder="Registered mobile number / username"
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-sm h-10 rounded-[12px] shadow-none"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("crm-password")?.focus();
                  }
                }}
                {...loginRegister("identifier")}
              />
              {loginErrors.identifier && (
                <p className="text-[10px] text-red-500 font-medium">{loginErrors.identifier.message}</p>
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
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-sm h-10 rounded-[12px] shadow-none pr-14"
                  disabled={isSubmitting}
                  {...loginRegister("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-xs font-bold text-[#1e3a8a] hover:text-blue-700 transition cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-[10px] text-red-500 font-medium">{loginErrors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <span className="text-xs text-[#1e3a8a] hover:underline font-bold cursor-pointer">
                Forgot password?
              </span>
            </div>

            {/* Sign In Button matching reference styling */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0d1b4c] hover:bg-[#081233] text-white font-bold h-10 rounded-[12px] shadow-[0_6px_14px_-6px_rgba(15,58,168,0.55)] transition-all flex items-center justify-between px-5 cursor-pointer"
            >
              <span className="flex-1 text-center font-bold text-sm pl-4">
                {isSubmitting ? "Signing in..." : "Sign In"}
              </span>
              <span className="w-5 h-5 rounded-full bg-[#f08a1c] text-white flex items-center justify-center shrink-0 shadow-xs">
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                )}
              </span>
            </Button>
          </form>

          {/* Footer with Lock & Version 5.08 matching reference */}
          <div className="text-center pt-2 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Secure login</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              5.08
            </p>
          </div>

          {/* Switch to Admin Login */}
          <div className="text-center pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              ← Back to Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white text-slate-800 antialiased selection:bg-blue-600 selection:text-white overflow-hidden">

      {/* ── CRM Wrong-Portal Modal ────────────────────────────────────────── */}
      {crmModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Title */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="text-base font-black text-slate-900">Use your own login link</h2>
            </div>

            {/* User identity line */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">
                {crmModal.userName}{" "}
                <span className="text-slate-500 font-normal">·</span>{" "}
                <span className="font-semibold text-slate-700">{crmModal.role} · SIDDESHWAR ENTERPRISES</span>
              </p>

              <p className="text-sm text-slate-600">This login works only on:</p>

              <p className="text-sm font-black text-slate-900 tracking-tight">
                erp-9kr.pages.dev/crm/login
              </p>

              <p className="text-xs text-slate-500">
                Save this link on your phone{" "}
                <span className="text-slate-400">(Chrome: ⋮ → Add to Home screen).</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCrmModal({ visible: false, userName: "", role: "" })}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setCrmModal({ visible: false, userName: "", role: "" });
                  navigate("/crm/login");
                }}
                className="px-4 py-2 rounded-lg bg-[#0d1b4c] hover:bg-[#081233] text-white text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                Open my link
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Top Application Header matching Screenshot 4 */}
      <header className="h-11 sm:h-12 px-4 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-20">
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
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 sm:p-4 bg-white overflow-hidden">
          <div className="w-full max-w-[360px] sm:max-w-[380px]">
            {/* Back to home link matching Screenshot 4 */}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="text-[#1e3a8a] hover:text-blue-800 font-bold text-xs flex items-center gap-1.5 mb-1.5 sm:mb-2 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </button>

            <div className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-sm px-4 py-3 sm:px-6 sm:py-4 space-y-2 sm:space-y-2.5 relative">
              {/* Circular Siddeshwar Enterprises Temple Logo matching reference screenshot */}
              <div className="text-center space-y-1">
                <div className="inline-block relative">
                  <img
                    src="/siddeshwar-logo.png"
                    alt="Siddeshwar Enterprises Logo"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-contain mx-auto"
                  />
                </div>
                <div>
                  <h1 className="text-xs sm:text-sm font-black tracking-tight text-[#162a52] uppercase">
                    SIDDESHWAR ENTERPRISES
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                    Welcome back! Sign in to continue
                  </p>
                </div>
              </div>

              {/* Single Clean Login Form */}
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-2">
                {/* Mobile / Email / Username Input */}
                <div className="space-y-0.5">
                  <Label htmlFor="identifier" className="text-[11px] font-bold text-slate-700">
                    Mobile / Email / Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Registered mobile number / username"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-xs sm:text-sm h-8 sm:h-9 rounded-lg shadow-none"
                      disabled={isSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          document.getElementById("password")?.focus();
                        }
                      }}
                      {...loginRegister("identifier")}
                    />
                  </div>
                  {loginErrors.identifier && (
                    <p className="text-[10px] text-red-500 font-medium">{loginErrors.identifier.message}</p>
                  )}
                </div>

                {/* Password Input with Hide/Show Toggle Inside Input */}
                <div className="space-y-0.5">
                  <Label htmlFor="password" className="text-[11px] font-bold text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-xs sm:text-sm h-8 sm:h-9 rounded-lg shadow-none pr-14"
                      disabled={isSubmitting}
                      {...loginRegister("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1.5 sm:top-2 text-xs font-bold text-[#1e3a8a] hover:text-blue-700 transition cursor-pointer"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-[10px] text-red-500 font-medium">{loginErrors.password.message}</p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <span className="text-[11px] text-[#1e3a8a] hover:underline font-bold cursor-pointer">
                    Forgot password?
                  </span>
                </div>

                {/* Sign In Button with Orange Arrow Circle matching Screenshot */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#132d5e] hover:bg-[#0f244a] text-white font-bold h-8 sm:h-9 rounded-full shadow-sm transition-all flex items-center justify-between px-4 sm:px-5 cursor-pointer"
                >
                  <span className="flex-1 text-center font-bold text-xs sm:text-sm pl-4">
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-[#e65100] text-white flex items-center justify-center shrink-0 shadow-xs">
                    {isSubmitting ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <ArrowRight className="w-3 h-3 text-white" />
                    )}
                  </span>
                </Button>
              </form>

              {/* New phone? Create Owner account */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-[11px] font-bold text-[#1e3a8a] hover:underline cursor-pointer"
                >
                  New phone? Create Owner account
                </button>
              </div>

              {/* Footer with Lock & Version 5.08 matching Screenshot */}
              <div className="text-center pt-0.5 space-y-0.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Secure login</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  5.08
                </p>
              </div>

              {/* Switch to CRM Portal Link */}
              <div className="text-center pt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate("/crm/login")}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
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
