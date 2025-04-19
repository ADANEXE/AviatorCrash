import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { GameProvider } from "./contexts/GameContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <GameProvider>
      <App />
    </GameProvider>
  </AuthProvider>
);
