import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";

type WithdrawalRequest = {
  id: number;
  userId: number;
  username: string;
  amount: number;
  paymentMethod: string;
  transactionDetails: string;
  status: string;
  createdAt: string;
};

export default function WithdrawalRequests() {
  const { toast } = useToast();
  
  // Fetch withdrawal requests
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/withdrawals'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Approve withdrawal mutation
  const { mutate: approveWithdrawal, isPending: isApproving } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/admin/transaction/${id}`, { status: 'completed' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      toast({
        title: "Withdrawal Approved",
        description: "The withdrawal request has been approved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve withdrawal.",
      });
    },
  });
  
  // Reject withdrawal mutation
  const { mutate: rejectWithdrawal, isPending: isRejecting } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/admin/transaction/${id}`, { status: 'rejected' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      toast({
        title: "Withdrawal Rejected",
        description: "The withdrawal request has been rejected and funds returned to user.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject withdrawal.",
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
        Failed to load withdrawal requests. Please try again later.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h2>
      
      <Card className="bg-[#1A2634] border-0">
        <CardHeader className="pb-2">
          <CardTitle>Pending Withdrawals</CardTitle>
          <CardDescription className="text-[#8A96A3]">
            Review and process pending withdrawal requests.
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
                {data && data.length > 0 ? (
                  data.map((withdrawal: WithdrawalRequest) => (
                    <TableRow key={withdrawal.id} className="border-[#8A96A3]/20 hover:bg-[#0F1923]/50">
                      <TableCell className="font-medium">{withdrawal.id}</TableCell>
                      <TableCell>{withdrawal.username}</TableCell>
                      <TableCell className="font-mono">₹{Math.abs(withdrawal.amount).toFixed(2)}</TableCell>
                      <TableCell>{withdrawal.paymentMethod}</TableCell>
                      <TableCell>{formatTime(withdrawal.createdAt)}</TableCell>
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
                                <DialogTitle>Withdrawal Request Details</DialogTitle>
                                <DialogDescription className="text-[#8A96A3]">
                                  Review the details of this withdrawal request.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Request ID</p>
                                    <p className="font-medium">{withdrawal.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">User ID</p>
                                    <p className="font-medium">{withdrawal.userId}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Username</p>
                                    <p className="font-medium">{withdrawal.username}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Amount</p>
                                    <p className="font-medium font-mono">₹{Math.abs(withdrawal.amount).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Payment Method</p>
                                    <p className="font-medium">{withdrawal.paymentMethod}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#8A96A3]">Requested At</p>
                                    <p className="font-medium">{new Date(withdrawal.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-[#8A96A3] mb-1">Payment Details</p>
                                  <div className="bg-[#0F1923] p-3 rounded-md text-sm">
                                    {withdrawal.transactionDetails || "No additional details provided."}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="space-x-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => rejectWithdrawal(withdrawal.id)}
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
                                  onClick={() => approveWithdrawal(withdrawal.id)}
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
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => rejectWithdrawal(withdrawal.id)}
                            disabled={isRejecting}
                            className="h-8 bg-[#FF3D57] hover:bg-red-600"
                          >
                            {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => approveWithdrawal(withdrawal.id)}
                            disabled={isApproving}
                            className="h-8 bg-[#00C853] hover:bg-green-600"
                          >
                            {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-[#8A96A3]">
                      No pending withdrawal requests.
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
