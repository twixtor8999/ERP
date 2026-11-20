import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store, Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "../schemas/login.schema";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { setAvailableBranches, setActiveBranch } = useBranchStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@siddeshwar.in",
      password: "Password123!",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
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
      toast.success("Authentication successful", {
        description: `Welcome back, ${response.user.fullName}`,
      });
      navigate("/dashboard");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-2">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AI Smart Bazar
          </h1>
          <p className="text-sm text-slate-400">
            Enterprise ERP for Siddeshwar Enterprises
          </p>
        </div>

        <Card className="border-slate-800 bg-card/95 backdrop-blur shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your enterprise credentials to access your authorized branch workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@siddeshwar.in"
                    className="pl-9"
                    disabled={isSubmitting}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info("Password Recovery", {
                        description: "Please contact your Organization Administrator.",
                      });
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    disabled={isSubmitting}
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
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
        </Card>

        <div className="text-center text-xs text-slate-500">
          Protected by Enterprise Multi-Branch Isolation & RBAC.
        </div>
      </div>
    </div>
  );
}
