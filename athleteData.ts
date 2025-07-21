// This file would contain athlete data management utilities
// In a real application, this would include functions to:
// - Fetch athlete data from external APIs
// - Calculate IPO prices based on performance metrics
// - Update athlete statistics and prices
// - Manage injury status and "hotness" factors

export interface AthleteStats {
  ppg?: number; // points per game
  rpg?: number; // rebounds per game
  apg?: number; // assists per game
  fg?: number;  // field goal percentage
  [key: string]: any;
}

export function calculateIPOPrice(stats: AthleteStats, position: string): number {
  // Implementation of the IPO pricing formula from the business document
  // Based on position-specific multipliers for different stats
  
  const positionMultipliers = {
    'PG': { ppg: 1.26, rpg: 3.08, apg: 2.73, stl: 10, blk: 25, threes: 15 },
    'SG': { ppg: 0.901, rpg: 3.448, apg: 4, stl: 11.111, blk: 33.333, threes: 11.111 },
    'SF': { ppg: 0.917, rpg: 2.326, apg: 5.263, stl: 12.5, blk: 25, threes: 14.286 },
    'PF': { ppg: 1.0204, rpg: 1.6949, apg: 6.667, stl: 14.286, blk: 16.667, threes: 25 },
    'C': { ppg: 1.0989, rpg: 1.5625, apg: 7.692, stl: 20, blk: 10, threes: 8.33 }
  };
  
  const multipliers = positionMultipliers[position as keyof typeof positionMultipliers] || positionMultipliers['SF'];
  
  let score = 0;
  score += (stats.ppg || 0) * multipliers.ppg;
  score += (stats.rpg || 0) * multipliers.rpg;
  score += (stats.apg || 0) * multipliers.apg;
  
  // Target benchmark is 60 points for average player
  return Math.max(score / 10, 10); // Minimum price of $10
}

export function calculateInjuryImpact(injuryStatus: string): number {
  // Return multiplier based on injury severity
  const injuryWeights = {
    'healthy': 1.0,
    'minor': 0.85,   // Green/Blue grade
    'moderate': 0.65, // Yellow grade  
    'major': 0.25,   // Red grade
    'out': 0.1       // Purple grade
  };
  
  return injuryWeights[injuryStatus as keyof typeof injuryWeights] || 1.0;
}

export function calculateHotnessMultiplier(tradingVolume: number, avgVolume: number): number {
  // Calculate "hotness" based on trading volume relative to average
  const ratio = avgVolume > 0 ? tradingVolume / avgVolume : 1;
  
  if (ratio > 2.0) return 1.15;  // Very hot
  if (ratio > 1.5) return 1.08;  // Hot
  if (ratio > 0.8) return 1.0;   // Normal
  if (ratio > 0.5) return 0.95;  // Cool
  return 0.9; // Cold
}
