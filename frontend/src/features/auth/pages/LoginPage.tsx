import { useState, useId } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  const { setUser } = useAuthStore();
  const { setAvailableBranches, setActiveBranch } = useBranchStore();

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
      navigate(response.user.dashboardRoute || "/dashboard");
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

      navigate(loginRes.user.dashboardRoute || "/dashboard");
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
              className="w-20 h-20 rounded-full object-cover shadow-xl border-2 border-amber-500/30"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
              AI Smart Bazar
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ERP
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Siddeshwar Enterprises • Enterprise Multi-Branch Retail Operations
            </p>
          </div>
        </div>

        {/* Enterprise Auth Card */}
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
              Sign In to ERP
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
              Register Employee
            </button>
          </div>

          {activeTab === "login" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Enterprise Sign In</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered mobile number to access your authorized branch workspace.
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
                      className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 font-mono text-sm shadow-sm"
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
                          description: "Please contact your Super Admin or Branch Administrator for credential resets.",
                        })
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
                      className="pl-9 pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 text-sm shadow-sm"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 h-auto shadow-md shadow-blue-600/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Workspace
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register Operational Staff</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create an employee account with your mobile number and assigned operational role.
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

        {/* Security & Database Status Footer */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Enterprise Branch Isolation & Role-Based Access Control
          </p>
          <p className="text-[11px] text-slate-400">Authoritative Cloud PostgreSQL Database (Neon)</p>
        </div>
      </div>
    </div>
  );
}
