import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatCurrency } from "@/lib/formatters/currency";

describe("Frontend Core Suite", () => {
  it("formats Indian Rupee currency correctly", () => {
    const formatted = formatCurrency(12500.5);
    expect(formatted).toContain("12,500.50");
  });

  it("renders EmptyState component properly", () => {
    render(
      <EmptyState
        title="No Orders Found"
        description="There are currently no active orders for this branch."
      />
    );
    expect(screen.getByText("No Orders Found")).toBeInTheDocument();
    expect(
      screen.getByText("There are currently no active orders for this branch.")
    ).toBeInTheDocument();
  });
});

