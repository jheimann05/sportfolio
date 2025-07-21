import { Link, useLocation } from "wouter";
import { TrendingUp, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location] = useLocation();
  
  // Mock user data - in real app this would come from auth context
  const mockUser = {
    portfolioValue: "12847.32",
    dailyChange: "247.18",
    dailyChangePercent: "1.96",
    coins: "8234.56"
  };

  const navItems = [
    { href: "/", label: "Trade" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-slate-900">Sportfolio</h1>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span className={`cursor-pointer pb-4 transition-colors ${
                    location === item.href 
                      ? 'text-primary font-medium border-b-2 border-primary' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Portfolio Summary and User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm text-slate-600">Coin Balance</p>
              <p className="font-semibold text-slate-900">{mockUser.coins} coins</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-success font-medium">
                +{mockUser.dailyChange} (+{mockUser.dailyChangePercent}%)
              </span>
              <i className="fas fa-arrow-up text-success text-xs"></i>
            </div>
            <Button className="bg-primary text-white hover:bg-blue-700">
              <Wallet className="h-4 w-4 mr-2" />
              Buy Coins
            </Button>
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-slate-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
