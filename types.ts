
export type Sector = 'service' | 'tech' | 'luxury' | 'finance' | 'entertainment' | 'space' | 'energy' | 'cosmic';
export type SortOption = 'cost' | 'income' | 'name' | 'level';
export type LeaderboardTimeframe = 'local' | 'global';
export type ItemTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'exotic';

export interface GlobalNews {
  id: string;
  headline: string;
  targetSector: Sector | 'all';
  multiplier: number;
  expiresAt: number;
  isPlayerMsg?: boolean; 
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'alert' | 'reward' | 'system';
  read: boolean;
}

export interface Asset {
  id: string;
  name: string;
  category: 'business' | 'luxury' | 'megaproject' | 'cosmic';
  sector: Sector;
  baseCost: number;
  baseIncome: number;
  description: string;
  icon: string;
  count: number;
  level: number;
  isCosmic?: boolean;
  requiredAssetId?: string;
  requiredAssetCount?: number;
}

export interface Rank {
  id: number;
  name: string;
  requirement: number; 
  perks: string;
  color: string;
  description: string;
  dominancePercent: number;
}

export interface TradeOrder {
  id: string;
  stockId: string;
  stockName: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  shares: number;
  price: number;
  total: number;
  targetPrice?: number;
  timestamp: number;
  status: 'filled' | 'pending' | 'cancelled';
  realizedPnL?: number;
}

export interface Stock {
  id: string;
  name: string;
  price: number;
  history: number[];
  volatility: number;
  trend: 'up' | 'down' | 'flat';
  prediction?: 'bull' | 'bear' | 'stagnant';
  isManipulated?: boolean;
  insiderPrice?: number;
  category?: 'stock' | 'crypto';
  sector?: string;
  icon?: string;
  openPrice?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  marketCap?: number;
  peRatio?: number;
  analystRating?: 'Strong Buy' | 'Buy' | 'Hold' | 'Underperform';
  summary?: string;
  totalFloat?: number;
  dividendYieldPerSec?: number;
}

export interface MarginLoan {
  principal: number;
  borrowedAt: number;
  lastInterestTick: number;
  interestRatePerSec: number; // e.g. 0.0001 (0.01% per sec)
  totalInterestPaid: number;
}

export interface StockPosition {
  shares: number;
  avgBuyPrice: number;
}

export interface FinancialHistory {
  totalRevenue: number;
  totalExpenses: number;
  totalTaxes: number;
  totalHackLosses: number;
  stockProfits: number;
  bestTrade: number;
}

export interface HackerProfile {
  id: string;
  name: string;
  cost: number;
  successRate: number;
  detectionRate: number;
  tier: 'Script Kiddie' | 'Black Hat' | 'State Actor' | 'AI Construct';
  description: string;
}

export interface RewardLog {
  id: string;
  timestamp: number;
  source: string;
  item: string;
  tier: ItemTier;
  value?: string;
}

export interface GameState {
  userId: string;
  userName: string;
  userBannerColor: string;
  avatar: string;
  money: number;
  diamonds: number;
  totalEarnings: number;
  multiplier: number;
  legacyKeys: number;
  prestigeCount: number;
  lastUpdate: number;
  assets: Asset[];
  hardenedAssetIds: string[];
  saveHash: string;
  
  lifestyle: LifestyleItem[];
  isGreedActive: boolean;
  greedEndTime: number;
  isAuditActive: boolean;
  adsRemoved: boolean;
  securityLevel: number;
  firewallStrength: number;
  lastBreachAttempt: number;
  breachProbability: number;
  sabotagePower: number;
  
  stocks: Stock[];
  stockPortfolio: Record<string, StockPosition>;
  watchlist?: string[];
  tradeOrders?: TradeOrder[];
  stockAlerts: Notification[];
  assetSortBy: SortOption;
  inventory: Record<string, number>;
  
  purchasedPermanentIds: string[];
  purchasedCosmetics: string[];
  equippedCosmetics: {
     nameColor?: string;
     titleTag?: string;
     bgmId?: string;
  };

  financials: FinancialHistory;
  
  simulatedUsers: SimulatedUser[];
  rankId: number;
  
  activeNews: GlobalNews | null;
  hasSovereignStatus: boolean;
  isVIP: boolean;
  marketInsiderEndTime: number;
  
  adBoostActive: boolean;
  adBoostEndTime: number;

  taxesPaid: number;
  lastHackTime: number;
  royalDabbaCount: number;
  worldTalkTokens: number;
  giftBoxes: number;
  
  ownedTitles: string[];
  ownedAvatars: string[];
  rewardHistory: RewardLog[];
  
  realityUnlocked: boolean;
  loginStreak?: number;
  lastLoginDate?: string;
  dailyRewardClaimed?: boolean;
  insiderLeak?: {
    stockId: string;
    type: 'pump' | 'dump';
    multiplier: number;
    targetTime: number;
    revealed: boolean;
    headline: string;
  } | null;
  revengeTarget?: {
    botId: string;
    botName: string;
    stolenAmount: number;
    expiresAt: number;
  } | null;
  starterKitPurchased?: boolean;
  starterKitExpiresAt?: number;
  swissShieldEndTime?: number;
  marginLoan?: MarginLoan | null;
  marginCallWarningUntil?: number | null;
  controlledCompanies?: string[];
  corporatePowersCooldowns?: Record<string, number>;
}

export interface LifestyleItem {
  id: string;
  name: string;
  cost: number;
  multiplierAdd: number;
  icon: string;
  unlocked: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number; 
  currency?: 'money' | 'diamonds'; 
  type: 'booster' | 'permanent' | 'action' | 'security' | 'cosmetic' | 'bgm' | 'title' | 'risk' | 'avatar';
  rewardValue: number; 
  rewardMeta?: string; 
  icon: string;
  requiredRank?: number; 
  stock?: number; 
  tier?: ItemTier;
}

export interface DiamondBundle {
  id: string;
  name: string;
  amount: number;
  price: number; 
  icon: string;
  isPopular?: boolean;
  productId?: string; // Google Play Product ID
}

export interface RedPacketData {
  id: string;
  totalAmount: number;
  claimsRemaining: number;
  maxClaims: number;
  claimedBy: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isFlex?: boolean;
  isZenith?: boolean;
  isSovereign?: boolean;
  isGiftDrop?: boolean; 
  giftAmount?: number;
  redPacket?: RedPacketData;
  flexMetadata?: { icon: string; name: string };
  rankName?: string;
  rankColor?: string;
  cosmeticNameColor?: string;
  titleTag?: string;
}

export interface SimulatedUser {
  id: string;
  name: string;
  avatar: string;
  personality: 'whale' | 'grinder' | 'socialite' | 'newbie' | 'troll' | 'mentor' | 'lover' | 'gentleman' | 'zenith';
  money: number;
  diamonds: number;
  isOnline: boolean;
  wakeHour: number;
  sleepHour: number;
  location: string;
  growthRate: number;
  partnerId?: string;
  isLegendary?: boolean;
}

export interface RemotePlayer {
  id: string;
  name: string;
  avatar: string;
  money: number;
  rankId: number;
  lastSeen: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  money: number;
  isPlayer?: boolean;
  isRemote?: boolean;
  avatar: string;
  growthRate: number;
  personality?: string;
}
