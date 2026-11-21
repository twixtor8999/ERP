import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PosBillingPage } from "@/features/billing/pages/PosBillingPage";
import { InventoryManagementPage } from "@/features/inventory/pages/InventoryManagementPage";
import { SettlementsPage } from "@/features/settlements/pages/SettlementsPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";

describe("Prompt 02.7 — Command Center & Multi-Branch Workspaces", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    useAuthStore.getState().setUser({
      id: "usr_admin",
      email: "admin@siddeshwar.in",
      fullName: "Siddeshwar Owner",
      role: "SUPER_ADMIN",
      organizationId: "org_1",
      organizationName: "Siddeshwar Enterprises",
      allowedBranches: [
        { id: "br_1", code: "HQ-01", name: "Main Branch", isHeadquarters: true },
        { id: "br_2", code: "BR-02", name: "Market Yard Branch", isHeadquarters: false },
      ],
      activeBranchId: "br_1",
      permissions: ["*"],
    });

    useBranchStore.getState().setAvailableBranches([
      { id: "br_1", code: "HQ-01", name: "Main Branch", isHeadquarters: true },
      { id: "br_2", code: "BR-02", name: "Market Yard Branch", isHeadquarters: false },
    ]);
  });

  it("renders POS billing counter terminal with cart and cash/UPI split inputs", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PosBillingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/POS Counter Billing Terminal/i)).toBeInTheDocument();
    expect(screen.getByText(/Barcode & SKU Fast Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Cart/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Tender Mode/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cash/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /UPI QR/i })).toBeInTheDocument();
  });

  it("renders Inventory workspace with stock valuation and transfer workflow tabs", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <InventoryManagementPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Inventory & Multi-Branch Stock Tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/Stock Balances & Valuation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inter-Branch Transfers/i })).toBeInTheDocument();
    expect(screen.getByText(/Stock Adjustment/i)).toBeInTheDocument();
    expect(screen.getByText(/Request Stock Transfer/i)).toBeInTheDocument();
  });

  it("renders Settlements workspace with drawer discrepancy audit cards", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Cashier Shifts & Day-End Drawer Settlements/i)).toBeInTheDocument();
    expect(screen.getByText(/Physical Cash Collected/i)).toBeInTheDocument();
    expect(screen.getByText(/Digital UPI Collected/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Drawer Discrepancies/i)).toBeInTheDocument();
  });

  it("renders Reports workspace with sales breakdown and CSV download button", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Business Intelligence & Management Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Consolidated Sales Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Cashier Performance & Audits/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventory Valuation Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Official CSV/i)).toBeInTheDocument();
  });
});
