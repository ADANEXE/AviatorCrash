import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Search, Pencil, BadgeAlert } from "lucide-react";

type User = {
  id: number;
  username: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
};

export default function UserManagement() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/users', page, limit, searchQuery],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      const url = `/api/admin/users?limit=${limit}&offset=${offset}${searchQuery ? `&search=${searchQuery}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });

  // Update user balance mutation
  const { mutate: updateBalance, isPending: isUpdatingBalance } = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: number }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/balance`, { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Balance Updated",
        description: "User balance has been updated successfully.",
      });
      // Close the dialog after successful update
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const closeButton = dialog.querySelector('button[aria-label="Close"]');
        if (closeButton) {
          (closeButton as HTMLButtonElement).click();
        }
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user balance.",
      });
    },
  });

  const { mutate: suspendUser, isPending: isSuspendingUser } = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/suspend`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Suspended",
        description: "User has been suspended successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to suspend user.",
      });
    },
  });

  // Calculate total pages
  const totalPages = data?.total ? Math.ceil(data.total / limit) : 1;

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Reset to first page when searching
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md">
        Failed to load users. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8A96A3]" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-[#0F1923] border-[#8A96A3]/20 text-white"
          />
        </form>
      </div>
      
      <Card className="bg-[#1A2634] border-0">
        <CardHeader className="pb-2">
          <CardTitle>Users</CardTitle>
          <CardDescription className="text-[#8A96A3]">
            Manage user accounts and balances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#8A96A3]/20">
            <Table>
              <TableHeader>
                <TableRow className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                  <TableHead className="text-[#8A96A3]">ID</TableHead>
                  <TableHead className="text-[#8A96A3]">Username</TableHead>
                  <TableHead className="text-[#8A96A3]">Email</TableHead>
                  <TableHead className="text-[#8A96A3]">Balance</TableHead>
                  <TableHead className="text-[#8A96A3]">Role</TableHead>
                  <TableHead className="text-[#8A96A3]">Joined</TableHead>
                  <TableHead className="text-right text-[#8A96A3]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.map((user: User) => (
                  <TableRow key={user.id} className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="font-mono">₹{user.balance.toFixed(2)}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100/10 px-2 py-1 text-xs font-medium text-amber-500 ring-1 ring-inset ring-amber-500/20">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100/10 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20">
                          User
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0F1923] border-[#8A96A3]/20 text-white">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Adjust Balance
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1A2634] text-white border-[#8A96A3]/20">
                              <DialogHeader>
                                <DialogTitle>Adjust User Balance</DialogTitle>
                                <DialogDescription className="text-[#8A96A3]">
                                  Update the balance for user {user.username} (ID: {user.id})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <label className="text-[#8A96A3] text-sm">Current Balance</label>
                                    <div className="font-mono font-medium">₹{user.balance.toFixed(2)}</div>
                                  </div>
                                  <div className="flex-1">
                                    <label htmlFor="new-balance" className="text-sm text-[#8A96A3]">
                                      New Balance
                                    </label>
                                    <Input
                                      id="new-balance"
                                      type="number"
                                      defaultValue={user.balance}
                                      className="bg-[#0F1923] border-[#8A96A3]/20 text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => {
                                    const input = document.getElementById("new-balance") as HTMLInputElement;
                                    const newBalance = parseFloat(input.value);
                                    if (!isNaN(newBalance)) {
                                      updateBalance({ userId: user.id, amount: newBalance - user.balance });
                                    }
                                  }}
                                  className="bg-[#FF6B00] hover:bg-orange-500"
                                  disabled={isUpdatingBalance}
                                >
                                  {isUpdatingBalance ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    "Update Balance"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-500"
                            onClick={() => {
                              if (confirm('Are you sure you want to suspend this user?')) {
                                suspendUser(user.id);
                              }
                            }}
                            disabled={isSuspendingUser}
                          >
                            {isSuspendingUser ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <BadgeAlert className="mr-2 h-4 w-4" />
                            )}
                            Suspend User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                
                {data?.users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-[#8A96A3]">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Calculate page numbers to show based on current page
                    let pageNum = i + 1;
                    if (page > 3 && totalPages > 5) {
                      pageNum = page - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
