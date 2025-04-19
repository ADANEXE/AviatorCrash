import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle, Loader2 } from "lucide-react";

const withdrawSchema = z.object({
  amount: z.number()
    .min(100, { message: "Minimum withdrawal amount is ₹100" })
    .max(50000, { message: "Maximum withdrawal amount is ₹50,000" }),
  paymentMethod: z.enum(["Easypaisa", "JazzCash"], {
    required_error: "Please select a payment method",
  }),
  transactionDetails: z.string()
    .min(5, { message: "Please provide your payment details" })
    .max(500, { message: "Payment details too long" }),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

export default function WithdrawPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // Form setup
  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 100,
      transactionDetails: "",
    },
  });
  
  // Validate amount doesn't exceed balance
  const validateAmount = (amount: number) => {
    return amount <= user.balance;
  };
  
  // Withdraw mutation
  const { mutate: withdraw, isPending } = useMutation({
    mutationFn: async (data: WithdrawFormValues) => {
      if (!validateAmount(data.amount)) {
        throw new Error("Withdrawal amount exceeds your balance");
      }
      
      const response = await apiRequest('POST', '/api/payment/withdraw', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for processing.",
      });
      setShowSuccess(true);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal request.",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: WithdrawFormValues) => {
    if (!validateAmount(data.amount)) {
      form.setError("amount", {
        type: "manual",
        message: "Withdrawal amount exceeds your balance",
      });
      return;
    }
    
    withdraw(data);
  };
  
  // Display success view
  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-center">Withdrawal Request Submitted</CardTitle>
            <CardDescription className="text-center text-[#8A96A3]">
              Your withdrawal request has been submitted for processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <div className="rounded-full bg-blue-500/10 p-3 w-16 h-16 mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-blue-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </div>
            <p className="text-white mb-6">
              Our team will review your withdrawal request and process it within 24 hours. You can check the status in your transaction history.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild variant="outline" className="border-[#8A96A3]/20">
                <Link href="/profile">View Transactions</Link>
              </Button>
              <Button asChild className="bg-[#FF6B00] hover:bg-orange-500">
                <Link href="/">Back to Game</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="bg-[#1A2634] border-0">
        <CardHeader>
          <CardTitle className="text-xl text-center">Withdraw Funds</CardTitle>
          <CardDescription className="text-center text-[#8A96A3]">
            Withdraw your winnings to your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-3 bg-[#0F1923] rounded-md">
            <p className="text-sm text-[#8A96A3]">Available Balance</p>
            <p className="text-xl font-bold font-mono text-[#FF6B00]">₹{user.balance.toFixed(2)}</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        className="bg-[#0F1923] border-[#8A96A3]/20 text-white"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-[#8A96A3]">
                      Minimum: ₹100, Maximum: ₹50,000
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0F1923] border-[#8A96A3]/20 text-white">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0F1923] border-[#8A96A3]/20 text-white">
                        <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                        <SelectItem value="JazzCash">JazzCash</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-[#0F1923]/50 p-4 rounded-md border border-[#8A96A3]/10 space-y-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-[#FF6B00] mr-2" />
                  <h3 className="text-sm font-medium">Withdrawal Information</h3>
                </div>
                <ul className="text-sm text-[#8A96A3] list-disc pl-5 space-y-1">
                  <li>Withdrawals are processed within 24 hours.</li>
                  <li>Make sure to provide the correct account details for the selected payment method.</li>
                  <li>A 2% processing fee may apply to withdrawals.</li>
                </ul>
              </div>
              
              <FormField
                control={form.control}
                name="transactionDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your payment account details (phone number, account name, etc.)"
                        className="bg-[#0F1923] border-[#8A96A3]/20 text-white min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-[#4D7CFE] hover:bg-blue-600"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Withdrawal Request"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-[#8A96A3]">
            Having issues?{" "}
            <a href="#" className="text-[#FF6B00] hover:underline">
              Contact support
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
