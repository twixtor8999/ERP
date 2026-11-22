import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  Loader2,
  ArrowRight,
  ShoppingCart,
  Users,
  Receipt,
  FileText,
  Package,
  BarChart3,
  ArrowLeft,
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
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isAuthenticated, setUser } = useAuthStore();
  const { setAvailableBranches, setActiveBranch } = useBranchStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(resolveSmartRoute(user.role, user.dashboardRoute), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
      navigate(resolveSmartRoute(response.user.role, response.user.dashboardRoute), { replace: true });
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

  return (
    <div className="min-h-screen w-full flex flex-col bg-white text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Application Header matching Screenshot 1 */}
      <header className="h-14 sm:h-16 px-4 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 leading-tight">
            <span className="font-extrabold text-amber-500 text-sm sm:text-base tracking-tight">
              PK Ai Smart Bazar
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
              BILLING SOFTWARE
            </span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side: Retail Photography & Operations Value Prop matching Screenshot 1 */}
        <div className="relative hidden lg:flex lg:w-7/12 xl:w-3/5 bg-slate-900 overflow-hidden items-end p-8 xl:p-14">
          <img
            src="/family-shopping.jpg"
            alt="Indian family shopping in supermarket aisle"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Subtle Dark Gradient Overlay for High Contrast Text */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Hero Branding Content */}
          <div className="relative z-10 space-y-5 max-w-xl">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Run your store, <br />
              <span className="text-slate-100 font-bold">all in one app</span>
            </h2>

            {/* 5 Operational Badges matching Screenshot 1 */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg">
                <Users className="w-4 h-4 text-amber-400" />
                <span>CRM</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Billing</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>GST</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Inventory</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Single Clean Login Card matching Screenshot 1 */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-white lg:bg-slate-50/60">
          <div className="w-full max-w-md bg-white sm:border sm:border-slate-200/90 sm:rounded-2xl sm:shadow-xl sm:shadow-slate-200/50 p-6 sm:p-8 space-y-6 relative">
            {/* Back to Home link matching Screenshot 1 */}
            <div className="text-left">
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to home</span>
              </Link>
            </div>

            {/* Siddeshwar Brand Seal & Title matching Screenshot 1 */}
            <div className="text-center space-y-2">
              <div className="inline-block relative">
                <img
                  src="/siddeshwar-logo.png"
                  alt="Siddeshwar Enterprises Logo"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/40 shadow-sm mx-auto"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1e3a8a] uppercase">
                  SIDDESHWAR ENTERPRISES
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Welcome back! Sign in to continue
                </p>
              </div>
            </div>

            {/* Single Clean Login Form (No Public Sign-Up) */}
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
              {/* Mobile / Email / Username Input */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-semibold text-slate-700">
                  Mobile / Email / Username
                </Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="9739396236"
                    className="bg-[#f0f4f8] border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm h-11 shadow-2xs rounded-lg"
                    disabled={isSubmitting}
                    {...loginRegister("identifier")}
                  />
                </div>
                {loginErrors.identifier && (
                  <p className="text-xs text-red-500 font-medium">{loginErrors.identifier.message}</p>
                )}
              </div>

              {/* Password Input with Hide/Show Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Vijay@123"
                    className="bg-[#f0f4f8] border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm h-11 shadow-2xs rounded-lg pr-10"
                    disabled={isSubmitting}
                    {...loginRegister("password")}
                  />
                </div>
                {loginErrors.password && (
                  <p className="text-xs text-red-500 font-medium">{loginErrors.password.message}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <span className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                  Forgot password?
                </span>
              </div>

              {/* Sign In Button with Orange Arrow Circle matching Screenshot 1 */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1a2942] hover:bg-[#132035] text-white font-bold h-11 rounded-full shadow-md transition-all flex items-center justify-between px-6"
              >
                <span className="flex-1 text-center font-bold text-sm">
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </span>
                <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )}
                </span>
              </Button>
            </form>

            {/* Footer with Lock & Version 5.08 matching Screenshot 1 */}
            <div className="text-center pt-2 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Secure login</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                5.08
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
