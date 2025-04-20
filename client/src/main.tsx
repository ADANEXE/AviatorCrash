import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Providers } from "./contexts/Providers";

// Mount the app with the Providers wrapper
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Providers>
      <App />
    </Providers>
  </QueryClientProvider>
);
