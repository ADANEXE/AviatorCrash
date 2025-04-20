import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";

type DepositRequest = {
  id: number;
  userId: number;
  username: string;
  amount: number;
  paymentMethod: string;
  transactionDetails: string;
  status: string;
  createdAt: string;
};

export default function DepositRequests() {
  const { toast } = useToast();
  
  // Fetch deposit requests
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/deposits'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Approve deposit mutation
  const { mutate: approveDeposit, isPending: isApproving } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/admin/transaction/${id}`, { status: 'completed' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposits'] });
      // Invalidate user session to refresh balance
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Deposit Approved",
        description: "The deposit has been approved and funds added to user's account.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve deposit.",
      });
    },
  });
  
  // Reject deposit mutation
  const { mutate: rejectDeposit, isPending: isRejecting } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/admin/transaction/${id}`, { status: 'rejected' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposits'] });
      toast({
        title: "Deposit Rejected",
        description: "The deposit request has been rejected.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject deposit.",
      });
    },
  });
  
  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Unknown time";
    }
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
        <AlertCircle className="h-5 w-5 inline mr-2" />
        Failed to load deposit requests. Please try again later.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Deposit Requests</h2>
      
      <Card className="bg-[#1A2634] border-0">
        <CardHeader className="pb-2">
          <CardTitle>Pending Deposits</CardTitle>
          <CardDescription className="text-[#8A96A3]">
            Review and process pending deposit requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#8A96A3]/20">
            <Table>
              <TableHeader>
                <TableRow className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                  <TableHead className="text-[#8A96A3]">ID</TableHead>
                  <TableHead className="text-[#8A96A3]">User</TableHead>
                  <TableHead className="text-[#8A96A3]">Amount</TableHead>
                  <TableHead className="text-[#8A96A3]">Payment Method</TableHead>
                  <TableHead className="text-[#8A96A3]">Requested</TableHead>
                  <TableHead className="text-[#8A96A3]">Status</TableHead>
                  <TableHead className="text-right text-[#8A96A3]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && Array.isArray(data) && data.length > 0 ? (
                  data.map((deposit: DepositRequest) => (
                    <TableRow key={deposit.id} className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                      <TableCell className="font-medium">{deposit.id}</TableCell>
                      <TableCell>{deposit.username}</TableCell>
                      <TableCell className="font-mono">₹{deposit.amount.toFixed(2)}</TableCell>
                      <TableCell>{deposit.paymentMethod}</TableCell>
                      <TableCell>{formatTime(deposit.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                          Pending
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 border-[#8A96A3]/20 hover:bg-[#0F1923]/80">
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1A2634] text-white border-[#8A96A3]/20">
                              <DialogHeader>
                                <DialogTitle>Deposit Request Details</DialogTitle>
                                <DialogDescription className="text-[#8A96A3]">
                                  Review the details of this deposit request.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Request ID</p>
                                    <p className="font-medium">{deposit.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">User ID</p>
                                    <p className="font-medium">{deposit.userId}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Username</p>
                                    <p className="font-medium">{deposit.username}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Amount</p>
                                    <p className="font-medium font-mono">₹{deposit.amount.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Payment Method</p>
                                    <p className="font-medium">{deposit.paymentMethod}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Requested At</p>
                                    <p className="font-medium">{new Date(deposit.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-[#8A96A3] mb-1">Payment Details</p>
                                  <div className="bg-[#0F1923] p-3 rounded-md text-sm">
                                    {deposit.transactionDetails || "No additional details provided."}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="space-x-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => rejectDeposit(deposit.id)}
                                  disabled={isRejecting}
                                  className="bg-[#FF3D57] hover:bg-red-600"
                                >
                                  {isRejecting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => approveDeposit(deposit.id)}
                                  disabled={isApproving}
                                  className="bg-[#00C853] hover:bg-green-600"
                                >
                                  {isApproving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-[#8A96A3]">
                      No pending deposit requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}