import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Providers } from "./providers";
import "@/styles/globals.css";
import "@/styles/theme.css";
import "@/styles/responsive.css";

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
