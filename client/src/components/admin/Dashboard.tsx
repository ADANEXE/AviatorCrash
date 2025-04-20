
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useGame } from "@/contexts/GameContext";

type DashboardData = {
  totalUsers: number;
  activeUsers: number;
  totalBets: number;
  todayBets: number;
  totalDeposits: number;
  totalWithdrawals: number;
  profitLoss: number;
  dailyActiveUsers: {
    hour: string;
    users: number;
  }[];
};

export default function Dashboard() {
  const { gameHistory } = useGame();
  
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/admin/dashboard'],
    refetchInterval: 60000, // Refetch every minute
  });

  // Create a chart data from game history
  const chartData = gameHistory.map((game) => ({
    id: game.id,
    crashPoint: game.crashPoint,
  })).reverse();

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-[#8A96A3]"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
            <p className="text-xs text-[#8A96A3]">
              {data?.activeUsers || 0} active now
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-[#8A96A3]"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalBets || 0}</div>
            <p className="text-xs text-[#8A96A3]">
              {data?.todayBets || 0} today
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposits</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-[#8A96A3]"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data?.totalDeposits || 0}</div>
            <p className="text-xs text-[#8A96A3]">Total deposits</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-[#8A96A3]"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data?.profitLoss && data.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ₹{data?.profitLoss || 0}
            </div>
            <p className="text-xs text-[#8A96A3]">Net profit/loss</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-[#1A2634] border-0">
          <CardHeader>
            <CardTitle>Recent Crash Points</CardTitle>
            <CardDescription className="text-[#8A96A3]">
              The last {chartData.length} game outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="id" 
                  stroke="#8A96A3" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8A96A3"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}x`}
                />
                <CartesianGrid strokeDasharray="3 3" className="stroke-[#8A96A3]/20" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#0F1923", 
                    border: "1px solid #8A96A3",
                    borderRadius: "4px" 
                  }}
                  formatter={(value) => [`${value}x`, "Crash Point"]}
                />
                <Bar 
                  dataKey="crashPoint" 
                  fill="#FF6B00" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-0">
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription className="text-[#8A96A3]">
              Active users over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.dailyActiveUsers || []}>
                <XAxis 
                  dataKey="hour" 
                  stroke="#8A96A3" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8A96A3"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <CartesianGrid strokeDasharray="3 3" className="stroke-[#8A96A3]/20" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#0F1923", 
                    border: "1px solid #8A96A3",
                    borderRadius: "4px" 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#4D7CFE" 
                  strokeWidth={2}
                  dot={{ fill: "#4D7CFE" }}
                  activeDot={{ r: 6, fill: "#4D7CFE", stroke: "#1A2634" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
