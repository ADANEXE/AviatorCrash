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

const depositSchema = z.object({
  amount: z.number()
    .min(100, { message: "Minimum deposit amount is ₹100" })
    .max(100000, { message: "Maximum deposit amount is ₹100,000" }),
  paymentMethod: z.enum(["Easypaisa", "JazzCash"], {
    required_error: "Please select a payment method",
  }),
  transactionDetails: z.string()
    .min(5, { message: "Please provide transaction details" })
    .max(500, { message: "Transaction details too long" }),
});

type DepositFormValues = z.infer<typeof depositSchema>;

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // Form setup
  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 100,
      transactionDetails: "",
    },
  });
  
  // Deposit mutation
  const { mutate: deposit, isPending } = useMutation({
    mutationFn: async (data: DepositFormValues) => {
      const response = await apiRequest('POST', '/api/payment/deposit', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit request has been submitted for processing.",
      });
      setShowSuccess(true);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Deposit Failed",
        description: error.message || "Failed to submit deposit request.",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: DepositFormValues) => {
    deposit(data);
  };
  
  // Display success view
  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="bg-[#1A2634] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-center">Deposit Request Submitted</CardTitle>
            <CardDescription className="text-center text-[#8A96A3]">
              Your deposit request has been submitted for processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <div className="rounded-full bg-green-500/10 p-3 w-16 h-16 mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-green-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-white mb-6">
              Our team will review your deposit and credit your account as soon as possible. You can check the status in your transaction history.
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
          <CardTitle className="text-xl text-center">Deposit Funds</CardTitle>
          <CardDescription className="text-center text-[#8A96A3]">
            Add money to your account to start playing
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      Minimum: ₹100, Maximum: ₹100,000
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
                        <SelectItem value="Easypaisa">Easypaisa (0331-5226400)</SelectItem>
                        <SelectItem value="JazzCash">JazzCash (0307-0985640)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-[#0F1923]/50 p-4 rounded-md border border-[#8A96A3]/10 space-y-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-[#FF6B00] mr-2" />
                  <h3 className="text-sm font-medium">Payment Instructions</h3>
                </div>
                <ol className="text-sm text-[#8A96A3] list-decimal pl-5 space-y-1">
                  <li>Send the amount to the selected payment method account.</li>
                  <li>Note down the transaction ID or reference number.</li>
                  <li>Provide the transaction details below, including the sender's phone number and transaction ID.</li>
                  <li>Submit the form and wait for confirmation.</li>
                </ol>
              </div>
              
              <FormField
                control={form.control}
                name="transactionDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter transaction ID, sender phone number, and other relevant details"
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
                className="w-full bg-[#FF6B00] hover:bg-orange-500"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Deposit Request"
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
