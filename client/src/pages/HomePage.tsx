import GameCanvas from "@/components/game/GameCanvas";
import BettingInterface from "@/components/game/BettingInterface";
import LiveBets from "@/components/game/LiveBets";
import TransactionHistory from "@/components/game/TransactionHistory";
import PaymentMethods from "@/components/game/PaymentMethods";

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Game Section */}
      <div className="lg:col-span-8 space-y-6">
        <GameCanvas />
        <BettingInterface />
      </div>
      
      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <LiveBets />
        <TransactionHistory />
        <PaymentMethods />
      </div>
    </div>
  );
}
