import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch, Label } from "@/components/ui/switch"; // Added Label import
import { Loader2, AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const gameSettingsSchema = z.object({
  minBet: z.number()
    .min(1, { message: "Minimum bet must be at least 1" })
    .max(1000, { message: "Minimum bet cannot exceed 1000" }),
  maxBet: z.number()
    .min(100, { message: "Maximum bet must be at least 100" })
    .max(100000, { message: "Maximum bet cannot exceed 100,000" }),
  houseEdge: z.number()
    .min(1, { message: "House edge must be at least 1%" })
    .max(15, { message: "House edge cannot exceed 15%" }),
  maxMultiplier: z.number()
    .min(2, { message: "Maximum multiplier must be at least 2" })
    .max(1000, { message: "Maximum multiplier cannot exceed 1000" }),
  maintenance: z.boolean().optional(), // Added maintenance field to schema
});

type GameSettingsFormValues = z.infer<typeof gameSettingsSchema>;

export default function GameSettings() {
  const { toast } = useToast();
  const [manualMode, setManualMode] = useState(false);
  const [manualCrashPoint, setManualCrashPoint] = useState("2.00");

  // Fetch game settings
  const { data: gameSettings, isLoading, error } = useQuery({
    queryKey: ['/api/admin/game/settings'],
  });

  // Fetch manual mode settings
  const { data: manualModeData } = useQuery({
    queryKey: ['/api/admin/game/manual-mode'],
  });

  // Settings mutation
  const { mutate: updateSettings, isPending: isUpdatingSettings } = useMutation({
    mutationFn: async (data: GameSettingsFormValues) => {
      const response = await apiRequest('PATCH', '/api/admin/game/settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game/settings'] });
      toast({
        title: "Settings Updated",
        description: "Game settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update game settings.",
      });
    },
  });

  // Manual mode mutation
  const { mutate: toggleManualMode, isPending: isTogglingManualMode } = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('PATCH', '/api/admin/game/manual-mode', { enabled });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game/manual-mode'] });
      setManualMode(data.enabled);
      toast({
        title: "Manual Mode " + (data.enabled ? "Enabled" : "Disabled"),
        description: "Manual mode has been " + (data.enabled ? "enabled" : "disabled") + " successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to toggle manual mode.",
      });
    },
  });

  // Crash point mutation
  const { mutate: setCrashPoint, isPending: isSettingCrashPoint } = useMutation({
    mutationFn: async (crashPoint: number) => {
      const response = await apiRequest('PATCH', '/api/admin/game/crash-point', { crashPoint });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game/manual-mode'] });
      toast({
        title: "Crash Point Set",
        description: `Next crash point set to ${data.crashPoint.toFixed(2)}x.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to set crash point.",
      });
    },
  });

  // Form initialization
  const form = useForm<GameSettingsFormValues>({
    resolver: zodResolver(gameSettingsSchema),
    defaultValues: {
      minBet: gameSettings?.minBet || 10,
      maxBet: gameSettings?.maxBet || 10000,
      houseEdge: gameSettings?.houseEdge || 5,
      maxMultiplier: gameSettings?.maxMultiplier || 100,
      maintenance: gameSettings?.maintenance || false, //Added default maintenance value
    },
    values: gameSettings,
  });

  // Initialize manual mode state from data
  useState(() => {
    if (manualModeData) {
      setManualMode(manualModeData.enabled);
      if (manualModeData.crashPoint) {
        setManualCrashPoint(manualModeData.crashPoint.toFixed(2));
      }
    }
  });

  const onSubmit = (data: GameSettingsFormValues) => {
    updateSettings(data);
  };

  const handleManualModeToggle = (checked: boolean) => {
    toggleManualMode(checked);
  };

  const handleSetCrashPoint = () => {
    const crashPoint = parseFloat(manualCrashPoint);
    if (isNaN(crashPoint) || crashPoint < 1) {
      toast({
        variant: "destructive",
        title: "Invalid Crash Point",
        description: "Crash point must be at least 1.00.",
      });
      return;
    }
    setCrashPoint(crashPoint);
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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load game settings. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Game Settings</h2>

      <Card className="bg-[#1A2634] border-0">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription className="text-[#8A96A3]">
            Configure the basic parameters of the Aviator game.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="minBet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Minimum Bet (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="bg-[#0F1923] border-[#8A96A3]/20 text-white"
                        />
                      </FormControl>
                      <FormDescription className="text-[#8A96A3]">
                        The minimum amount a player can bet.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxBet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Maximum Bet (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="bg-[#0F1923] border-[#8A96A3]/20 text-white"
                        />
                      </FormControl>
                      <FormDescription className="text-[#8A96A3]">
                        The maximum amount a player can bet.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="houseEdge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">House Edge (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="bg-[#0F1923] border-[#8A96A3]/20 text-white"
                        />
                      </FormControl>
                      <FormDescription className="text-[#8A96A3]">
                        The percentage edge the house has over players.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Maximum Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="bg-[#0F1923] border-[#8A96A3]/20 text-white"
                        />
                      </FormControl>
                      <FormDescription className="text-[#8A96A3]">
                        The highest possible multiplier before forced crash.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-[#FF6B00] hover:bg-orange-500"
                  disabled={isUpdatingSettings}
                >
                  {isUpdatingSettings ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="bg-[#1A2634] border-0">
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>Enable or disable site maintenance mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <FormField
              control={form.control}
              name="maintenance"
              render={({ field }) => (
                <FormItem>
                  <Switch
                    {...field}
                    id="maintenance"
                  />
                  <Label htmlFor="maintenance">
                    {field.value ? "Site is under maintenance" : "Site is live"}
                  </Label>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A2634] border-0">
        <CardHeader>
          <CardTitle>Manual Control</CardTitle>
          <CardDescription className="text-[#8A96A3]">
            Manually control the crash point for the next game.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-white">Manual Mode</h4>
              <p className="text-sm text-[#8A96A3]">
                Enable to manually set the crash point for the next game.
              </p>
            </div>
            <Switch
              checked={manualMode}
              onCheckedChange={handleManualModeToggle}
              disabled={isTogglingManualMode}
            />
          </div>

          <Separator className="bg-[#8A96A3]/10" />

          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-white">Next Crash Point</h4>
              <p className="text-sm text-[#8A96A3]">
                Set the exact crash point for the next game (only works when manual mode is enabled).
              </p>
            </div>

            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  type="text"
                  value={manualCrashPoint}
                  onChange={(e) => setManualCrashPoint(e.target.value)}
                  placeholder="2.00"
                  className="bg-[#0F1923] border-[#8A96A3]/20 text-white"
                  disabled={!manualMode || isSettingCrashPoint}
                />
              </div>
              <Button
                onClick={handleSetCrashPoint}
                className="bg-[#4D7CFE] hover:bg-blue-600"
                disabled={!manualMode || isSettingCrashPoint}
              >
                {isSettingCrashPoint ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  "Set Crash Point"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-[#0F1923]/30 border-t border-[#8A96A3]/10">
          <p className="text-sm text-[#FF3D57]">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Warning: Manual mode should only be used for testing purposes. Using it in production may lead to unfair gameplay.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}