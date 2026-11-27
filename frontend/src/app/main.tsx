import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Providers } from "./providers";
import "@/styles/globals.css";
import "@/styles/theme.css";
import "@/styles/responsive.css";

// ─────────────────────────────────────────────────────────────────
// STARTUP: Clear all stale inventory localStorage keys from old builds.
// Every time we bump the key version (v1→v2→v3→v4), old stale data
// must be wiped so the user always gets fresh backup data.
// ─────────────────────────────────────────────────────────────────
if (typeof window !== "undefined") {
  const staleInventoryKeys = [
    "erp_wholesale_inventory_skus",
    "ai_smart_bazar_inventory_skus_v1",
    "ai_smart_bazar_inventory_skus_v2",
    "ai_smart_bazar_inventory_skus_v3",
    // Also clear old audit/punch keys from pre-backup era
    "erp_wholesale_audit_draft",
    "erp_wholesale_saved_audits",
    "erp_wholesale_super_audits",
    "ai_smart_bazar_saved_audits_v1",
    "ai_smart_bazar_saved_audits_v2",
    "ai_smart_bazar_audit_draft_v1",
    "ai_smart_bazar_audit_draft_v2",
  ];
  for (const k of staleInventoryKeys) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
}

// Global restriction: Never allow future dates in any date picker across the ERP
if (typeof window !== "undefined") {
  // Recover seamlessly when a new deployment replaces hashed lazy chunks while a tab is open
  window.addEventListener("vite:preloadError", (event) => {
    const key = "erp_chunk_reload_at";
    const last = Number(sessionStorage.getItem(key) || "0");
    if (!last || Date.now() - last > 10_000) {
      sessionStorage.setItem(key, String(Date.now()));
      event.preventDefault();
      window.location.reload();
    }
  });

  const enforceMaxToday = (target: EventTarget | null) => {
    if (target instanceof HTMLInputElement && target.type === "date") {
      const now = new Date();
      const todayIso = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      if (!target.max || target.max > todayIso) {
        target.max = todayIso;
      }
      if (target.value && target.value > todayIso) {
        target.value = todayIso;
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  };

  document.addEventListener("focusin", (e) => enforceMaxToday(e.target), true);
  document.addEventListener("click", (e) => enforceMaxToday(e.target), true);
  document.addEventListener("change", (e) => enforceMaxToday(e.target), true);
  document.addEventListener("input", (e) => enforceMaxToday(e.target), true);
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to locate root DOM element #root");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);

