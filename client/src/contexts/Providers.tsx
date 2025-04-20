import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { GameProvider } from './GameContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GameProvider>
        {children}
      </GameProvider>
    </AuthProvider>
  );
}