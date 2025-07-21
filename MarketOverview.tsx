import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Users, BarChart3, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketOverview() {
  const { data: marketStats, isLoading } = useQuery({
    queryKey: ["/api/market/stats"],
  });

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </section>
    );
  }

  const stats = [
    {
      title: "Market Cap",
      value: `$${marketStats?.marketCap || "0"}`,
      change: "+12.3%",
      changeType: "positive",
      icon: Globe
    },
    {
      title: "Active Traders",
      value: marketStats?.activeTraders?.toLocaleString() || "0",
      change: `+${Math.floor(Math.random() * 200)} today`,
      changeType: "positive",
      icon: Users
    },
    {
      title: "Daily Volume",
      value: `$${marketStats?.dailyVolume || "0"}`,
      change: "-3.2%",
      changeType: "negative",
      icon: BarChart3
    },
    {
      title: "Top Gainer",
      value: marketStats?.topGainer?.name || "N/A",
      change: marketStats?.topGainer?.change ? `+${marketStats.topGainer.change}%` : "0%",
      changeType: "positive",
      icon: Trophy
    }
  ];

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-success' : 'text-danger'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
