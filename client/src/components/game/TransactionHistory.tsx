import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

export default function TransactionHistory() {
  const { user } = useAuth();
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/user/transactions'],
    enabled: !!user,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Unknown time";
    }
  };
  
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
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'bet':
        return 'Game Bet';
      case 'win':
        return 'Game Win';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const getAmountClass = (amount: number) => {
    return amount > 0 ? 'text-[#00C853]' : 'text-[#FF3D57]';
  };
  
  if (!user) {
    return (
      <Card className="bg-[#1A2634] rounded-xl shadow-lg border-0">
        <CardHeader className="p-4 border-b border-[#8A96A3]/10">
          <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <p className="text-[#8A96A3] mb-4">Please log in to view your transactions.</p>
          <Button asChild className="bg-[#FF6B00] hover:bg-orange-500">
            <Link href="/login">Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card className="bg-[#1A2634] rounded-xl shadow-lg border-0">
        <CardHeader className="p-4 border-b border-[#8A96A3]/10">
          <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <p className="text-[#8A96A3]">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-[#1A2634] rounded-xl shadow-lg border-0">
      <CardHeader className="p-4 border-b border-[#8A96A3]/10">
        <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[300px] overflow-y-auto">
          {!transactions || transactions.length === 0 ? (
            <div className="p-4 text-center text-[#8A96A3]">
              No transactions yet.
            </div>
          ) : (
            transactions.map((transaction: Transaction) => (
              <div key={transaction.id} className="transaction-item p-3 border-b border-[#8A96A3]/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{getTypeLabel(transaction.type)}</div>
                    <div className="text-xs text-[#8A96A3]">{formatTime(transaction.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono ${getAmountClass(transaction.amount)}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}₹
                    </div>
                    <div className={`text-xs px-2 py-0.5 ${getStatusClass(transaction.status)} rounded-full`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t border-[#8A96A3]/10">
        <Button asChild
          variant="secondary" 
          className="w-full py-2 bg-[#0F1923] hover:bg-[#0F1923]/80 text-white text-sm font-medium rounded-lg transition duration-200"
        >
          <Link href="/profile">View All Transactions</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
