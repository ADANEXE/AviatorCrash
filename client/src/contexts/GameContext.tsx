import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export type GameState = {
  status: 'waiting' | 'in-progress' | 'crashed';
  currentMultiplier: number;
  crashPoint?: number;
  startTime?: number;
  roundId?: number;
};

export type LiveBet = {
  id: number;
  username: string;
  avatar: string;
  amount: number;
  status: 'active' | 'cashed_out' | 'lost';
  cashedOutAt?: number;
};

export type GameHistory = {
  id: number;
  crashPoint: number;
};

export type UserBet = {
  id: number;
  gameRoundId: number;
  amount: number;
  autoCashoutAt: number | null;
  status: string;
};

type GameContextType = {
  gameState: GameState;
  liveBets: LiveBet[];
  gameHistory: GameHistory[];
  userBet: UserBet | null;
  isPlacingBet: boolean;
  isCashingOut: boolean;
  placeBet: (amount: number, autoCashoutAt: number | null) => void;
  cashOut: () => void;
};

const initialGameState: GameState = {
  status: 'waiting',
  currentMultiplier: 1.0
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isConnected,
    error: wsError,
    send,
    addMessageHandler,
    removeMessageHandler
  } = useWebSocket();

  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [userBet, setUserBet] = useState<UserBet | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);

  // Handle game state updates
  useEffect(() => {
    const handleGameState = (data: GameState) => {
      setGameState(data);

      // Auto cash out logic
      if (
        data.status === 'in-progress' &&
        userBet &&
        userBet.status === 'active' &&
        userBet.autoCashoutAt &&
        data.currentMultiplier >= userBet.autoCashoutAt
      ) {
        cashOut();
      }

      // Reset user bet when game crashes
      if (data.status === 'crashed' && userBet && userBet.status === 'active') {
        setUserBet(null);
        toast({
          variant: "destructive",
          title: "Crashed!",
          description: `Plane crashed at ${data.crashPoint?.toFixed(2)}x. Your bet was lost.`,
        });
      }
    };

    const handleLiveBets = (data: LiveBet[]) => {
      setLiveBets(data);
    };

    const handleGameHistory = (data: GameHistory[]) => {
      setGameHistory(data);
    };

    const handleBetPlaced = (data: UserBet) => {
      setUserBet(data);
      setIsPlacingBet(false);
      toast({
        title: "Bet Placed",
        description: `Your bet of ₹${data.amount.toFixed(2)} has been placed.`,
      });
    };

    const handleCashoutSuccess = (data: { betId: number, cashoutMultiplier: number, winAmount: number }) => {
      setUserBet(null);
      setIsCashingOut(false);
      
      if (user) {
        // Update user balance in AuthContext
        toast({
          variant: "success",
          title: "Cashed Out!",
          description: `Successfully cashed out at ${data.cashoutMultiplier.toFixed(2)}x and won ₹${data.winAmount.toFixed(2)}!`,
        });
      }
    };

    const handleError = (data: { message: string }) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: data.message,
      });
      setIsPlacingBet(false);
      setIsCashingOut(false);
    };

    // Register WebSocket message handlers
    addMessageHandler('gameState', handleGameState);
    addMessageHandler('liveBets', handleLiveBets);
    addMessageHandler('gameHistory', handleGameHistory);
    addMessageHandler('betPlaced', handleBetPlaced);
    addMessageHandler('cashoutSuccess', handleCashoutSuccess);
    addMessageHandler('error', handleError);

    // Cleanup handlers on unmount
    return () => {
      removeMessageHandler('gameState', handleGameState);
      removeMessageHandler('liveBets', handleLiveBets);
      removeMessageHandler('gameHistory', handleGameHistory);
      removeMessageHandler('betPlaced', handleBetPlaced);
      removeMessageHandler('cashoutSuccess', handleCashoutSuccess);
      removeMessageHandler('error', handleError);
    };
  }, [addMessageHandler, removeMessageHandler, userBet, user, toast]);

  // WebSocket error handling
  useEffect(() => {
    if (wsError) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: wsError,
      });
    }
  }, [wsError, toast]);

  // Request game history on connection
  useEffect(() => {
    if (isConnected) {
      send('getGameHistory', { limit: 10 });
    }
  }, [isConnected, send]);

  const placeBet = useCallback((amount: number, autoCashoutAt: number | null) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to place a bet.",
      });
      return;
    }

    if (gameState.status !== 'waiting') {
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: "You can only place bets when the game is waiting to start.",
      });
      return;
    }

    setIsPlacingBet(true);
    send('placeBet', {
      userId: user.id,
      sessionId: Math.random().toString(36).substring(2, 15),
      amount,
      autoCashoutAt
    });
  }, [gameState.status, user, send, toast]);

  const cashOut = useCallback(() => {
    if (!user || !userBet) {
      return;
    }

    if (gameState.status !== 'in-progress') {
      toast({
        variant: "destructive",
        title: "Cash Out Failed",
        description: "You can only cash out during an active game.",
      });
      return;
    }

    setIsCashingOut(true);
    send('cashOut', {
      userId: user.id,
      betId: userBet.id,
      sessionId: Math.random().toString(36).substring(2, 15)
    });
  }, [gameState.status, user, userBet, send, toast]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        liveBets,
        gameHistory,
        userBet,
        isPlacingBet,
        isCashingOut,
        placeBet,
        cashOut
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
