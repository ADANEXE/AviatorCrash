import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, RefreshCw } from "lucide-react";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  transactionDetails?: string;
};

type Bet = {
  id: number;
  gameRoundId: number;
  amount: number;
  autoCashoutAt: number | null;
  cashedOutAt: number | null;
  profit: number | null;
  status: string;
  createdAt: string;
};

export default function ProfilePage() {
  const { user, refreshBalance, isRefreshingBalance } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // Fetch user transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/user/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/user/transactions?limit=50', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });
  
  // Fetch user bets
  const { data: bets, isLoading: isLoadingBets } = useQuery({
    queryKey: ['/api/user/bets'],
    queryFn: async () => {
      const response = await fetch('/api/user/bets?limit=50', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch bets');
      }
      return response.json();
    },
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy HH:mm:ss');
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'bet':
        return 'Bet';
      case 'win':
        return 'Win';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Get transaction status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#00C853]/20 text-[#00C853]';
      case 'pending':
        return 'bg-[#4D7CFE]/20 text-[#4D7CFE]';
      case 'rejected':
        return 'bg-[#FF3D57]/20 text-[#FF3D57]';
      default:
        return 'bg-[#8A96A3]/20 text-[#8A96A3]';
    }
  };
  
  // Calculate account statistics
  const calculateStats = () => {
    if (!transactions || !bets) return { 
      totalDeposits: 0, 
      totalWithdrawals: 0, 
      gamesPlayed: 0, 
      gamesWon: 0, 
      totalWinnings: 0, 
      totalLosses: 0 
    };
    
    const totalDeposits = transactions
      .filter((tx: Transaction) => tx.type === 'deposit' && tx.status === 'completed')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
    
    const totalWithdrawals = transactions
      .filter((tx: Transaction) => tx.type === 'withdrawal' && tx.status === 'completed')
      .reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount), 0);
    
    const gamesPlayed = bets.length;
    
    const gamesWon = bets.filter((bet: Bet) => bet.status === 'won').length;
    
    const totalWinnings = bets
      .filter((bet: Bet) => bet.status === 'won' && bet.profit !== null)
      .reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0);
    
    const totalLosses = bets
      .filter((bet: Bet) => bet.status === 'lost')
      .reduce((sum: number, bet: Bet) => sum + bet.amount, 0);
    
    return {
      totalDeposits,
      totalWithdrawals,
      gamesPlayed,
      gamesWon,
      totalWinnings,
      totalLosses
    };
  };
  
  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="border-b border-[#8A96A3]/10 pb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
          <p className="text-[#8A96A3] mt-2">
            Manage your account and view your game history.
          </p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-3">
          <Button asChild variant="outline" className="border-[#8A96A3]/20 hover:bg-[#1A2634]">
            <Link href="/withdraw">Withdraw</Link>
          </Button>
          <Button asChild className="bg-[#4D7CFE] hover:bg-blue-600">
            <Link href="/deposit">Deposit</Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Account Balance</CardTitle>
              <button 
                onClick={refreshBalance}
                disabled={isRefreshingBalance}
                className="p-1.5 rounded-full hover:bg-[#0F1923] transition-colors"
                title="Refresh Balance"
              >
                <RefreshCw className={`h-5 w-5 text-[#8A96A3] ${isRefreshingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <CardDescription className="text-[#8A96A3]">
              Your current balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-[#FF6B00]">
              ₹{user.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Username</CardTitle>
            <CardDescription className="text-[#8A96A3]">
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium">{user.username}</div>
            <div className="text-sm text-[#8A96A3] mt-1">{user.email}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Games Won</CardTitle>
            <CardDescription className="text-[#8A96A3]">
              Your game statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium">{stats.gamesWon} / {stats.gamesPlayed}</div>
            <div className="text-sm text-[#8A96A3] mt-1">
              Win rate: {stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Deposits</CardTitle>
            <CardDescription className="text-[#8A96A3]">
              Amount deposited in your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium font-mono">₹{stats.totalDeposits.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Net Profit/Loss</CardTitle>
            <CardDescription className="text-[#8A96A3]">
              Your gaming profit/loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-medium font-mono ${stats.totalWinnings - stats.totalLosses >= 0 ? 'text-[#00C853]' : 'text-[#FF3D57]'}`}>
              ₹{(stats.totalWinnings - stats.totalLosses).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#0F1923] border border-[#8A96A3]/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#1A2634]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-[#1A2634]">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="bets" className="data-[state=active]:bg-[#1A2634]">
            Betting History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card className="bg-[#1A2634] border-0">
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
              <CardDescription className="text-[#8A96A3]">
                A summary of your account activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Recent Activity</h3>
                  
                  {isLoadingTransactions || isLoadingBets ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-[#8A96A3] mb-2">Recent Transactions</h4>
                        {transactions && transactions.length > 0 ? (
                          <div className="space-y-2">
                            {transactions.slice(0, 3).map((transaction: Transaction) => (
                              <div key={transaction.id} className="bg-[#0F1923] p-3 rounded-md">
                                <div className="flex justify-between">
                                  <div>
                                    <div className="font-medium">{getTransactionTypeLabel(transaction.type)}</div>
                                    <div className="text-xs text-[#8A96A3]">{formatDate(transaction.createdAt)}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className={transaction.amount > 0 ? 'text-[#00C853]' : 'text-[#FF3D57]'}>
                                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}₹
                                    </div>
                                    <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${getStatusClass(transaction.status)}`}>
                                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-[#0F1923] p-4 rounded-md text-center text-[#8A96A3]">
                            No recent transactions.
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-[#8A96A3] mb-2">Recent Bets</h4>
                        {bets && bets.length > 0 ? (
                          <div className="space-y-2">
                            {bets.slice(0, 3).map((bet: Bet) => (
                              <div key={bet.id} className="bg-[#0F1923] p-3 rounded-md">
                                <div className="flex justify-between">
                                  <div>
                                    <div className="font-medium">Game #{bet.gameRoundId}</div>
                                    <div className="text-xs text-[#8A96A3]">{formatDate(bet.createdAt)}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-mono">{bet.amount.toFixed(2)}₹</div>
                                    <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${
                                      bet.status === 'won' 
                                        ? 'bg-[#00C853]/20 text-[#00C853]' 
                                        : 'bg-[#FF3D57]/20 text-[#FF3D57]'
                                    }`}>
                                      {bet.status === 'won' ? 'Won' : 'Lost'}
                                      {bet.status === 'won' && bet.cashedOutAt && ` at ${bet.cashedOutAt.toFixed(2)}x`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-[#0F1923] p-4 rounded-md text-center text-[#8A96A3]">
                            No recent bets.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card className="bg-[#1A2634] border-0">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription className="text-[#8A96A3]">
                A record of all your deposits, withdrawals, and game transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-[#FF6B00]" />
                </div>
              ) : (
                <div className="rounded-md border border-[#8A96A3]/20">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                        <TableHead className="text-[#8A96A3]">ID</TableHead>
                        <TableHead className="text-[#8A96A3]">Type</TableHead>
                        <TableHead className="text-[#8A96A3]">Amount</TableHead>
                        <TableHead className="text-[#8A96A3]">Status</TableHead>
                        <TableHead className="text-[#8A96A3]">Method</TableHead>
                        <TableHead className="text-[#8A96A3]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions && transactions.length > 0 ? (
                        transactions.map((transaction: Transaction) => (
                          <TableRow key={transaction.id} className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                            <TableCell className="font-medium">{transaction.id}</TableCell>
                            <TableCell>{getTransactionTypeLabel(transaction.type)}</TableCell>
                            <TableCell className={`font-mono ${transaction.amount > 0 ? 'text-[#00C853]' : 'text-[#FF3D57]'}`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}₹
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(transaction.status)}`}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>{transaction.paymentMethod || 'N/A'}</TableCell>
                            <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-[#8A96A3]">
                            No transactions found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bets">
          <Card className="bg-[#1A2634] border-0">
            <CardHeader>
              <CardTitle>Betting History</CardTitle>
              <CardDescription className="text-[#8A96A3]">
                A record of all your bets and game results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBets ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-[#FF6B00]" />
                </div>
              ) : (
                <div className="rounded-md border border-[#8A96A3]/20">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                        <TableHead className="text-[#8A96A3]">ID</TableHead>
                        <TableHead className="text-[#8A96A3]">Game</TableHead>
                        <TableHead className="text-[#8A96A3]">Amount</TableHead>
                        <TableHead className="text-[#8A96A3]">Auto Cashout</TableHead>
                        <TableHead className="text-[#8A96A3]">Result</TableHead>
                        <TableHead className="text-[#8A96A3]">Profit/Loss</TableHead>
                        <TableHead className="text-[#8A96A3]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bets && bets.length > 0 ? (
                        bets.map((bet: Bet) => (
                          <TableRow key={bet.id} className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                            <TableCell className="font-medium">{bet.id}</TableCell>
                            <TableCell>#{bet.gameRoundId}</TableCell>
                            <TableCell className="font-mono">{bet.amount.toFixed(2)}₹</TableCell>
                            <TableCell>
                              {bet.autoCashoutAt ? `${bet.autoCashoutAt.toFixed(2)}x` : 'Manual'}
                            </TableCell>
                            <TableCell>
                              {bet.status === 'won' ? (
                                <span className="bg-[#00C853]/20 text-[#00C853] px-2 py-1 rounded-full text-xs">
                                  Won at {bet.cashedOutAt?.toFixed(2)}x
                                </span>
                              ) : (
                                <span className="bg-[#FF3D57]/20 text-[#FF3D57] px-2 py-1 rounded-full text-xs">
                                  Lost
                                </span>
                              )}
                            </TableCell>
                            <TableCell className={`font-mono ${bet.profit ? 'text-[#00C853]' : 'text-[#FF3D57]'}`}>
                              {bet.profit 
                                ? `+${bet.profit.toFixed(2)}₹` 
                                : `-${bet.amount.toFixed(2)}₹`}
                            </TableCell>
                            <TableCell>{formatDate(bet.createdAt)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-[#8A96A3]">
                            No betting history found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
