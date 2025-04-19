import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentMethods() {
  return (
    <Card className="bg-[#1A2634] rounded-xl shadow-lg border-0">
      <CardHeader className="p-4 border-b border-[#8A96A3]/10">
        <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between p-3 border border-[#8A96A3]/20 rounded-lg hover:border-[#FF6B00]/50 transition duration-200 cursor-pointer">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center mr-3">
              {/* Easypaisa Logo */}
              <span className="font-bold text-green-600">EP</span>
            </div>
            <div>
              <div className="font-medium">Easypaisa</div>
              <div className="text-xs text-[#8A96A3]">0331-5226400</div>
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#8A96A3]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex items-center justify-between p-3 border border-[#8A96A3]/20 rounded-lg hover:border-[#FF6B00]/50 transition duration-200 cursor-pointer">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center mr-3">
              {/* JazzCash Logo */}
              <span className="font-bold text-red-600">JC</span>
            </div>
            <div>
              <div className="font-medium">JazzCash</div>
              <div className="text-xs text-[#8A96A3]">0307-0985640</div>
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#8A96A3]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <Button
          asChild
          className="w-full py-2 bg-[#4D7CFE] hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition duration-200 mt-3"
        >
          <Link href="/deposit">Make a Deposit</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
