import React from "react";
import { createRoot } from "react-dom/client";
import SimpleQRReader from "./components/SimpleQRReader";
import ErrorBoundary from "./components/ErrorBoundary";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <SimpleQRReader />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
