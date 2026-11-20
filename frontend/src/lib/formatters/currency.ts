/**
 * Currency formatting utilities for Indian Rupee (INR).
 */

export function formatCurrency(
  amount: number | string,
  options?: { currency?: string; decimals?: number }
): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return "₹0.00";
  }
  const decimals = options?.decimals ?? 2;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: options?.currency ?? "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericAmount);
}
