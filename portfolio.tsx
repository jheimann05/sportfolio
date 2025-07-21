import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Portfolio() {
  // Mock user ID - in real app this would come from auth context
  const userId = 1;

  const { data: portfolio, isLoading } = useQuery({
    queryKey: [`/api/portfolio/${userId}`],
  });

  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: [`/api/trades/${userId}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  const totalValue = Array.isArray(portfolio) ? portfolio.reduce((sum: number, holding: any) => sum + parseFloat(holding.totalValue), 0) : 0;
  const totalCost = Array.isArray(portfolio) ? portfolio.reduce((sum: number, holding: any) => sum + (parseFloat(holding.averageCost) * holding.shares), 0) : 0;
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">My Portfolio</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalValue.toFixed(2)} coins</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCost.toFixed(2)} coins</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                {totalGainLoss.toFixed(2)} coins
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Return %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGainLossPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {!portfolio || !Array.isArray(portfolio) || portfolio.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No holdings yet. Start trading to build your portfolio!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Athlete</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Avg Cost</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(portfolio) && portfolio.map((holding: any) => {
                      const currentPrice = parseFloat(holding.athlete?.currentPrice || "0");
                      const avgCost = parseFloat(holding.averageCost);
                      const gainLoss = (currentPrice - avgCost) * holding.shares;
                      const gainLossPercent = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;
                      
                      return (
                        <TableRow key={holding.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <img 
                                src={holding.athlete?.imageUrl || "/placeholder-athlete.jpg"} 
                                alt={holding.athlete?.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-medium">{holding.athlete?.name}</div>
                                <div className="text-sm text-slate-600">{holding.athlete?.position} • {holding.athlete?.team}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{holding.shares}</TableCell>
                          <TableCell>{avgCost.toFixed(2)} coins</TableCell>
                          <TableCell>{currentPrice.toFixed(2)} coins</TableCell>
                          <TableCell>{(currentPrice * holding.shares).toFixed(2)} coins</TableCell>
                          <TableCell>
                            <div className={gainLoss >= 0 ? 'text-success' : 'text-danger'}>
                              {gainLoss.toFixed(2)} coins
                              <div className="text-xs">
                                ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%)
                              </div>
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !trades || !Array.isArray(trades) || trades.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No trades yet.</p>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(trades) && trades.slice(0, 10).map((trade: any) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          trade.type === 'buy' ? 'bg-success' : 'bg-danger'
                        }`}>
                          <i className={`fas ${trade.type === 'buy' ? 'fa-arrow-up' : 'fa-arrow-down'} text-white text-xs`}></i>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.athlete?.name}
                          </div>
                          <div className="text-xs text-slate-600">
                            {new Date(trade.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {trade.type === 'buy' ? '+' : '-'}{trade.shares} shares
                        </div>
                        <div className="text-xs text-slate-600">
                          ${parseFloat(trade.totalAmount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
