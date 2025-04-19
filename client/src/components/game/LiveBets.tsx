import { useGame } from "@/contexts/GameContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LiveBets() {
  const { liveBets } = useGame();

  return (
    <Card className="bg-[#1A2634] rounded-xl shadow-lg border-0">
      <CardHeader className="p-4 border-b border-[#8A96A3]/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Live Bets</CardTitle>
          <div className="text-sm text-[#8A96A3]">
            <span>{liveBets.length} players</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[300px] overflow-y-auto p-0.5">
          {liveBets.length === 0 ? (
            <div className="p-4 text-center text-[#8A96A3]">
              No active bets at the moment.
            </div>
          ) : (
            liveBets.map((bet) => (
              <div
                key={bet.id}
                className="p-3 hover:bg-[#0F1923]/30 border-b border-[#8A96A3]/5"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[#8A96A3]/20 flex items-center justify-center text-white mr-2">
                      <span className="text-xs">{bet.avatar}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {bet.username.length > 8
                          ? `${bet.username.substring(0, 8)}...`
                          : bet.username}
                      </div>
                      <div className="text-xs text-[#8A96A3]">
                        Bet:{" "}
                        <span className="text-white font-mono">
                          ₹{bet.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {bet.status === "active" ? (
                      <div className="font-medium text-white">Betting</div>
                    ) : bet.status === "cashed_out" ? (
                      <div className="text-[#00C853] font-medium">
                        Cashed Out
                      </div>
                    ) : (
                      <div className="text-[#FF3D57] font-medium">Lost</div>
                    )}
                    {bet.status === "cashed_out" && bet.cashedOutAt && (
                      <div className="text-xs text-[#8A96A3]">
                        at{" "}
                        <span className="text-[#FF6B00] font-mono">
                          {bet.cashedOutAt.toFixed(2)}x
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
