import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { StoreOrdersAdminPage } from "@/features/orders/pages/StoreOrdersAdminPage";
import { DeliveryStaffDashboardPage } from "@/features/orders/pages/DeliveryStaffDashboardPage";
import { apiClient } from "@/lib/api/client";

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Employee Order Processing & Internal Delivery UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders StoreOrdersAdminPage with operational status filter tabs", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: [
        {
          id: "ord-test-1",
          order_number: "ORD-20261120-1001",
          order_date: "2026-11-20",
          customer_id: "c-1",
          customer_name: "Rohan Deshpande",
          customer_phone: "9822112233",
          branch_id: "br-1",
          status: "PENDING",
          order_type: "STOREFRONT",
          total_amount: "800.00",
          delivery_charge: "40.00",
          payment_method: "CASH_ON_DELIVERY",
          payment_status: "PENDING",
          package_count: 1,
          delivery_attempt_count: 0,
          created_at: new Date().toISOString(),
          items: [],
        },
      ],
    });

    render(
      <BrowserRouter>
        <StoreOrdersAdminPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Storefront Orders & Fulfillment")).toBeInTheDocument();
    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.getByText("Ready to Dispatch")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("ORD-20261120-1001")).toBeInTheDocument();
      expect(screen.getByText("Rohan Deshpande")).toBeInTheDocument();
      expect(screen.getByText("Pending Review")).toBeInTheDocument();
    });
  });

  it("renders DeliveryStaffDashboardPage with mobile run tabs and order cards", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: [
        {
          id: "deliv-ord-1",
          order_number: "ORD-20261120-9999",
          customer_name: "Anita Joshi",
          customer_phone: "9822445566",
          shipping_address: "Flat 4, Shanti Nagar, Pune",
          total_amount: "1250.00",
          payment_method: "CASH_ON_DELIVERY",
          payment_status: "PENDING",
          status: "READY_FOR_DISPATCH",
          package_count: 2,
          delivery_attempt_count: 0,
          created_at: new Date().toISOString(),
        },
      ],
    });

    render(
      <BrowserRouter>
        <DeliveryStaffDashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText("My Delivery Runs")).toBeInTheDocument();
    expect(screen.getByText("Ready to Start")).toBeInTheDocument();
    expect(screen.getByText("In Transit")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("ORD-20261120-9999")).toBeInTheDocument();
      expect(screen.getByText("Anita Joshi")).toBeInTheDocument();
      expect(screen.getByText("Start Delivery Run")).toBeInTheDocument();
      expect(screen.getByText(/Collect COD ₹1250.00/)).toBeInTheDocument();
    });
  });
});
