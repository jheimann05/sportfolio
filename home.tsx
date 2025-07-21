import { useState } from "react";
import Header from "@/components/Header";
import MarketOverview from "@/components/MarketOverview";
import TradingInterface from "@/components/TradingInterface";
import Sidebar from "@/components/Sidebar";
import TradingModal from "@/components/TradingModal";
import type { Athlete } from "@shared/schema";

export default function Home() {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTradeClick = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAthlete(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MarketOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <TradingInterface onTradeClick={handleTradeClick} />
          <Sidebar />
        </div>
      </main>

      <TradingModal
        athlete={selectedAthlete}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
