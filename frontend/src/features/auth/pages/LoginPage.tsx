import { useState, useEffect, useId } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  Loader2,
  ArrowRight,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  ShoppingCart,
  Users,
  Receipt,
  FileText,
  Package,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "../schemas/login.schema";
import { authService, type RegistrationRoleItem } from "../services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const OPERATIONAL_ROLES: RegistrationRoleItem[] = [
  {
    slug: "crm_executive",
    name: "Telecaller & CRM Sales Staff",
    badge: "CRM Telecalling",
    description: "Rural Kirana calling run-sheet, wholesale order punch, incentive targets & route dispatches.",
  },
  {
    slug: "cashier",
    name: "Cashier / Billing Counter Agent",
    badge: "POS Operations",
    description: "Counter billing terminal, active cart scanning, drawer float & shift settlements.",
  },
  {
    slug: "branch_manager",
    name: "Branch Manager",
    badge: "Branch Oversight",
    description: "Branch sales telemetry, cashier shifts audit, stock requisitions & orders dispatch.",
  },
  {
    slug: "inventory_manager",
    name: "Inventory & Stock Manager",
    badge: "Warehouse & Stock",
    description: "Multi-branch stock balances, transfer requisitions, SKU barcodes & product master catalog.",
  },
  {
    slug: "accountant",
    name: "Accountant",
    badge: "Finance & Accounts",
    description: "Cashier float reconciliation, end-of-day discrepancy verification & ledger audits.",
  },
  {
    slug: "sales_executive",
    name: "Sales Executive",
    badge: "In-Store Sales",
    description: "Customer counter orders, billing counter sales, customer CRM & pricing discounts.",
  },
  {
    slug: "crm_executive",
    name: "Telecaller / CRM Staff",
    badge: "Customer Relations",
    description: "Customer Khata ledger, pending Udhaar calls, WhatsApp payment reminders & orders.",
  },
  {
    slug: "employee",
    name: "Store & Delivery Staff",
    badge: "Logistics & Floor",
    description: "Order item picking, parcel packing, mobile delivery runs & OTP verification.",
  },
];

function resolveSmartRoute(role?: string, fallbackRoute?: string | null): string {
  if (!role) return fallbackRoute || "/dashboard";
  const r = role.toLowerCase().replace(/[-\s]/g, "_");
  if (r.includes("cashier") || r.includes("pos")) return "/pos";
  if (r.includes("delivery")) return "/deliveries";
  if (r.includes("inventory")) return "/inventory";
  if (r.includes("accountant") || r.includes("ca")) return "/accounts";
  if (r.includes("crm") || r.includes("telecaller")) return "/crm";
  if (r.includes("super_admin") || r.includes("admin") || r.includes("owner")) return fallbackRoute || "/dashboard";
  return fallbackRoute || "/dashboard";
}

interface LoginPageProps {
  initialTab?: "login" | "register";
}

export function LoginPage({ initialTab = "login" }: LoginPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get("tab") === "register" ? "register" : initialTab;

  const [activeTab, setActiveTab] = useState<"login" | "register">(activeTabFromUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form IDs for accessibility
  const regFullNameId = useId();
  const regPhoneId = useId();
  const regPasswordId = useId();
  const regRoleSelectId = useId();

  // Registration state
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regSelectedRole, setRegSelectedRole] = useState("crm_executive");

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
      rememberMe: false,
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
        description: `Welcome back, ${response.user.fullName} (${response.user.role})`,
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

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      toast.error("Validation Error", { description: "Please enter your full name." });
      return;
    }
    const cleanPhone = regPhone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Validation Error", { description: "Please enter a valid 10-digit mobile number." });
      return;
    }
    if (regPassword.length < 8) {
      toast.error("Validation Error", { description: "Password must be at least 8 characters long." });
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({
        full_name: regFullName.trim(),
        phone: cleanPhone,
        password: regPassword,
        role_slug: regSelectedRole,
      });

      toast.success("Access Request Submitted", {
        description: "Your registration is pending Super Admin role approval. You will be able to log in once approved.",
      });

      setActiveTab("login");
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error - typed axios response error
            err.response?.data?.detail || "Registration failed"
          : "Could not register account";
      toast.error("Registration Failed", {
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoleObj = OPERATIONAL_ROLES.find((r) => r.slug === regSelectedRole) || OPERATIONAL_ROLES[0];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f8fafc] text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <header className="h-14 sm:h-16 px-4 sm:px-8 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
              PK Ai Smart Bazar
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-500">
              BILLING SOFTWARE
            </span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side: Retail Hero Photography & Operations Value Prop */}
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

            {/* 5 Operational Badges from the Live CRM */}
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

        {/* Right Side: Clean Authentication Portal */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-white lg:bg-slate-50/60">
          <div className="w-full max-w-md bg-white sm:border sm:border-slate-200/90 sm:rounded-2xl sm:shadow-xl sm:shadow-slate-200/50 p-6 sm:p-8 space-y-6">
            {/* Siddeshwar Brand Seal & Title */}
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

            {/* Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Staff Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "register"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                New Staff Request
              </button>
            </div>

            {activeTab === "login" ? (
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
                      placeholder="Registered mobile number / username"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm h-11 shadow-xs rounded-xl"
                      disabled={isSubmitting}
                      {...loginRegister("identifier")}
                    />
                  </div>
                  {loginErrors.identifier && (
                    <p className="text-xs text-red-500 font-medium">{loginErrors.identifier.message}</p>
                  )}
                </div>

                {/* Password Input with Show/Hide toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Password Assistance", {
                          description: "Please contact Store Admin or Vijaykumar for credential resets.",
                        })
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className="pr-16 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm h-11 shadow-xs rounded-xl"
                      disabled={isSubmitting}
                      {...loginRegister("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-red-500 font-medium">{loginErrors.password.message}</p>
                  )}
                </div>

                {/* Exact Pill Sign In Button with Orange Arrow Icon */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0a192f] hover:bg-[#112240] text-white font-semibold py-3 px-4 rounded-full flex items-center justify-center gap-3 transition-all shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                      <span className="text-sm">Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold tracking-wide">Sign In</span>
                      <div className="w-6 h-6 rounded-full bg-[#f97316] flex items-center justify-center text-white">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </>
                  )}
                </button>

                {/* Candidate Telecaller Account Request Shortcut */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRegSelectedRole("crm_executive");
                      setActiveTab("register");
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <span>📞 New Telecaller? Request CRM Account Access</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                </div>

                {/* Security Tag & Version */}
                <div className="pt-2 text-center space-y-0.5">
                  <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Secure login
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">5.08</p>
                </div>
              </form>
            ) : (
              /* Staff Registration Form */
              <form onSubmit={onRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor={regFullNameId} className="text-xs font-semibold text-slate-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id={regFullNameId}
                      type="text"
                      placeholder="e.g. Ramesh Patil"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm h-10 shadow-xs rounded-xl"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={regPhoneId} className="text-xs font-semibold text-slate-700">
                    Mobile Number (10 digits)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                      +91
                    </span>
                    <Input
                      id={regPhoneId}
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="pl-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 font-mono text-sm h-10 shadow-xs rounded-xl"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={regRoleSelectId} className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Requested Operational Role</span>
                    <span className="text-[10px] text-slate-400 font-normal">Super Admin will approve</span>
                  </Label>
                  <select
                    id={regRoleSelectId}
                    value={regSelectedRole}
                    onChange={(e) => setRegSelectedRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                    disabled={isSubmitting}
                  >
                    {OPERATIONAL_ROLES.map((role) => (
                      <option key={role.slug} value={role.slug} className="text-slate-900">
                        {role.name} ({role.badge})
                      </option>
                    ))}
                  </select>

                  {/* Role preview box */}
                  {selectedRoleObj && (
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-1 mt-1.5">
                      <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{selectedRoleObj.name}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1 ml-auto bg-white text-blue-700 border-blue-200 shadow-xs">
                          {selectedRoleObj.badge}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {selectedRoleObj.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={regPasswordId} className="text-xs font-semibold text-slate-700">
                    Account Password (min 8 characters)
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id={regPasswordId}
                      type={showRegPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-9 pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm h-10 shadow-xs rounded-xl"
                      disabled={isSubmitting}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Zero-trust security approval notice */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    New accounts are submitted in <strong>PENDING</strong> status. The Super Admin will review your profile and assign your branch role before you can sign in.
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0a192f] hover:bg-[#112240] text-white font-semibold py-2.5 h-auto rounded-full shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
                      Submit Access Request
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Bottom Storefront Cross-link */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Looking for online shopping?</span>
              <Link to="/shop" className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Customer Storefront <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
