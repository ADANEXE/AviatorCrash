import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/admin/Dashboard";
import GameSettings from "@/components/admin/GameSettings";
import UserManagement from "@/components/admin/UserManagement";
import WithdrawalRequests from "@/components/admin/WithdrawalRequests";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Redirect if not logged in or not an admin
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (!user.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#8A96A3]/10 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-[#8A96A3] mt-2">
          Manage game settings, users, and withdrawal requests.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#0F1923] border border-[#8A96A3]/10">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#1A2634]">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="game-settings" className="data-[state=active]:bg-[#1A2634]">
            Game Settings
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-[#1A2634]">
            Users
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-[#1A2634]">
            Withdrawals
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <Dashboard />
        </TabsContent>
        
        <TabsContent value="game-settings">
          <GameSettings />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="withdrawals">
          <WithdrawalRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}
