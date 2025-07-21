import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Flame, AlertTriangle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Athlete } from "@shared/schema";

interface TradingModalProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TradingModal({ athlete, isOpen, onClose }: TradingModalProps) {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID - in real app this would come from auth context
  const userId = 1;

  const tradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await apiRequest("POST", "/api/trade", tradeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Executed",
        description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${shares} shares of ${athlete?.name}`,
      });
      setShares("");
      onClose();
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive",
      });
    },
  });

  const handleTrade = () => {
    if (!athlete || !shares || parseInt(shares) <= 0) {
      toast({
        title: "Invalid Trade",
        description: "Please enter a valid number of shares.",
        variant: "destructive",
      });
      return;
    }

    tradeMutation.mutate({
      userId,
      athleteId: athlete.id,
      type: tradeType,
      shares: parseInt(shares),
    });
  };

  if (!athlete) return null;

  const estimatedTotal = shares ? parseFloat(athlete.currentPrice) * parseInt(shares) : 0;
  const fee = estimatedTotal * 0.015;
  const totalCost = estimatedTotal + fee;

  const getPriceChange = () => {
    if (!athlete.previousPrice) return { amount: 0, percent: 0 };
    
    const current = parseFloat(athlete.currentPrice);
    const previous = parseFloat(athlete.previousPrice);
    const amount = current - previous;
    const percent = (amount / previous) * 100;
    
    return { amount, percent };
  };

  const priceChange = getPriceChange();

  const getStatusBadge = () => {
    if (athlete.injuryStatus !== "healthy") {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {athlete.injuryStatus === "minor" ? "Injury" : "Out"}
        </Badge>
      );
    }
    if ((athlete.hotness || 0) > 50) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Flame className="h-3 w-3 mr-1" />
          Hot
        </Badge>
      );
    }
    if ((athlete.hotness || 0) > 20) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          Rising
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        Steady
      </Badge>
    );
  };

  const getStats = () => {
    try {
      return athlete.stats ? JSON.parse(athlete.stats) : {};
    } catch {
      return {};
    }
  };

  const stats = getStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Trade {athlete.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Athlete Info */}
          <div className="flex items-center space-x-4">
            <img
              src={athlete.imageUrl || "/placeholder-athlete.jpg"}
              alt={athlete.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg">{athlete.name}</h3>
              <p className="text-slate-600">{athlete.position} • {athlete.team}</p>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusBadge()}
                {stats.ppg && (
                  <span className="text-sm text-slate-600">{stats.ppg} PPG</span>
                )}
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Current Price</span>
              <div className="text-right">
                <span className="text-2xl font-bold">{athlete.currentPrice} coins</span>
                <div className={`text-sm ${priceChange.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                  {priceChange.amount >= 0 ? '+' : ''}{priceChange.amount.toFixed(2)} ({priceChange.percent >= 0 ? '+' : ''}{priceChange.percent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Trade Type Selection */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={tradeType === "buy" ? "default" : "outline"}
              onClick={() => setTradeType("buy")}
              className={tradeType === "buy" ? "bg-success hover:bg-success/90" : ""}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Buy
            </Button>
            <Button
              variant={tradeType === "sell" ? "default" : "outline"}
              onClick={() => setTradeType("sell")}
              className={tradeType === "sell" ? "bg-danger hover:bg-danger/90" : ""}
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Sell
            </Button>
          </div>

          {/* Shares Input */}
          <div>
            <Label htmlFor="shares">Number of Shares</Label>
            <Input
              id="shares"
              type="number"
              placeholder="Enter number of shares"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
            />
          </div>

          {/* Cost Breakdown */}
          {shares && parseInt(shares) > 0 && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Shares:</span>
                <span>{shares}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Price per share:</span>
                <span>{athlete.currentPrice} coins</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span>{estimatedTotal.toFixed(2)} coins</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Fee (1.5%):</span>
                <span>{fee.toFixed(2)} coins</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total {tradeType === "buy" ? "Cost" : "Receive"}:</span>
                <span>{tradeType === "buy" ? totalCost.toFixed(2) : (estimatedTotal - fee).toFixed(2)} coins</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleTrade}
              disabled={!shares || parseInt(shares) <= 0 || tradeMutation.isPending}
              className="flex-1 bg-primary hover:bg-blue-700"
            >
              {tradeMutation.isPending ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} Shares`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
