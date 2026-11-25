import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Providers } from "./providers";
import "@/styles/globals.css";
import "@/styles/theme.css";
import "@/styles/responsive.css";

// Global restriction: Never allow future dates in any date picker across the ERP
if (typeof window !== "undefined") {
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

  // Periodic safeguard for newly mounted date inputs
  setInterval(() => {
    document.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach(enforceMaxToday);
  }, 1000);
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

