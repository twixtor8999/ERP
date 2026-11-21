import { useState, useId } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Store,
  Lock,
  Loader2,
  ArrowRight,
  Phone,
  User,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "../schemas/login.schema";
import { authService, type RegistrationRoleItem } from "../services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "9876543210",
      password: "Password123!",
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
            err.response?.data?.detail || "Authentication failed"
          : "Could not connect to authentication service";
      toast.error("Login Failed", {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 mb-1 border border-primary/30">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            AI Smart Bazar <Badge variant="secondary" className="text-xs bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-normal">ERP</Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Siddeshwar Enterprises • Enterprise Multi-Branch Retail Operations
          </p>
        </div>

        {/* Auth Card Container */}
        <Card className="border-slate-800 bg-card/95 backdrop-blur-md shadow-2xl shadow-black/40">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1.5 m-4 mb-0 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "login"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In to ERP
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "register"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register Employee
            </button>
          </div>

          {activeTab === "login" ? (
            <>
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-lg sm:text-xl">Enterprise Sign In</CardTitle>
                <CardDescription className="text-xs">
                  Enter your registered mobile number or email to access your authorized branch counter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="identifier" className="text-xs font-semibold">
                      Registered Mobile Number or Email
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="identifier"
                        type="text"
                        placeholder="e.g. 9876543210"
                        className="pl-9 font-mono text-sm"
                        disabled={isSubmitting}
                        {...loginRegister("identifier")}
                      />
                    </div>
                    {loginErrors.identifier && (
                      <p className="text-xs text-destructive">{loginErrors.identifier.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() =>
                          toast.info("Password Assistance", {
                            description: "Please contact your Branch Manager or Organization Administrator.",
                          })
                        }
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-9 pr-10 text-sm"
                        disabled={isSubmitting}
                        {...loginRegister("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="text-xs text-destructive">{loginErrors.password.message}</p>
                    )}
                  </div>

                  {/* Quick-fill helper for convenience */}
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Admin Demo credentials:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginValue("identifier", "9876543210");
                        setLoginValue("password", "Password123!");
                      }}
                      className="text-primary hover:underline font-mono font-medium"
                    >
                      Fill 9876543210
                    </button>
                  </div>

                  <Button type="submit" className="w-full gap-2 font-bold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-lg sm:text-xl">Register Operational Employee</CardTitle>
                <CardDescription className="text-xs">
                  Create an employee account with your registered mobile number and assigned operational role.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label htmlFor={regFullNameId} className="text-xs font-semibold">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={regFullNameId}
                        type="text"
                        placeholder="e.g. Ramesh Patil"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="pl-9 text-sm"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={regPhoneId} className="text-xs font-semibold">
                      Mobile Number (10 digits)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-muted-foreground">
                        +91
                      </span>
                      <Input
                        id={regPhoneId}
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="pl-12 font-mono text-sm"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={regRoleSelectId} className="text-xs font-semibold flex items-center justify-between">
                      <span>Operational Role</span>
                      <span className="text-[10px] text-muted-foreground">Select job position</span>
                    </Label>
                    <select
                      id={regRoleSelectId}
                      value={regSelectedRole}
                      onChange={(e) => setRegSelectedRole(e.target.value)}
                      className="w-full p-2 rounded-md border text-xs sm:text-sm font-semibold bg-background"
                      disabled={isSubmitting}
                    >
                      {OPERATIONAL_ROLES.map((role) => (
                        <option key={role.slug} value={role.slug}>
                          {role.name} ({role.badge})
                        </option>
                      ))}
                    </select>

                    {/* Role description card preview */}
                    {selectedRoleObj && (
                      <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1 mt-1.5">
                        <div className="flex items-center gap-1.5 text-primary font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{selectedRoleObj.name}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1 ml-auto">
                            {selectedRoleObj.badge}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {selectedRoleObj.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={regPasswordId} className="text-xs font-semibold">
                      Account Password (min 8 characters)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={regPasswordId}
                        type={showRegPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-9 pr-10 text-sm"
                        disabled={isSubmitting}
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Super admin notice */}
                  <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-500 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Super Admin & Business Owner roles are administrative authorities reserved for direct database provisioning.
                    </span>
                  </div>

                  <Button type="submit" className="w-full gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account & Assigning Role...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Register & Access Dashboard
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>AI Smart Bazar ERP • Enterprise Branch Isolation & Fixed Role RBAC</p>
          <p className="text-[11px] text-slate-600">Connected to Neon Cloud PostgreSQL Database</p>
        </div>
      </div>
    </div>
  );
}
