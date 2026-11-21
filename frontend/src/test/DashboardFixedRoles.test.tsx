import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { useAuthStore } from "@/stores/auth.store";

describe("Fixed Role Dashboard Verification", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    useAuthStore.getState().logout();
  });

  it("renders POS cashier view for authenticated cashier user", () => {
    useAuthStore.getState().setUser({
      id: "usr_cashier",
      email: "cashier@siddeshwar.in",
      fullName: "Ramesh Pawar",
      role: "CASHIER",
      organizationId: "org_1",
      organizationName: "Siddeshwar Enterprises",
      allowedBranches: [{ id: "br_1", code: "HQ-01", name: "Main Branch" }],
      activeBranchId: "br_1",
      permissions: ["pos.read", "pos.transact"],
      dashboardRoute: "/dashboard/pos",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:roleView" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Pos Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Cash Register Drawer/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE SESSION/i)).toBeInTheDocument();
  });

  it("blocks cashier from viewing admin dashboard and shows security violation", () => {
    useAuthStore.getState().setUser({
      id: "usr_cashier",
      email: "cashier@siddeshwar.in",
      fullName: "Ramesh Pawar",
      role: "CASHIER",
      organizationId: "org_1",
      organizationName: "Siddeshwar Enterprises",
      allowedBranches: [{ id: "br_1", code: "HQ-01", name: "Main Branch" }],
      activeBranchId: "br_1",
      permissions: ["pos.read", "pos.transact"],
      dashboardRoute: "/dashboard/pos",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/dashboard/admin"]}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:roleView" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Dashboard Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/Security policy violation/i)).toBeInTheDocument();
    expect(screen.getByText(/Return to My Assigned Dashboard/i)).toBeInTheDocument();
  });

  it("renders Super Admin dashboard with system health cards", () => {
    useAuthStore.getState().setUser({
      id: "usr_admin",
      email: "admin@siddeshwar.in",
      fullName: "Enterprise Administrator",
      role: "SUPER_ADMIN",
      organizationId: "org_1",
      organizationName: "Siddeshwar Enterprises",
      allowedBranches: [{ id: "br_1", code: "HQ-01", name: "Main Branch" }],
      activeBranchId: "br_1",
      permissions: ["*"],
      dashboardRoute: "/dashboard/admin",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:roleView" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Store Business Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Today's Total Sales/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Billing Counter/i)).toBeInTheDocument();
  });
});

