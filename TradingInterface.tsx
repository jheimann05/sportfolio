import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Flame, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Athlete } from "@shared/schema";

interface TradingInterfaceProps {
  onTradeClick: (athlete: Athlete) => void;
}

export default function TradingInterface({ onTradeClick }: TradingInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  const { data: athletes, isLoading } = useQuery({
    queryKey: ["/api/athletes/trending"],
  });

  if (isLoading) {
    return (
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const filteredAthletes = Array.isArray(athletes) ? athletes.filter((athlete: Athlete) => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = sportFilter === "all" || athlete.sport === sportFilter;
    const matchesPosition = positionFilter === "all" || athlete.position === positionFilter;
    return matchesSearch && matchesSport && matchesPosition;
  }) : [];

  const getStatusBadge = (athlete: Athlete) => {
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

  const getPriceChange = (athlete: Athlete) => {
    if (!athlete.previousPrice) return { amount: 0, percent: 0 };
    
    const current = parseFloat(athlete.currentPrice);
    const previous = parseFloat(athlete.previousPrice);
    const amount = current - previous;
    const percent = (amount / previous) * 100;
    
    return { amount, percent };
  };

  const getStats = (athlete: Athlete) => {
    try {
      return athlete.stats ? JSON.parse(athlete.stats) : {};
    } catch {
      return {};
    }
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  <SelectItem value="NBA">NBA</SelectItem>
                  <SelectItem value="NFL">NFL</SelectItem>
                  <SelectItem value="MLB">MLB</SelectItem>
                </SelectContent>
              </Select>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="PG">Point Guard</SelectItem>
                  <SelectItem value="SG">Shooting Guard</SelectItem>
                  <SelectItem value="SF">Small Forward</SelectItem>
                  <SelectItem value="PF">Power Forward</SelectItem>
                  <SelectItem value="C">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trending Athletes */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Athletes</CardTitle>
          <p className="text-slate-600 text-sm">Most traded players in the last 24 hours</p>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAthletes.length === 0 ? (
            <div className="p-6 text-center text-slate-600">
              No athletes found matching your criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredAthletes.map((athlete: Athlete) => {
                const priceChange = getPriceChange(athlete);
                const stats = getStats(athlete);
                
                return (
                  <div
                    key={athlete.id}
                    className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onTradeClick(athlete)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={athlete.imageUrl || "/placeholder-athlete.jpg"}
                          alt={athlete.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900">{athlete.name}</h3>
                          <p className="text-sm text-slate-600">{athlete.position} • {athlete.team}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(athlete)}
                            {stats.ppg && (
                              <span className="text-xs text-slate-500">{stats.ppg} PPG</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{athlete.currentPrice} coins</p>
                        <p className={`text-sm font-medium ${
                          priceChange.amount >= 0 ? 'text-success' : 'text-danger'
                        }`}>
                          {priceChange.amount >= 0 ? '+' : ''}{priceChange.amount.toFixed(2)} ({priceChange.percent >= 0 ? '+' : ''}{priceChange.percent.toFixed(2)}%)
                        </p>
                        <Button
                          size="sm"
                          className="mt-2 bg-primary text-white hover:bg-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTradeClick(athlete);
                          }}
                        >
                          Trade
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Market Performance</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="bg-primary text-white">1D</Button>
              <Button variant="outline" size="sm">1W</Button>
              <Button variant="outline" size="sm">1M</Button>
              <Button variant="outline" size="sm">1Y</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-slate-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Market performance chart</p>
              <p className="text-sm">Real-time data visualization coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
