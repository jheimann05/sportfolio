import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-warning" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-600">{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-warning text-white";
    if (rank === 2) return "bg-slate-400 text-white";
    if (rank === 3) return "bg-orange-500 text-white";
    return "bg-slate-200 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-3 mb-6">
          <Trophy className="h-8 w-8 text-warning" />
          <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Traders</CardTitle>
            <p className="text-slate-600">Rankings based on total portfolio value</p>
          </CardHeader>
          <CardContent>
            {!leaderboard || leaderboard.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No traders yet. Be the first to start trading!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Trader</TableHead>
                    <TableHead>Portfolio Value</TableHead>
                    <TableHead>Cash Balance</TableHead>
                    <TableHead>Total Assets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((trader: any) => {
                    const totalAssets = parseFloat(trader.portfolioValue) + parseFloat(trader.balance);
                    const isTopThree = trader.rank <= 3;
                    
                    return (
                      <TableRow key={trader.rank} className={isTopThree ? "bg-slate-50" : ""}>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge className={`${getRankBadge(trader.rank)} mr-2`}>
                              {trader.rank}
                            </Badge>
                            {getRankIcon(trader.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{trader.username}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-success">
                            ${parseFloat(trader.portfolioValue).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-700">
                            ${parseFloat(trader.balance).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            ${totalAssets.toFixed(2)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {leaderboard && leaderboard.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboard.slice(0, 3).map((trader: any, index: number) => (
              <Card key={trader.rank} className={`${index === 0 ? 'ring-2 ring-warning' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-4">
                    {getRankIcon(trader.rank)}
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{trader.username}</h3>
                    <p className="text-2xl font-bold text-success mt-2">
                      ${parseFloat(trader.portfolioValue).toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">Portfolio Value</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
