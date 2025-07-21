import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, ArrowDown, Trophy, Medal, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function Sidebar() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID - in real app this would come from auth context
  const userId = 1;

  const { data: athletes } = useQuery({
    queryKey: ["/api/athletes"],
  });

  const { data: portfolio } = useQuery({
    queryKey: [`/api/portfolio/${userId}`],
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  const { data: trades } = useQuery({
    queryKey: [`/api/trades/${userId}`],
  });

  const tradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await apiRequest("POST", "/api/trade", tradeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Executed",
        description: "Your trade has been successfully completed.",
      });
      // Clear form
      setSelectedAthleteId("");
      setShares("");
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
    if (!selectedAthleteId || !shares || parseInt(shares) <= 0) {
      toast({
        title: "Invalid Trade",
        description: "Please select an athlete and enter a valid number of shares.",
        variant: "destructive",
      });
      return;
    }

    tradeMutation.mutate({
      userId,
      athleteId: parseInt(selectedAthleteId),
      type: tradeType,
      shares: parseInt(shares),
    });
  };

  const selectedAthlete = Array.isArray(athletes) ? athletes.find((a: any) => a.id.toString() === selectedAthleteId) : null;
  const estimatedTotal = selectedAthlete && shares ? 
    parseFloat(selectedAthlete.currentPrice) * parseInt(shares) : 0;
  const fee = estimatedTotal * 0.015;
  const totalCost = estimatedTotal + fee;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-warning" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-orange-500" />;
    return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-slate-600">{rank}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Quick Trade Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Trade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="athlete-select">Select Athlete</Label>
            <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an athlete" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(athletes) && athletes.map((athlete: any) => (
                  <SelectItem key={athlete.id} value={athlete.id.toString()}>
                    {athlete.name} - {athlete.currentPrice} coins
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={tradeType === "buy" ? "default" : "outline"}
              onClick={() => setTradeType("buy")}
              className={tradeType === "buy" ? "bg-success hover:bg-success/90" : ""}
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Buy
            </Button>
            <Button
              variant={tradeType === "sell" ? "default" : "outline"}
              onClick={() => setTradeType("sell")}
              className={tradeType === "sell" ? "bg-danger hover:bg-danger/90" : ""}
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              Sell
            </Button>
          </div>

          <div>
            <Label htmlFor="shares">Shares</Label>
            <Input
              id="shares"
              type="number"
              placeholder="0"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Estimated Total:</span>
              <span className="font-semibold">{estimatedTotal.toFixed(2)} coins</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Fee (1.5%):</span>
              <span>{fee.toFixed(2)} coins</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total {tradeType === "buy" ? "Cost" : "Receive"}:</span>
              <span>{tradeType === "buy" ? totalCost.toFixed(2) : (estimatedTotal - fee).toFixed(2)} coins</span>
            </div>
          </div>

          <Button
            onClick={handleTrade}
            disabled={!selectedAthleteId || !shares || tradeMutation.isPending}
            className="w-full bg-primary hover:bg-blue-700"
          >
            {tradeMutation.isPending ? "Processing..." : "Execute Trade"}
          </Button>
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle>My Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          {!portfolio || !Array.isArray(portfolio) || portfolio.length === 0 ? (
            <p className="text-slate-600 text-center py-4">No holdings yet</p>
          ) : (
            <div className="space-y-3">
              {portfolio.slice(0, 3).map((holding: any) => {
                const currentPrice = parseFloat(holding.athlete?.currentPrice || "0");
                const avgCost = parseFloat(holding.averageCost);
                const gainLoss = (currentPrice - avgCost) * holding.shares;
                const gainLossPercent = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;
                
                return (
                  <div key={holding.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={holding.athlete?.imageUrl || "/placeholder-athlete.jpg"}
                        alt={holding.athlete?.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {holding.athlete?.name?.split(' ').map((n: string) => n[0]).join('.') + ' ' + holding.athlete?.name?.split(' ').slice(-1)[0]}
                        </p>
                        <p className="text-xs text-slate-600">{holding.shares} shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900 text-sm">
                        {(currentPrice * holding.shares).toFixed(0)} coins
                      </p>
                      <p className={`text-xs ${gainLossPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                        {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
              <Button variant="ghost" className="w-full text-primary">
                View Full Portfolio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Traders</CardTitle>
        </CardHeader>
        <CardContent>
          {!leaderboard ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(leaderboard) && leaderboard.slice(0, 3).map((trader: any) => (
                <div key={trader.rank} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getRankIcon(trader.rank)}
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{trader.username}</p>
                      <p className="text-xs text-slate-600">Portfolio leader</p>
                    </div>
                  </div>
                  <p className="font-bold text-success text-sm">
                    ${parseFloat(trader.portfolioValue).toFixed(0)}
                  </p>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-primary">
                View Full Leaderboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!trades || !Array.isArray(trades) || trades.length === 0 ? (
            <p className="text-slate-600 text-center py-4">No recent trades</p>
          ) : (
            <div className="space-y-3">
              {trades.slice(0, 3).map((trade: any) => (
                <div key={trade.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      trade.type === 'buy' ? 'bg-success' : 'bg-danger'
                    }`}>
                      <ArrowUp className={`h-4 w-4 text-white ${
                        trade.type === 'sell' ? 'rotate-180' : ''
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.athlete?.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-slate-900 text-sm">
                    {trade.type === 'buy' ? '+' : '-'}{trade.shares} shares
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
