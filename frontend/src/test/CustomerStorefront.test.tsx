import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { StoreHeader } from "@/features/store/components/StoreHeader";
import { CustomerLoginPage } from "@/features/store/pages/CustomerLoginPage";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

describe("Customer Storefront UI Suite", () => {
  beforeEach(() => {
    useCustomerAuthStore.getState().logout();
  });

  it("renders StoreHeader brand title and Siddeshwar Mart branding", () => {
    render(
      <BrowserRouter>
        <StoreHeader cartCount={3} />
      </BrowserRouter>
    );

    expect(screen.getByText("AI Smart Bazar")).toBeInTheDocument();
    expect(screen.getByText("Siddeshwar Enterprises")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // Cart badge
  });

  it("renders StoreHeader login and register actions when unauthenticated", () => {
    render(
      <BrowserRouter>
        <StoreHeader cartCount={0} />
      </BrowserRouter>
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("displays customer mobile login form with Indian phone prefix", () => {
    render(
      <BrowserRouter>
        <CustomerLoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Welcome to AI Smart Bazar")).toBeInTheDocument();
    expect(screen.getByText("+91")).toBeInTheDocument();
    expect(screen.getByLabelText(/registered mobile number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/10-digit mobile/i)).toBeInTheDocument();
    expect(screen.getByText("Sign In to Shop")).toBeInTheDocument();
  });

  it("blocks submission with invalid phone number", async () => {
    render(
      <BrowserRouter>
        <CustomerLoginPage />
      </BrowserRouter>
    );

    const phoneInput = screen.getByLabelText(/registered mobile number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByText("Sign In to Shop");

    fireEvent.change(phoneInput, { target: { value: "12345" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("Please enter a valid 10-digit mobile number.")
    ).toBeInTheDocument();
  });

  it("manages customer auth store state correctly", () => {
    const store = useCustomerAuthStore.getState();
    expect(store.isAuthenticated).toBe(false);

    store.setAuth({
      token: "mock-jwt-token-12345",
      user: {
        id: "usr-1",
        phone: "9876543210",
        full_name: "Ramesh Kulkarni",
        email: "9876543210@customer.siddeshwar.in",
        status: "ACTIVE",
      },
      customer: {
        id: "cust-1",
        user_id: "usr-1",
        customer_type: "RETAIL",
        pricing_tier: "RETAIL",
        loyalty_points: 50,
      },
    });

    const updated = useCustomerAuthStore.getState();
    expect(updated.isAuthenticated).toBe(true);
    expect(updated.user?.full_name).toBe("Ramesh Kulkarni");
    expect(updated.customer?.loyalty_points).toBe(50);

    updated.logout();
    expect(useCustomerAuthStore.getState().isAuthenticated).toBe(false);
    expect(useCustomerAuthStore.getState().token).toBeNull();
  });
});

