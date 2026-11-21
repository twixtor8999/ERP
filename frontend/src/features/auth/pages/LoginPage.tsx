import { useState, useEffect, useId } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  Loader2,
  ArrowRight,
  Phone,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
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
  if (r.includes("accountant")) return "/accounts";
  if (r.includes("super_admin") || r.includes("admin") || r.includes("owner")) return "/dashboard";
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
  const [regSelectedRole, setRegSelectedRole] = useState("cashier");

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

      toast.success("Account Created Successfully", {
        description: `Registered with assigned role: ${OPERATIONAL_ROLES.find((r) => r.slug === regSelectedRole)?.name || regSelectedRole}`,
      });

      // Automatically sign in with the new registered account
      const loginRes = await authService.login({
        identifier: cleanPhone,
        password: regPassword,
      });
      setUser(loginRes.user);
      if (loginRes.user.allowedBranches && loginRes.user.allowedBranches.length > 0) {
        setAvailableBranches(loginRes.user.allowedBranches);
        const defaultBranch = loginRes.user.allowedBranches[0];
        if (defaultBranch) {
          setActiveBranch(defaultBranch);
        }
      }

      navigate(resolveSmartRoute(loginRes.user.role, loginRes.user.dashboardRoute), { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50/80 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] p-4 text-slate-800">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center">
            <img
              src="/siddeshwar-logo.png"
              alt="Siddeshwar Enterprises Logo"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-slate-200"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
              Siddeshwar Enterprises
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Store Team Portal • Owner, Managers, Cashiers & Delivery
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-6 sm:p-7 space-y-5">
          {/* Segmented Tab Bar */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Staff & Owner Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              New Staff Request
            </button>
          </div>

          {activeTab === "login" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sign In to Store</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your mobile number. The system will automatically open your assigned workspace.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="identifier" className="text-xs font-semibold text-slate-700">
                    Registered Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Enter 10-digit mobile number"
                      className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 font-mono text-sm shadow-sm"
                      disabled={isSubmitting}
                      {...loginRegister("identifier")}
                    />
                  </div>
                  {loginErrors.identifier && (
                    <p className="text-xs text-red-500 font-medium">{loginErrors.identifier.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Password Assistance", {
                          description: "Please contact your Store Owner or Administrator for credential resets.",
                        })
                      }
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className="pl-9 pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 text-sm shadow-sm"
                      disabled={isSubmitting}
                      {...loginRegister("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-red-500 font-medium">{loginErrors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 h-auto shadow-md shadow-emerald-600/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In to Workspace
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Customer Link Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Looking for online shopping?</span>
                <Link to="/shop" className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  Customer Storefront <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Request Staff Access</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submit your details. Your profile will be activated once approved by the store owner.
                </p>
              </div>

              <form onSubmit={onRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor={regFullNameId} className="text-xs font-semibold text-slate-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id={regFullNameId}
                      type="text"
                      placeholder="e.g. Ramesh Patil"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm shadow-sm"
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
                      className="pl-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 font-mono text-sm shadow-sm"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={regRoleSelectId} className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Operational Role</span>
                    <span className="text-[10px] text-slate-400 font-normal">Select branch position</span>
                  </Label>
                  <select
                    id={regRoleSelectId}
                    value={regSelectedRole}
                    onChange={(e) => setRegSelectedRole(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id={regPasswordId}
                      type={showRegPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-9 pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm shadow-sm"
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

                {/* Security guardrail callout */}
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Super Admin & Business Owner roles are enterprise authorities reserved for direct database provisioning.
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 h-auto shadow-md shadow-emerald-600/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Employee Profile...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Register & Access Workspace
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Security & System Footer */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Siddeshwar Multi-Branch Enterprise Security & Isolation
          </p>
          <p className="text-[11px] text-slate-400">Authoritative Cloud PostgreSQL Database Active</p>
        </div>
      </div>
    </div>
  );
}
