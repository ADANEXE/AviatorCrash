import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Header() {
  const { user, logout, refreshBalance, isRefreshingBalance } = useAuth();

  return (
    <header className="bg-[#1A2634] shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-[#FF6B00]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 16C12.5523 16 13 15.5523 13 15C13 14.4477 12.5523 14 12 14C11.4477 14 11 14.4477 11 15C11 15.5523 11.4477 16 12 16Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 15C21 16.8565 19.1046 18 17 18H6.5C4.567 18 3 16.433 3 14.5C3 12.7571 4.30455 11.2957 6 11.035C6 11.035 6.03958 7 10 7C13.9604 7 14 11.035 14 11.035C15.6954 11.2957 17 12.7571 17 14.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 14.5C17 14.5 17.5 12.5 20 12.5C21.5 12.5 22.5 13.5 22.5 15C22.5 16.5 21.5 17.5 20 17.5C18.5 17.5 17 16.5 17 14.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <Link href="/">
              <a className="text-xl font-bold text-white">Aviator</a>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center bg-[#0F1923] rounded-full px-4 py-1.5 text-white">
                <span className="text-sm font-medium">Balance:</span>
                <span className="ml-2 text-[#FF6B00] font-mono font-medium">
                  ₹ {user.balance.toFixed(2)}
                </span>
                <button 
                  onClick={refreshBalance}
                  disabled={isRefreshingBalance}
                  className="ml-2 p-1 rounded-full hover:bg-[#1A2634] transition-colors"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`h-4 w-4 text-[#8A96A3] ${isRefreshingBalance ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <Button
                asChild
                className="bg-[#4D7CFE] hover:bg-blue-600 text-white rounded-full"
                size="sm"
              >
                <div>
                  <Link href="/deposit">Deposit</Link>
                </div>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 bg-[#1A2634] border border-[#8A96A3]/20 rounded-full p-1 pr-2">
                  <div className="w-7 h-7 rounded-full bg-[#8A96A3]/20 flex items-center justify-center text-white">
                    <span className="text-xs font-medium">
                      {user.username.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {user.username}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1A2634] text-white border-[#8A96A3]/20">
                  <DropdownMenuItem asChild>
                    <div>
                      <Link href="/profile">
                        <a className="cursor-pointer">Profile</a>
                      </Link>
                    </div>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <div>
                        <Link href="/admin">
                          <a className="cursor-pointer">Admin Panel</a>
                        </Link>
                      </div>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <div>
                      <Link href="/withdraw">
                        <a className="cursor-pointer">Withdraw</a>
                      </Link>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-[#FF3D57]"
                    onClick={() => logout()}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="border-[#8A96A3]/20 text-white hover:bg-[#1A2634]/80"
                size="sm"
              >
                <div>
                  <Link href="/login">Login</Link>
                </div>
              </Button>
              <Button
                asChild
                className="bg-[#FF6B00] hover:bg-orange-500 text-white"
                size="sm"
              >
                <div>
                  <Link href="/register">Register</Link>
                </div>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}