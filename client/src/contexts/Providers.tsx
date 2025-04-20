import { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { GameProvider } from "./GameContext";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <GameProvider>
          {children}
        </GameProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}