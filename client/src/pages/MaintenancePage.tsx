
import { Card, CardContent } from "@/components/ui/card";
import { WrenchIcon } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-[#1A2634] border-0">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center mb-4 gap-2">
            <WrenchIcon className="h-12 w-12 text-[#FF6B00]" />
            <h1 className="text-2xl font-bold">Site Under Maintenance</h1>
          </div>
          <p className="mt-4 text-[#8A96A3]">
            We're currently performing scheduled maintenance. Please check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
