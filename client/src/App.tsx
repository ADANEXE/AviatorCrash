import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import NotFoundPage from "@/pages/not-found";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminPage from "@/pages/AdminPage";
import ProfilePage from "@/pages/ProfilePage";
import DepositPage from "@/pages/DepositPage";
import WithdrawPage from "@/pages/WithdrawPage";
import PolicyPage from "@/pages/PolicyPage";
import { GameProvider } from "./contexts/GameContext";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";


export default function App() {
  const { user } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <TooltipProvider>
          <Layout>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegisterPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/admin" component={AdminPage} />
              <Route path="/deposit" component={DepositPage} />
              <Route path="/withdraw" component={WithdrawPage} />
              <Route path="/policy/:page" component={PolicyPage} />
              <Route component={NotFoundPage} />
            </Switch>
          </Layout>
          <Toaster />
        </TooltipProvider>
      </GameProvider>
    </QueryClientProvider>
  );
}