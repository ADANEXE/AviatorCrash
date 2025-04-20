import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";

// Quick bet amounts
const QUICK_BET_AMOUNTS = [50, 100, 250, 500, 1000, 2500];

export default function BettingInterface() {
  const { user } = useAuth();
  const { 
    gameState, 
    userBet,
    isPlacingBet,
    isCashingOut,
    placeBet,
    cashOut
  } = useGame();
  
  const [betAmount, setBetAmount] = useState<string>("100");
  const [autoCashoutAt, setAutoCashoutAt] = useState<string>("2.00");
  
  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const autoCashout = parseFloat(autoCashoutAt);
    const autoCashoutValue = !isNaN(autoCashout) && autoCashout > 1 ? autoCashout : null;
    
    placeBet(amount, autoCashoutValue);
  };
  
  const handleCashOut = () => {
    cashOut();
  };
  
  const canPlaceBet = () => {
    if (!user) return false;
    if (gameState.status !== 'waiting') return false;
    if (isPlacingBet) return false;
    if (userBet) return false;
    
    const amount = parseFloat(betAmount);
    return !isNaN(amount) && amount > 0 && amount <= user.balance;
  };
  
  const canCashOut = () => {
    if (!userBet) return false;
    if (gameState.status !== 'in-progress') return false;
    if (isCashingOut) return false;
    return userBet.status === 'active';
  };
  
  const handleQuickBetSelect = (amount: number) => {
    setBetAmount(amount.toString());
  };
  
  return (
    <Card className="bg-[#1A2634] shadow-lg border-0">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Place Your Bet</CardTitle>
          {gameState.status === 'waiting' && gameState.countdown !== undefined && (
            <div className="text-[#8A96A3] font-mono">
              Next round in: {gameState.countdown}s
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bet Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-[#8A96A3] mb-1">Bet Amount</Label>
              <div className="flex">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full bg-[#0F1923] border border-[#8A96A3]/20 text-white py-2 px-3 rounded-l-lg font-mono focus:border-[#FF6B00] focus:ring-[#FF6B00]"
                    disabled={isPlacingBet || !!userBet || gameState.status !== 'waiting'}
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A96A3]">₹</span>
                </div>
                <button className="bg-[#0F1923] border border-[#8A96A3]/20 border-l-0 rounded-r-lg px-3 text-[#8A96A3] hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-[#8A96A3] mb-1">Auto Cashout At</Label>
              <div className="flex">
                <Input
                  type="text"
                  value={autoCashoutAt}
                  onChange={(e) => setAutoCashoutAt(e.target.value)}
                  className="w-full bg-[#0F1923] border border-[#8A96A3]/20 text-white py-2 px-3 rounded-lg font-mono focus:border-[#FF6B00] focus:ring-[#FF6B00]"
                  disabled={isPlacingBet || !!userBet || gameState.status !== 'waiting'}
                />
                <span className="ml-2 font-mono text-[#8A96A3] flex items-center">x</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {!user ? (
                <Button asChild className="flex-1 bg-[#FF6B00] hover:bg-orange-500 text-white font-medium py-3 rounded-lg transition duration-200">
                  <Link href="/login">Login to Play</Link>
                </Button>
              ) : userBet && gameState.status === 'in-progress' ? (
                <Button
                  className="flex-1 bg-green-700/70 hover:bg-[#00C853] text-white font-medium py-3 rounded-lg transition duration-200"
                  onClick={handleCashOut}
                  disabled={!canCashOut()}
                >
                  {isCashingOut ? "Cashing Out..." : `Cash Out (${gameState.currentMultiplier.toFixed(2)}x)`}
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-[#FF6B00] hover:bg-orange-500 text-white font-medium py-3 rounded-lg transition duration-200"
                  onClick={handlePlaceBet}
                  disabled={!canPlaceBet()}
                >
                  {isPlacingBet ? "Placing Bet..." : "Place Bet"}
                </Button>
              )}
            </div>
          </div>
          
          {/* Quick Bet Options */}
          <div>
            <h3 className="text-sm font-medium text-[#8A96A3] mb-2">Quick Bet</h3>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_BET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  className="bg-[#0F1923] hover:bg-[#0F1923]/80 border border-[#8A96A3]/10 rounded-md py-2 text-center text-white transition duration-200"
                  onClick={() => handleQuickBetSelect(amount)}
                  disabled={isPlacingBet || !!userBet || gameState.status !== 'waiting'}
                >
                  ₹{amount.toLocaleString()}
                </button>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[#8A96A3] mb-2">Bet Strategy</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-[#0F1923] hover:bg-[#0F1923]/80 border border-[#8A96A3]/10 rounded-md py-2 text-center text-white transition duration-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  On Win: +50%
                </button>
                <button className="bg-[#0F1923] hover:bg-[#0F1923]/80 border border-[#8A96A3]/10 rounded-md py-2 text-center text-white transition duration-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                  On Loss: +100%
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
