import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Asset, GameState, LeaderboardEntry, ShopItem, ChatMessage, Stock, Rank, DiamondBundle, LeaderboardTimeframe, HackerProfile, SimulatedUser, RemotePlayer, RewardLog, ItemTier, Notification, StockPosition, TradeOrder, MarginLoan, GlobalNews } from './types';
import { INITIAL_ASSETS, TICK_RATE, AVATAR_OPTIONS, LIFESTYLE_ITEMS, SHOP_ITEMS, BLACK_MARKET_ITEMS, SIMULATED_USERS, RANKS, DIAMOND_BUNDLES, INITIAL_STOCKS, HACKER_ROSTER, RARE_AVATARS, ULTRA_RARE_AVATARS, PREMIUM_AVATARS, REALITY_ICONS, ALL_TITLES } from './constants';
import { AssetCard } from './components/AssetCard';
import { Leaderboard } from './components/Leaderboard';
import { StockChart } from './components/StockChart';
import { PieChart } from './components/PieChart';
import { Intro } from './components/Intro';
import { AuthScreen } from './components/AuthScreen';
import { Icons } from './icons';
import { audio } from './services/audioService';
import { generateGlobalNews, generateAutonomousChat, generateChatReplies } from './services/geminiService';
import { networking } from './services/networkingService';
import { firebaseService } from './services/firebaseService';
import { storeService } from './services/storeService';
import { adService } from './services/adService';

const STOCK_UPDATE_FREQ = 2000; 
const CHAT_AUTO_FREQ = 3000; 
const NEWS_AUTO_FREQ = 45000;
const LEADERBOARD_FETCH_RATE = 30000; // Fetch Cloud Data every 30s
const LEADERBOARD_RENDER_RATE = 100; // Render/Update Prices every 0.1s (10 FPS for smoother numbers)
const TAX_CHECK_INTERVAL = 300000; // Base 5 minutes
const MAX_SESSION_TIME = 6 * 60 * 60 * 1000; // 6 Hours
const BAN_DURATION = 15 * 60 * 1000; // 15 Mins

const SAVE_KEY = 'lazy_billionaire_secure_v3'; 
const ENCRYPTION_KEY = 'IMPERIAL_VAULT_KEY_99'; 

const RARITY_COLORS = {
  common: 'text-zinc-400',
  uncommon: 'text-emerald-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
  exotic: 'text-red-500'
};

const RARITY_BG = {
  common: 'bg-zinc-800/50',
  uncommon: 'bg-emerald-900/30',
  rare: 'bg-blue-900/30',
  epic: 'bg-purple-900/30',
  legendary: 'bg-amber-900/30',
  exotic: 'bg-red-900/30'
};

const RARITY_BORDER = {
  common: 'border-zinc-700',
  uncommon: 'border-emerald-700',
  rare: 'border-blue-700',
  epic: 'border-purple-700',
  legendary: 'border-amber-700',
  exotic: 'border-red-600'
};

// Cyberpunk Palette for Banner - REMOVED PURPLE TO RESERVE FOR ZENITH
const BANNER_COLORS = [
    '#18181b', // Default Black
    '#7f1d1d', // Red
    '#1e3a8a', // Blue
    '#064e3b', // Green
    '#78350f', // Amber
    '#115e59', // Teal
];

const encryptData = (text: string): string => {
  try {
    const uriEncoded = encodeURIComponent(text);
    const chars = uriEncoded.split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    );
    return btoa(chars.join(''));
  } catch (e) {
    console.error("Encryption failed", e);
    return "";
  }
};

const decryptData = (encoded: string): string => {
  try {
    const text = atob(encoded);
    const chars = text.split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    );
    return decodeURIComponent(chars.join(''));
  } catch (e) {
    console.error("Decryption failed", e);
    return "{}";
  }
};

const generateSaveHash = (money: number, earnings: number, diamonds: number) => {
  const str = `salt_${Math.floor(money)}_${Math.floor(earnings)}_${diamonds}_${ENCRYPTION_KEY}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash.toString(16);
};

const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    switch (style) {
      case 'light': window.navigator.vibrate(10); break;
      case 'medium': window.navigator.vibrate(25); break;
      case 'heavy': window.navigator.vibrate(50); break;
      case 'success': window.navigator.vibrate([20, 30, 20]); break;
    }
  }
};

const getAvatarMetadata = (url: string) => {
   if (PREMIUM_AVATARS.includes(url)) return { rarity: 'legendary', obtain: 'Premium Store / Black Market' };
   if (ULTRA_RARE_AVATARS.includes(url)) return { rarity: 'epic', obtain: 'Special Events' };
   if (RARE_AVATARS.includes(url)) return { rarity: 'rare', obtain: 'Events / Rare Drops' };
   return { rarity: 'common', obtain: 'Standard Issue' };
};

const getLevel = (count: number) => {
  if (count >= 100) return 5;
  if (count >= 50) return 4;
  if (count >= 25) return 3;
  if (count >= 10) return 2;
  return 1;
};

const getLevelCostMultiplier = (level: number) => {
  switch(level) {
    case 2: return 10;
    case 3: return 50;
    case 4: return 250;
    case 5: return 1000;
    default: return 1;
  }
};

const getLevelIncomeMultiplier = (level: number) => {
  switch(level) {
    case 2: return 2;
    case 3: return 5;
    case 4: return 12;
    case 5: return 30;
    default: return 1;
  }
};

const formatMoney = (n: number) => {
  if (!n || isNaN(n)) return "0.00";
  if (n < 1000000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tiers = [
    { v: 1e45, s: ' Qda' },
    { v: 1e42, s: ' Tda' },
    { v: 1e39, s: ' Dda' },
    { v: 1e36, s: ' Uda' },
    { v: 1e33, s: ' Dca' },
    { v: 1e30, s: ' Noa' },
    { v: 1e27, s: ' Oca' },
    { v: 1e24, s: ' Spa' },
    { v: 1e21, s: ' Sxa' },
    { v: 1e18, s: ' Qia' },
    { v: 1e15, s: ' Qa' },
    { v: 1e12, s: ' T' },
    { v: 1e9, s: ' B' },
    { v: 1e6, s: ' M' }
  ];
  for (const tier of tiers) {
    if (n >= tier.v) {
      const scaled = n / tier.v;
      // ALWAYS 6 digits (including dot) for a neat look: X.XXXX M or XX.XXX B or XXX.XX T
      // Max 7 chars total if we include the dot. 
      // e.g. 1.23456 (7 chars)
      // e.g. 12.3456 (7 chars)
      // e.g. 123.456 (7 chars)
      
      const integerPart = Math.floor(scaled).toString();
      const intLen = integerPart.length; 
      const decimals = Math.max(0, 6 - intLen); // Dynamic decimals to keep total "numbers" consistent
      
      return scaled.toFixed(decimals) + tier.s;
    }
  }
  return n.toExponential(2).replace('e+', 'E');
};

const formatCost = (n: number) => {
  if (!n || isNaN(n)) return "0";
  if (n < 1000) return n.toFixed(0); 
  const tiers = [
     { v: 1e45, s: 'Qd' }, { v: 1e42, s: 'Td' }, { v: 1e39, s: 'Dd' }, { v: 1e36, s: 'Ud' },
     { v: 1e33, s: 'Dc' }, { v: 1e30, s: 'No' }, { v: 1e27, s: 'Oc' }, { v: 1e24, s: 'Sp' },
     { v: 1e21, s: 'Sx' }, { v: 1e18, s: 'Qi' }, { v: 1e15, s: 'Q' }, { v: 1e12, s: 'T' },
     { v: 1e9, s: 'B' }, { v: 1e6, s: 'M' }, { v: 1e3, s: 'k' }
  ];
  for (const tier of tiers) {
    if (n >= tier.v) {
        // "in the empire all the price on buy buttons only stays in 5 numbers"
        // e.g. XXX.XXk
        const scaled = n / tier.v;
        const intLen = Math.floor(scaled).toString().length;
        const decimals = Math.max(0, 5 - intLen);
        return scaled.toFixed(decimals) + tier.s;
    }
  }
  return n.toExponential(1);
}

const formatYield = (n: number) => {
  if (!n || isNaN(n)) return "0.00";
  if (n < 1000000) return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const tiers = [
    { v: 1e45, s: 'Qd' },
    { v: 1e42, s: 'Td' },
    { v: 1e39, s: 'Dd' },
    { v: 1e36, s: 'Ud' },
    { v: 1e33, s: 'Dc' },
    { v: 1e30, s: 'No' },
    { v: 1e27, s: 'Oc' },
    { v: 1e24, s: 'Sp' },
    { v: 1e21, s: 'Sx' },
    { v: 1e18, s: 'Qi' },
    { v: 1e15, s: 'Q' },
    { v: 1e12, s: 'T' },
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' }
  ];
  for (const tier of tiers) {
    if (n >= tier.v) {
      return (n / tier.v).toFixed(2) + tier.s;
    }
  }
  return n.toExponential(2).replace('e+', 'E');
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitialState = (): GameState => ({
  userId: Math.floor(10000000 + Math.random() * 90000000).toString(),
  userName: "Shadow Mogul",
  userBannerColor: "#18181b",
  avatar: AVATAR_OPTIONS[0],
  money: 20,
  diamonds: 50,
  totalEarnings: 0,
  multiplier: 1,
  legacyKeys: 0,
  prestigeCount: 0,
  lastUpdate: Date.now(),
  assets: INITIAL_ASSETS,
  hardenedAssetIds: [],
  saveHash: generateSaveHash(20, 0, 50),
  lifestyle: LIFESTYLE_ITEMS,
  isGreedActive: false,
  greedEndTime: 0,
  isAuditActive: false,
  adsRemoved: false,
  securityLevel: 1,
  firewallStrength: 20,
  lastBreachAttempt: 0,
  breachProbability: 0.04,
  sabotagePower: 1,
  stocks: INITIAL_STOCKS,
  stockPortfolio: {},
  watchlist: ['BTC', 'NOVI', 'PEAR'],
  tradeOrders: [],
  stockAlerts: [],
  assetSortBy: 'cost',
  inventory: {},
  purchasedPermanentIds: [],
  purchasedCosmetics: [],
  equippedCosmetics: {},
  financials: { 
      totalRevenue: 0, 
      totalExpenses: 0, 
      totalTaxes: 0, 
      totalHackLosses: 0, 
      stockProfits: 0, 
      bestTrade: 0 
  },
  simulatedUsers: SIMULATED_USERS,
  rankId: 0,
  activeNews: null,
  hasSovereignStatus: false,
  isVIP: false,
  marketInsiderEndTime: 0,
  adBoostActive: false,
  adBoostEndTime: 0,
  taxesPaid: 0,
  lastHackTime: 0,
  royalDabbaCount: 0,
  worldTalkTokens: 0,
  giftBoxes: 0,
  ownedTitles: ['Novice'],
  ownedAvatars: AVATAR_OPTIONS,
  rewardHistory: [],
  realityUnlocked: false,
  loginStreak: 1,
  lastLoginDate: '',
  dailyRewardClaimed: false,
  insiderLeak: null,
  revengeTarget: null,
  starterKitPurchased: false,
  starterKitExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
  swissShieldEndTime: 0,
  marginLoan: null,
  marginCallWarningUntil: null,
  controlledCompanies: [],
  corporatePowersCooldowns: {}
});

const DAILY_REWARDS = [
  { day: 1, title: 'Seed Capital', icon: '💵', desc: '$50,000 Cash', cash: 50000, diamonds: 0, gifts: 0, firewall: 0 },
  { day: 2, title: 'Cyber Gems', icon: '💎', desc: '100 Diamonds', cash: 0, diamonds: 100, gifts: 0, firewall: 0 },
  { day: 3, title: 'Angel Round', icon: '🧧', desc: '$500,000 + 2 Red Packets', cash: 500000, diamonds: 0, gifts: 2, firewall: 0 },
  { day: 4, title: 'Treasury Vault', icon: '💎', desc: '250 Diamonds', cash: 0, diamonds: 250, gifts: 0, firewall: 0 },
  { day: 5, title: 'Venture Capital', icon: '🛡️', desc: '$5,000,000 + Firewall Boost', cash: 5000000, diamonds: 0, gifts: 0, firewall: 25 },
  { day: 6, title: 'Diamond Reserve', icon: '💎', desc: '500 Diamonds', cash: 0, diamonds: 500, gifts: 0, firewall: 0 },
  { day: 7, title: 'The Daily Whale', icon: '👑', desc: '$25M + 1,000 Gems + "Daily Whale" Title', cash: 25000000, diamonds: 1000, gifts: 5, firewall: 50, rewardTitleTag: 'Daily Whale' },
];

export const App: React.FC = () => {
  const adContextRef = useRef<'boost' | 'whale'>('boost');
  const [appView, setAppView] = useState<'intro' | 'auth' | 'game'>('intro');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'market' | 'chat' | 'imperial' | 'status'>('portfolio');
  const [statusSubTab, setStatusSubTab] = useState<'stats' | 'ranks' | 'security' | 'cyber'>('stats');
  const [marketView, setMarketView] = useState<'list' | 'detail' | 'portfolio' | 'watchlist' | 'orders' | 'margin'>('list');
  const [previousMarketTab, setPreviousMarketTab] = useState<'list' | 'portfolio' | 'watchlist' | 'orders' | 'margin'>('list');
  const [marketCategory, setMarketCategory] = useState<'all' | 'stock' | 'crypto' | 'gainers' | 'losers'>('all');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'1H' | '1D' | '1W' | '1M' | 'ALL'>('1D');
  const [chartMode, setChartMode] = useState<'area' | 'candle'>('area');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitTargetPrice, setLimitTargetPrice] = useState<string>('');
  const [tradeAmountMode, setTradeAmountMode] = useState<'1' | '10' | '100' | 'MAX' | '25%' | '50%'>('1');
  const [customShareCount, setCustomShareCount] = useState<string>('1');
  const [ordersSubTab, setOrdersSubTab] = useState<'pending' | 'fills'>('pending');
  const [marginBorrowInput, setMarginBorrowInput] = useState<string>('');
  const [marginRepayInput, setMarginRepayInput] = useState<string>('');
  const [showPuppetModal, setShowPuppetModal] = useState<boolean>(false);
  const [selectedSynergyStockId, setSelectedSynergyStockId] = useState<string | null>(null);
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<LeaderboardTimeframe>('local');
  const [displayMoney, setDisplayMoney] = useState(0);

  const [selectedItemInfo, setSelectedItemInfo] = useState<{name: string, description: string, rarity: string, obtain: string, icon?: string} | null>(null);
  const [showRankCelebration, setShowRankCelebration] = useState<Rank | null>(null);
  const [tapParticles, setTapParticles] = useState<{id: number, x: number, y: number, text: string}[]>([]);
  const [isMuted, setIsMuted] = useState(audio.isMuted());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isGlitching, setIsGlitching] = useState(false);
  const [newsFade, setNewsFade] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [showDailyModal, setShowDailyModal] = useState(false);
  const dailyStreakCheckedRef = useRef(false);

  // New High-Monetization Modals
  const [offlineYieldPending, setOfflineYieldPending] = useState<number>(0);
  const [showStarterKitModal, setShowStarterKitModal] = useState<boolean>(false);
  const [showRevengeModal, setShowRevengeModal] = useState<boolean>(false);
  const [revengeStep, setRevengeStep] = useState<number>(0);
  const [revengeNodes, setRevengeNodes] = useState<string[]>(['0xA4', '0x7F', '0x3D']);
  
  const [showToast, setShowToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeAlertPopup, setActiveAlertPopup] = useState<Notification | null>(null);
  const alertPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [showAccountingModal, setShowAccountingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [showGuestGate, setShowGuestGate] = useState(false);
  
  const [showCosmeticPicker, setShowCosmeticPicker] = useState<'title' | 'avatar' | null>(null);
  const [editingName, setEditingName] = useState(''); 
  const [editingBanner, setEditingBanner] = useState('');
  
  const [selectedHacker, setSelectedHacker] = useState<HackerProfile | null>(null);
  const [hackTargetInput, setHackTargetInput] = useState('');

  const [throttledLeaderboardEntries, setThrottledLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number>(9999);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  
  const [showAdModal, setShowAdModal] = useState(false);
  const [whaleSignalData, setWhaleSignalData] = useState<{ amount: number } | null>(null);
  const [isWhaleModalOpen, setIsWhaleModalOpen] = useState(false);
  const [adTimer, setAdTimer] = useState(0);

  // Black Market / Reality Store State
  const [showRealityShop, setShowRealityShop] = useState(false);
  const [showDiamondStore, setShowDiamondStore] = useState(false);
  const [diamondStoreTab, setDiamondStoreTab] = useState<'topup' | 'store'>('topup');

  // Gacha State
  const [isOpeningDabba, setIsOpeningDabba] = useState(false);
  const [dabbaReward, setDabbaReward] = useState<{name: string, tier: ItemTier, val: string} | null>(null);

  // Chat Gift State
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmountConfig, setGiftAmountConfig] = useState<number>(1000000);
  const [giftClaimsConfig, setGiftClaimsConfig] = useState<number>(1);

  // Anti-Addiction State
  const [sessionStartTime] = useState(Date.now());
  const [isBanned, setIsBanned] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('lazy_chat_v13');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Chat history corrupted, resetting.");
      return [];
    }
  });

  const initialOfflineIncomeRef = useRef(0);

  const [state, setState] = useState<GameState>(() => {
    const savedEncrypted = localStorage.getItem(SAVE_KEY);
    if (savedEncrypted) {
       try {
         const decryptedJSON = decryptData(savedEncrypted);
         const parsed = JSON.parse(decryptedJSON);
         
         const isSensibleNumber = (v: any) => typeof v === 'number' && isFinite(v) && !isNaN(v) && v >= 0;
         if (parsed && isSensibleNumber(parsed.money) && isSensibleNumber(parsed.diamonds)) {
            const mergedAssets = INITIAL_ASSETS.map(initial => {
                const existing = parsed.assets?.find((p: Asset) => p.id === initial.id);
                return existing ? { ...initial, count: existing.count, level: existing.level } : initial;
            });

            // Calculate offline earnings (passive progression while away)
            const now = Date.now();
            const lastUpdate = typeof parsed.lastUpdate === 'number' ? parsed.lastUpdate : now;
            const elapsedSec = Math.max(0, Math.floor((now - lastUpdate) / 1000));
            let offlineIncome = 0;
            if (elapsedSec >= 5) {
              const ips = mergedAssets.reduce((acc, curr) => {
                const level = getLevel(curr.count);
                return acc + (curr.count * curr.baseIncome * getLevelIncomeMultiplier(level));
              }, 0);
              const rankBonus = (parsed.rankId || 0) >= 1 ? 1.1 + ((parsed.rankId || 0) * 0.1) : 1;
              const prestigeMult = 1 + ((parsed.legacyKeys || 0) * 0.1);
              const totalMult = (parsed.multiplier || 1) * rankBonus * prestigeMult;
              const baseIps = ips * totalMult;
              if (baseIps > 0) {
                const cappedSeconds = Math.min(elapsedSec, 12 * 3600); // Capped at 12 hours
                offlineIncome = Math.floor(baseIps * cappedSeconds * 0.7); // 70% offline yield
                initialOfflineIncomeRef.current = offlineIncome;
              }
            }

            const immediateOfflineAdd = offlineIncome > 50 ? 0 : offlineIncome;
            const finalMoney = (parsed.money || 0) + immediateOfflineAdd;
            const finalTotalEarnings = (parsed.totalEarnings || 0) + immediateOfflineAdd;
            const finalDiamonds = parsed.diamonds ?? 50;

            return {
              ...parsed,
              money: finalMoney,
              totalEarnings: finalTotalEarnings,
              diamonds: finalDiamonds,
              saveHash: generateSaveHash(finalMoney, finalTotalEarnings, finalDiamonds),
              lastUpdate: now,
              assets: mergedAssets,
              simulatedUsers: (parsed.simulatedUsers && Array.isArray(parsed.simulatedUsers) && parsed.simulatedUsers.length > 5) 
                 ? parsed.simulatedUsers 
                 : SIMULATED_USERS,
              stockPortfolio: parsed.stockPortfolio || {},
              financials: {
                 totalRevenue: (parsed.financials?.totalRevenue ?? parsed.financials?.allTimeEarnings ?? 0) + immediateOfflineAdd,
                 totalExpenses: parsed.financials?.totalExpenses ?? 0,
                 totalTaxes: parsed.financials?.totalTaxes ?? parsed.financials?.totalTaxesPaid ?? 0,
                 totalHackLosses: parsed.financials?.totalHackLosses ?? 0,
                 stockProfits: parsed.financials?.stockProfits ?? 0,
                 bestTrade: parsed.financials?.bestTrade ?? 0
              },
              adBoostActive: parsed.adBoostActive || false,
              adBoostEndTime: parsed.adBoostEndTime || 0,
              taxesPaid: parsed.taxesPaid || 0,
              purchasedCosmetics: parsed.purchasedCosmetics || [],
              equippedCosmetics: parsed.equippedCosmetics || {},
              lastHackTime: parsed.lastHackTime || 0,
              royalDabbaCount: parsed.royalDabbaCount || 0,
              worldTalkTokens: parsed.worldTalkTokens || 0,
              giftBoxes: parsed.giftBoxes || 0,
              ownedTitles: parsed.ownedTitles || ['Novice'],
              ownedAvatars: parsed.ownedAvatars || AVATAR_OPTIONS,
              rewardHistory: parsed.rewardHistory || [],
              stockAlerts: parsed.stockAlerts || [],
              userBannerColor: parsed.userBannerColor || "#18181b",
              realityUnlocked: parsed.realityUnlocked || false,
              loginStreak: parsed.loginStreak ?? 1,
              lastLoginDate: parsed.lastLoginDate ?? '',
              dailyRewardClaimed: parsed.dailyRewardClaimed ?? false,
              insiderLeak: parsed.insiderLeak || null,
              revengeTarget: parsed.revengeTarget || null,
              watchlist: parsed.watchlist || ['BTC', 'NOVI', 'PEAR'],
              tradeOrders: parsed.tradeOrders || [],
              starterKitPurchased: parsed.starterKitPurchased || false,
              starterKitExpiresAt: parsed.starterKitExpiresAt || (now + 24 * 60 * 60 * 1000),
              swissShieldEndTime: parsed.swissShieldEndTime || 0
            };
          }
        } catch (e) {
          console.error("Save file corrupted, starting fresh.", e);
        }
     }
     return getInitialState();
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const isGuestModeRef = useRef(isGuestMode);
  isGuestModeRef.current = isGuestMode;
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;

  const saveLocalData = (currentState: GameState) => {
    try {
      const validHash = generateSaveHash(currentState.money, currentState.totalEarnings, currentState.diamonds);
      const stateToPersist = {
        ...currentState,
        saveHash: validHash,
        lastUpdate: Date.now()
      };
      const jsonString = JSON.stringify(stateToPersist);
      const encrypted = encryptData(jsonString);
      localStorage.setItem(SAVE_KEY, encrypted);
      if (chatMessagesRef.current) {
        localStorage.setItem('lazy_chat_v13', JSON.stringify(chatMessagesRef.current.slice(-50)));
      }
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  };

  const lastStockUpdateRef = useRef(Date.now());
  const lastChatUpdateRef = useRef(Date.now());
  const lastNewsUpdateRef = useRef(Date.now());
  const lastTickTimeRef = useRef(Date.now());
  const lastLeaderboardFetchRef = useRef(0);
  const lastLeaderboardRenderRef = useRef(0);
  const cachedRemoteLeaderboardRef = useRef<any[]>([]); // Cache cloud data
  const lastTaxCheckRef = useRef(Date.now());
  const lastBreachRef = useRef(Date.now());

  // Initialize Store Service
  useEffect(() => {
    storeService.initialize((amount, bundleId) => {
        // This callback runs when a REAL purchase is verified
        triggerHaptic('success');
        audio.playSfx('buy');
        setState(prev => {
            const newState = {...prev, diamonds: prev.diamonds + amount};
            // Immediate save to prevent loss
            if (!isGuestModeRef.current && firebaseService.isConfigured) {
                 firebaseService.saveGame(prev.userId, newState);
            }
            saveLocalData(newState);
            return newState;
        });
        triggerToast(`STORE VERIFIED: +${amount} 💎`, 'success');
    });

    // Initialize Google AdMob / Ad Service
    adService.initialize(false);
  }, []);

  useEffect(() => {
    if (isGuestMode || appView !== 'game') return;
    const saveToCloud = async () => {
        if (!firebaseService.isConfigured) return;
        await firebaseService.saveGame(stateRef.current.userId, stateRef.current);
    };
    const interval = setInterval(saveToCloud, 60000);
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') saveToCloud(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGuestMode, appView]);

  useEffect(() => {
    if (appView !== 'game' || dailyStreakCheckedRef.current) return;
    dailyStreakCheckedRef.current = true;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastDateStr = state.lastLoginDate;

    if (!lastDateStr) {
      setState(prev => ({ ...prev, lastLoginDate: todayStr, loginStreak: 1, dailyRewardClaimed: false }));
      setShowDailyModal(true);
    } else if (lastDateStr !== todayStr) {
      const lastTime = new Date(lastDateStr).getTime();
      const nowTime = new Date(todayStr).getTime();
      const diffDays = Math.round((nowTime - lastTime) / (1000 * 3600 * 24));

      let nextStreak = 1;
      if (diffDays === 1) {
        const currentStreak = state.loginStreak || 1;
        nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1;
      }
      setState(prev => ({
        ...prev,
        lastLoginDate: todayStr,
        loginStreak: nextStreak,
        dailyRewardClaimed: false
      }));
      setShowDailyModal(true);
    } else if (!state.dailyRewardClaimed) {
      setShowDailyModal(true);
    }
  }, [appView, state.lastLoginDate, state.dailyRewardClaimed, state.loginStreak]);

  const handleClaimDailyReward = () => {
    const currentStreak = state.loginStreak || 1;
    const reward = DAILY_REWARDS[Math.max(0, Math.min(currentStreak - 1, DAILY_REWARDS.length - 1))];
    
    setState(prev => {
      const updatedTitles = reward.rewardTitleTag && !prev.ownedTitles.includes(reward.rewardTitleTag) 
        ? [...prev.ownedTitles, reward.rewardTitleTag] 
        : prev.ownedTitles;
      const newMoney = prev.money + reward.cash;
      const newTotalEarnings = prev.totalEarnings + reward.cash;
      const newDiamonds = prev.diamonds + reward.diamonds;
      
      const nextState: GameState = {
        ...prev,
        money: newMoney,
        totalEarnings: newTotalEarnings,
        diamonds: newDiamonds,
        saveHash: generateSaveHash(newMoney, newTotalEarnings, newDiamonds),
        giftBoxes: prev.giftBoxes + (reward.gifts || 0),
        firewallStrength: Math.min(100, prev.firewallStrength + (reward.firewall || 0)),
        ownedTitles: updatedTitles,
        dailyRewardClaimed: true
      };
      saveLocalData(nextState);
      return nextState;
    });

    triggerHaptic('heavy');
    audio.playSfx('golden');
    triggerToast(`DAY ${currentStreak} CLAIMED: ${reward.desc}!`, 'success');
    setShowDailyModal(false);
  };

  const handleIntroComplete = () => {
      setAppView('auth');
  };

  const handleLogin = async (name: string, isGuest: boolean, uid?: string) => {
      // FIX: If Guest Mode is selected, we enforce a fresh start to prevent "ghost assets" from previous sessions.
      if (isGuest) {
          setState({ ...getInitialState(), userName: "Guest Mogul" });
          setIsGuestMode(true);
          setAppView('game');
          return;
      }

      let loadedState: Partial<GameState> | null = null;
      if (uid) loadedState = await firebaseService.loadGame(uid);

      setState(prev => {
          let newState = { ...prev, userName: name };
          if (uid) newState.userId = uid; 
          if (loadedState) {
              newState = { ...newState, ...loadedState };
              if (loadedState.userName) newState.userName = loadedState.userName;
              else newState.userName = name;

              if (loadedState.financials) {
                 const f = loadedState.financials as any;
                 newState.financials = {
                    totalRevenue: f.totalRevenue ?? f.allTimeEarnings ?? 0,
                    totalExpenses: f.totalExpenses ?? 0,
                    totalTaxes: f.totalTaxes ?? f.totalTaxesPaid ?? 0,
                    totalHackLosses: f.totalHackLosses ?? 0,
                    stockProfits: f.stockProfits ?? 0,
                    bestTrade: f.bestTrade ?? 0
                 };
              }
              if (!newState.simulatedUsers || !Array.isArray(newState.simulatedUsers)) {
                  newState.simulatedUsers = SIMULATED_USERS;
              }
              if (!newState.assets) newState.assets = INITIAL_ASSETS;
          }
          return newState;
      });
      setIsGuestMode(isGuest);
      setAppView('game');
      if (loadedState && loadedState.rankId) audio.playBgm(loadedState.rankId);
      else audio.playBgm(0);
  };

  const handleLogout = async () => {
      await firebaseService.logout();
      localStorage.removeItem(SAVE_KEY);
      setAppView('auth');
      setIsGuestMode(false);
      setState(getInitialState());
      triggerToast("SYSTEM DISCONNECTED", 'success');
  };

  const currentRank = RANKS.find(r => r.id === state.rankId) || RANKS[0];

  const triggerToast = (message: string, type: 'error' | 'success') => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setShowToast({ message, type });
      toastTimeoutRef.current = setTimeout(() => setShowToast(null), 3000); 
  };

  useEffect(() => {
    if (appView === 'game' && initialOfflineIncomeRef.current > 0) {
      const earned = initialOfflineIncomeRef.current;
      initialOfflineIncomeRef.current = 0;
      if (earned > 50) {
        setOfflineYieldPending(earned);
      } else {
        setState(prev => ({
          ...prev,
          money: prev.money + earned,
          totalEarnings: prev.totalEarnings + earned,
          saveHash: generateSaveHash(prev.money + earned, prev.totalEarnings + earned, prev.diamonds)
        }));
        triggerToast(`WELCOME BACK: Generated +$${formatMoney(earned)} offline!`, 'success');
      }
    }
  }, [appView]);

  const handleClaimOfflineYield = (multiplier: number = 1) => {
    if (offlineYieldPending <= 0) return;
    const finalAmount = offlineYieldPending * multiplier;
    setState(prev => {
      const newMoney = prev.money + finalAmount;
      const newTotalEarnings = prev.totalEarnings + finalAmount;
      const nextState: GameState = {
        ...prev,
        money: newMoney,
        totalEarnings: newTotalEarnings,
        saveHash: generateSaveHash(newMoney, newTotalEarnings, prev.diamonds),
        financials: {
          ...prev.financials,
          totalRevenue: prev.financials.totalRevenue + finalAmount
        }
      };
      saveLocalData(nextState);
      return nextState;
    });

    if (multiplier > 1) {
      triggerHaptic('heavy');
      audio.playSfx('golden');
      triggerToast(`2X DIVIDEND SECURED: +$${formatMoney(finalAmount)}!`, 'success');
    } else {
      triggerHaptic('medium');
      audio.playSfx('buy');
      triggerToast(`COLLECTED: +$${formatMoney(finalAmount)}!`, 'success');
    }
    setOfflineYieldPending(0);
  };

  const handleUnlockInsiderLeak = (costType: 'ad' | 'diamonds') => {
    if (costType === 'diamonds') {
      if (state.diamonds < 20) {
        triggerToast("NEED 20 DIAMONDS", 'error');
        triggerHaptic('heavy');
        return;
      }
      setState(prev => ({ ...prev, diamonds: prev.diamonds - 20 }));
    }

    const targetStock = state.stocks[Math.floor(Math.random() * state.stocks.length)] || state.stocks[0];
    const isPump = Math.random() < 0.65;
    const mult = isPump ? Number((2.2 + Math.random() * 1.5).toFixed(2)) : Number((0.35 + Math.random() * 0.2).toFixed(2));
    
    const pumpHeadlines = [
      `CONFIDENTIAL: ${targetStock.name} securing sovereign defense contract. +${Math.round((mult - 1) * 100)}% pump in 30s!`,
      `LEAK: Institutional consortium accumulating 40% float of ${targetStock.id}. Breakout in 30s!`,
      `WHISTLEBLOWER: AI breakthrough patents granted to ${targetStock.id}. Parabolic surge guaranteed!`,
    ];
    const dumpHeadlines = [
      `LEAK: SEC auditing ${targetStock.name} for accounting discrepancies. -${Math.round((1 - mult) * 100)}% crash in 30s!`,
      `INSIDER: Major hedge fund liquidating entire position in ${targetStock.id}. Short now!`,
      `CRISIS MEMO: Supply-chain collapse halts all operations at ${targetStock.id}. Dump imminent!`,
    ];

    const headline = isPump 
      ? pumpHeadlines[Math.floor(Math.random() * pumpHeadlines.length)]
      : dumpHeadlines[Math.floor(Math.random() * dumpHeadlines.length)];

    setState(prev => ({
      ...prev,
      insiderLeak: {
        stockId: targetStock.id,
        type: isPump ? 'pump' : 'dump',
        multiplier: mult,
        targetTime: Date.now() + 30000,
        revealed: true,
        headline
      }
    }));

    triggerHaptic('heavy');
    audio.playNewsAlert(isPump);
    triggerToast("CLASSIFIED MEMO DECRYPTED! ACT FAST!", 'success');
  };

  const handleStartRevengeHeist = () => {
    if (!state.revengeTarget) return;
    setRevengeStep(0);
    const hexTokens = ['0xA4', '0x7F', '0x3D', '0xE8', '0xB1', '0x9C'];
    const chosen = [...hexTokens].sort(() => 0.5 - Math.random()).slice(0, 3);
    setRevengeNodes(chosen);
    setShowRevengeModal(true);
  };

  const handleTapRevengeNode = (_node: string, index: number) => {
    if (index !== revengeStep) {
      triggerHaptic('heavy');
      triggerToast("WRONG CIPHER! TRACE DETECTED", 'error');
      return;
    }

    triggerHaptic('light');
    audio.playSfx('tap');

    if (revengeStep + 1 >= revengeNodes.length) {
      const bounty = (state.revengeTarget?.stolenAmount || 10000) * 3;
      const diamondBounty = 25;
      
      setState(prev => {
        const newMoney = prev.money + bounty;
        const newTotalEarnings = prev.totalEarnings + bounty;
        const newDiamonds = prev.diamonds + diamondBounty;
        const nextState: GameState = {
          ...prev,
          money: newMoney,
          totalEarnings: newTotalEarnings,
          diamonds: newDiamonds,
          saveHash: generateSaveHash(newMoney, newTotalEarnings, newDiamonds),
          revengeTarget: null
        };
        saveLocalData(nextState);
        return nextState;
      });

      triggerHaptic('heavy');
      audio.playSfx('golden');
      triggerToast(`VAULT CRACKED! STOLE BACK $${formatMoney(bounty)} + ${diamondBounty}💎!`, 'success');
      setShowRevengeModal(false);
    } else {
      setRevengeStep(prev => prev + 1);
    }
  };

  const handleBuyStarterKit = (currency: 'money' | 'diamonds') => {
    if (currency === 'diamonds' && state.diamonds < 100) {
      triggerToast("NEED 100 DIAMONDS", 'error');
      triggerHaptic('heavy');
      return;
    }

    setState(prev => {
      const updatedDiamonds = currency === 'diamonds' ? (prev.diamonds - 100 + 500) : (prev.diamonds + 500);
      const updatedTitles = !prev.ownedTitles.includes('The Oligarch') 
        ? [...prev.ownedTitles, 'The Oligarch'] 
        : prev.ownedTitles;

      const nextState: GameState = {
        ...prev,
        diamonds: updatedDiamonds,
        multiplier: prev.multiplier * 2,
        swissShieldEndTime: Date.now() + 7 * 24 * 3600 * 1000,
        ownedTitles: updatedTitles,
        equippedCosmetics: {
          ...prev.equippedCosmetics,
          titleTag: 'The Oligarch'
        },
        starterKitPurchased: true,
        saveHash: generateSaveHash(prev.money, prev.totalEarnings, updatedDiamonds)
      };
      saveLocalData(nextState);
      return nextState;
    });

    triggerHaptic('heavy');
    audio.playSfx('golden');
    triggerToast("WHALE STARTER KIT ACTIVATED! 2X YIELD & SWISS SHIELD UNLOCKED!", 'success');
    setShowStarterKitModal(false);
  };
  
  const addNotification = (title: string, message: string, type: 'alert' | 'reward' | 'system') => {
      const notif: Notification = {
          id: Math.random().toString(36),
          title,
          message,
          timestamp: Date.now(),
          type,
          read: false
      };

      setState(prev => ({
          ...prev,
          stockAlerts: [notif, ...prev.stockAlerts].slice(0, 50)
      }));

      // If user unlocked the Bloomberg Satellite Feed, pop up live breaking notification
      if (stateRef.current.purchasedPermanentIds?.includes('satellite_feed')) {
          if (alertPopupTimerRef.current) clearTimeout(alertPopupTimerRef.current);
          setActiveAlertPopup(notif);
          triggerHaptic('medium');
          audio.playNewsAlert(type === 'reward');
          alertPopupTimerRef.current = setTimeout(() => {
              setActiveAlertPopup(null);
          }, 6000);
      }
  };

  const potentialKeys = useMemo(() => {
    if (state.totalEarnings < 5000000) return 0;
    const rawKeys = Math.floor(Math.pow(state.totalEarnings / 5000000, 0.25));
    return Math.max(state.legacyKeys, rawKeys);
  }, [state.totalEarnings, state.legacyKeys]);

  const keysToGain = potentialKeys - state.legacyKeys;

  const currentIps = useMemo(() => {
    const currentNews = state.activeNews;
    const isNewsActive = currentNews && currentTime < currentNews.expiresAt;
    const isAdBoostActive = state.adBoostActive && currentTime < state.adBoostEndTime;
    const assetList = state.assets || INITIAL_ASSETS;

    const ips = assetList.reduce((acc, curr) => {
      const level = getLevel(curr.count);
      let sectorMult = 1;
      if (isNewsActive && (currentNews.targetSector === 'all' || currentNews.targetSector === curr.sector)) sectorMult = currentNews.multiplier;
      return acc + (curr.count * curr.baseIncome * getLevelIncomeMultiplier(level) * sectorMult);
    }, 0);
    
    const rankBonus = state.rankId >= 1 ? 1.1 + (state.rankId * 0.1) : 1;
    const greedMult = (state.isGreedActive && currentTime < state.greedEndTime) ? 2 : 1;
    const adMult = isAdBoostActive ? 2 : 1;
    const prestigeMult = 1 + (state.legacyKeys * 0.1); 

    return ips * state.multiplier * rankBonus * greedMult * adMult * prestigeMult;
  }, [state, currentTime]);

  const scrollToBottom = (force = false) => {
    if (force || !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = Math.abs(e.currentTarget.scrollHeight - e.currentTarget.scrollTop - e.currentTarget.clientHeight) < 50;
    if (bottom) setUserScrolledUp(false);
    else setUserScrolledUp(true);
  };

  useEffect(() => { 
      if (activeTab === 'chat') {
          setTimeout(() => scrollToBottom(true), 100); 
      }
  }, [activeTab]);

  useEffect(() => {
      if (activeTab === 'chat') {
          scrollToBottom();
      }
  }, [chatMessages.length, activeTab]);

  const sendChatMessage = async (text: string, isFlex: boolean = false, isGift: boolean = false, giftAmount: number = 0) => {
     if (isSending) return;
     
     let redPacketData = undefined;
     if (isGift && giftAmount > 0) {
         redPacketData = {
             id: Math.random().toString(36).substr(2, 9),
             totalAmount: giftAmount,
             maxClaims: giftClaimsConfig,
             claimsRemaining: giftClaimsConfig,
             claimedBy: []
         };
     }

     const userMsg: ChatMessage = {
       id: Math.random().toString(36).substr(2, 9),
       userId: state.userId,
       userName: state.userName,
       avatar: state.avatar,
       text: text,
       timestamp: Date.now(),
       isSovereign: state.hasSovereignStatus,
       rankName: currentRank.name,
       rankColor: currentRank.color,
       cosmeticNameColor: state.equippedCosmetics.nameColor,
       titleTag: state.equippedCosmetics.titleTag, 
       isFlex,
       isGiftDrop: isGift,
       giftAmount: giftAmount,
       redPacket: redPacketData
     };
     
     setChatMessages(prev => [...prev, userMsg].slice(-500));
     networking.broadcastMessage(userMsg);
     setIsSending(true);
     triggerHaptic(isFlex || isGift ? 'heavy' : 'medium');
     audio.playSfx(isFlex || isGift ? 'golden' : 'nav');
     setUserScrolledUp(false); // Force scroll to bottom on send

     try {
       const bots = state.simulatedUsers || SIMULATED_USERS;
       const replies = await generateChatReplies(text, state, bots);
       if (replies.length > 0) {
         setTimeout(() => {
            setChatMessages(prev => [...prev, ...replies].slice(-500));
         }, 1000 + Math.random() * 2000); 
       }
     } catch (err) {
       console.error("Chat reply failed", err);
     } finally {
       setIsSending(false);
     }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuestMode) {
        setShowGuestGate(true);
        return;
    }
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatInput('');
    await sendChatMessage(text);
  };

  const handleFlex = async () => {
     if (isGuestMode) {
        setShowGuestGate(true);
        return;
     }
     if (isSending) return;
     const amount = formatMoney(state.money);
     await sendChatMessage(amount, true);
  };

  const handleDropGift = async () => {
      if (isGuestMode) {
          setShowGuestGate(true);
          return;
      }
      // Validate Logic
      if (giftAmountConfig > state.money) {
          triggerToast("INSUFFICIENT FUNDS", 'error');
          return;
      }
      if (giftAmountConfig <= 0 || giftClaimsConfig <= 0) {
          triggerToast("INVALID CONFIGURATION", 'error');
          return;
      }
      if (state.giftBoxes <= 0) {
          triggerToast("NO GIFT BOXES AVAILABLE", 'error');
          return;
      }
      if (isSending) return;
      
      setState(prev => ({ 
          ...prev, 
          money: prev.money - giftAmountConfig,
          giftBoxes: prev.giftBoxes - 1 
      }));
      
      await sendChatMessage(`DROPPED $${formatMoney(giftAmountConfig)} FOR ${giftClaimsConfig} PEOPLE!`, false, true, giftAmountConfig);
      triggerToast("RED PACKET DEPLOYED", 'success');
      setShowGiftModal(false);
  };

  const handleClaimGift = (msgId: string, packet: any) => {
      // Find message
      const msgIndex = chatMessages.findIndex(m => m.id === msgId);
      if (msgIndex === -1) return;
      
      const msg = chatMessages[msgIndex];
      if (!msg.redPacket || msg.redPacket.claimsRemaining <= 0) {
          triggerToast("ALREADY CLAIMED OR EMPTY", 'error');
          return;
      }
      if (msg.redPacket.claimedBy.includes(state.userId)) {
          triggerToast("YOU ALREADY CLAIMED THIS", 'error');
          return;
      }

      // Claim Logic
      const share = msg.redPacket.totalAmount / msg.redPacket.maxClaims;
      
      // Update Message Local State
      const newPacket = {
          ...msg.redPacket,
          claimsRemaining: msg.redPacket.claimsRemaining - 1,
          claimedBy: [...msg.redPacket.claimedBy, state.userId]
      };
      
      const newMsgs = [...chatMessages];
      newMsgs[msgIndex] = { ...msg, redPacket: newPacket };
      setChatMessages(newMsgs);

      // Give Money
      setState(prev => ({ ...prev, money: prev.money + share }));
      triggerHaptic('success');
      audio.playSfx('buy');
      triggerToast(`CLAIMED $${formatMoney(share)}`, 'success');
  };

  const handleTabChange = (tab: 'portfolio' | 'market' | 'chat' | 'imperial' | 'status') => {
      if (tab === 'chat') {
          const isUnlocked = state.rankId >= 1 || state.prestigeCount > 0;
          if (!isUnlocked) {
              triggerToast("NETWORK LOCKED. REACH ENTREPRENEUR RANK.", 'error');
              triggerHaptic('heavy');
              return;
          }
      }
      setActiveTab(tab);
      triggerHaptic('light');
      audio.playSfx('nav');
  };

  const openRoyalDabba = () => {
      const baseCost = 50;
      const cost = baseCost * Math.pow(2, state.royalDabbaCount);
      
      if (state.money < cost) {
          triggerToast("INSUFFICIENT FUNDS", 'error');
          return;
      }

      setState(prev => ({ ...prev, money: prev.money - cost, royalDabbaCount: prev.royalDabbaCount + 1 }));
      setIsOpeningDabba(true);
      audio.playSfx('audit'); // Tension sound

      // Cinematic Delay
      setTimeout(() => {
          handleGachaRoll(cost);
      }, 2500);
  };

  const handleGachaRoll = (cost: number) => {
      const roll = Math.random();
      let rewardName = "";
      let rewardTier: ItemTier = 'common';
      let rewardVal = "";

      // Gacha Odds
      // 0.1% Exotic (Ultra Rare Avatar), 1% Legendary (Rare Avatar), 5% Epic, 15% Rare, 30% Uncommon, Rest Common (Cash)

      if (roll < 0.001) {
          // EXOTIC - ULTRA RARE AVATAR
          rewardTier = 'exotic';
          const newAvatar = ULTRA_RARE_AVATARS[Math.floor(Math.random() * ULTRA_RARE_AVATARS.length)];
          if (!state.ownedAvatars.includes(newAvatar)) {
              setState(prev => ({ ...prev, ownedAvatars: [...prev.ownedAvatars, newAvatar] }));
              rewardName = `ULTRA RARE AVATAR`;
              rewardVal = "Cosmic Identity";
          } else {
               const refund = cost * 500;
               setState(prev => ({ ...prev, money: prev.money + refund }));
               rewardName = "DUPLICATE RELIC";
               rewardVal = `$${formatMoney(refund)}`;
          }
      } else if (roll < 0.011) {
          // LEGENDARY - RARE AVATAR
          rewardTier = 'legendary';
          const newAvatar = RARE_AVATARS[Math.floor(Math.random() * RARE_AVATARS.length)];
          if (!state.ownedAvatars.includes(newAvatar)) {
              setState(prev => ({ ...prev, ownedAvatars: [...prev.ownedAvatars, newAvatar] }));
              rewardName = `RARE AVATAR`;
              rewardVal = "Elite Identity";
          } else {
              const refund = cost * 20;
              setState(prev => ({ ...prev, money: prev.money + refund }));
              rewardName = "DUPLICATE AVATAR";
              rewardVal = `$${formatMoney(refund)}`;
          }
      } else if (roll < 0.061) {
          // EPIC
          rewardTier = 'epic';
          setState(prev => ({ ...prev, giftBoxes: prev.giftBoxes + 3 }));
          rewardName = "3x GIFT BOXES";
          rewardVal = "Social Power";
      } else if (roll < 0.211) {
          // RARE
          rewardTier = 'rare';
          setState(prev => ({ ...prev, giftBoxes: prev.giftBoxes + 1 }));
          rewardName = "1x GIFT BOX";
          rewardVal = "Social Power";
      } else if (roll < 0.511) {
          // UNCOMMON
          rewardTier = 'uncommon';
          const cash = cost * 2.5;
          setState(prev => ({ ...prev, money: prev.money + cash }));
          rewardName = "JACKPOT";
          rewardVal = `$${formatMoney(cash)}`;
      } else {
          // COMMON
          rewardTier = 'common';
          const cash = cost * 0.6; // Loss
          setState(prev => ({ ...prev, money: prev.money + cash }));
          rewardName = "SMALL REFUND";
          rewardVal = `$${formatMoney(cash)}`;
      }

      setDabbaReward({ name: rewardName, tier: rewardTier, val: rewardVal });
      
      // Log History
      setState(prev => ({
          ...prev,
          rewardHistory: [{
              id: Math.random().toString(36),
              timestamp: Date.now(),
              source: 'Royal Dabba',
              item: rewardName,
              tier: rewardTier,
              value: rewardVal
          }, ...prev.rewardHistory].slice(0, 50)
      }));
      
      addNotification("GACHA RESULT", `You obtained ${rewardName} from Royal Dabba`, 'reward');

      triggerHaptic('success');
      audio.playSfx(rewardTier === 'common' ? 'buy' : 'rankUp');
  };

  const closeGacha = () => {
      setIsOpeningDabba(false);
      setDabbaReward(null);
  };

  const buyImperialItem = (item: ShopItem) => {
      const currency = item.currency || 'diamonds';
      const userBalance = currency === 'money' ? state.money : state.diamonds;
      
      if (userBalance < item.price) {
          triggerToast(`INSUFFICIENT ${currency.toUpperCase()}`, 'error');
          return;
      }
      
      if (item.stock !== undefined && item.stock <= 0) {
          triggerToast("ITEM SOLD OUT", 'error');
          return;
      }

      const isOwned = state.purchasedCosmetics.includes(item.id) || state.purchasedPermanentIds.includes(item.id);
      if (item.type !== 'booster' && item.type !== 'action' && item.type !== 'risk' && isOwned) {
          if (item.type === 'title') {
              if (state.equippedCosmetics.titleTag === item.rewardMeta) {
                  setState(prev => ({ ...prev, equippedCosmetics: { ...prev.equippedCosmetics, titleTag: undefined }}));
              } else {
                  setState(prev => ({ ...prev, equippedCosmetics: { ...prev.equippedCosmetics, titleTag: item.rewardMeta }}));
              }
          }
          return;
      }

      triggerHaptic('success');
      audio.playSfx('buy');

      setState(prev => ({
          ...prev,
          money: currency === 'money' ? prev.money - item.price : prev.money,
          diamonds: currency === 'diamonds' ? prev.diamonds - item.price : prev.diamonds,
          purchasedCosmetics: (item.type === 'cosmetic' || item.type === 'title' || item.type === 'bgm' || item.type === 'avatar') ? [...prev.purchasedCosmetics, item.id] : prev.purchasedCosmetics,
          purchasedPermanentIds: (item.type === 'permanent' || item.type === 'security') ? [...prev.purchasedPermanentIds, item.id] : prev.purchasedPermanentIds
      }));

      if (item.type === 'risk') {
          const outcome = Math.random() > 0.5;
          if (outcome) {
              setState(prev => ({ ...prev, money: prev.money * 5 }));
              triggerToast("RISK SUCCESS: 5x BALANCE!", 'success');
              addNotification("RISK WIN", "Your investment in Chaos Protocol returned 500% gains.", 'reward');
          } else {
              setState(prev => ({ ...prev, money: prev.money / 2 }));
              triggerToast("RISK FAILURE: 50% LOSS", 'error');
              addNotification("RISK LOSS", "Chaos Protocol failed. 50% of assets liquidated.", 'alert');
          }
          return;
      }

      if (item.type === 'avatar' && item.rewardMeta) {
          setState(prev => ({ ...prev, ownedAvatars: [...prev.ownedAvatars, item.rewardMeta!] }));
      }
      
      if (item.type === 'title' && item.rewardMeta) {
          setState(prev => ({ ...prev, ownedTitles: [...prev.ownedTitles, item.rewardMeta!] }));
      }

      if (item.id === 'quantum_leap') {
           const reward = Number(currentIps) * 86400;
           setState(prev => ({ ...prev, money: prev.money + reward, totalEarnings: prev.totalEarnings + reward }));
      }
      
      triggerToast(`${item.name} ACQUIRED`, 'success');
      addNotification("PURCHASE CONFIRMED", `Successfully acquired ${item.name}`, 'system');
  };

  const toggleWatchlist = (stockId: string) => {
    setState(prev => {
      const list = prev.watchlist || [];
      const next = list.includes(stockId) ? list.filter(id => id !== stockId) : [...list, stockId];
      return { ...prev, watchlist: next };
    });
    triggerHaptic('light');
  };

  const handleCancelOrder = (orderId: string) => {
    setState(prev => ({
      ...prev,
      tradeOrders: (prev.tradeOrders || []).map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o)
    }));
    triggerToast("ORDER CANCELLED", 'error');
  };

  const handleStockTrade = (
    stock: Stock, 
    action: 'buy' | 'sell', 
    quantity: number, 
    mode: 'market' | 'limit' = 'market',
    limitPrice?: number
  ) => {
      if (!quantity || quantity <= 0 || isNaN(quantity)) {
          triggerToast("INVALID QUANTITY", 'error');
          return;
      }
      
      const spread = stock.price * 0.002;
      const executionPrice = action === 'buy'
          ? (mode === 'limit' && limitPrice ? limitPrice : +(stock.price + spread / 2).toFixed(2))
          : (mode === 'limit' && limitPrice ? limitPrice : +(stock.price - spread / 2).toFixed(2));
      
      const totalCost = executionPrice * quantity;

      if (mode === 'limit' && limitPrice) {
          if (action === 'buy' && state.money < totalCost) {
              triggerToast("INSUFFICIENT FUNDS FOR LIMIT ORDER", 'error');
              return;
          }
          if (action === 'sell') {
              const currentPos = state.stockPortfolio[stock.id];
              if (!currentPos || currentPos.shares < quantity) {
                  triggerToast("INSUFFICIENT SHARES FOR LIMIT ORDER", 'error');
                  return;
              }
          }
          const order: TradeOrder = {
              id: 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              stockId: stock.id,
              stockName: stock.name,
              type: action,
              orderType: 'limit',
              shares: quantity,
              price: executionPrice,
              targetPrice: limitPrice,
              total: totalCost,
              timestamp: Date.now(),
              status: 'pending'
          };
          setState(prev => ({
              ...prev,
              tradeOrders: [order, ...(prev.tradeOrders || [])].slice(0, 100)
          }));
          triggerToast(`LIMIT ORDER: ${action.toUpperCase()} ${quantity} ${stock.id} @ $${limitPrice.toFixed(2)}`, 'success');
          audio.playSfx('buy');
          return;
      }

      // Market Order Execution
      if (action === 'buy') {
          if (state.money < totalCost) {
              triggerToast("INSUFFICIENT CAPITAL", 'error');
              return;
          }
          triggerHaptic('success');
          audio.playSfx('buy');
          const order: TradeOrder = {
              id: 'fill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              stockId: stock.id,
              stockName: stock.name,
              type: 'buy',
              orderType: 'market',
              shares: quantity,
              price: executionPrice,
              total: totalCost,
              timestamp: Date.now(),
              status: 'filled'
          };
          setState(prev => {
              const currentPos = prev.stockPortfolio[stock.id] || { shares: 0, avgBuyPrice: 0 };
              const newShares = currentPos.shares + quantity;
              const newAvg = ((currentPos.shares * currentPos.avgBuyPrice) + totalCost) / newShares;
              return {
                  ...prev,
                  money: prev.money - totalCost,
                  stockPortfolio: { ...prev.stockPortfolio, [stock.id]: { shares: newShares, avgBuyPrice: newAvg } },
                  tradeOrders: [order, ...(prev.tradeOrders || [])].slice(0, 100)
              };
          });
          triggerToast(`BOUGHT ${quantity} ${stock.id} @ $${executionPrice.toFixed(2)}`, 'success');
      } else {
          const currentPos = state.stockPortfolio[stock.id];
          if (!currentPos || currentPos.shares < quantity) {
              triggerToast("INSUFFICIENT SHARES", 'error');
              return;
          }
          const profit = totalCost - (currentPos.avgBuyPrice * quantity);
          triggerHaptic('medium');
          audio.playSfx('buy'); 
          const order: TradeOrder = {
              id: 'fill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              stockId: stock.id,
              stockName: stock.name,
              type: 'sell',
              orderType: 'market',
              shares: quantity,
              price: executionPrice,
              total: totalCost,
              timestamp: Date.now(),
              status: 'filled',
              realizedPnL: profit
          };
          setState(prev => {
              const left = currentPos.shares - quantity;
              const nextPortfolio = { ...prev.stockPortfolio };
              if (left <= 0) delete nextPortfolio[stock.id];
              else nextPortfolio[stock.id] = { ...currentPos, shares: left };
              return {
                  ...prev,
                  money: prev.money + totalCost,
                  stockPortfolio: nextPortfolio,
                  tradeOrders: [order, ...(prev.tradeOrders || [])].slice(0, 100),
                  financials: {
                      ...prev.financials,
                      stockProfits: prev.financials.stockProfits + profit,
                      bestTrade: Math.max(prev.financials.bestTrade, profit)
                  }
              };
          });
          triggerToast(`SOLD ${quantity} ${stock.id} @ $${executionPrice.toFixed(2)} (${profit >= 0 ? '+' : ''}$${formatMoney(Math.abs(profit))})`, profit >= 0 ? 'success' : 'error');
      }
  };

  // --- CORPORATE PUPPET-MASTER & MARGIN CREDIT DESK LOGIC ---
  const calculateTotalStockValue = (stocks: Stock[], portfolio: Record<string, StockPosition>) => {
    return Object.entries(portfolio).reduce((acc, [id, pos]) => {
      const stock = stocks.find(s => s.id === id);
      return acc + (stock ? pos.shares * stock.price : 0);
    }, 0);
  };

  const calculateMaxBorrowPower = (state: GameState) => {
    const stockVal = calculateTotalStockValue(state.stocks, state.stockPortfolio);
    const businessEquity = (state.assets || []).reduce((acc, a) => acc + (a.count * a.baseCost), 0);
    const hasNeoBank = (state.assets || []).some(a => a.id === 'neo_bank' && a.count > 0);
    const leverageMult = hasNeoBank ? 4.0 : 2.5;
    const currentPrincipal = state.marginLoan?.principal || 0;
    const maxCapacity = Math.max(1000, Math.floor((state.money + stockVal + (businessEquity * 0.2)) * leverageMult));
    return Math.max(0, maxCapacity - currentPrincipal);
  };

  const handleBorrowMargin = (amount: number) => {
    const maxBorrow = calculateMaxBorrowPower(state);
    if (amount <= 0 || isNaN(amount)) {
      triggerToast("ENTER VALID LOAN AMOUNT", 'error');
      return;
    }
    if (amount > maxBorrow) {
      triggerToast(`MAX BORROW CAPACITY IS $${formatMoney(maxBorrow)}`, 'error');
      return;
    }
    const hasNeoBank = (state.assets || []).some(a => a.id === 'neo_bank' && a.count > 0);
    const ratePerSec = hasNeoBank ? 0.00005 : 0.0001; // 0.005% vs 0.01% / sec
    
    setState(prev => {
      const curLoan = prev.marginLoan;
      const newPrincipal = (curLoan?.principal || 0) + amount;
      const nextLoan: MarginLoan = {
        principal: newPrincipal,
        borrowedAt: curLoan ? curLoan.borrowedAt : Date.now(),
        lastInterestTick: Date.now(),
        interestRatePerSec: ratePerSec,
        totalInterestPaid: curLoan ? curLoan.totalInterestPaid : 0
      };
      return {
        ...prev,
        money: prev.money + amount,
        marginLoan: nextLoan,
        marginCallWarningUntil: null
      };
    });
    audio.playSfx('buy');
    triggerHaptic('success');
    triggerToast(`CREDIT ISSUED: +$${formatMoney(amount)} CASH ON MARGIN`, 'success');
  };

  const handleRepayMargin = (amount: number) => {
    if (!state.marginLoan || state.marginLoan.principal <= 0) {
      triggerToast("NO OUTSTANDING MARGIN BALANCE", 'error');
      return;
    }
    const curPrincipal = state.marginLoan.principal;
    const repayAmount = Math.min(amount, curPrincipal);
    if (repayAmount <= 0 || isNaN(repayAmount)) {
      triggerToast("ENTER VALID REPAY AMOUNT", 'error');
      return;
    }
    if (state.money < repayAmount) {
      triggerToast("INSUFFICIENT CASH TO REPAY", 'error');
      return;
    }
    setState(prev => {
      if (!prev.marginLoan) return prev;
      const left = prev.marginLoan.principal - repayAmount;
      return {
        ...prev,
        money: prev.money - repayAmount,
        marginLoan: left <= 0 ? null : { ...prev.marginLoan, principal: left },
        marginCallWarningUntil: null
      };
    });
    audio.playSfx('buy');
    triggerHaptic('medium');
    triggerToast(`REPAID $${formatMoney(repayAmount)} ON MARGIN DESK`, 'success');
  };

  const handleExecuteCorporatePower = (
    powerType: 'media_broadcast' | 'botnet_raid' | 'pmc_sabotage',
    targetStockId: string,
    direction: 'pump' | 'dump'
  ) => {
    const targetStock = state.stocks.find(s => s.id === targetStockId);
    if (!targetStock) return;
    const now = Date.now();
    const cooldowns = state.corporatePowersCooldowns || {};
    if (cooldowns[powerType] && cooldowns[powerType] > now) {
      const waitSec = Math.ceil((cooldowns[powerType] - now) / 1000);
      triggerToast(`POWER COOLING DOWN (${waitSec}s REMAINING)`, 'error');
      return;
    }

    let mult = direction === 'pump' ? 1.25 : 0.75;
    let headline = '';
    let cooldownDuration = 120000;

    if (powerType === 'media_broadcast') {
      const hasMedia = (state.assets || []).some(a => a.id === 'media' && a.count > 0);
      if (!hasMedia) {
        triggerToast("REQUIRES NEWS NETWORK ASSET OWNERSHIP", 'error');
        return;
      }
      mult = direction === 'pump' ? 1.30 : 0.70;
      headline = direction === 'pump'
        ? `🔥 BREAKING: Global News Network broadcasts exclusive report predicting massive breakout for ${targetStock.name}!`
        : `⚠️ BOMBSHELL INVESTIGATION: News Network uncovers executive scandal at ${targetStock.name}! Massive selloff!`;
      cooldownDuration = 120000;
    } else if (powerType === 'botnet_raid') {
      const hasBotNet = (state.assets || []).some(a => a.id === 'bot_farm' && a.count > 0);
      if (!hasBotNet) {
        triggerToast("REQUIRES SOCIAL BOT NET ASSET OWNERSHIP", 'error');
        return;
      }
      mult = direction === 'pump' ? 1.40 : 0.60;
      headline = direction === 'pump'
        ? `🚀 VIRAL SURGE: Social Bot Army trends #Buy${targetStock.id} to #1 worldwide! Retail mania begins!`
        : `📉 FUD CAMPAIGN: Bot Army floods web with synthetic crash panic on ${targetStock.id}!`;
      cooldownDuration = 90000;
    } else if (powerType === 'pmc_sabotage') {
      const hasPMC = (state.assets || []).some(a => a.id === 'pmc' && a.count > 0);
      if (!hasPMC) {
        triggerToast("REQUIRES PRIVATE MILITARY ASSET OWNERSHIP", 'error');
        return;
      }
      // 15% risk of SEC counter-audit fine
      if (Math.random() < 0.15) {
        const fine = Math.min(state.money * 0.1, 50000000);
        setState(prev => ({
          ...prev,
          money: Math.max(0, prev.money - fine),
          corporatePowersCooldowns: { ...(prev.corporatePowersCooldowns || {}), [powerType]: now + 180000 }
        }));
        audio.playSfx('audit');
        triggerHaptic('heavy');
        triggerToast(`SEC RAID! Sabotage exposed! You paid a fine of $${formatMoney(fine)}!`, 'error');
        return;
      }
      mult = 0.55; // 45% plunge
      headline = `💥 BLACK OPS RAID: Hostile PMC covertly raids ${targetStock.name} central warehouse! Production halted!`;
      cooldownDuration = 180000;
    }

    // Apply immediate stock impact and publish global news
    setState(prev => {
      const updatedStocks = prev.stocks.map(s => {
        if (s.id !== targetStockId) return s;
        const newPrice = Math.max(0.01, +(s.price * mult).toFixed(2));
        const newHistory = [...s.history.slice(-49), newPrice];
        return {
          ...s,
          price: newPrice,
          history: newHistory,
          high24h: Math.max(s.high24h || newPrice, newPrice),
          low24h: Math.min(s.low24h || newPrice, newPrice),
          trend: mult >= 1 ? 'up' : 'down'
        } as Stock;
      });

      const synergyNews: GlobalNews = {
        id: 'news_' + Date.now(),
        headline,
        targetSector: targetStock.sector as any || 'all',
        multiplier: mult,
        expiresAt: now + 45000,
        isPlayerMsg: true
      };

      return {
        ...prev,
        stocks: updatedStocks,
        activeNews: synergyNews,
        corporatePowersCooldowns: {
          ...(prev.corporatePowersCooldowns || {}),
          [powerType]: now + cooldownDuration
        }
      };
    });

    audio.playNewsAlert(mult >= 1);
    triggerHaptic('heavy');
    triggerToast(`CORPORATE INFLUENCE EXECUTED: ${targetStock.id} SHIFTED ${(mult >= 1 ? '+' : '')}${((mult - 1) * 100).toFixed(0)}%!`, 'success');
    setShowPuppetModal(false);
  };

  const handleExecuteContract = () => {
      if (isGuestMode) {
          setShowGuestGate(true);
          return;
      }
      if (!selectedHacker || !hackTargetInput) return;
      const query = hackTargetInput.trim();
      const normalize = (s: string) => s.toLowerCase();
      
      // Self-hack check
      if (normalize(query) === normalize(state.userName) || query === state.userId) {
          triggerToast("CANNOT TARGET SELF", 'error');
          return;
      }

      // Check if trying to hack Zenith
      if (normalize(query) === 'zenith' || query === 'bot-zenith') {
          const zenithUser = state.simulatedUsers.find(u => u.personality === 'zenith');
          if (zenithUser) {
              handleHack(selectedHacker, zenithUser);
              setSelectedHacker(null);
              setHackTargetInput('');
              return;
          }
      }

      const users = state.simulatedUsers || SIMULATED_USERS;
      const targetSim = users.find(u => normalize(u.name) === normalize(query) || u.id === query);
      if (targetSim) {
          handleHack(selectedHacker, targetSim);
          setSelectedHacker(null);
          setHackTargetInput('');
          return;
      }
      triggerToast("TARGET NOT FOUND ON NETWORK", 'error');
  };

  const handleHack = (hacker: HackerProfile, target: SimulatedUser | RemotePlayer) => {
      if (Date.now() - state.lastHackTime < 60000) {
          triggerToast("SYSTEM COOLING DOWN", 'error');
          return;
      }
      if (state.money < hacker.cost) {
          triggerToast("INSUFFICIENT FUNDS FOR OPERATIVE", 'error');
          return;
      }
      setState(prev => ({ ...prev, money: prev.money - hacker.cost, lastHackTime: Date.now() }));
      triggerHaptic('heavy');
      audio.playSfx('audit');

      if ((target as SimulatedUser).personality === 'zenith') {
          handleHackZenith();
          return;
      }

      setTimeout(() => {
          const targetDefense = 0.2; 
          const successChance = hacker.successRate - targetDefense;
          if (Math.random() < successChance) {
              const stealAmount = target.money * 0.05; 
              setState(prev => ({
                  ...prev,
                  money: prev.money + stealAmount,
                  totalEarnings: prev.totalEarnings + stealAmount,
                  financials: { ...prev.financials, totalRevenue: prev.financials.totalRevenue + stealAmount }
              }));
              triggerHaptic('success');
              audio.playSfx('buy');
              triggerToast(`BREACH SUCCESSFUL. STOLEN: $${formatMoney(stealAmount)}`, 'success');
              addNotification("HACK SUCCESS", `Stole $${formatMoney(stealAmount)} from ${target.name}`, 'reward');
          } else {
              const backfire = Math.random() < hacker.detectionRate;
              if (backfire) {
                 const penalty = state.money * 0.10;
                 // FEED ZENITH
                 const zenithUser = state.simulatedUsers.find(u => u.personality === 'zenith');
                 let newBots = state.simulatedUsers;
                 if (zenithUser) {
                     newBots = state.simulatedUsers.map(u => u.id === zenithUser.id ? { ...u, money: u.money + penalty } : u);
                 }

                 setState(prev => ({
                     ...prev,
                     money: prev.money - penalty,
                     simulatedUsers: newBots,
                     financials: { ...prev.financials, totalHackLosses: prev.financials.totalHackLosses + penalty }
                 }));
                 triggerToast(`TRACE DETECTED. ASSETS SEIZED: $${formatMoney(penalty)}`, 'error');
                 addNotification("HACK BACKFIRED", `Detected during hack on ${target.name}. Lost $${formatMoney(penalty)} to Zenith`, 'alert');
              } else {
                 triggerToast("HACK FAILED. CONNECTION SEVERED.", 'error');
              }
          }
      }, 2000);
  };

  const handleHackZenith = () => {
      setTimeout(() => {
          const roll = Math.random();
          // 0.0001% chance (1 in a million roughly, adjusted for gameplay feel to 1 in 10000 for realistic rarity)
          const jackpotChance = 0.000001; 
          
          if (roll < jackpotChance) {
              triggerHaptic('success');
              audio.playSfx('rankUp');
              const currentMoney = stateRef.current.money;
              // 9Q is 9e15
              const reward = Math.max(currentMoney * 2, 9e15);
              setState(prev => ({
                  ...prev,
                  money: prev.money + reward,
                  totalEarnings: prev.totalEarnings + reward
              }));
              triggerToast("ZENITH IS IMPRESSED. REWARD GRANTED.", 'success');
              addNotification("ZENITH REWARD", `You poked the bear. Zenith granted $${formatMoney(reward)}`, 'reward');
          } else {
              // 99.999% fail - REVERSE HACK
              const penalty = stateRef.current.money * 0.25;
              
              // FEED ZENITH
              const zenithUser = stateRef.current.simulatedUsers.find(u => u.personality === 'zenith');
              let newBots = stateRef.current.simulatedUsers;
              if (zenithUser) {
                  newBots = stateRef.current.simulatedUsers.map(u => u.id === zenithUser.id ? { ...u, money: u.money + penalty } : u);
              }

              setState(prev => ({
                  ...prev,
                  money: prev.money - penalty,
                  simulatedUsers: newBots,
                  financials: { ...prev.financials, totalHackLosses: prev.financials.totalHackLosses + penalty }
              }));
              setIsGlitching(true);
              setTimeout(() => setIsGlitching(false), 2500);
              triggerHaptic('heavy');
              triggerToast(`REVERSE HACK DETECTED. LOST $${formatMoney(penalty)}`, 'error');
              addNotification("ZENITH RETALIATION", `You poked the bear. Zenith seized $${formatMoney(penalty)}`, 'alert');
          }
      }, 2500);
  };

  const handleLeaderboardHack = (entry: LeaderboardEntry) => {
      const hacker = HACKER_ROSTER[1];
      setSelectedHacker(hacker);
      setHackTargetInput(entry.name);
  };

  const hardenAsset = (id: string) => {
    if (state.diamonds >= 50 && !state.hardenedAssetIds.includes(id)) {
      triggerHaptic('success');
      audio.playSfx('buy');
      setState(prev => ({
        ...prev,
        diamonds: prev.diamonds - 50,
        hardenedAssetIds: [...prev.hardenedAssetIds, id]
      }));
    }
  };

  const startWebFallbackAd = () => {
    setShowAdModal(true);
    setAdTimer(5); 
    const timer = setInterval(() => {
      setAdTimer(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleWatchAd = async () => {
    triggerHaptic('medium');
    adContextRef.current = 'boost';

    const result = await adService.showRewardedAd();
    if (result.watched) {
      // Completed real Google AdMob Rewarded Ad!
      completeAd();
    } else if (result.fallbackToWeb) {
      // On Web (or AdMob load fallback)
      startWebFallbackAd();
    }
  };

  const handleWhaleAd = async () => {
    if (!whaleSignalData) return;
    triggerHaptic('medium');
    setIsWhaleModalOpen(false); 
    adContextRef.current = 'whale';

    const result = await adService.showRewardedAd();
    if (result.watched) {
      // Completed real Google AdMob Rewarded Ad!
      completeAd();
    } else if (result.fallbackToWeb) {
      startWebFallbackAd();
    }
  };

  const completeAd = () => {
    setShowAdModal(false);
    triggerHaptic('success');
    audio.playSfx('rankUp'); 
    
    if (adContextRef.current === 'whale') {
        const reward = (whaleSignalData?.amount || Number(currentIps) * 300); 
        setState(prev => ({ ...prev, money: prev.money + reward, totalEarnings: prev.totalEarnings + reward }));
        triggerToast(`WHALE INVESTMENT: +$${formatMoney(reward)}`, 'success');
        setWhaleSignalData(null);
        setIsWhaleModalOpen(false);
    } else {
        triggerToast("HYPE PROTOCOL: 2M YIELD ACTIVE", 'success');
        setState(prev => ({ ...prev, adBoostActive: true, adBoostEndTime: Date.now() + (2 * 60 * 1000) }));
    }
    adContextRef.current = 'boost';
  };

  const handlePrestige = () => {
     if (keysToGain <= 0) return;
     triggerHaptic('heavy');
     audio.playSfx('rankUp');
     // IMPORTANT: Keep realityUnlocked if true
     const keepReality = state.realityUnlocked;
     setState(prev => {
         const newState = {
             ...prev, money: 20, assets: INITIAL_ASSETS, multiplier: 1, legacyKeys: potentialKeys, prestigeCount: prev.prestigeCount + 1, rankId: 0, financials: { ...prev.financials, stockProfits: 0 }, realityUnlocked: keepReality 
         };
         saveLocalData(newState);
         if (!isGuestModeRef.current && firebaseService.isConfigured) {
             firebaseService.saveGame(prev.userId, newState);
         }
         return newState;
     });
     setShowPrestigeModal(false);
     triggerToast("LEGACY SECURED. DYNASTY REBORN.", 'success');
  };
  
  const handlePurchaseSimulation = (bundle: DiamondBundle) => {
    // Attempt Real Purchase
    const isReal = storeService.purchase(bundle.id);
    
    // If Real store is NOT active (Web/Dev), fallback to Sim for testing
    if (!isReal) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            triggerHaptic('success');
            audio.playSfx('buy');
            setState(prev => ({...prev, diamonds: prev.diamonds + bundle.amount }));
            triggerToast(`SIMULATED PURCHASE: +${bundle.amount} 💎`, 'success');
        } else {
            triggerToast("Payment Store Unavailable. Check Connection or Play Store.", 'error');
        }
    }
  };

  const handleGlobalTap = (e: React.MouseEvent | React.TouchEvent) => {
    audio.initialize();
    const isMouseEvent = 'clientX' in e;
    const x = isMouseEvent ? (e as React.MouseEvent).clientX : (e as any).touches[0].clientX;
    const y = isMouseEvent ? (e as React.MouseEvent).clientY : (e as any).touches[0].clientY;
    
    triggerHaptic('light');
    audio.playSfx('tap');
    
    // Tap value rebalance: base 1 + 25% of current 1s passive income, plus modest scaling with earnings (capped at 5000)
    const baseTap = Math.max(1, Math.min(5000, 1 + Math.floor(Math.sqrt(Math.max(0, stateRef.current.totalEarnings)) * 0.05) + Math.floor(Number(currentIps) * 0.25)));
    let tapVal = baseTap;
    if (stateRef.current.isGreedActive && Date.now() < stateRef.current.greedEndTime) tapVal *= 2;
    if (stateRef.current.adBoostActive && Date.now() < stateRef.current.adBoostEndTime) tapVal *= 2; 
    const prestigeMult = 1 + (stateRef.current.legacyKeys * 0.1);
    tapVal *= prestigeMult;

    const amount = `+$${formatMoney(tapVal)}`;
    setTapParticles(p => [...p, { id: Date.now() + Math.random(), x, y, text: amount }]);
    setTimeout(() => setTapParticles(p => p.slice(1)), 800);

    setState(prev => ({
      ...prev,
      money: prev.money + tapVal,
      totalEarnings: prev.totalEarnings + tapVal
    }));
  };

  const updateProfile = () => {
      setState(prev => ({ ...prev, userName: editingName, userBannerColor: editingBanner }));
      setShowProfileModal(false);
      triggerToast("IDENTITY UPDATED", 'success');
  };

  const toggleCosmetic = (type: 'title' | 'avatar', value: string) => {
      if (type === 'title') {
          setState(prev => ({ ...prev, equippedCosmetics: { ...prev.equippedCosmetics, titleTag: prev.equippedCosmetics.titleTag === value ? undefined : value }}));
      } else {
          setState(prev => ({ ...prev, avatar: value }));
      }
      triggerHaptic('light');
  };

  const handleCloseGame = () => {
      // In a real app this might use navigator.app.exitApp() or similar
      // For web, we simulate a 'shutdown' state
      setAppView('intro'); 
      window.location.reload(); 
  };

  useEffect(() => {
    if (appView !== 'game') return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      // ANTI-ADDICTION CHECK
      if (now - sessionStartTime > MAX_SESSION_TIME && !isBanned) {
          setIsBanned(true);
      }

      const botList = stateRef.current.simulatedUsers && stateRef.current.simulatedUsers.length > 0 ? stateRef.current.simulatedUsers : SIMULATED_USERS;

      if (stateRef.current.totalEarnings > 1000000000000000 && !stateRef.current.ownedTitles.includes("Cash Cow")) {
          setState(prev => ({ ...prev, ownedTitles: [...prev.ownedTitles, "Cash Cow"] }));
          triggerToast("NEW TITLE UNLOCKED: CASH COW", 'success');
      }

      // --- LEADERBOARD LOGIC ---
      // 1. FETCH STAGE: Get Cloud Data periodically (slow)
      if (now - lastLeaderboardFetchRef.current > LEADERBOARD_FETCH_RATE) {
          lastLeaderboardFetchRef.current = now;
          if (leaderboardTimeframe === 'global' && isOnline) {
               firebaseService.getGlobalLeaderboard().then(remotes => {
                   cachedRemoteLeaderboardRef.current = remotes;
               });
          }
      }

      // 2. RENDER STAGE: Update List locally (fast - 10fps or more)
      if (now - lastLeaderboardRenderRef.current > LEADERBOARD_RENDER_RATE) {
          lastLeaderboardRenderRef.current = now;
          
          if (leaderboardTimeframe === 'global') {
               // Use Cached Remotes + Live Local Bots + Live Me
               const bots = botList;
               const remotes = cachedRemoteLeaderboardRef.current;

               const botEntries = bots.map((b) => ({
                   id: b.id,
                   name: b.name,
                   money: b.money, // Live Bot Money
                   avatar: b.avatar,
                   isPlayer: false,
                   isRemote: false,
                   growthRate: b.growthRate
               }));

               const myEntry = {
                   id: stateRef.current.userId,
                   name: stateRef.current.userName,
                   money: stateRef.current.money, // Live My Money
                   avatar: stateRef.current.avatar,
                   isPlayer: true,
                   growthRate: 0,
                   isRemote: false
               };

               let mixed = [
                   ...remotes.filter(r => r.id !== myEntry.id),
                   ...botEntries,
                   myEntry
               ];
               
               const unique = new Map();
               mixed.forEach(item => unique.set(item.id, item));
               const deduped = Array.from(unique.values());

               deduped.sort((a, b) => b.money - a.money);

               const finalEntries: LeaderboardEntry[] = deduped.slice(0, 100).map((u, i) => ({
                   id: u.id,
                   name: u.name,
                   money: u.money,
                   avatar: u.avatar || '👤',
                   isPlayer: u.isPlayer,
                   isRemote: u.isRemote,
                   rank: i + 1,
                   growthRate: u.growthRate || 0
               }));

               setThrottledLeaderboardEntries(finalEntries);
               const myRank = finalEntries.find(e => e.isPlayer);
               if (myRank) setCurrentUserRank(myRank.rank);

          } else {
             // LOCAL MODE
             const allEntities = [
                ...botList.map(u => ({
                    id: u.id,
                    name: u.name,
                    money: u.money, // Live
                    avatar: u.avatar,
                    personality: u.personality,
                    growthRate: u.growthRate,
                    isPlayer: false
                })),
                {
                    id: stateRef.current.userId,
                    name: stateRef.current.userName,
                    money: stateRef.current.money, // Live
                    avatar: stateRef.current.avatar,
                    personality: 'player',
                    growthRate: 0,
                    isPlayer: true
                }
            ];
            allEntities.sort((a, b) => b.money - a.money);
            const rankedEntities: LeaderboardEntry[] = allEntities.map((e, idx) => ({ ...e, rank: idx + 1 }));
            const myEntry = rankedEntities.find(e => e.isPlayer);
            if (myEntry) setCurrentUserRank(myEntry.rank);

            let finalEntries: LeaderboardEntry[] = [];
            const myIndex = rankedEntities.findIndex(e => e.isPlayer);
            if (myIndex !== -1) {
                const start = Math.max(0, myIndex - 3);
                const end = Math.min(rankedEntities.length, myIndex + 4);
                finalEntries = rankedEntities.slice(start, end);
            } else {
                finalEntries = rankedEntities.slice(0, 7);
            }
            setThrottledLeaderboardEntries(finalEntries);
          }
      }

      // TAXES / CRASHES LOGIC (5-10 MINS)
      // Base interval is 5 mins (300,000ms). Add random 0-5 mins noise.
      if (now - lastTaxCheckRef.current > (TAX_CHECK_INTERVAL + (Math.random() * 300000))) {
         lastTaxCheckRef.current = now;
         // 20% Chance of an event per check if money > 1000
         if (Math.random() < 0.2 && stateRef.current.money > 1000) {
            const isCrash = Math.random() > 0.5;
            const lossPercent = isCrash ? 0.15 : 0.08; 
            const lossAmount = stateRef.current.money * lossPercent;
            triggerHaptic('heavy');
            audio.playSfx('audit');
            setIsGlitching(true);
            setTimeout(() => setIsGlitching(false), 2000);
            
            const title = isCrash ? "MARKET CRASH" : "IRS AUDIT";
            const msg = isCrash ? `Global markets dipped. You lost $${formatMoney(lossAmount)}` : `Tax audit completed. Paid $${formatMoney(lossAmount)}`;
            
            triggerToast(title, 'error');
            addNotification(title, msg, 'alert');

            // FEED ZENITH THE LOST MONEY
            const zenithUser = stateRef.current.simulatedUsers.find(u => u.personality === 'zenith');
            let newBots = stateRef.current.simulatedUsers;
            if (zenithUser) {
                newBots = stateRef.current.simulatedUsers.map(u => u.id === zenithUser.id ? { ...u, money: u.money + lossAmount } : u);
            }

            setState(prev => ({
                ...prev,
                money: Math.max(0, prev.money - lossAmount),
                taxesPaid: prev.taxesPaid + lossAmount,
                simulatedUsers: newBots,
                financials: { 
                    ...prev.financials, 
                    totalTaxes: prev.financials.totalTaxes + (isCrash ? 0 : lossAmount),
                    totalExpenses: prev.financials.totalExpenses + lossAmount
                },
            }));
         }
      }

      // WHALE BUBBLE SPAWN LOGIC (Random chance every few seconds)
      if (now % 1000 < TICK_RATE && Math.random() < 0.005 && !whaleSignalData) {
          const reward = Math.max(1000, Number(currentIps) * 300);
          setWhaleSignalData({ amount: reward });
          triggerToast("ENCRYPTED SIGNAL RECEIVED", 'success');
      }

      const elapsedSinceLastTick = now - lastTickTimeRef.current;
      const deltaMs = Math.min(Math.max(TICK_RATE, elapsedSinceLastTick), 5000);
      lastTickTimeRef.current = now;
      setCurrentTime(now);
      
      const currentNews = stateRef.current.activeNews;
      const isNewsActive = currentNews && now < currentNews.expiresAt;
      const isAdBoostActive = stateRef.current.adBoostActive && now < stateRef.current.adBoostEndTime;
      const assetList = stateRef.current.assets || INITIAL_ASSETS;
      const ips = assetList.reduce((acc, curr) => {
        const level = getLevel(curr.count);
        let sectorMult = 1;
        if (isNewsActive && (currentNews.targetSector === 'all' || currentNews.targetSector === curr.sector)) sectorMult = currentNews.multiplier;
        return acc + (curr.count * curr.baseIncome * getLevelIncomeMultiplier(level) * sectorMult);
      }, 0);
      
      const rankBonus = stateRef.current.rankId >= 1 ? 1.1 + (stateRef.current.rankId * 0.1) : 1;
      const greedMult = (stateRef.current.isGreedActive && now < stateRef.current.greedEndTime) ? 2 : 1;
      const adMult = isAdBoostActive ? 2 : 1;
      const prestigeMult = 1 + (stateRef.current.legacyKeys * 0.1);
      const totalMult = stateRef.current.multiplier * rankBonus * greedMult * adMult * prestigeMult;
      const increment = (ips * totalMult * deltaMs) / 1000;
      
      const deltaSec = deltaMs / 1000;
      const updatedBots = botList.map(bot => {
          let growth = bot.growthRate * deltaSec;
          if (bot.personality === 'zenith') {
              // ZENITH LOGIC: Always stay ahead.
              // If player catches up, Zenith surges.
              const playerMoney = stateRef.current.money;
              if (bot.money < playerMoney * 2) {
                  growth = playerMoney * 0.1; // Jump 10% ahead instantly if close
              }
              // Passive massive growth regardless
              growth += (ips * 1.5 * deltaSec);
              growth += bot.growthRate * 2 * deltaSec;
          }
          return { ...bot, money: bot.money + growth };
      });

      if (now - lastChatUpdateRef.current > CHAT_AUTO_FREQ) {
        lastChatUpdateRef.current = now;
        generateAutonomousChat(botList, chatMessages, stateRef.current, stateRef.current.stocks)
          .then(newMsgs => {
            if (newMsgs.length > 0) {
                setChatMessages(prev => [...prev, ...newMsgs].slice(-500));
            }
          });
      }

      // Passive Rival Breach Check (every 90s, 35% chance)
      const HACK_CHECK_FREQ = 90000;
      if (now - lastBreachRef.current > HACK_CHECK_FREQ) {
        lastBreachRef.current = now;
        if (Math.random() < 0.35 && stateRef.current.money > 25000 && !stateRef.current.revengeTarget) {
          if (stateRef.current.swissShieldEndTime && stateRef.current.swissShieldEndTime > now) {
            triggerToast("SWISS CYBER SHIELD BLOCKED INCOMING BREACH!", 'success');
            audio.playSfx('golden');
          } else {
            const attacker = stateRef.current.simulatedUsers[Math.floor(Math.random() * stateRef.current.simulatedUsers.length)];
            if (attacker && attacker.personality !== 'zenith') {
              const breachRoll = Math.random() * 100;
              if (breachRoll > stateRef.current.firewallStrength) {
                const stolen = Math.floor(Math.min(stateRef.current.money * 0.08, 100000000));
                if (stolen > 0) {
                  setState(p => ({
                    ...p,
                    money: Math.max(0, p.money - stolen),
                    financials: { ...p.financials, totalHackLosses: p.financials.totalHackLosses + stolen },
                    revengeTarget: {
                      botId: attacker.id,
                      botName: attacker.name,
                      stolenAmount: stolen,
                      expiresAt: now + 5 * 60 * 1000
                    }
                  }));
                  audio.playSfx('audit');
                  triggerHaptic('heavy');
                  triggerToast(`BREACH: ${attacker.name} stole $${formatMoney(stolen)}! REVENGE HEIST READY!`, 'error');
                }
              } else {
                triggerToast(`FIREWALL REPELLED ATTACK FROM ${attacker.name}!`, 'success');
              }
            }
          }
        }
      }

      if (now - lastNewsUpdateRef.current > NEWS_AUTO_FREQ) {
        lastNewsUpdateRef.current = now;
        setNewsFade(false);
        generateGlobalNews(stateRef.current).then(news => {
          if (news) {
            setState(prev => ({ ...prev, activeNews: news }));
            setNewsFade(true);
            addNotification("NEWS ALERT", news.headline, news.multiplier < 1 ? 'alert' : 'system');
            
            // Urgent Breaking News Audio Alert & Haptic
            const isBoom = news.multiplier >= 1.5;
            const isCrash = news.multiplier <= 0.6;
            if (isBoom || isCrash) {
              audio.playNewsAlert(isBoom);
              triggerHaptic(isCrash ? 'heavy' : 'medium');
            }
          }
        });
      }

      setState(prev => {
        let nextRankId = prev.rankId;
        const nextRank = RANKS[prev.rankId + 1];
        if (nextRank && prev.money >= nextRank.requirement) {
           nextRankId++;
           triggerHaptic('heavy');
           audio.playSfx('rankUp');
           setShowRankCelebration(nextRank);
           setTimeout(() => setShowRankCelebration(null), 3500);
           audio.playBgm(nextRankId);
        }

        let updatedStocks = prev.stocks;
        let nextInsiderLeak = prev.insiderLeak;

        if (now - lastStockUpdateRef.current >= STOCK_UPDATE_FREQ) {
           lastStockUpdateRef.current = now;
           
           const leakToExecute = prev.insiderLeak && now >= prev.insiderLeak.targetTime ? prev.insiderLeak : null;
           if (leakToExecute) {
             nextInsiderLeak = null; // executed!
           }

           updatedStocks = prev.stocks.map(s => {
              let mult = 1;
              if (leakToExecute && s.id === leakToExecute.stockId) {
                mult = leakToExecute.multiplier;
              }
              const change = (Math.random() - 0.49) * s.volatility * s.price;
              const newPrice = Math.max(0.01, +( (s.price + change) * mult ).toFixed(2));
              const newHistory = [...s.history.slice(-49), newPrice]; 
              const high24h = Math.max(s.high24h || newPrice, newPrice);
              const low24h = Math.min(s.low24h || newPrice, newPrice);
              return { 
                ...s, 
                price: newPrice, 
                history: newHistory, 
                high24h,
                low24h,
                trend: (change * mult) >= 0 ? 'up' : 'down' 
              } as Stock;
           });
        }

        let nextMoney = prev.money + increment;
        const nextTotal = prev.totalEarnings + increment;
        let nextOrders = prev.tradeOrders ? [...prev.tradeOrders] : [];
        let nextPortfolio = { ...prev.stockPortfolio };
        let nextStockProfits = prev.financials.stockProfits;
        let nextBestTrade = prev.financials.bestTrade;

        // Process pending Limit Orders
        if (nextOrders.some(o => o.status === 'pending')) {
          nextOrders = nextOrders.map(order => {
            if (order.status !== 'pending' || !order.targetPrice) return order;
            const currentStock = updatedStocks.find(s => s.id === order.stockId);
            if (!currentStock) return order;

            if (order.type === 'buy' && currentStock.price <= order.targetPrice) {
              const executionTotal = +(currentStock.price * order.shares).toFixed(2);
              if (nextMoney >= executionTotal) {
                nextMoney -= executionTotal;
                const curPos = nextPortfolio[order.stockId] || { shares: 0, avgBuyPrice: 0 };
                const newShares = curPos.shares + order.shares;
                const newAvg = ((curPos.shares * curPos.avgBuyPrice) + executionTotal) / newShares;
                nextPortfolio[order.stockId] = { shares: newShares, avgBuyPrice: newAvg };
                triggerToast(`LIMIT BUY EXECUTED: ${order.shares} ${order.stockId} @ $${currentStock.price.toFixed(2)}`, 'success');
                audio.playSfx('buy');
                return { ...order, status: 'filled', price: currentStock.price, total: executionTotal };
              }
            } else if (order.type === 'sell' && currentStock.price >= order.targetPrice) {
              const curPos = nextPortfolio[order.stockId];
              if (curPos && curPos.shares >= order.shares) {
                const executionTotal = +(currentStock.price * order.shares).toFixed(2);
                const profit = executionTotal - (curPos.avgBuyPrice * order.shares);
                nextMoney += executionTotal;
                const left = curPos.shares - order.shares;
                if (left <= 0) delete nextPortfolio[order.stockId];
                else nextPortfolio[order.stockId] = { ...curPos, shares: left };
                nextStockProfits += profit;
                nextBestTrade = Math.max(nextBestTrade, profit);
                triggerToast(`LIMIT SELL EXECUTED: ${order.shares} ${order.stockId} @ $${currentStock.price.toFixed(2)} (${profit >= 0 ? '+' : ''}$${formatMoney(Math.abs(profit))})`, 'success');
                audio.playSfx('buy');
                return { ...order, status: 'filled', price: currentStock.price, total: executionTotal, realizedPnL: profit };
              }
            }
            return order;
          });
        }

        // Hostile Takeover Dividend Yields (if player holds >= 51% float)
        let dividendTotal = 0;
        const currentControlled: string[] = [];
        updatedStocks.forEach(s => {
          const pos = nextPortfolio[s.id];
          const totalFloat = s.totalFloat || 50000;
          if (pos && pos.shares >= totalFloat * 0.51) {
            currentControlled.push(s.id);
            const divRate = s.dividendYieldPerSec || 50;
            dividendTotal += (divRate * (deltaMs / 1000));
          }
        });
        if (dividendTotal > 0) {
          nextMoney += dividendTotal;
        }

        // Margin Loan Interest & Collateral Check
        let nextMarginLoan = prev.marginLoan ? { ...prev.marginLoan } : null;
        let nextMarginWarning = prev.marginCallWarningUntil;

        if (nextMarginLoan && nextMarginLoan.principal > 0) {
          // Accrue Interest
          const interestDelta = nextMarginLoan.principal * nextMarginLoan.interestRatePerSec * (deltaMs / 1000);
          nextMarginLoan.principal += interestDelta;
          nextMarginLoan.lastInterestTick = now;

          // Check Collateral Ratio: Total Portfolio Value / Margin Principal
          const totalStockValue = Object.entries(nextPortfolio).reduce((acc, [id, pos]) => {
            const stk = updatedStocks.find(s => s.id === id);
            return acc + (stk ? pos.shares * stk.price : 0);
          }, 0);
          const totalCollateral = nextMoney + totalStockValue;
          const collateralRatio = totalCollateral / nextMarginLoan.principal;

          // Margin Call Trigger: Maintenance margin is 130% (1.30)
          if (collateralRatio < 1.30) {
            if (!nextMarginWarning) {
              nextMarginWarning = now + 30000; // 30 seconds emergency countdown
              triggerToast("⚠️ MARGIN CALL WARNING! Collateral < 130%! Cure within 30s!", 'error');
              audio.playSfx('audit');
              triggerHaptic('heavy');
            } else if (now >= nextMarginWarning) {
              // FORCED BROKER LIQUIDATION!
              // Liquidate shares to clear loan principal
              let debtToClear = nextMarginLoan.principal;
              const liquidatedPortfolio = { ...nextPortfolio };
              for (const [stockId, pos] of Object.entries(liquidatedPortfolio)) {
                if (debtToClear <= 0) break;
                const stk = updatedStocks.find(s => s.id === stockId);
                if (!stk || pos.shares <= 0) continue;
                const shareValue = stk.price * 0.90; // 10% fire-sale liquidation penalty
                const sharesNeeded = Math.min(pos.shares, Math.ceil(debtToClear / shareValue));
                const recovered = sharesNeeded * shareValue;
                debtToClear -= recovered;
                const left = pos.shares - sharesNeeded;
                if (left <= 0) delete liquidatedPortfolio[stockId];
                else liquidatedPortfolio[stockId] = { ...pos, shares: left };
              }
              nextPortfolio = liquidatedPortfolio;
              nextMarginLoan = null;
              nextMarginWarning = null;
              triggerToast("🚨 MARGIN LIQUIDATION: Broker fire-sold positions to settle debt!", 'error');
              audio.playSfx('audit');
              triggerHaptic('heavy');
            }
          } else {
            // Healthy collateral
            nextMarginWarning = null;
          }
        } else {
          nextMarginWarning = null;
        }

        return {
          ...prev, 
          money: nextMoney, 
          totalEarnings: nextTotal + dividendTotal, 
          rankId: nextRankId,
          stocks: updatedStocks,
          stockPortfolio: nextPortfolio,
          tradeOrders: nextOrders,
          insiderLeak: nextInsiderLeak,
          simulatedUsers: updatedBots,
          marginLoan: nextMarginLoan,
          marginCallWarningUntil: nextMarginWarning,
          controlledCompanies: currentControlled,
          saveHash: generateSaveHash(nextMoney, nextTotal, prev.diamonds),
          lastUpdate: now,
          financials: { 
            ...prev.financials, 
            totalRevenue: prev.financials.totalRevenue + increment + dividendTotal,
            stockProfits: nextStockProfits,
            bestTrade: nextBestTrade
          },
        };
      });
    }, TICK_RATE);
    return () => clearInterval(interval);
  }, [chatMessages.length, appView, leaderboardTimeframe, isBanned]);

  // Throttled local storage save (every 3s + visibilitychange/beforeunload)
  useEffect(() => {
    const save = () => {
      if (appView !== 'game') return;
      saveLocalData(stateRef.current);
    };

    const interval = setInterval(save, 3000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') save();
    };
    const handleBeforeUnload = () => save();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [appView]);

  useEffect(() => {
    const diff = state.money - displayMoney;
    if (Math.abs(diff) < 1) { setDisplayMoney(state.money); return; }
    const timer = setTimeout(() => setDisplayMoney(prev => prev + (diff * 0.1)), 16);
    return () => clearTimeout(timer);
  }, [state.money, displayMoney]);

  if (appView === 'intro') return <Intro onComplete={handleIntroComplete} />;
  if (appView === 'auth') return <AuthScreen onLogin={handleLogin} />;

  // PROGRESSIVE ASSET VISIBILITY LOGIC
  const visibleAssets = (() => {
      const allAssets = state.assets || INITIAL_ASSETS;
      const visible: Asset[] = [];
      let foundUnaffordable = false;

      // Check unlock condition for Reality Engine
      const otherAssets = allAssets.filter(a => a.id !== 'reality_engine');
      const allMaxed = otherAssets.every(a => getLevel(a.count) >= 4);

      for (const asset of allAssets) {
          if (asset.id === 'reality_engine') {
              // Once unlocked, it stays unlocked (persisted in state)
              if (state.realityUnlocked || allMaxed) visible.push(asset);
              continue;
          }

          const level = getLevel(asset.count);
          const currentCost = Math.floor(asset.baseCost * Math.pow(1.22, asset.count) * getLevelCostMultiplier(level));
          
          if (asset.count > 0) {
              visible.push(asset);
          } else if (state.money >= currentCost) {
              visible.push(asset);
          } else if (!foundUnaffordable) {
              visible.push(asset);
              foundUnaffordable = true;
          }
      }
      return visible.sort((a, b) => a.baseCost - b.baseCost);
  })();

  const selectedStock = state.stocks.find(s => s.id === selectedStockId);
  const watchlistSet = new Set(state.watchlist || ['BTC', 'NOVI', 'PEAR']);

  // REALISTIC PORTFOLIO VALUATION & REALIZED/UNREALIZED P&L
  const totalPortfolioValue = Object.entries(state.stockPortfolio).reduce((acc, [id, pos]) => {
      if (!pos || pos.shares <= 0) return acc;
      const st = state.stocks.find(s => s.id === id);
      return acc + (pos.shares * (st ? st.price : pos.avgBuyPrice));
  }, 0);

  const totalCostBasis = Object.values(state.stockPortfolio).reduce((acc, pos) => {
      if (!pos || pos.shares <= 0) return acc;
      return acc + (pos.shares * pos.avgBuyPrice);
  }, 0);

  const totalUnrealizedPnL = totalPortfolioValue - totalCostBasis;
  const totalUnrealizedPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;

  const portfolioDayChangeVal = Object.entries(state.stockPortfolio).reduce((acc, [id, pos]) => {
      if (!pos || pos.shares <= 0) return acc;
      const st = state.stocks.find(s => s.id === id);
      if (!st) return acc;
      const open = st.openPrice || st.history[0] || st.price;
      return acc + (pos.shares * (st.price - open));
  }, 0);
  const portfolioDayChangePct = totalCostBasis > 0 ? (portfolioDayChangeVal / totalCostBasis) * 100 : 0;

  // SAFE MARKET NAVIGATION (Permanently resolves get-stuck bug)
  const handleSwitchMarketTab = (tab: 'list' | 'portfolio' | 'watchlist' | 'orders' | 'margin') => {
      setSelectedStockId(null);
      setMarketView(tab);
      setPreviousMarketTab(tab);
  };

  const openStockDetail = (id: string) => {
      setPreviousMarketTab(marketView === 'detail' ? 'list' : marketView);
      setSelectedStockId(id);
      setMarketView('detail');
  };

  // ADVANCED MARKET FILTERS & LIVE SEARCH
  const filteredStocks = state.stocks.filter(s => {
      if (marketSearchQuery.trim()) {
          const q = marketSearchQuery.toLowerCase();
          const matches = s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.sector && s.sector.toLowerCase().includes(q));
          if (!matches) return false;
      }
      if (marketCategory === 'all') return true;
      if (marketCategory === 'crypto') return s.category === 'crypto';
      if (marketCategory === 'stock') return s.category === 'stock' || !s.category;
      if (marketCategory === 'gainers') return s.trend === 'up';
      if (marketCategory === 'losers') return s.trend === 'down';
      return true;
  });

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center bg-black overflow-hidden select-none">
      <div className={`h-full w-full max-w-[480px] flex flex-col bg-[#050505] text-white font-inter overflow-hidden relative shadow-2xl border-x border-white/5 transition-all duration-700 ${isGlitching ? 'filter invert hue-rotate-180 brightness-125' : ''}`}>
      
      {/* ANTI-ADDICTION BAN OVERLAY */}
      {isBanned && (
          <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="w-full max-w-sm bg-zinc-900/90 border border-blue-500/50 p-8 rounded-[2rem] text-center shadow-[0_0_100px_rgba(59,130,246,0.3)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                  
                  <div className="mb-6 relative z-10">
                      <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30 animate-pulse">
                          <div className="text-4xl">❄️</div>
                      </div>
                      <h2 className="font-bebas text-3xl text-white tracking-widest mb-2">SYSTEM COOLDOWN</h2>
                      <div className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em] mb-6">MANDATORY REST PERIOD</div>
                      
                      <p className="text-xs text-zinc-300 leading-relaxed font-medium mb-8">
                          We at <span className="text-blue-400 font-bold">FROZEN FLAME</span> hold responsibility for the well-being of our elite operatives. Your neural link has exceeded safe operational limits (6 hours). 
                          <br/><br/>
                          Disengage immediately to prevent cognitive overload. Access will be restored in <span className="text-white font-bold">15 minutes</span>.
                      </p>
                      
                      <button onClick={handleCloseGame} className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                          ACKNOWLEDGE & EXIT
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* DIAMOND STORE MODAL */}
      {showDiamondStore && (
          <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-300">
               <div className="w-full max-w-sm h-auto max-h-[85vh] bg-zinc-950 border border-amber-500/20 rounded-[2.5rem] flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                   <button onClick={() => setShowDiamondStore(false)} className="absolute top-4 right-4 z-20 text-zinc-500 hover:text-white p-2">✕</button>
                   
                   <div className="flex bg-zinc-900 border-b border-white/5 shrink-0">
                       <button onClick={() => setDiamondStoreTab('topup')} className={`flex-1 py-6 font-bebas text-xl tracking-widest transition-colors ${diamondStoreTab === 'topup' ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-600'}`}>TOP UP</button>
                       <button onClick={() => setDiamondStoreTab('store')} className={`flex-1 py-6 font-bebas text-xl tracking-widest transition-colors ${diamondStoreTab === 'store' ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-600'}`}>STORE</button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                       {diamondStoreTab === 'topup' && (
                           <div className="space-y-4">
                               <div className="text-center mb-6">
                                   <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Current Balance</div>
                                   <div className="font-bebas text-5xl text-white">{state.diamonds} 💎</div>
                               </div>
                               <div className="grid grid-cols-2 gap-3">
                                   {DIAMOND_BUNDLES.map(bundle => (
                                      <button key={bundle.id} onClick={() => handlePurchaseSimulation(bundle)} className={`bg-zinc-900/80 border ${bundle.isPopular ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-white/5'} p-4 rounded-2xl flex flex-col items-center relative overflow-hidden active:scale-95 transition-transform`}>
                                         {bundle.isPopular && (<div className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase">Best Value</div>)}
                                         <div className="w-8 h-8 text-amber-400 mb-2"><Icons.Diamond /></div>
                                         <div className="font-bebas text-xl text-white tracking-widest">{bundle.amount}</div>
                                         <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">${bundle.price}</div>
                                      </button>
                                   ))}
                                </div>
                           </div>
                       )}

                       {diamondStoreTab === 'store' && (
                           <div className="space-y-6">
                               <div className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">PREMIUM AVATARS (500💎)</div>
                               <div className="grid grid-cols-3 gap-3">
                                   {PREMIUM_AVATARS.map((av, idx) => {
                                       const isOwned = state.ownedAvatars.includes(av);
                                       const isEquipped = state.avatar === av;
                                       return (
                                           <div key={idx} className="flex flex-col gap-2">
                                               <div className={`aspect-square rounded-2xl bg-zinc-900 border overflow-hidden flex items-center justify-center relative ${isEquipped ? 'border-amber-500 ring-2 ring-amber-500/20' : isOwned ? 'border-zinc-700' : 'border-zinc-800'}`}>
                                                   <img src={av} className="w-full h-full object-cover" />
                                                   {isOwned && <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow"></div>}
                                               </div>
                                               <button 
                                                   onClick={() => {
                                                       if (isOwned) {
                                                           toggleCosmetic('avatar', av);
                                                       } else if (state.diamonds >= 500) {
                                                           triggerHaptic('medium');
                                                           audio.playSfx('buy');
                                                           setState(prev => ({
                                                               ...prev,
                                                               diamonds: prev.diamonds - 500,
                                                               ownedAvatars: [...prev.ownedAvatars, av]
                                                           }));
                                                           triggerToast("AVATAR ACQUIRED", 'success');
                                                       } else {
                                                           triggerToast("NEED MORE DIAMONDS", 'error');
                                                       }
                                                   }}
                                                   className={`w-full py-2 rounded-lg font-black text-[8px] uppercase tracking-widest ${isEquipped ? 'bg-amber-500 text-black' : isOwned ? 'bg-zinc-800 text-zinc-400' : state.diamonds >= 500 ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-600'}`}
                                               >
                                                   {isEquipped ? 'USED' : isOwned ? 'OWNED' : '500💎'}
                                               </button>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       )}
                   </div>
               </div>
          </div>
      )}

      {/* OFFSHORE YIELD COLLECTOR MODAL (2X AD MULTIPLIER) */}
      {offlineYieldPending > 0 && (
          <div className="fixed inset-0 z-[9800] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in zoom-in duration-300">
              <div className="w-full max-w-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 blur-3xl rounded-full opacity-60 animate-pulse"></div>
                  <div className="bg-zinc-950 border border-emerald-500/30 rounded-[2.5rem] p-6 text-center relative overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.25)]">
                      <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                          💼
                      </div>
                      <h2 className="font-bebas text-4xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                          OFFSHORE YIELD COLLECTED
                      </h2>
                      <div className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-4">
                          AUTOMATED EMPIRE PROGRESSION
                      </div>
                      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-white/5 mb-6">
                          <div className="text-[9px] uppercase font-bold text-zinc-500 mb-1">ACCUMULATED WEALTH</div>
                          <div className="font-bebas text-4xl text-white tracking-wide">
                              +${formatMoney(offlineYieldPending)}
                          </div>
                      </div>
                      <div className="flex flex-col gap-2.5">
                          <button
                              onClick={() => handleClaimOfflineYield(2)}
                              className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                              <span>📺</span> CLAIM 2X (+${formatMoney(offlineYieldPending * 2)})
                          </button>
                          <button
                              onClick={() => handleClaimOfflineYield(1)}
                              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/5 transition-colors"
                          >
                              CLAIM STANDARD (${formatMoney(offlineYieldPending)})
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

            {/* CORPORATE PUPPET-MASTER ACTION MODAL */}
      {showPuppetModal && selectedSynergyStockId && (() => {
          const stock = state.stocks.find(s => s.id === selectedSynergyStockId);
          if (!stock) return null;
          const hasMedia = (state.assets || []).some(a => a.id === "media" && a.count > 0);
          const hasBotNet = (state.assets || []).some(a => a.id === "bot_farm" && a.count > 0);
          const hasPMC = (state.assets || []).some(a => a.id === "pmc" && a.count > 0);
          const cooldowns = state.corporatePowersCooldowns || {};
          const now = Date.now();

          return (
              <div className="fixed inset-0 z-[9900] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in zoom-in duration-200">
                  <div className="w-full max-w-sm relative">
                      <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full pointer-events-none"></div>
                      <div className="bg-zinc-950 border border-purple-500/40 rounded-[2.5rem] p-6 text-center relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)] space-y-4">
                          <button 
                              onClick={() => setShowPuppetModal(false)}
                              className="absolute top-5 right-5 text-zinc-500 hover:text-white text-lg w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center transition-colors"
                          >
                              ✕
                          </button>

                          <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg">
                              🕶️
                          </div>

                          <div>
                              <div className="text-[9px] font-black uppercase tracking-widest text-purple-400">CORPORATE PUPPET-MASTER</div>
                              <h2 className="font-bebas text-2xl text-white mt-0.5">TARGET: {stock.name} ({stock.id})</h2>
                              <p className="text-[10px] text-zinc-400 mt-1">Leverage owned empire assets to manipulate public sentiment and move share price.</p>
                          </div>

                          <div className="space-y-3 text-left">
                              {/* Power 1: News Broadcast */}
                              <div className={`p-3.5 rounded-2xl border transition-all ${hasMedia ? "bg-zinc-900/60 border-purple-500/30" : "bg-zinc-950/60 border-white/5 opacity-50"}`}>
                                  <div className="flex justify-between items-start mb-2">
                                      <div>
                                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                              <span>📺</span> News Network Broadcast
                                          </div>
                                          <div className="text-[9px] text-zinc-400">Swing price by ±30% via media narrative</div>
                                      </div>
                                      <span className="text-[8px] font-mono font-bold text-purple-400">
                                          {hasMedia ? (cooldowns["media_broadcast"] && cooldowns["media_broadcast"] > now ? `${Math.ceil((cooldowns["media_broadcast"] - now)/1000)}s CD` : "READY") : "LOCKED"}
                                      </span>
                                  </div>
                                  {hasMedia ? (
                                      <div className="grid grid-cols-2 gap-2 pt-1">
                                          <button 
                                              onClick={() => handleExecuteCorporatePower("media_broadcast", stock.id, "pump")}
                                              disabled={Boolean(cooldowns["media_broadcast"] && cooldowns["media_broadcast"] > now)}
                                              className="py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500/30 disabled:opacity-30 transition-all"
                                          >
                                              Hype Pump (+30%)
                                          </button>
                                          <button 
                                              onClick={() => handleExecuteCorporatePower("media_broadcast", stock.id, "dump")}
                                              disabled={Boolean(cooldowns["media_broadcast"] && cooldowns["media_broadcast"] > now)}
                                              className="py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/30 disabled:opacity-30 transition-all"
                                          >
                                              Hit Piece (-30%)
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="text-[8px] text-zinc-500 italic">Own News Network business to unlock.</div>
                                  )}
                              </div>

                              {/* Power 2: Bot Net Raid */}
                              <div className={`p-3.5 rounded-2xl border transition-all ${hasBotNet ? "bg-zinc-900/60 border-purple-500/30" : "bg-zinc-950/60 border-white/5 opacity-50"}`}>
                                  <div className="flex justify-between items-start mb-2">
                                      <div>
                                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                              <span>🤖</span> Social Bot Army Raid
                                          </div>
                                          <div className="text-[9px] text-zinc-400">Flood feeds to trigger ±40% viral swing</div>
                                      </div>
                                      <span className="text-[8px] font-mono font-bold text-purple-400">
                                          {hasBotNet ? (cooldowns["botnet_raid"] && cooldowns["botnet_raid"] > now ? `${Math.ceil((cooldowns["botnet_raid"] - now)/1000)}s CD` : "READY") : "LOCKED"}
                                      </span>
                                  </div>
                                  {hasBotNet ? (
                                      <div className="grid grid-cols-2 gap-2 pt-1">
                                          <button 
                                              onClick={() => handleExecuteCorporatePower("botnet_raid", stock.id, "pump")}
                                              disabled={Boolean(cooldowns["botnet_raid"] && cooldowns["botnet_raid"] > now)}
                                              className="py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500/30 disabled:opacity-30 transition-all"
                                          >
                                              Viral Mania (+40%)
                                          </button>
                                          <button 
                                              onClick={() => handleExecuteCorporatePower("botnet_raid", stock.id, "dump")}
                                              disabled={Boolean(cooldowns["botnet_raid"] && cooldowns["botnet_raid"] > now)}
                                              className="py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/30 disabled:opacity-30 transition-all"
                                          >
                                              FUD Raid (-40%)
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="text-[8px] text-zinc-500 italic">Own Social Bot Net business to unlock.</div>
                                  )}
                              </div>

                              {/* Power 3: PMC Sabotage */}
                              <div className={`p-3.5 rounded-2xl border transition-all ${hasPMC ? "bg-zinc-900/60 border-red-500/30" : "bg-zinc-950/60 border-white/5 opacity-50"}`}>
                                  <div className="flex justify-between items-start mb-2">
                                      <div>
                                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                              <span>🪖</span> PMC Corporate Sabotage
                                          </div>
                                          <div className="text-[9px] text-zinc-400">Hostile raid on supplier: tanks stock 45% (15% risk of SEC fine)</div>
                                      </div>
                                      <span className="text-[8px] font-mono font-bold text-red-400">
                                          {hasPMC ? (cooldowns["pmc_sabotage"] && cooldowns["pmc_sabotage"] > now ? `${Math.ceil((cooldowns["pmc_sabotage"] - now)/1000)}s CD` : "READY") : "LOCKED"}
                                      </span>
                                  </div>
                                  {hasPMC ? (
                                      <button 
                                          onClick={() => handleExecuteCorporatePower("pmc_sabotage", stock.id, "dump")}
                                          disabled={Boolean(cooldowns["pmc_sabotage"] && cooldowns["pmc_sabotage"] > now)}
                                          className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs uppercase rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-30 transition-all"
                                      >
                                          Execute Black Ops Sabotage (-45%)
                                      </button>
                                  ) : (
                                      <div className="text-[8px] text-zinc-500 italic">Own Private Military business to unlock.</div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          );
      })()}

{/* 24-HOUR WHALE STARTER KIT MODAL */}
      {showStarterKitModal && (
          <div className="fixed inset-0 z-[9800] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in zoom-in duration-300">
              <div className="w-full max-w-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-amber-600/30 blur-3xl rounded-full opacity-60 animate-pulse"></div>
                  <div className="bg-zinc-950 border border-amber-400/50 rounded-[2.5rem] p-6 text-center relative overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.3)]">
                      <button 
                          onClick={() => setShowStarterKitModal(false)}
                          className="absolute top-5 right-5 text-zinc-500 hover:text-white text-lg w-8 h-8 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center transition-colors"
                      >
                          ✕
                      </button>
                      <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                          👑
                      </div>
                      <div className="text-[9px] font-black uppercase text-red-500 tracking-[0.2em] mb-1">
                          ⚡ 85% ONE-TIME DISCOUNT • 24H EXCLUSIVE
                      </div>
                      <h2 className="font-bebas text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                          THE OLIGARCH STARTER VAULT
                      </h2>
                      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-white/5 my-4 text-left space-y-2">
                          <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-200">
                              <span className="text-base">💎</span> 500 Diamonds ($5.00 Value)
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-200">
                              <span className="text-base">🛡️</span> 7-Day Swiss Cyber Shield (Immune to Hacks)
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-200">
                              <span className="text-base">⚡</span> Permanent 2X Empire Yield Multiplier
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-200">
                              <span className="text-base">👑</span> Exclusive Title: <span className="text-amber-400">"The Oligarch"</span>
                          </div>
                      </div>
                      <div className="flex flex-col gap-2">
                          <button
                              onClick={() => handleBuyStarterKit('money')}
                              className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-95 transition-all"
                          >
                              PURCHASE NOW FOR $0.99
                          </button>
                          <button
                              onClick={() => handleBuyStarterKit('diamonds')}
                              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-black text-[9px] uppercase tracking-widest rounded-xl border border-amber-500/20 transition-colors"
                          >
                              OR UNLOCK WITH 100 💎
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* INTERACTIVE REVENGE HEIST MINI-GAME */}
      {showRevengeModal && state.revengeTarget && (
          <div className="fixed inset-0 z-[9800] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in zoom-in duration-300">
              <div className="w-full max-w-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-purple-600/30 blur-3xl rounded-full opacity-60 animate-pulse"></div>
                  <div className="bg-zinc-950 border border-red-500/50 rounded-[2.5rem] p-6 text-center relative overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.3)]">
                      <button 
                          onClick={() => setShowRevengeModal(false)}
                          className="absolute top-5 right-5 text-zinc-500 hover:text-white text-lg w-8 h-8 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center transition-colors"
                      >
                          ✕
                      </button>
                      <div className="w-16 h-16 bg-red-600/20 border border-red-500/40 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                          🚨
                      </div>
                      <div className="text-[9px] font-black uppercase text-red-400 tracking-[0.2em] mb-1">
                          COUNTER-BREACH PROTOCOL
                      </div>
                      <h2 className="font-bebas text-3xl text-white tracking-wide">
                          INFILTRATING {state.revengeTarget.botName.toUpperCase()}
                      </h2>
                      <div className="bg-zinc-900/80 p-3 rounded-2xl border border-white/5 my-4">
                          <div className="text-[8px] uppercase font-bold text-zinc-400 mb-0.5">TARGET VAULT BOUNTY</div>
                          <div className="font-bebas text-2xl text-emerald-400">
                              +${formatMoney(state.revengeTarget.stolenAmount * 3)} + 25 💎
                          </div>
                      </div>
                      <p className="text-[9px] text-zinc-400 mb-4 font-mono">
                          Bypass encryption nodes: <span className="text-white font-bold">{revengeStep + 1} / {revengeNodes.length}</span>
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-6">
                          {revengeNodes.map((node, idx) => {
                              const isNext = idx === revengeStep;
                              const isSolved = idx < revengeStep;
                              return (
                                  <button
                                      key={node}
                                      onClick={() => handleTapRevengeNode(node, idx)}
                                      className={`p-3 rounded-xl border font-mono font-bold text-xs uppercase transition-all ${
                                          isSolved 
                                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400' 
                                              : isNext 
                                                  ? 'bg-red-600 text-white border-red-400 animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                                                  : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                                      }`}
                                  >
                                      {isSolved ? 'DECRYPTED' : node}
                                  </button>
                              );
                          })}
                      </div>
                      <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                          TAP THE HIGHLIGHTED CIPHER NODE TO CRACK VAULT
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 7-DAY DAILY LOGIN STREAK REWARDS MODAL */}
      {showDailyModal && (
          <div className="fixed inset-0 z-[9700] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in zoom-in duration-300">
              <div className="w-full max-w-md relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 blur-3xl rounded-full opacity-60 animate-pulse"></div>
                  <div className="bg-zinc-950 border border-amber-500/30 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                      
                      {/* Close Button */}
                      <button 
                          onClick={() => setShowDailyModal(false)}
                          className="absolute top-5 right-5 text-zinc-500 hover:text-white text-lg w-8 h-8 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center transition-colors z-20"
                      >
                          ✕
                      </button>

                      <div className="relative z-10 text-center mb-6">
                          <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                              📅
                          </div>
                          <h2 className="font-bebas text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-wider">
                              DAILY SYNDICATE DIVIDEND
                          </h2>
                          <div className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.3em]">
                              DAY {state.loginStreak || 1} OF 7 • CONSECUTIVE LOGIN STREAK
                          </div>
                      </div>

                      {/* 7-Day Calendar Grid */}
                      <div className="grid grid-cols-4 gap-2 mb-6">
                          {DAILY_REWARDS.map((r) => {
                              const currentStreak = state.loginStreak || 1;
                              const isPast = r.day < currentStreak;
                              const isCurrent = r.day === currentStreak;
                              const isFuture = r.day > currentStreak;

                              return (
                                  <div 
                                      key={r.day}
                                      className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all ${
                                          r.day === 7 ? 'col-span-2 bg-gradient-to-r from-amber-950/40 to-purple-950/40 border-amber-500/50' : ''
                                      } ${
                                          isCurrent
                                              ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.03]'
                                              : isPast
                                                  ? 'bg-zinc-900/60 border-emerald-500/30 text-emerald-400'
                                                  : 'bg-zinc-900/30 border-white/5 opacity-60'
                                      }`}
                                  >
                                      <div className="text-[8px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                                          Day {r.day}
                                      </div>
                                      <div className="text-xl mb-1">{r.icon}</div>
                                      <div className="text-[8px] font-bold text-zinc-200 line-clamp-1 mb-1">
                                          {r.title}
                                      </div>
                                      <div className="text-[7px] font-mono text-zinc-400 line-clamp-1">
                                          {r.desc}
                                      </div>
                                      {isPast && (
                                          <div className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mt-1">✓ CLAIMED</div>
                                      )}
                                      {isCurrent && (
                                          <div className="text-[7px] font-black text-amber-400 uppercase tracking-widest mt-1 animate-pulse">
                                              {state.dailyRewardClaimed ? 'CLAIMED' : 'READY'}
                                          </div>
                                      )}
                                      {isFuture && (
                                          <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mt-1">LOCKED</div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>

                      {/* Action Button */}
                      {!state.dailyRewardClaimed ? (
                          <button
                              onClick={handleClaimDailyReward}
                              className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                          >
                              CLAIM DAY {state.loginStreak || 1} DIVIDEND
                          </button>
                      ) : (
                          <button
                              onClick={() => setShowDailyModal(false)}
                              className="w-full py-4 bg-zinc-900 border border-white/10 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-colors"
                          >
                              TODAY'S DIVIDEND CLAIMED • CLOSE
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* PRESTIGE / LEGACY MODAL */}
      {showPrestigeModal && (
          <div className="fixed inset-0 z-[9600] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-500">
               <div className="w-full max-w-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl rounded-full opacity-50 animate-pulse"></div>
                  <div className="bg-zinc-950 border border-purple-500/30 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.25)]">
                      <div className="absolute top-0 right-0 p-6 opacity-30 animate-spin-slow"><Icons.Legacy /></div>
                      
                      <div className="relative z-10 text-center">
                          <h2 className="font-bebas text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white mb-2">LEGACY PROTOCOL</h2>
                          <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] mb-8">ABDICATION SEQUENCE INITIATED</div>
                          
                          <div className="bg-zinc-900/80 p-6 rounded-3xl border border-white/5 mb-8 backdrop-blur-md">
                              <div className="text-xs text-zinc-400 uppercase font-black tracking-widest mb-4">CURRENT DYNASTY</div>
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Earned Keys</span>
                                  <span className="font-bebas text-3xl text-white">+{potentialKeys} 🔑</span>
                              </div>
                              <div className="w-full bg-zinc-800 h-1 rounded-full mb-2">
                                   <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }}></div>
                              </div>
                              <p className="text-[9px] text-zinc-500 leading-relaxed italic">
                                  "A true empire is built on the ruins of the last."
                                  <br/>
                                  Reset your cash and assets to gain <span className="text-white">Legacy Keys</span>. Each key permanently boosts income by 10%.
                              </p>
                          </div>

                          <div className="flex flex-col gap-3">
                              <button 
                                  onClick={handlePrestige} 
                                  disabled={potentialKeys <= 0}
                                  className={`w-full font-black py-4 rounded-xl uppercase tracking-[0.2em] transition-all ${
                                      potentialKeys > 0 
                                      ? 'bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                                  }`}
                              >
                                  {potentialKeys > 0 ? 'EXECUTE REBOOT' : 'INSUFFICIENT FUNDS'}
                              </button>
                              <button onClick={() => setShowPrestigeModal(false)} className="w-full bg-zinc-900/50 text-zinc-500 font-black py-4 rounded-xl uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-colors border border-white/5">
                                  ABORT
                              </button>
                          </div>
                      </div>
                  </div>
               </div>
          </div>
      )}

      {/* GLOBAL TOAST NOTIFICATIONS */}
      {showToast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[11000] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 ${showToast.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-200' : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'}`}>
              <div className={`text-xl ${showToast.type === 'error' ? 'animate-pulse' : ''}`}>
                  {showToast.type === 'error' ? '⚠️' : '✅'}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{showToast.message}</span>
          </div>
      )}

      {/* BLOOMBERG SATELLITE LIVE FEED POPUP */}
      {activeAlertPopup && (
          <div className="fixed top-20 left-4 right-4 z-[10500] max-w-sm mx-auto animate-in slide-in-from-top-6 fade-in duration-300">
              <div className={`p-4 rounded-2xl border backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative overflow-hidden ${
                  activeAlertPopup.type === 'alert' 
                    ? 'bg-gradient-to-r from-red-950/95 via-zinc-950/95 to-red-950/90 border-red-500/60 shadow-red-500/20' 
                    : activeAlertPopup.type === 'reward' 
                      ? 'bg-gradient-to-r from-emerald-950/95 via-zinc-950/95 to-emerald-950/90 border-emerald-500/60 shadow-emerald-500/20' 
                      : 'bg-gradient-to-r from-amber-950/95 via-zinc-950/95 to-zinc-950/90 border-amber-500/60 shadow-amber-500/20'
              }`}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                  <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shrink-0">
                          {activeAlertPopup.type === 'alert' ? '🚨' : activeAlertPopup.type === 'reward' ? '💰' : '🛰️'}
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">LIVE SATELLITE FEED</span>
                              </div>
                              <button 
                                  onClick={() => setActiveAlertPopup(null)}
                                  className="text-zinc-400 hover:text-white p-1 rounded-lg text-xs"
                              >
                                  ✕
                              </button>
                          </div>
                          <div className="text-xs font-black uppercase text-white truncate tracking-wide">{activeAlertPopup.title}</div>
                          <p className="text-[10px] text-zinc-300 mt-1 line-clamp-2 font-medium leading-relaxed">{activeAlertPopup.message}</p>
                          <div className="mt-2.5 flex items-center justify-between">
                              <span className="text-[8px] font-mono text-zinc-500">BLOOMBERG ORBITAL • {formatTime(activeAlertPopup.timestamp)}</span>
                              <button 
                                  onClick={() => {
                                      setActiveAlertPopup(null);
                                      handleTabChange('market');
                                  }}
                                  className="text-[8px] font-black uppercase px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white tracking-wider active:scale-95 transition-all"
                              >
                                  Open Market →
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* WHALE MONEY BUBBLE - APPEARS RANDOMLY */}
      {whaleSignalData && !isBanned && (
          <button 
            onClick={() => { 
                adContextRef.current = 'whale'; 
                handleWhaleAd(); 
            }} 
            className="absolute top-32 right-0 z-[90] group active:scale-95 transition-transform"
          >
              <div className="relative bg-zinc-900/80 backdrop-blur-md border-l border-t border-b border-cyan-500/50 pl-3 pr-2 py-2 rounded-l-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent animate-pulse"></div>
                  <div className="relative z-10 text-2xl animate-bounce-short">🐋</div>
                  <div className="flex flex-col relative z-10">
                      <span className="text-[8px] font-black uppercase text-cyan-400 leading-none">Whale</span>
                      <span className="text-[8px] font-black uppercase text-white leading-none">Signal</span>
                  </div>
              </div>
          </button>
      )}

      {/* NEW: NEURAL UPLINK AD INTERFACE */}
      {showAdModal && (
          <div className="fixed inset-0 z-[9800] flex items-center justify-center p-6 animate-in zoom-in duration-200 pointer-events-none">
              <div className="pointer-events-auto bg-zinc-950/90 border border-cyan-500/30 p-1 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] w-full max-w-sm backdrop-blur-xl">
                  {/* Holographic Effects */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 animate-pulse"></div>
                  
                  <div className="p-6 relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 bg-cyan-900/20 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/30">
                          <div className="text-3xl animate-pulse">📡</div>
                      </div>
                      
                      <h3 className="font-bebas text-3xl text-white tracking-widest mb-1 text-center">NEURAL UPLINK</h3>
                      <p className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-8 animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
                      
                      {/* Cyber Progress Bar */}
                      <div className="w-full bg-black/50 rounded-full h-3 mb-2 border border-white/10 overflow-hidden relative">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>
                          <div 
                              className="bg-gradient-to-r from-cyan-600 to-blue-400 h-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(6,182,212,0.5)]" 
                              style={{ width: `${(1 - adTimer/5) * 100}%` }}
                          ></div>
                      </div>
                      
                      <div className="flex justify-between w-full text-[8px] font-mono text-zinc-500 mb-8">
                          <span>PACKET_LOSS: 0%</span>
                          <span>ENCRYPTION: AES-256</span>
                      </div>

                      {adTimer > 0 ? (
                          <div className="text-center">
                              <div className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Decryption in progress</div>
                              <div className="font-bebas text-4xl text-white">{adTimer}</div>
                          </div>
                      ) : (
                          <button onClick={completeAd} className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                              INJECT FUNDS
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* FINANCIAL RECORDS MODAL */}
      {showAccountingModal && (
          <div className="fixed inset-0 z-[8800] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in">
              <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl p-6 relative shadow-2xl">
                   <button onClick={() => setShowAccountingModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
                   <h3 className="font-bebas text-2xl text-white tracking-widest mb-6">FINANCIAL RECORDS</h3>
                   
                   <div className="space-y-3 font-mono text-xs">
                       <div className="flex justify-between py-2 border-b border-white/5">
                           <span className="text-zinc-500">Total Revenue</span>
                           <span className="text-emerald-400 font-bold">${formatMoney(state.financials.totalRevenue)}</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-white/5">
                           <span className="text-zinc-500">Expenses</span>
                           <span className="text-red-400 font-bold">-${formatMoney(state.financials.totalExpenses)}</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-white/5">
                           <span className="text-zinc-500">Taxes Paid</span>
                           <span className="text-amber-500 font-bold">-${formatMoney(state.financials.totalTaxes)}</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-white/5">
                           <span className="text-zinc-500">Hack Losses</span>
                           <span className="text-purple-400 font-bold">-${formatMoney(state.financials.totalHackLosses)}</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-white/5">
                           <span className="text-zinc-500">Stock Profits</span>
                           <span className="text-blue-400 font-bold">${formatMoney(state.financials.stockProfits)}</span>
                       </div>
                       <div className="flex justify-between py-2">
                           <span className="text-zinc-500">Best Trade</span>
                           <span className="text-emerald-400 font-bold">+${formatMoney(state.financials.bestTrade)}</span>
                       </div>
                   </div>
              </div>
          </div>
      )}

      {/* MAIL MODAL */}
      {showMailModal && (
          <div className="fixed inset-0 z-[8700] bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-in slide-in-from-right">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bebas text-3xl text-white tracking-widest">ENCRYPTED MAIL</h3>
                  <button onClick={() => setShowMailModal(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
                  {state.stockAlerts.length === 0 && <div className="text-zinc-600 text-center mt-10 font-mono text-xs">NO MESSAGES FOUND</div>}
                  {state.stockAlerts.map(msg => (
                      <div key={msg.id} className={`p-4 rounded-xl border ${msg.type === 'alert' ? 'bg-red-950/20 border-red-900/40' : msg.type === 'reward' ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-zinc-900/40 border-zinc-800'}`}>
                          <div className="flex justify-between mb-1">
                              <span className={`text-[10px] font-black uppercase ${msg.type === 'alert' ? 'text-red-500' : msg.type === 'reward' ? 'text-emerald-500' : 'text-zinc-400'}`}>{msg.title}</span>
                              <span className="text-[9px] text-zinc-600">{formatTime(msg.timestamp)}</span>
                          </div>
                          <p className="text-xs text-zinc-300">{msg.message}</p>
                      </div>
                  ))}
                  
                  {/* Also show reward history as logs */}
                  {state.rewardHistory.length > 0 && <div className="text-[10px] font-black text-zinc-600 uppercase mt-8 mb-2 tracking-widest">ACQUISITION LOG</div>}
                  {state.rewardHistory.map(log => (
                      <div key={log.id} className="flex justify-between items-center p-3 bg-black rounded-lg border border-zinc-800 opacity-70">
                          <div>
                              <div className="text-[9px] text-zinc-500 uppercase">{log.source}</div>
                              {/* Fix implicit any on tier by casting key */}
                              <div className={`text-xs font-bold ${RARITY_COLORS[log.tier as keyof typeof RARITY_COLORS] || 'text-white'}`}>{log.item}</div>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">{log.value}</div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* GUEST GATE MODAL */}
      {showGuestGate && (
        <div className="fixed inset-0 z-[9000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="w-full max-w-sm bg-zinc-950 border border-amber-500/30 rounded-3xl p-8 relative shadow-2xl shadow-amber-900/20">
                <button onClick={() => setShowGuestGate(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
                
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                    <div className="w-8 h-8 text-amber-500"><Icons.Lock /></div>
                </div>
                
                <h3 className="font-bebas text-3xl mb-2 text-white text-center tracking-widest">ACCESS DENIED</h3>
                <p className="text-zinc-400 text-center text-xs mb-8 leading-relaxed font-mono">
                    You are currently operating as a <span className="text-white">GHOST</span> entity. 
                    Full network access requires a verified identity.
                </p>
                
                <div className="space-y-3">
                    <button onClick={() => { setShowGuestGate(false); setAppView('auth'); }} className="w-full py-4 bg-amber-500 text-black font-black uppercase rounded-xl tracking-widest hover:bg-amber-400 transition-all">
                        INITIALIZE ACCOUNT
                    </button>
                    <button onClick={() => setShowGuestGate(false)} className="w-full py-4 bg-zinc-900 text-zinc-500 font-black uppercase rounded-xl tracking-widest hover:bg-zinc-800 transition-all border border-zinc-800">
                        REMAIN GHOST
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* REALITY SHOP MODAL */}
      {showRealityShop && (
          <div className="fixed inset-0 z-[9200] bg-black flex flex-col items-center animate-in zoom-in duration-500 overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
               <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-black pointer-events-none"></div>
               
               <div className="relative z-10 w-full max-w-md h-full flex flex-col p-6">
                   <div className="flex justify-between items-center mb-8">
                       <h2 className="font-bebas text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-widest drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">REALITY BOUTIQUE</h2>
                       <button onClick={() => setShowRealityShop(false)} className="text-zinc-500 hover:text-white uppercase font-black text-xs tracking-widest">EXIT REALITY</button>
                   </div>
                   
                   <p className="text-center text-[10px] font-mono text-purple-300/70 mb-8 uppercase tracking-[0.2em]">"Enough money can buy anything."</p>

                   <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10">
                       {/* REALITY ICONS */}
                       <div className="grid grid-cols-3 gap-3 mb-4">
                           {REALITY_ICONS.map((icon, idx) => {
                               const isOwned = state.ownedAvatars.includes(icon);
                               const isEquipped = state.avatar === icon;
                               return (
                                   <div key={idx} className="flex flex-col gap-2">
                                       <div className={`aspect-square rounded-2xl bg-zinc-900 border overflow-hidden flex items-center justify-center relative ${isEquipped ? 'border-purple-500 ring-2 ring-purple-500/20' : isOwned ? 'border-zinc-700' : 'border-zinc-800'}`}>
                                           <img src={icon} className="w-full h-full object-cover" />
                                       </div>
                                       <button 
                                            onClick={() => {
                                                if (isOwned) {
                                                    toggleCosmetic('avatar', icon);
                                                } else if (state.diamonds >= 1000) {
                                                    triggerHaptic('medium');
                                                    audio.playSfx('buy');
                                                    setState(prev => ({
                                                        ...prev,
                                                        diamonds: prev.diamonds - 1000,
                                                        ownedAvatars: [...prev.ownedAvatars, icon]
                                                    }));
                                                    triggerToast("REALITY ICON ACQUIRED", 'success');
                                                } else {
                                                    triggerToast("NEED 1000 DIAMONDS", 'error');
                                                }
                                            }}
                                            className={`w-full py-2 rounded-lg font-black text-[8px] uppercase tracking-widest ${isEquipped ? 'bg-purple-500 text-black' : isOwned ? 'bg-zinc-800 text-zinc-400' : 'bg-purple-900/50 text-purple-200 border border-purple-500/30'}`}
                                        >
                                            {isEquipped ? 'USED' : isOwned ? 'OWNED' : '1000💎'}
                                        </button>
                                   </div>
                               );
                           })}
                       </div>

                       {BLACK_MARKET_ITEMS.map(item => {
                             const isOwned = state.purchasedCosmetics.includes(item.id) || state.purchasedPermanentIds.includes(item.id) || (item.type === 'title' && state.ownedTitles.includes(item.rewardMeta || '')) || (item.type === 'avatar' && state.ownedAvatars.includes(item.rewardMeta || ''));
                             const currency = item.currency || 'diamonds';
                             const canAfford = currency === 'money' ? state.money >= item.price : state.diamonds >= item.price;
                             let isActive = false;
                             if (item.type === 'cosmetic') isActive = state.equippedCosmetics.nameColor === item.rewardMeta;
                             if (item.type === 'title') isActive = state.equippedCosmetics.titleTag === item.rewardMeta;

                             return (
                                  <div key={item.id} className={`bg-zinc-950/80 border ${isOwned ? 'border-white/20' : 'border-purple-500/30'} p-4 rounded-3xl flex items-center gap-4 relative overflow-hidden group`}>
                                      {item.stock !== undefined && (<div className="absolute top-2 right-2 text-[6px] font-black uppercase text-purple-400 tracking-widest border border-purple-500/30 px-1 rounded">{item.stock > 0 ? `${item.stock}` : 'SOLD OUT'}</div>)}
                                      
                                      <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center border border-purple-500/20 text-purple-300 text-lg">
                                          {(Icons as any)[item.icon] ? React.createElement((Icons as any)[item.icon]) : <Icons.Cosmic />}
                                      </div>
                                      
                                      <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                              <h3 className="font-black uppercase text-xs tracking-wider text-white">{item.name}</h3>
                                              {item.tier && <span className={`text-[6px] font-black uppercase border px-1 rounded ${RARITY_COLORS[item.tier]} ${RARITY_BORDER[item.tier]}`}>{item.tier}</span>}
                                          </div>
                                          <p className="text-[8px] text-zinc-400 uppercase font-bold">{item.description}</p>
                                      </div>
                                      
                                      <button onClick={() => buyImperialItem(item)} disabled={(!isOwned && !canAfford) && item.type !== 'risk'} className={`px-4 py-3 rounded-xl font-black text-[8px] uppercase tracking-widest min-w-[80px] ${isActive ? 'bg-green-500 text-black' : isOwned && item.type !== 'risk' ? 'bg-zinc-800 text-zinc-400' : canAfford ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-zinc-900 text-zinc-600'}`}>
                                          {isActive ? 'ACTIVE' : isOwned && item.type !== 'risk' ? 'OWNED' : `$${formatMoney(item.price)}`}
                                      </button>
                                  </div>
                             );
                       })}
                   </div>
               </div>
          </div>
      )}

      {/* ROYAL DABBA OPENING ANIMATION */}
      {isOpeningDabba && (
          <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
              {!dabbaReward ? (
                  <div className="flex flex-col items-center animate-bounce-short">
                      <div className="text-[100px] animate-spin-slow">📦</div>
                      <div className="mt-8 text-amber-500 font-bebas text-4xl tracking-widest animate-pulse">DECRYPTING SUPPLY DROP...</div>
                  </div>
              ) : (
                  <div className="flex flex-col items-center text-center p-6 animate-in zoom-in duration-300">
                      <div className="relative">
                          <div className={`absolute inset-0 blur-3xl opacity-50 ${RARITY_BG[dabbaReward.tier]}`}></div>
                          <div className={`text-6xl mb-6 relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]`}>{dabbaReward.name.includes("AVATAR") ? "👤" : dabbaReward.name.includes("TOKEN") ? "🌐" : "💰"}</div>
                      </div>
                      <h2 className={`font-bebas text-5xl mb-2 ${RARITY_COLORS[dabbaReward.tier]} drop-shadow-lg`}>{dabbaReward.name}</h2>
                      <p className="text-white text-xl font-bold uppercase tracking-widest mb-8">{dabbaReward.val}</p>
                      <button onClick={closeGacha} className="bg-white text-black font-black py-4 px-12 rounded-full uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl">CLAIM REWARD</button>
                  </div>
              )}
          </div>
      )}

      {/* NEW: SOVEREIGN ID PROFILE */}
      {showProfileModal && (
          <div className="fixed inset-0 z-[8500] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-300">
              <div className="w-full max-w-sm relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  
                  <div className="bg-zinc-950/90 border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-2xl backdrop-blur-2xl">
                      <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 z-20 text-white/50 hover:text-white p-2">✕</button>
                      
                      {/* Banner Header */}
                      <div className="h-32 w-full relative overflow-hidden transition-colors duration-500" style={{ backgroundColor: state.userBannerColor }}>
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/90"></div>
                      </div>

                      <div className="px-8 pb-8 relative -mt-16 text-center">
                          {/* Avatar */}
                          <div className="mx-auto w-28 h-28 rounded-[2rem] bg-zinc-900 border-4 border-zinc-950 flex items-center justify-center text-5xl shadow-2xl relative group cursor-pointer overflow-hidden" onClick={() => setShowCosmeticPicker('avatar')}>
                              {state.avatar.startsWith('/') || state.avatar.startsWith('http') ? <img src={state.avatar} className="w-full h-full object-cover" /> : state.avatar}
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] font-black uppercase text-white tracking-widest">CHANGE</span>
                              </div>
                          </div>

                          {/* Identity */}
                          {editingName ? (
                              <div className="mt-4 space-y-4 animate-in fade-in">
                                  <div>
                                      <label className="text-[8px] font-black uppercase text-zinc-500 mb-1 block">Codename</label>
                                      <input 
                                          autoFocus
                                          value={editingName} 
                                          onChange={e => setEditingName(e.target.value)} 
                                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-center text-white font-bebas text-xl tracking-widest outline-none focus:border-amber-500 transition-colors"
                                          placeholder="ENTER ALIAS"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[8px] font-black uppercase text-zinc-500 mb-2 block">Signal Color</label>
                                      <div className="flex justify-center gap-2">
                                          {BANNER_COLORS.map(c => (
                                              <button 
                                                  key={c}
                                                  onClick={() => setEditingBanner(c)}
                                                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${editingBanner === c ? 'border-white scale-110' : 'border-transparent'}`}
                                                  style={{ backgroundColor: c }}
                                              />
                                          ))}
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <button onClick={updateProfile} className="bg-white text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200">CONFIRM</button>
                                      <button onClick={() => { setEditingName(''); setShowProfileModal(false); }} className="bg-zinc-800 text-zinc-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-white">CANCEL</button>
                                  </div>
                              </div>
                          ) : (
                              <div className="mt-4">
                                  <div className="flex items-center justify-center gap-2 mb-1">
                                      <h2 className="text-3xl font-bebas text-white tracking-widest">{state.userName}</h2>
                                      {state.isVIP && <span className="text-amber-400 text-sm drop-shadow-md" title="VIP Status">👑</span>}
                                  </div>
                                  
                                  <div onClick={() => setShowCosmeticPicker('title')} className="cursor-pointer group relative inline-block mb-6">
                                      {state.equippedCosmetics.titleTag ? (
                                          <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-colors">
                                              {state.equippedCosmetics.titleTag}
                                          </div>
                                      ) : (
                                          <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest group-hover:text-zinc-400">NO TITLE ASSIGNED</div>
                                      )}
                                      <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-zinc-500">
                                          ✏️
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 mb-6">
                                      <div className="bg-zinc-900/50 p-2 rounded-xl border border-white/5">
                                          <div className="text-[8px] text-zinc-500 font-black uppercase">Rank</div>
                                          <div className="text-emerald-400 font-bebas text-lg">{currentRank.name}</div>
                                      </div>
                                      <div className="bg-zinc-900/50 p-2 rounded-xl border border-white/5">
                                          <div className="text-[8px] text-zinc-500 font-black uppercase">Legacy</div>
                                          <div className="text-purple-400 font-bebas text-lg">{state.prestigeCount}</div>
                                      </div>
                                      <div className="bg-zinc-900/50 p-2 rounded-xl border border-white/5">
                                          <div className="text-[8px] text-zinc-500 font-black uppercase">Net Worth</div>
                                          <div className="text-amber-400 font-bebas text-lg">${formatMoney(state.money)}</div>
                                      </div>
                                  </div>

                                  <button 
                                      onClick={() => { setEditingName(state.userName); setEditingBanner(state.userBannerColor); }}
                                      className="w-full bg-zinc-800/50 border border-white/5 text-zinc-400 font-black py-3 rounded-xl uppercase tracking-widest text-[9px] hover:bg-zinc-800 hover:text-white transition-all"
                                  >
                                      EDIT IDENTITY
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* GIFT MODAL (RED PACKET) */}
      {showGiftModal && (
          <div className="fixed inset-0 z-[9000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-sm bg-zinc-950 border border-red-900/50 rounded-3xl p-6 relative">
                  <button onClick={() => setShowGiftModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
                  <div className="flex flex-col items-center mb-6">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(220,38,38,0.4)] mb-3">🧧</div>
                      <h3 className="font-bebas text-2xl text-white tracking-widest">SEND RED PACKET</h3>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-zinc-500">INVENTORY</span>
                        <span className="font-bebas text-xl text-white">{state.giftBoxes} BOXES</span>
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Total Amount ($)</label>
                          <input autoFocus type="number" value={giftAmountConfig} onChange={e => setGiftAmountConfig(Number(e.target.value))} className="w-full bg-zinc-900 p-3 rounded-xl text-white font-mono border border-zinc-800 focus:border-red-500 outline-none" />
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Number of Claims</label>
                          <input type="number" min="1" max="50" value={giftClaimsConfig} onChange={e => setGiftClaimsConfig(Number(e.target.value))} className="w-full bg-zinc-900 p-3 rounded-xl text-white font-mono border border-zinc-800 focus:border-red-500 outline-none" />
                      </div>
                  </div>
                  
                  <button onClick={handleDropGift} disabled={state.giftBoxes <= 0} className={`w-full font-black py-4 rounded-xl uppercase tracking-[0.2em] shadow-lg ${state.giftBoxes > 0 ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
                      {state.giftBoxes > 0 ? 'DEPLOY PACKET' : 'NO BOXES AVAILABLE'}
                  </button>
              </div>
          </div>
      )}

      {/* COSMETIC PICKER */}
      {showCosmeticPicker && (
          <div className="fixed inset-0 z-[8600] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-6 relative">
                  <button onClick={() => setShowCosmeticPicker(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
                  <h3 className="font-bebas text-2xl mb-6 text-white tracking-widest">{showCosmeticPicker === 'title' ? 'SELECT TITLE' : 'SELECT AVATAR'}</h3>
                  
                  <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto no-scrollbar">
                      {showCosmeticPicker === 'title' ? (
                          (() => {
                            const allTitles = Array.from(new Set([
                                'Novice',
                                'Cash Cow',
                                ...state.ownedTitles,
                                ...BLACK_MARKET_ITEMS.filter(i => i.type === 'title').map(i => i.rewardMeta as string)
                            ]));
                            return allTitles.map(title => {
                                const isOwned = state.ownedTitles.includes(title);
                                const isEquipped = state.equippedCosmetics.titleTag === title;
                                return (
                                  <button 
                                      key={title} 
                                      onClick={() => isOwned && toggleCosmetic('title', title)}
                                      className={`p-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all relative overflow-hidden ${
                                          isEquipped ? 'bg-amber-500 text-black border-amber-500' : 
                                          isOwned ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white' : 
                                          'bg-black/40 text-zinc-700 border-zinc-900/50 cursor-not-allowed'
                                      }`}
                                  >
                                      {title}
                                      {!isOwned && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Icons.Lock /></div>}
                                  </button>
                                );
                            });
                        })()
                      ) : (
                          (() => {
                              // Unified Avatar List (Owned + All Locked)
                              const allAvatars = Array.from(new Set([
                                  ...state.ownedAvatars,
                                  ...AVATAR_OPTIONS,
                                  ...PREMIUM_AVATARS,
                                  ...RARE_AVATARS,
                                  ...ULTRA_RARE_AVATARS
                              ]));
                              
                              return allAvatars.map((av, i) => {
                                  const isOwned = state.ownedAvatars.includes(av);
                                  return (
                                      <button 
                                          key={av} 
                                          onClick={() => {
                                              if (isOwned) {
                                                  toggleCosmetic('avatar', av);
                                              } else {
                                                  const meta = getAvatarMetadata(av);
                                                  setSelectedItemInfo({
                                                      name: `Locked Cosmetic`,
                                                      description: "Unlock this avatar via Shop or Events.",
                                                      rarity: meta.rarity,
                                                      obtain: meta.obtain,
                                                      icon: av
                                                  });
                                              }
                                          }}
                                          onContextMenu={(e) => { e.preventDefault(); /* potential long press handler hook */ }}
                                          className={`aspect-square rounded-xl relative overflow-hidden text-2xl flex items-center justify-center border transition-all ${
                                              state.avatar === av ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/50' : 
                                              isOwned ? 'bg-black border-zinc-800 hover:bg-white/10' : 
                                              'bg-black/40 border-zinc-900 opacity-60'
                                          }`}
                                      >
                                          <img src={av} alt="Avatar" className={`w-full h-full object-cover ${!isOwned ? 'grayscale opacity-50' : ''}`} />
                                          {!isOwned && (
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                                  <div className="w-5 h-5 text-zinc-500"><Icons.Lock /></div>
                                              </div>
                                          )}
                                      </button>
                                  );
                              });
                          })()
                      )}

                      {showCosmeticPicker === 'title' && (
                          <div className="col-span-3 mt-4">
                             <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto no-scrollbar py-2 content-start">
                                 {ALL_TITLES.map(title => {
                                    const isOwned = state.ownedTitles.includes(title.id);
                                    const isEquipped = state.equippedCosmetics.titleTag === title.id;
                                    return (
                                        <button 
                                            key={title.id} 
                                            onClick={() => {
                                                setSelectedItemInfo({
                                                    name: title.id,
                                                    description: `A ${title.rarity} title for your profile.`,
                                                    rarity: title.rarity,
                                                    obtain: isOwned ? "Owned" : "Find in Shop / Black Market",
                                                    icon: undefined
                                                });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all relative ${
                                                isEquipped ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' : 
                                                isOwned ? 'bg-zinc-800 text-white border-zinc-700 hover:border-zinc-500' : 
                                                'bg-black/40 text-zinc-600 border-zinc-900 border-dashed'
                                            }`}
                                        >
                                            {title.id}
                                            {!isOwned && <span className="ml-2">🔒</span>}
                                        </button>
                                    );
                                 })}
                             </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* ITEM INFO MODAL */}
      {selectedItemInfo && (
        <div className="fixed inset-0 z-[9600] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setSelectedItemInfo(null)}>
            <div className="w-full max-w-xs bg-zinc-900 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    {selectedItemInfo.icon ? (
                       <div className="w-24 h-24 rounded-full border-4 border-white/5 overflow-hidden mb-4 shadow-lg">
                           <img src={selectedItemInfo.icon} className="w-full h-full object-cover" />
                       </div>
                    ) : (
                       <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center mb-4 text-2xl font-black text-zinc-500 uppercase tracking-widest">TAG</div>
                    )}
                    
                    <h3 className="font-bebas text-3xl text-white mb-1">{selectedItemInfo.name}</h3>
                    <div className={`text-[9px] font-black uppercase mb-4 px-2 py-0.5 rounded ${
                        selectedItemInfo.rarity === 'legendary' || selectedItemInfo.rarity === 'exotic' ? 'bg-amber-500/20 text-amber-500' : 
                        selectedItemInfo.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' : 
                        selectedItemInfo.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' : 
                        'bg-zinc-800 text-zinc-500'
                    }`}>{selectedItemInfo.rarity}</div>

                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{selectedItemInfo.description}</p>
                    
                    <div className="w-full bg-zinc-950/50 rounded-xl p-3 border border-white/5 mb-6">
                        <div className="text-[8px] font-black text-zinc-600 uppercase mb-1">Source</div>
                        <div className="text-xs text-zinc-300">{selectedItemInfo.obtain}</div>
                    </div>

                    {/* Action Button */}
                    {showCosmeticPicker === 'avatar' && selectedItemInfo.icon && (
                        <button 
                            onClick={() => {
                                setState(p => ({...p, avatar: selectedItemInfo.icon! }));
                                setSelectedItemInfo(null);
                                setShowCosmeticPicker(null);
                                triggerToast("AVATAR EQUIPPED", 'success');
                            }}
                            className="w-full py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Equip Avatar
                        </button>
                    )}

                    {showCosmeticPicker === 'title' && (
                         state.ownedTitles.includes(selectedItemInfo.name) ? (
                            <button 
                                onClick={() => {
                                    setState(p => ({...p, equippedCosmetics: { ...p.equippedCosmetics, titleTag: selectedItemInfo.name } }));
                                    setSelectedItemInfo(null);
                                    setShowCosmeticPicker(null);
                                    triggerToast("TITLE EQUIPPED", 'success');
                                }}
                                className="w-full py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                Equip Title
                            </button>
                         ) : (
                            <button disabled className="w-full py-3 bg-zinc-800 text-zinc-600 font-black uppercase text-xs rounded-xl cursor-not-allowed">
                                Locked
                            </button>
                         )
                    )}

                </div>
            </div>
        </div>
      )}

      {/* HACKER MODAL */}
      {selectedHacker && (
          <div className="fixed inset-0 z-[9500] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="w-full max-w-sm bg-zinc-950 border border-red-500/30 rounded-[2rem] p-6 relative overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.15)]">
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-900/20 to-transparent pointer-events-none"></div>
                  <button onClick={() => setSelectedHacker(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2">✕</button>
                  <div className="flex flex-col items-center mb-6 relative z-10">
                      <div className="w-20 h-20 bg-red-950/50 rounded-2xl flex items-center justify-center text-4xl border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.2)] mb-4">👾</div>
                      <h3 className="font-bebas text-3xl text-white tracking-widest leading-none">CONTRACT NEGOTIATION</h3>
                      <div className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">{selectedHacker.tier} CLASS</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="text-[8px] font-black text-zinc-600 uppercase">Success Rate</div>
                          <div className="text-xl font-bebas text-emerald-500">{Math.floor(selectedHacker.successRate * 100)}%</div>
                      </div>
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="text-[8px] font-black text-zinc-600 uppercase">Detection Risk</div>
                          <div className="text-xl font-bebas text-red-500">{Math.floor(selectedHacker.detectionRate * 100)}%</div>
                      </div>
                  </div>
                  <div className="space-y-4 relative z-10">
                      <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase block mb-2 tracking-wider">Target Identity (Username/ID)</label>
                          <input autoFocus type="text" value={hackTargetInput} onChange={(e) => setHackTargetInput(e.target.value)} placeholder="ENTER TARGET ID..." className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-4 px-4 text-white font-mono text-sm outline-none focus:border-red-500 focus:bg-zinc-900 transition-all uppercase placeholder:text-zinc-700" />
                          <p className="text-[8px] text-zinc-500 mt-1 italic">Tip: You can try to hack 'Zenith'... at your own risk.</p>
                      </div>
                      <div className="flex items-center justify-between bg-red-900/10 p-3 rounded-xl border border-red-900/20">
                          <span className="text-[10px] font-black text-red-400 uppercase">Service Fee</span>
                          <span className="font-bebas text-xl text-white">${formatMoney(selectedHacker.cost)}</span>
                      </div>
                      <button onClick={handleExecuteContract} disabled={!hackTargetInput.trim()} className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all ${hackTargetInput.trim() ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>SIGN & DEPLOY</button>
                  </div>
              </div>
          </div>
      )}

      {/* Header and Main Content */}
      <div className="bg-zinc-900/90 backdrop-blur-md border-b border-white/5 py-2 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] flex justify-between items-center z-[100] sticky top-0 shadow-xl">
        <button onClick={() => { audio.toggleMute(); setIsMuted(audio.isMuted()); }} className="text-zinc-500 hover:text-white transition-colors text-xl w-10 h-10 flex items-center justify-center rounded-full active:bg-zinc-800">{isMuted ? '🔇' : '🔊'}</button>
        
        {/* HYPE PROTOCOL WIDGET IN HEADER */}
        <button 
            onClick={() => {
                if (!state.adBoostActive || currentTime > state.adBoostEndTime) {
                    adContextRef.current = 'boost';
                    handleWatchAd();
                }
            }}
            className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all active:scale-95 ${state.adBoostActive && currentTime < state.adBoostEndTime ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30 animate-pulse'}`}
        >
            {state.adBoostActive && currentTime < state.adBoostEndTime ? (
                <>
                    <div className="text-[8px] font-black text-green-500 uppercase tracking-widest">HYPE ACTIVE</div>
                    <div className="text-xs font-mono text-white">{Math.ceil((state.adBoostEndTime - currentTime) / 1000)}s</div>
                </>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">ACTIVATE HYPE</span>
                    <span className="text-amber-400 text-xs">⚡</span>
                </div>
            )}
        </button>

        <div className="flex items-center gap-3">
           <button onClick={() => setShowMailModal(true)} className="relative text-zinc-500 hover:text-white transition-colors w-10 h-10 flex items-center justify-center rounded-full active:bg-zinc-800">
               <div className="w-5 h-5"><Icons.Email /></div>
               {state.stockAlerts.some(a => !a.read) && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
           </button>
           {!isOnline && (<div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" title="Offline Mode"></div>)}
           <button onClick={() => setShowDiamondStore(true)} className="flex items-center gap-1 text-amber-500 font-black text-[10px] bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 active:scale-90 transition-transform"><div className="w-3 h-3"><Icons.Diamond /></div> {state.diamonds}</button>
        </div>
      </div>

      <header className="pt-4 px-6 pb-4 shrink-0 text-center relative z-10 bg-gradient-to-b from-zinc-950/95 via-black/90 to-transparent backdrop-blur-md" onMouseDown={handleGlobalTap} onTouchStart={handleGlobalTap}>
        {(state.adBoostActive || state.isGreedActive) && (
            <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-yellow-500 text-black text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.4)]">⚡ x{((state.adBoostActive ? 2 : 1) * (state.isGreedActive ? 2 : 1)).toFixed(1)} BOOST ACTIVE</span>
            </div>
        )}
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-1 mt-1">Total Net Worth</div>
        <div className="min-w-0 flex items-center justify-center">
            <h1 className="font-bebas money-text leading-tight tabular-nums drop-shadow-2xl overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:scale-[1.01] active:scale-95 transition-transform" style={{ fontSize: 'clamp(2.4rem, 12vw, 4.2rem)', maxWidth: '100%' }}>${formatMoney(displayMoney)}</h1>
        </div>
        <div className="mt-2.5 flex flex-col items-center">
          <div className="bg-emerald-950/40 border border-emerald-500/30 px-5 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-sm"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div><span className="text-emerald-400 font-black text-[11px] tracking-widest uppercase">+${formatYield(Number(currentIps))}/s Yield</span></div>
        </div>
        <div className="fixed inset-0 pointer-events-none z-[1000]">
           {tapParticles.map(p => (
             <div key={p.id} className="absolute font-bebas text-3xl text-amber-400 animate-float-up whitespace-nowrap drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" style={{ left: p.x, top: p.y }}>{p.text}</div>
           ))}
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto relative z-0 no-scrollbar ${activeTab === 'chat' ? 'p-0 pb-0' : 'p-6 space-y-6 pb-32'}`}>
        {activeTab === 'portfolio' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
             {/* WHALE STARTER KIT PROMO BANNER */}
             {!state.starterKitPurchased && (
               <div 
                 onClick={() => setShowStarterKitModal(true)} 
                 className="bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-900/30 p-3.5 rounded-2xl border border-amber-400/40 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-98 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
               >
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-xl shadow-inner border border-amber-400/40">⚡</div>
                   <div>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">WHALE STARTER KIT</span>
                       <span className="text-[7px] bg-red-600 text-white font-black px-1 rounded uppercase">85% OFF</span>
                     </div>
                     <div className="text-[8px] text-zinc-400 font-bold uppercase">500💎 + Swiss Shield + 2x Permanent Yield</div>
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="font-bebas text-lg text-amber-400">$0.99</div>
                   <div className="text-[7px] font-mono text-zinc-500">LIMITED DEAL</div>
                 </div>
               </div>
             )}

             {/* REVENGE HEIST ACTIVE BANNER */}
             {state.revengeTarget && Date.now() < state.revengeTarget.expiresAt && (
               <div 
                 onClick={handleStartRevengeHeist} 
                 className="bg-gradient-to-r from-red-950/60 via-red-900/40 to-black p-3.5 rounded-2xl border border-red-500/60 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-98 transition-all animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.3)]"
               >
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center text-xl border border-red-500/50">🚨</div>
                   <div>
                     <div className="text-[10px] font-black uppercase tracking-wider text-red-400">REVENGE HEIST ACTIVE</div>
                     <div className="text-[8px] text-zinc-300 font-bold uppercase">Breach {state.revengeTarget.botName} to steal back 300% (${formatMoney(state.revengeTarget.stolenAmount * 3)})</div>
                   </div>
                 </div>
                 <div className="bg-red-600 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-xl shadow-lg">
                   HACK NOW
                 </div>
               </div>
             )}

             {(() => {
                let lastTier = -1;
                return visibleAssets.map(a => {
                    const tier = Math.floor(Math.log10(Math.max(1, a.baseCost)) / 3);
                    const showHeader = tier > lastTier;
                    if (showHeader) lastTier = tier;
                    
                    const tierNames: Record<number, string> = {
                        0: "STREET LEVEL",
                        1: "LOCAL OPERATIONS",
                        2: "MILLIONS",
                        3: "BILLIONS",
                        4: "TRILLIONS",
                        5: "QUADRILLIONS",
                        6: "QUINTILLIONS",
                        7: "SEXTILLIONS",
                        8: "SEPTILLIONS",
                        9: "OCTILLIONS",
                        10: "NONILLIONS",
                        11: "DECILLIONS"
                    };

                    return (
                       <React.Fragment key={a.id}>
                           {showHeader && (
                               <div className="py-2.5 my-3 first:mt-0 flex items-center gap-3">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/60 border border-white/5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{tierNames[tier] || `TIER ${tier}`}</span>
                                    </div>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                               </div>
                           )}
                           <AssetCard 
                              asset={a} 
                              playerMoney={state.money} 
                              playerDiamonds={state.diamonds}
                              isHardened={state.hardenedAssetIds.includes(a.id)}
                              onBuy={(id) => {
                                const asset = state.assets.find(as => as.id === id)!;
                                
                                // REALITY EDITOR SPECIAL LOGIC
                                if (asset.id === 'reality_engine' && asset.count > 0) {
                                    setShowRealityShop(true);
                                    triggerHaptic('heavy');
                                    return;
                                }

                                const cost = Math.floor(asset.baseCost * Math.pow(1.22, asset.count) * getLevelCostMultiplier(getLevel(asset.count)));
                                if (state.money >= cost) {
                                  triggerHaptic('medium');
                                  audio.playSfx('buy');
                                  setState(prev => ({
                                    ...prev, money: prev.money - cost,
                                    assets: prev.assets.map(as => as.id === id ? { ...as, count: as.count + 1, level: getLevel(as.count + 1) } : as)
                                  }));
                                  if (asset.id === 'reality_engine') {
                                      setTimeout(() => setShowRealityShop(true), 500);
                                      addNotification("SINGULARITY", "Welcome to the Reality Editor.", 'system');
                                      setState(prev => ({ ...prev, realityUnlocked: true }));
                                  }
                                }
                              }}
                              onHarden={hardenAsset}
                           />
                       </React.Fragment>
                    );
                });
             })()}
          </div>
        )}
        
        {activeTab === 'market' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Market Header - Portfolio Summary (Only shown on non-detail views) */}
              {marketView !== 'detail' && (
                <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/20 via-zinc-900/40 to-transparent pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1">Portfolio Valuation</div>
                                <div className="font-bebas text-4xl text-white tracking-wide">$${formatMoney(totalPortfolioValue)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1">Today's P&L</div>
                                <div className={`font-mono text-sm font-bold ${portfolioDayChangeVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {portfolioDayChangeVal >= 0 ? '+' : ''}$${formatMoney(Math.abs(portfolioDayChangeVal))} ({portfolioDayChangeVal >= 0 ? '+' : ''}{portfolioDayChangePct.toFixed(2)}%)
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-white/5 text-[10px]">
                            <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 font-bold uppercase">Buying Power:</span>
                                <span className="font-mono font-bold text-amber-400">$${formatMoney(state.money)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 font-bold uppercase">Unrealized:</span>
                                <span className={`font-mono font-bold ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {totalUnrealizedPnL >= 0 ? '+' : ''}$${formatMoney(Math.abs(totalUnrealizedPnL))} ({totalUnrealizedPnL >= 0 ? '+' : ''}{totalUnrealizedPnLPercent.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* View Switcher (Safe navigation: Always resets selectedStockId) */}
              {marketView !== 'detail' && (
                <div className="flex bg-zinc-900/80 p-1 rounded-2xl border border-white/10 shadow-lg">
                    <button 
                        onClick={() => handleSwitchMarketTab('list')} 
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${marketView === 'list' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Exchange
                    </button>
                    <button 
                        onClick={() => handleSwitchMarketTab('portfolio')} 
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${marketView === 'portfolio' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Holdings {Object.values(state.stockPortfolio).filter(p => p.shares > 0).length > 0 && `(${Object.values(state.stockPortfolio).filter(p => p.shares > 0).length})`}
                    </button>
                    <button 
                        onClick={() => handleSwitchMarketTab('watchlist')} 
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${marketView === 'watchlist' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Watchlist
                    </button>
                    <button 
                        onClick={() => handleSwitchMarketTab('orders')} 
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 ${marketView === 'orders' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Orders {(state.tradeOrders || []).some(o => o.status === 'pending') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        )}
                    </button>
                    <button 
                        onClick={() => handleSwitchMarketTab('margin')} 
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 ${marketView === 'margin' ? 'bg-amber-400 text-black shadow-md' : 'text-amber-400/80 hover:text-amber-300'}`}
                    >
                        Margin {state.marginLoan && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                    </button>
                </div>
              )}

              {/* EMERGENCY MARGIN CALL ALERT BANNER */}
              {state.marginCallWarningUntil && state.marginCallWarningUntil > Date.now() && (
                <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 rounded-3xl border border-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🚨</span>
                        <div>
                            <div className="font-bebas text-lg leading-none tracking-wider">MARGIN CALL IN PROGRESS</div>
                            <div className="text-[10px] text-red-100 font-mono">
                                Collateral ratio &lt; 130%. Broker liquidation in {Math.max(0, Math.ceil((state.marginCallWarningUntil - Date.now()) / 1000))}s!
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleSwitchMarketTab('margin')}
                        className="px-4 py-2 bg-white text-black font-black text-xs uppercase rounded-xl shadow hover:scale-105 active:scale-95 transition-all"
                    >
                        Cure Loan →
                    </button>
                </div>
              )}

              {/* 1. EXCHANGE VIEW */}
              {marketView === 'list' && !selectedStockId && (
                <div className="space-y-4 animate-in fade-in">
                    {/* INSIDER WIRETAP TERMINAL */}
                    {!state.insiderLeak || Date.now() > state.insiderLeak.targetTime ? (
                        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900/60 to-black p-4 rounded-3xl border border-amber-500/30 relative overflow-hidden group shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">INSIDER WIRETAP // LEAK RADAR</span>
                                </div>
                                <span className="text-[7px] font-mono text-zinc-500 bg-black/60 px-2 py-0.5 rounded border border-white/5">TOP SECRET</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                                Decrypt confidential memos to front-run guaranteed 2x-4x stock surges or short sudden crashes before the public.
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleUnlockInsiderLeak('ad')}
                                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                    <span>📺</span> DECRYPT VIA AD
                                </button>
                                <button 
                                    onClick={() => handleUnlockInsiderLeak('diamonds')}
                                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-400 font-black text-[9px] uppercase tracking-wider rounded-xl transition-all border border-amber-500/20 flex items-center gap-1"
                                >
                                    <span>💎</span> 20
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-4 rounded-3xl border relative overflow-hidden shadow-xl animate-in zoom-in-95 duration-300 ${
                            state.insiderLeak.type === 'pump' 
                                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                : 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${state.insiderLeak.type === 'pump' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    🚨 LEAK ACTIVE: {state.insiderLeak.stockId} ({state.insiderLeak.type.toUpperCase()})
                                </span>
                                <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10 animate-pulse">
                                    ⏱ {Math.max(0, Math.ceil((state.insiderLeak.targetTime - Date.now()) / 1000))}s
                                </span>
                            </div>
                            <p className="text-[11px] font-semibold text-white mb-2 leading-relaxed">{state.insiderLeak.headline}</p>
                            <div className="text-[8px] font-mono text-zinc-400 uppercase">
                                Guaranteed {state.insiderLeak.multiplier}x impact on {state.insiderLeak.stockId}. Trade now!
                            </div>
                        </div>
                    )}

                    {/* Search & Category Filter */}
                    <div className="space-y-2">
                        <div className="relative">
                            <input 
                                type="text"
                                value={marketSearchQuery}
                                onChange={(e) => setMarketSearchQuery(e.target.value)}
                                placeholder="🔍 Search ticker, company, or sector..."
                                className="w-full bg-zinc-900/60 border border-white/10 rounded-2xl py-2.5 pl-4 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                            {marketSearchQuery && (
                                <button 
                                    onClick={() => setMarketSearchQuery('')}
                                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            {[
                                { id: 'all', label: 'All Markets' },
                                { id: 'stock', label: 'Stocks' },
                                { id: 'crypto', label: 'Crypto' },
                                { id: 'gainers', label: '🚀 Gainers' },
                                { id: 'losers', label: '📉 Losers' }
                            ].map(cat => (
                                <button 
                                    key={cat.id}
                                    onClick={() => setMarketCategory(cat.id as any)} 
                                    className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase whitespace-nowrap border transition-all ${marketCategory === cat.id ? 'bg-zinc-800 text-white border-zinc-500 shadow-md' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stock List */}
                    <div className="space-y-2">
                        {filteredStocks.length === 0 ? (
                            <div className="text-center py-10 bg-zinc-900/20 rounded-3xl border border-white/5">
                                <div className="text-2xl mb-2">🔍</div>
                                <div className="font-bebas text-lg text-zinc-400">NO ASSETS MATCHED</div>
                                <p className="text-[10px] text-zinc-600 mt-1">Try clearing your search query or filter</p>
                            </div>
                        ) : (
                            filteredStocks.map(stock => {
                                const open = stock.openPrice || stock.history[0] || stock.price;
                                const diff = stock.price - open;
                                const pct = open > 0 ? (diff / open) * 100 : 0;
                                const isStarred = watchlistSet.has(stock.id);

                                return (
                                    <div 
                                        key={stock.id} 
                                        onClick={() => openStockDetail(stock.id)}
                                        className="bg-zinc-900/40 hover:bg-zinc-900/70 active:scale-[0.99] p-3.5 sm:p-4 rounded-2xl border border-white/5 hover:border-white/10 flex items-center justify-between transition-all cursor-pointer group shadow-sm"
                                    >
                                         <div className="flex items-center gap-3 min-w-0 flex-1">
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock.id); }}
                                                className={`text-base p-1 transition-transform active:scale-125 ${isStarred ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                title={isStarred ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                             >
                                                {isStarred ? '★' : '☆'}
                                             </button>
                                             
                                             <div className="w-10 h-10 rounded-xl bg-black/60 flex items-center justify-center text-lg border border-white/10 shrink-0">
                                                 {stock.icon || (stock.category === 'crypto' ? '🪙' : '📈')}
                                             </div>
                                             
                                             <div className="min-w-0 flex-1">
                                                 <div className="flex items-center gap-1.5">
                                                     <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">{stock.id}</span>
                                                     <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">{stock.sector || stock.category}</span>
                                                 </div>
                                                 <div className="text-[10px] text-zinc-400 truncate">{stock.name}</div>
                                             </div>
                                         </div>
                                         
                                         {/* Mini Sparkline Visualization */}
                                         <div className="w-16 h-8 opacity-75 hidden sm:block shrink-0 px-2">
                                             <StockChart history={stock.history.slice(-15)} color={diff >= 0 ? '#10b981' : '#ef4444'} />
                                         </div>

                                         <div className="text-right shrink-0 ml-3">
                                             <div className="font-mono text-sm font-bold text-white">$${stock.price.toFixed(2)}</div>
                                             <div className={`text-[10px] font-bold font-mono ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                 {diff >= 0 ? '+' : ''}{pct.toFixed(2)}%
                                             </div>
                                         </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
              )}

              {/* 2. HOLDINGS / PORTFOLIO VIEW */}
              {marketView === 'portfolio' && !selectedStockId && (
                  <div className="space-y-6 animate-in fade-in">
                       {/* Portfolio Pie Chart */}
                       {Object.keys(state.stockPortfolio).some(id => state.stockPortfolio[id].shares > 0) && (
                          <div className="flex flex-col items-center justify-center py-6 bg-zinc-900/30 rounded-3xl border border-white/5">
                              <PieChart 
                                data={state.stocks.map(s => {
                                   const pos = state.stockPortfolio[s.id];
                                   if (!pos || pos.shares <= 0) return null;
                                   return {
                                     label: s.name,
                                     value: pos.shares * s.price,
                                     color: s.category === 'crypto' ? '#818cf8' : s.trend === 'up' ? '#10b981' : '#f59e0b' 
                                   };
                                }).filter(Boolean) as any}
                              />
                              <div className="mt-4 flex gap-4 text-[10px] font-black uppercase text-zinc-500">
                                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Stocks</div>
                                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div>Crypto</div>
                              </div>
                          </div>
                       )}

                       {/* Positions List */}
                       {Object.keys(state.stockPortfolio).filter(id => state.stockPortfolio[id]?.shares > 0).length === 0 ? (
                            <div className="text-center py-12 px-6 bg-zinc-900/30 rounded-3xl border border-white/5 shadow-inner">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">📈</div>
                                <h3 className="font-bebas text-2xl text-white tracking-wide">NO ACTIVE POSITIONS</h3>
                                <p className="text-xs text-zinc-400 mt-2 mb-6 max-w-xs mx-auto leading-relaxed">
                                    Your brokerage account has <strong className="text-amber-400">$${formatMoney(state.money)}</strong> in buying power ready to trade.
                                </p>
                                <button 
                                    onClick={() => handleSwitchMarketTab('list')}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
                                >
                                    Explore All Stocks & Cryptos →
                                </button>
                            </div>
                       ) : (
                            <div className="space-y-3">
                                {Object.entries(state.stockPortfolio).map(([id, pos]) => {
                                    if (pos.shares <= 0 || !state.stocks.find(s => s.id === id)) return null;
                                    const stock = state.stocks.find(s => s.id === id)!;
                                    const value = pos.shares * stock.price;
                                    const avgCost = pos.avgBuyPrice * pos.shares;
                                    const gl = value - avgCost;
                                    const glPercent = avgCost > 0 ? (gl / avgCost) * 100 : 0;
                                    
                                    return (
                                        <div 
                                            key={id} 
                                            onClick={() => openStockDetail(id)} 
                                            className="bg-zinc-900/40 p-4 sm:p-5 rounded-3xl border border-white/5 hover:border-white/10 relative overflow-hidden transition-all cursor-pointer group shadow-sm"
                                        >
                                             <div className="flex justify-between items-start mb-3">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center font-black text-xs text-amber-400 border border-zinc-700">
                                                        {stock.icon || id}
                                                     </div>
                                                     <div>
                                                         <div className="font-bebas text-xl text-white group-hover:text-amber-400 transition-colors">{stock.name}</div>
                                                         <div className="text-[10px] font-mono text-zinc-400">
                                                            {pos.shares.toLocaleString()} shares • Avg $${pos.avgBuyPrice.toFixed(2)}
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div className="text-right">
                                                     <div className="font-bebas text-xl text-white">$${formatMoney(value)}</div>
                                                     <div className={`text-[10px] font-mono font-bold ${gl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                         {gl >= 0 ? '+' : ''}{glPercent.toFixed(1)}% ({gl >= 0 ? '+' : ''}$${formatMoney(Math.abs(gl))})
                                                     </div>
                                                 </div>
                                             </div>

                                             {/* P&L Performance Bar */}
                                             <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mb-3">
                                                 <div className={`h-full ${gl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.abs(glPercent))}%` }}></div>
                                             </div>

                                             {/* Quick Actions */}
                                             <div className="flex gap-2 justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                                                 <button 
                                                    onClick={() => openStockDetail(id)}
                                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                 >
                                                    Trade
                                                 </button>
                                                 <button 
                                                    onClick={() => handleStockTrade(stock, 'sell', Math.ceil(pos.shares / 2))}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                 >
                                                    Sell 50%
                                                 </button>
                                                 <button 
                                                    onClick={() => handleStockTrade(stock, 'sell', pos.shares)}
                                                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-600 transition-all active:scale-95 shadow-md"
                                                 >
                                                    Sell All
                                                 </button>
                                             </div>
                                        </div>
                                    );
                                })}
                            </div>
                       )}
                  </div>
              )}

              {/* 3. WATCHLIST VIEW */}
              {marketView === 'watchlist' && !selectedStockId && (
                  <div className="space-y-4 animate-in fade-in">
                      <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Saved Watchlist ({watchlistSet.size})</span>
                          <span className="text-[9px] text-zinc-600">Starred for quick price execution</span>
                      </div>

                      {state.stocks.filter(s => watchlistSet.has(s.id)).length === 0 ? (
                          <div className="text-center py-12 px-6 bg-zinc-900/30 rounded-3xl border border-white/5">
                              <div className="text-3xl mb-2">⭐</div>
                              <h3 className="font-bebas text-xl text-white">YOUR WATCHLIST IS EMPTY</h3>
                              <p className="text-xs text-zinc-400 mt-1 mb-5">Click the star icon on any asset in the Exchange to monitor it here.</p>
                              <button 
                                  onClick={() => handleSwitchMarketTab('list')}
                                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                              >
                                  Browse Exchange
                              </button>
                          </div>
                      ) : (
                          <div className="space-y-2">
                              {state.stocks.filter(s => watchlistSet.has(s.id)).map(stock => {
                                  const open = stock.openPrice || stock.history[0] || stock.price;
                                  const diff = stock.price - open;
                                  const pct = open > 0 ? (diff / open) * 100 : 0;

                                  return (
                                      <div 
                                          key={stock.id}
                                          onClick={() => openStockDetail(stock.id)}
                                          className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 flex items-center justify-between transition-all cursor-pointer group"
                                      >
                                          <div className="flex items-center gap-3">
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock.id); }}
                                                  className="text-amber-400 text-base"
                                              >
                                                  ★
                                              </button>
                                              <div className="w-10 h-10 rounded-xl bg-black/60 flex items-center justify-center text-lg border border-white/10">
                                                  {stock.icon || '📈'}
                                              </div>
                                              <div>
                                                  <div className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">{stock.id}</div>
                                                  <div className="text-[10px] text-zinc-400">{stock.name}</div>
                                              </div>
                                          </div>

                                          <div className="text-right">
                                              <div className="font-mono text-sm font-bold text-white">$${stock.price.toFixed(2)}</div>
                                              <div className={`text-[10px] font-mono font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                  {diff >= 0 ? '+' : ''}{pct.toFixed(2)}%
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              )}

              {/* 4. ORDERS & HISTORY VIEW */}
              {marketView === 'orders' && !selectedStockId && (
                  <div className="space-y-4 animate-in fade-in">
                      <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
                          <button 
                              onClick={() => setOrdersSubTab('pending')}
                              className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${ordersSubTab === 'pending' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
                          >
                              Pending Limit Orders ({(state.tradeOrders || []).filter(o => o.status === 'pending').length})
                          </button>
                          <button 
                              onClick={() => setOrdersSubTab('fills')}
                              className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${ordersSubTab === 'fills' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
                          >
                              Execution History ({(state.tradeOrders || []).filter(o => o.status === 'filled').length})
                          </button>
                      </div>

                      {ordersSubTab === 'pending' ? (
                          (state.tradeOrders || []).filter(o => o.status === 'pending').length === 0 ? (
                              <div className="text-center py-12 px-6 bg-zinc-900/20 rounded-3xl border border-white/5">
                                  <div className="text-3xl mb-2">⏱️</div>
                                  <h3 className="font-bebas text-xl text-white">NO PENDING LIMIT ORDERS</h3>
                                  <p className="text-xs text-zinc-500 mt-1">Place Limit Orders from any stock page to automatically trigger buys/sells when price targets hit.</p>
                              </div>
                          ) : (
                              <div className="space-y-2">
                                  {(state.tradeOrders || []).filter(o => o.status === 'pending').map(order => {
                                      const liveStock = state.stocks.find(s => s.id === order.stockId);
                                      const curPrice = liveStock ? liveStock.price : order.price;
                                      const distance = order.targetPrice ? Math.abs(curPrice - order.targetPrice) : 0;
                                      const distancePct = order.targetPrice ? (distance / order.targetPrice) * 100 : 0;

                                      return (
                                          <div key={order.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                                              <div>
                                                  <div className="flex items-center gap-2 mb-1">
                                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono ${order.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                          LIMIT {order.type.toUpperCase()}
                                                      </span>
                                                      <span className="font-bold text-white text-xs">{order.stockId}</span>
                                                      <span className="text-[10px] text-zinc-400">({order.shares} shares)</span>
                                                  </div>
                                                  <div className="text-[10px] text-zinc-400">
                                                      Target: <strong className="text-white">$${order.targetPrice?.toFixed(2)}</strong> • Current: <strong className="text-amber-400">$${curPrice.toFixed(2)}</strong> ({distancePct.toFixed(1)}% away)
                                                  </div>
                                              </div>
                                              <button 
                                                  onClick={() => handleCancelOrder(order.id)}
                                                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[9px] font-bold uppercase transition-all"
                                              >
                                                  Cancel
                                              </button>
                                          </div>
                                      );
                                  })}
                              </div>
                          )
                      ) : (
                          (state.tradeOrders || []).filter(o => o.status === 'filled').length === 0 ? (
                              <div className="text-center py-12 px-6 bg-zinc-900/20 rounded-3xl border border-white/5">
                                  <div className="text-3xl mb-2">📜</div>
                                  <h3 className="font-bebas text-xl text-white">NO EXECUTED ORDERS</h3>
                                  <p className="text-xs text-zinc-500 mt-1">Your trading order receipts and realized P&L will show here.</p>
                              </div>
                          ) : (
                              <div className="space-y-2">
                                  {(state.tradeOrders || []).filter(o => o.status === 'filled').map(order => (
                                      <div key={order.id} className="bg-zinc-900/30 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                                          <div>
                                              <div className="flex items-center gap-2 mb-0.5">
                                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono ${order.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                      {order.orderType.toUpperCase()} {order.type.toUpperCase()}
                                                  </span>
                                                  <span className="font-bold text-white text-xs">{order.stockId}</span>
                                                  <span className="text-[9px] text-zinc-500">{order.shares} shares @ $${order.price.toFixed(2)}</span>
                                              </div>
                                              <div className="text-[8px] text-zinc-500 font-mono">
                                                  {new Date(order.timestamp).toLocaleTimeString()} • Total: $${formatMoney(order.total)}
                                              </div>
                                          </div>
                                          {order.realizedPnL !== undefined && (
                                              <div className={`text-right text-[10px] font-mono font-bold ${order.realizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                  {order.realizedPnL >= 0 ? '+' : ''}$${formatMoney(Math.abs(order.realizedPnL))}
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          )
                      )}
                  </div>
              )}

              {/* 5. MARGIN CREDIT DESK VIEW */}
              {marketView === 'margin' && !selectedStockId && (() => {
                  const maxBorrow = calculateMaxBorrowPower(state);
                  const currentDebt = state.marginLoan?.principal || 0;
                  const stockVal = calculateTotalStockValue(state.stocks, state.stockPortfolio);
                  const totalCollateral = state.money + stockVal;
                  const collateralRatio = currentDebt > 0 ? (totalCollateral / currentDebt) * 100 : 999;
                  const hasNeoBank = (state.assets || []).some(a => a.id === 'neo_bank' && a.count > 0);

                  return (
                      <div className="space-y-5 animate-in fade-in">
                          {/* Margin Overview Card */}
                          <div className="bg-gradient-to-br from-amber-950/30 via-zinc-900 to-black p-6 rounded-3xl border border-amber-500/20 shadow-xl relative overflow-hidden">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <div className="text-[9px] font-black uppercase text-amber-400 tracking-widest mb-1 flex items-center gap-1.5">
                                          <span>🏛️</span>
                                          <span>INSTITUTIONAL MARGIN DESK</span>
                                      </div>
                                      <div className="font-bebas text-4xl text-white tracking-wide">
                                          ${currentDebt > 0 ? formatMoney(currentDebt) : '0.00'}
                                      </div>
                                      <div className="text-[10px] text-zinc-400 mt-0.5">
                                          Current Active Debt Principal
                                      </div>
                                  </div>

                                  <div className="text-right">
                                      <div className="text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1">
                                          Collateral Health
                                      </div>
                                      <div className={`font-mono text-xl font-black ${collateralRatio >= 200 ? 'text-emerald-400' : collateralRatio >= 130 ? 'text-amber-400' : 'text-red-400'}`}>
                                          {currentDebt > 0 ? `${collateralRatio.toFixed(1)}%` : 'PRIME (100%)'}
                                      </div>
                                      <div className="text-[8px] font-mono text-zinc-500">
                                          {currentDebt > 0 ? (collateralRatio < 130 ? '🚨 LIQUIDATION RISK' : 'Safe > 130%') : 'No Outstanding Debt'}
                                      </div>
                                  </div>
                              </div>

                              {/* Collateral Gauge Bar */}
                              {currentDebt > 0 && (
                                  <div className="space-y-1 mb-4">
                                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                                          <div 
                                              className={`h-full transition-all duration-300 ${collateralRatio >= 200 ? 'bg-emerald-500' : collateralRatio >= 130 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`}
                                              style={{ width: `${Math.min(100, (collateralRatio / 300) * 100)}%` }}
                                          ></div>
                                      </div>
                                      <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                                          <span>100% (Liquidation)</span>
                                          <span>130% (Maintenance)</span>
                                          <span>300%+ (Prime)</span>
                                      </div>
                                  </div>
                              )}

                              {/* Institutional Terms */}
                              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-[10px]">
                                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                                      <div className="text-[8px] font-black uppercase text-zinc-500">Max Borrow Capacity</div>
                                      <div className="font-mono font-bold text-white">${formatMoney(maxBorrow)}</div>
                                  </div>
                                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                                      <div className="text-[8px] font-black uppercase text-zinc-500">Daily Interest Rate</div>
                                      <div className="font-mono font-bold text-amber-400">{hasNeoBank ? '4.3% (Neo-Bank Perk)' : '8.6% Standard'}</div>
                                  </div>
                              </div>
                          </div>

                          {/* Borrow Controls */}
                          <div className="bg-zinc-900/40 p-5 rounded-3xl border border-white/5 space-y-4">
                              <div className="flex justify-between items-center">
                                  <h3 className="font-bebas text-xl text-white">DRAW MARGIN LIQUIDITY</h3>
                                  <span className="text-[9px] text-zinc-500">Instant Cash Deposit</span>
                              </div>

                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => setMarginBorrowInput(Math.floor(maxBorrow * 0.25).toString())}
                                      className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[9px] font-bold uppercase transition-all"
                                  >
                                      25%
                                  </button>
                                  <button 
                                      onClick={() => setMarginBorrowInput(Math.floor(maxBorrow * 0.50).toString())}
                                      className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[9px] font-bold uppercase transition-all"
                                  >
                                      50%
                                  </button>
                                  <button 
                                      onClick={() => setMarginBorrowInput(Math.floor(maxBorrow).toString())}
                                      className="flex-1 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 rounded-xl text-[9px] font-bold uppercase transition-all"
                                  >
                                      Max
                                  </button>
                              </div>

                              <div className="flex gap-2">
                                  <input 
                                      type="number"
                                      value={marginBorrowInput}
                                      onChange={(e) => setMarginBorrowInput(e.target.value)}
                                      placeholder="Enter amount to borrow..."
                                      className="flex-1 bg-black/70 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                                  />
                                  <button 
                                      onClick={() => {
                                          const amt = Number(marginBorrowInput);
                                          handleBorrowMargin(amt);
                                          setMarginBorrowInput('');
                                      }}
                                      disabled={maxBorrow <= 0}
                                      className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs uppercase rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all shadow-md"
                                  >
                                      Borrow
                                  </button>
                              </div>
                          </div>

                          {/* Repay Controls */}
                          {currentDebt > 0 && (
                              <div className="bg-zinc-900/40 p-5 rounded-3xl border border-white/5 space-y-4">
                                  <div className="flex justify-between items-center">
                                      <h3 className="font-bebas text-xl text-white">REPAY MARGIN DEBT</h3>
                                      <span className="text-[9px] text-zinc-500">Wallet: ${formatMoney(state.money)}</span>
                                  </div>

                                  <div className="flex gap-2">
                                      <button 
                                          onClick={() => setMarginRepayInput(Math.floor(Math.min(state.money, currentDebt * 0.5)).toString())}
                                          className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[9px] font-bold uppercase transition-all"
                                      >
                                          50%
                                      </button>
                                      <button 
                                          onClick={() => setMarginRepayInput(Math.floor(Math.min(state.money, currentDebt)).toString())}
                                          className="flex-1 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-xl text-[9px] font-bold uppercase transition-all"
                                      >
                                          Pay In Full
                                      </button>
                                  </div>

                                  <div className="flex gap-2">
                                      <input 
                                          type="number"
                                          value={marginRepayInput}
                                          onChange={(e) => setMarginRepayInput(e.target.value)}
                                          placeholder="Amount to repay..."
                                          className="flex-1 bg-black/70 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                                      />
                                      <button 
                                          onClick={() => {
                                              const amt = Number(marginRepayInput);
                                              handleRepayMargin(amt);
                                              setMarginRepayInput('');
                                          }}
                                          className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md"
                                      >
                                          Repay
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  );
              })()}

              {/* 6. PROFESSIONAL STOCK DETAIL & TRADING TERMINAL */}
              {marketView === 'detail' && selectedStock && (() => {
                  const open = selectedStock.openPrice || selectedStock.history[0] || selectedStock.price;
                  const diff = selectedStock.price - open;
                  const pct = open > 0 ? (diff / open) * 100 : 0;
                  const isStarred = watchlistSet.has(selectedStock.id);
                  const currentShares = state.stockPortfolio[selectedStock.id]?.shares || 0;
                  const currentEquity = currentShares * selectedStock.price;
                  const spread = selectedStock.price * 0.002;
                  const askPrice = +(selectedStock.price + spread / 2).toFixed(2);
                  const bidPrice = +(selectedStock.price - spread / 2).toFixed(2);

                  // Calculate Quantity based on mode
                  let tradeQty = 1;
                  if (tradeAmountMode === 'MAX') {
                      tradeQty = orderType === 'market' 
                          ? Math.max(1, Math.floor(state.money / askPrice))
                          : Math.max(1, Math.floor(state.money / (Number(limitTargetPrice) || askPrice)));
                  } else if (tradeAmountMode === '50%') {
                      tradeQty = Math.max(1, Math.floor((state.money * 0.5) / askPrice));
                  } else if (tradeAmountMode === '25%') {
                      tradeQty = Math.max(1, Math.floor((state.money * 0.25) / askPrice));
                  } else {
                      tradeQty = Math.max(1, parseInt(customShareCount) || 1);
                  }

                  const estCost = +(tradeQty * (orderType === 'limit' && Number(limitTargetPrice) ? Number(limitTargetPrice) : askPrice)).toFixed(2);

                  return (
                      <div className="animate-in slide-in-from-right-4 min-h-full flex flex-col pb-20 space-y-5">
                          {/* Top Navigation Breadcrumb */}
                          <div className="flex items-center justify-between">
                              <button 
                                  onClick={() => {
                                      setSelectedStockId(null);
                                      setMarketView(previousMarketTab || 'list');
                                  }} 
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all active:scale-95"
                              >
                                  ← Back to {previousMarketTab === 'portfolio' ? 'Holdings' : previousMarketTab === 'watchlist' ? 'Watchlist' : 'Exchange'}
                              </button>

                              <button 
                                  onClick={() => toggleWatchlist(selectedStock.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${isStarred ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
                              >
                                  <span>{isStarred ? '★' : '☆'}</span>
                                  <span>{isStarred ? 'Watchlist' : 'Add Watchlist'}</span>
                              </button>
                          </div>

                          {/* Asset Header Information */}
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl shadow-lg">
                                      {selectedStock.icon || (selectedStock.category === 'crypto' ? '🪙' : '📈')}
                                  </div>
                                  <div>
                                      <h2 className="font-bebas text-3xl leading-none text-white tracking-wider">{selectedStock.name}</h2>
                                      <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{selectedStock.id}</span>
                                          <span className="text-[9px] font-black text-zinc-400 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{selectedStock.sector || selectedStock.category}</span>
                                      </div>
                                  </div>
                              </div>

                              <div className="text-right">
                                  <div className="text-3xl font-bebas text-white">$${selectedStock.price.toFixed(2)}</div>
                                  <div className={`text-xs font-mono font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {diff >= 0 ? '+' : ''}$${Math.abs(diff).toFixed(2)} ({diff >= 0 ? '+' : ''}{pct.toFixed(2)}%)
                                  </div>
                              </div>
                          </div>

                          {/* Interactive Chart Container */}
                          <div className="bg-zinc-950 rounded-3xl border border-white/10 p-4 relative overflow-hidden shadow-2xl">
                              {/* Controls Bar: Timeframes + Chart Type */}
                              <div className="flex justify-between items-center mb-3">
                                  <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                                      {['1H', '1D', '1W', '1M', 'ALL'].map(t => (
                                          <button 
                                              key={t}
                                              onClick={() => setChartTimeframe(t as any)} 
                                              className={`text-[8px] font-black px-2.5 py-1 rounded-lg transition-all ${chartTimeframe === t ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                          >
                                              {t}
                                          </button>
                                      ))}
                                  </div>

                                  <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                                      <button 
                                          onClick={() => setChartMode('area')} 
                                          className={`text-[8px] font-black px-2 py-1 rounded-lg transition-all ${chartMode === 'area' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                                      >
                                          LINE
                                      </button>
                                      <button 
                                          onClick={() => setChartMode('candle')} 
                                          className={`text-[8px] font-black px-2 py-1 rounded-lg transition-all ${chartMode === 'candle' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                                      >
                                          CANDLES
                                      </button>
                                  </div>
                              </div>

                              {/* Interactive Chart */}
                              <div className="h-48 sm:h-64 w-full relative">
                                  <StockChart 
                                      history={
                                          chartTimeframe === '1H' ? selectedStock.history.slice(-15) :
                                          chartTimeframe === '1D' ? selectedStock.history.slice(-30) :
                                          chartTimeframe === '1W' ? selectedStock.history.slice(-45) :
                                          chartTimeframe === '1M' ? selectedStock.history.slice(-60) :
                                          selectedStock.history
                                      } 
                                      color={diff >= 0 ? '#10b981' : '#ef4444'} 
                                      chartType={chartMode}
                                      showVolume={true}
                                      interactive={true}
                                  />
                              </div>

                              {/* High/Low Bounds Legend */}
                              <div className="flex justify-between items-center pt-3 border-t border-white/5 text-[9px] font-mono text-zinc-500">
                                  <div>24h Low: <span className="text-zinc-300">$${(selectedStock.low24h || selectedStock.price * 0.98).toFixed(2)}</span></div>
                                  <div>Open: <span className="text-zinc-300">$${open.toFixed(2)}</span></div>
                                  <div>24h High: <span className="text-zinc-300">$${(selectedStock.high24h || selectedStock.price * 1.02).toFixed(2)}</span></div>
                              </div>
                          </div>

                          {/* Institutional Practice Fundamentals */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div className="bg-zinc-900/40 p-3 rounded-2xl border border-white/5">
                                  <div className="text-[8px] font-black uppercase text-zinc-500 mb-0.5">24h Volume</div>
                                  <div className="font-mono text-xs font-bold text-white">$${formatMoney(selectedStock.volume24h || 18000000000)}</div>
                              </div>
                              <div className="bg-zinc-900/40 p-3 rounded-2xl border border-white/5">
                                  <div className="text-[8px] font-black uppercase text-zinc-500 mb-0.5">Market Cap</div>
                                  <div className="font-mono text-xs font-bold text-white">$${formatMoney(selectedStock.marketCap || 800000000000)}</div>
                              </div>
                              <div className="bg-zinc-900/40 p-3 rounded-2xl border border-white/5">
                                  <div className="text-[8px] font-black uppercase text-zinc-500 mb-0.5">{selectedStock.category === 'crypto' ? 'Liquidity Tier' : 'P/E Ratio'}</div>
                                  <div className="font-mono text-xs font-bold text-white">{selectedStock.peRatio ? selectedStock.peRatio.toFixed(1) : 'Tier 1 Prime'}</div>
                              </div>
                              <div className="bg-zinc-900/40 p-3 rounded-2xl border border-white/5">
                                  <div className="text-[8px] font-black uppercase text-zinc-500 mb-0.5">Wall St Consensus</div>
                                  <div className="font-mono text-xs font-bold text-emerald-400">{selectedStock.analystRating || 'Strong Buy'}</div>
                              </div>
                          </div>

                          {/* 51% HOSTILE TAKEOVER & FLOAT TRACKER */}
                          {(() => {
                              const totalFloat = selectedStock.totalFloat || 50000;
                              const floatPct = Math.min(100, (currentShares / totalFloat) * 100);
                              const isControlled = floatPct >= 51;
                              const divRate = selectedStock.dividendYieldPerSec || 50;

                              return (
                                  <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-4 rounded-3xl border border-white/10 shadow-lg space-y-2">
                                      <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-2">
                                              <span className="text-base">{isControlled ? "👑" : "🎯"}</span>
                                              <div>
                                                  <div className="font-bebas text-base text-white tracking-wider flex items-center gap-2">
                                                      <span>{isControlled ? "BOARDROOM CONTROLLED (51%+)" : "HOSTILE TAKEOVER PROGRESS"}</span>
                                                      {isControlled && (
                                                          <span className="text-[8px] font-black uppercase bg-amber-400 text-black px-2 py-0.5 rounded-full animate-pulse">CHAIRMAN</span>
                                                      )}
                                                  </div>
                                                  <div className="text-[9px] text-zinc-400 font-mono">
                                                      {currentShares.toLocaleString()} / {totalFloat.toLocaleString()} float shares ({floatPct.toFixed(2)}%)
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-[8px] font-black text-zinc-500 uppercase">Board Dividend</div>
                                              <div className="font-mono text-xs font-bold text-amber-400">
                                                  {isControlled ? `+$${formatMoney(divRate)}/sec` : "Locked (<51%)"}
                                              </div>
                                          </div>
                                      </div>

                                      {/* Float Progress Bar */}
                                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden relative">
                                          <div 
                                              className={`h-full transition-all duration-300 ${isControlled ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
                                              style={{ width: `${floatPct}%` }}
                                          ></div>
                                          <div className="absolute top-0 bottom-0 left-[51%] w-0.5 bg-red-500 z-10" title="51% Control Threshold"></div>
                                      </div>
                                  </div>
                              );
                          })()}

                          {/* CORPORATE ACTION SYNDICATE TRIGGER BUTTON */}
                          <div className="bg-gradient-to-r from-purple-950/30 via-zinc-900 to-black p-4 rounded-3xl border border-purple-500/30 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">
                                      🕶️
                                  </div>
                                  <div>
                                      <div className="font-bebas text-base text-white tracking-wide">PUPPET-MASTER SYNDICATE</div>
                                      <div className="text-[9px] text-zinc-400">Deploy Media Propaganda, Botnet Raids, or PMC Espionage</div>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => {
                                      setSelectedSynergyStockId(selectedStock.id);
                                      setShowPuppetModal(true);
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-95 transition-all"
                              >
                                  Deploy Power →
                              </button>
                          </div>

                          {/* Live Order Book Spread */}
                          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between text-[10px] font-mono">
                              <div><span className="text-zinc-500">BID (SELL):</span> <span className="text-red-400 font-bold">$${bidPrice}</span></div>
                              <div className="text-zinc-600">SPREAD: $${(spread).toFixed(2)} (0.2%)</div>
                              <div><span className="text-zinc-500">ASK (BUY):</span> <span className="text-emerald-400 font-bold">$${askPrice}</span></div>
                          </div>

                          {/* TRADING EXECUTION CONSOLE */}
                          <div className="bg-zinc-900/60 p-5 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl space-y-4">
                              {/* Position & Equity Status */}
                              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                  <div>
                                      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Your Position</div>
                                      <div className="font-bebas text-xl text-white">{currentShares.toLocaleString()} SHARES</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Position Equity</div>
                                      <div className="font-bebas text-xl text-amber-400">$${formatMoney(currentEquity)}</div>
                                  </div>
                              </div>

                              {/* Order Type Selector: Market vs Limit */}
                              <div className="flex bg-black/60 p-1 rounded-xl border border-white/5">
                                  <button 
                                      onClick={() => setOrderType('market')}
                                      className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${orderType === 'market' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500'}`}
                                  >
                                      ⚡ Market Order (Instant)
                                  </button>
                                  <button 
                                      onClick={() => {
                                          setOrderType('limit');
                                          if (!limitTargetPrice) setLimitTargetPrice(selectedStock.price.toFixed(2));
                                      }}
                                      className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${orderType === 'limit' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500'}`}
                                  >
                                      🎯 Limit Order (Target Price)
                                  </button>
                              </div>

                              {/* Limit Target Price Input (If Limit Order) */}
                              {orderType === 'limit' && (
                                  <div className="space-y-1 animate-in fade-in">
                                      <label className="text-[9px] font-black uppercase text-zinc-400">Target Trigger Price ($)</label>
                                      <div className="relative">
                                          <input 
                                              type="number"
                                              step="0.01"
                                              value={limitTargetPrice}
                                              onChange={(e) => setLimitTargetPrice(e.target.value)}
                                              placeholder="Set target execution price..."
                                              className="w-full bg-black/70 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                                          />
                                          <button 
                                              onClick={() => setLimitTargetPrice(selectedStock.price.toFixed(2))}
                                              className="absolute right-2 top-1.5 text-[8px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
                                          >
                                              Current
                                          </button>
                                      </div>
                                  </div>
                              )}

                              {/* Quantity Presets & Input */}
                              <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-400">
                                      <span>Order Quantity</span>
                                      <span>Buying Power: $${formatMoney(state.money)}</span>
                                  </div>

                                  <div className="grid grid-cols-5 gap-1.5 bg-black/40 p-1 rounded-xl">
                                      {['1', '10', '100', '50%', 'MAX'].map(amt => (
                                          <button 
                                              key={amt}
                                              onClick={() => {
                                                  setTradeAmountMode(amt as any);
                                                  if (amt === '1' || amt === '10' || amt === '100') {
                                                      setCustomShareCount(amt);
                                                  }
                                              }}
                                              className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${tradeAmountMode === amt ? 'bg-amber-400 text-black shadow-md' : 'text-zinc-500 hover:text-white'}`}
                                          >
                                              {amt}
                                          </button>
                                      ))}
                                  </div>

                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-zinc-500 uppercase font-bold shrink-0">Exact Shares:</span>
                                      <input 
                                          type="number"
                                          min="1"
                                          value={tradeAmountMode === 'MAX' || tradeAmountMode === '50%' || tradeAmountMode === '25%' ? tradeQty : customShareCount}
                                          onChange={(e) => {
                                              setTradeAmountMode('1');
                                              setCustomShareCount(e.target.value);
                                          }}
                                          className="flex-1 bg-black/70 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                                      />
                                  </div>
                              </div>

                              {/* Estimated Total Calculation */}
                              <div className="bg-black/50 p-3 rounded-2xl border border-white/5 flex justify-between items-center text-[10px] font-mono">
                                  <span className="text-zinc-400 uppercase">Estimated Total Cost:</span>
                                  <span className="text-white font-bold">$${formatMoney(estCost)}</span>
                              </div>

                              {/* Action Buttons: Buy & Sell */}
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                  <button 
                                      onClick={() => {
                                          const target = orderType === 'limit' ? Number(limitTargetPrice) : undefined;
                                          handleStockTrade(selectedStock, 'sell', tradeQty, orderType, target);
                                      }}
                                      disabled={currentShares < tradeQty}
                                      className={`py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all active:scale-95 shadow-lg ${
                                          currentShares < tradeQty 
                                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                                              : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white'
                                      }`}
                                  >
                                      {orderType === 'limit' ? 'Place Limit Sell' : `Sell @ $${bidPrice}`}
                                  </button>

                                  <button 
                                      onClick={() => {
                                          const target = orderType === 'limit' ? Number(limitTargetPrice) : undefined;
                                          handleStockTrade(selectedStock, 'buy', tradeQty, orderType, target);
                                      }}
                                      disabled={state.money < estCost}
                                      className={`py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all active:scale-95 shadow-lg ${
                                          state.money < estCost 
                                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                                              : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:brightness-110'
                                      }`}
                                  >
                                      {orderType === 'limit' ? 'Place Limit Buy' : `Buy @ $${askPrice}`}
                                  </button>
                              </div>
                          </div>
                      </div>
                  );
              })()}
           </div>
        )}
        
        {activeTab === 'chat' && (
           <div className="h-full flex flex-col animate-in fade-in relative bg-black/50">
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#050505] to-transparent z-10 pointer-events-none"></div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-3 no-scrollbar pt-4" ref={chatContainerRef} onScroll={handleChatScroll}>
                 {/* --- USER STATS GLOBAL HEADER (REMOVED) --- */}
                 {/* The user requested to remove this debug info from the visible UI */}

                 {chatMessages.map((msg, idx) => {
                    const isMe = msg.userId === state.userId;
                    const showAvatar = idx === 0 || chatMessages[idx-1].userId !== msg.userId || (msg.timestamp - chatMessages[idx-1].timestamp > 60000);
                    
                    return (
                        <div key={msg.id} className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-300 ${isMe ? 'flex-row-reverse' : ''} ${msg.isZenith ? 'mb-6 mt-6' : 'mb-1'}`}>
                           <div className="w-8 shrink-0 flex flex-col items-center">
                              {showAvatar ? (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border shadow-lg overflow-hidden relative ${
                                    isMe ? 'bg-amber-500 border-amber-300 text-black' : 
                                    msg.isZenith ? 'bg-purple-900 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse' : 
                                    'bg-zinc-800 border-zinc-700'
                                  }`}>
                                    <img src={msg.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                  </div>
                              ) : <div className="w-8" />}
                           </div>

                           <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                              {showAvatar && (
                                  <div className={`flex items-center gap-1.5 mb-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${msg.isZenith ? 'text-purple-400' : 'text-zinc-400'}`} style={{ color: msg.cosmeticNameColor }}>
                                        {msg.userName}
                                    </span>
                                    {msg.titleTag && (<span className="text-[6px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1 rounded-[4px] font-black uppercase tracking-widest">{msg.titleTag}</span>)}
                                    {msg.rankName && !isMe && (<span className="text-[7px] px-1 py-0.5 rounded-[4px] bg-zinc-800 text-zinc-500 uppercase font-bold" style={{ color: msg.rankColor }}>{msg.rankName}</span>)}
                                  </div>
                              )}
                              
                              <div className={`px-4 py-2.5 rounded-2xl shadow-sm border backdrop-blur-sm text-xs font-medium leading-relaxed break-words relative group transition-all hover:shadow-md ${
                                isMe ? 'bg-amber-500/90 border-amber-400/50 text-black rounded-tr-sm' : 
                                msg.isZenith ? 'bg-purple-900/60 border-purple-500/50 text-purple-100 rounded-tl-sm' : 
                                msg.isGiftDrop ? 'bg-red-900/60 border-red-500/50 text-red-100 rounded-tl-sm shadow-[0_0_15px_rgba(220,38,38,0.3)]' :
                                'bg-zinc-900/60 border-zinc-800 text-zinc-200 rounded-tl-sm'
                              }`}>
                                {msg.isGiftDrop && msg.redPacket ? (
                                    <div className="flex flex-col items-center gap-2 py-1 min-w-[150px]">
                                        <div className="text-3xl animate-bounce">🧧</div>
                                        <div className="font-bebas text-xl tracking-wider">RED PACKET</div>
                                        <div className="text-[9px] font-black uppercase bg-red-500/20 px-2 py-1 rounded">Total: ${formatMoney(msg.redPacket.totalAmount)}</div>
                                        
                                        {msg.redPacket.claimedBy.includes(state.userId) ? (
                                            <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-4 py-2 rounded-full mt-2 border border-emerald-500/30">CLAIMED</div>
                                        ) : msg.redPacket.claimsRemaining > 0 ? (
                                            <button onClick={() => handleClaimGift(msg.id, msg.redPacket)} className="bg-white text-red-600 font-black px-4 py-2 rounded-full mt-2 text-[10px] uppercase hover:scale-105 active:scale-95 transition-transform shadow-lg">CLAIM NOW</button>
                                        ) : (
                                            <div className="bg-zinc-900/50 text-zinc-500 text-[10px] font-black px-4 py-2 rounded-full mt-2">EMPTY</div>
                                        )}
                                        <div className="text-[8px] text-red-300/50 font-mono mt-1">{msg.redPacket.claimsRemaining}/{msg.redPacket.maxClaims} remaining</div>
                                    </div>
                                ) : msg.isFlex ? (
                                    <div className="flex flex-col gap-1 pr-6">
                                        <div className="text-[8px] font-black uppercase opacity-60 tracking-widest">Net Worth Flex</div>
                                        <div className="font-bebas text-lg tracking-wider">${msg.text}</div>
                                    </div>
                                ) : (
                                    msg.text
                                )}
                              </div>
                           </div>
                        </div>
                    );
                 })}
                 <div ref={messagesEndRef} className="h-2" />
              </div>
               
               {userScrolledUp && (
                   <button onClick={() => { setUserScrolledUp(false); scrollToBottom(true); }} className="absolute bottom-24 right-4 z-50 bg-black/40 backdrop-blur text-amber-500 w-8 h-8 rounded-full shadow-lg flex items-center justify-center animate-bounce hover:scale-110 transition-transform hover:bg-black/60 border border-amber-500/30">
                       ▼
                   </button>
               )}

               {/* ADVANCED CHAT INPUT AREA */}
               <div className="bg-zinc-950/80 backdrop-blur-2xl border-t border-white/5 pb-[calc(env(safe-area-inset-bottom)+72px)] pt-3 px-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30">
                    <div className="flex flex-col gap-3 max-w-lg mx-auto">
                        {/* QUICK ACTIONS ROW */}
                        <div className="flex items-center justify-start gap-2 overflow-x-auto no-scrollbar pb-1">
                             <button onClick={handleFlex} className="shrink-0 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase px-3 py-2 rounded-full hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1.5 active:scale-95">
                               <div className="w-3 h-3"><Icons.Money /></div> FLEX CASH
                            </button>
                            <button onClick={() => setShowGiftModal(true)} className="shrink-0 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase px-3 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 active:scale-95">
                               <span className="text-sm leading-none">🧧</span> DROP(${state.giftBoxes})
                            </button>
                            <div className="shrink-0 bg-blue-950/40 border border-blue-500/30 text-blue-400 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-full flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                               LIVE AI BOTS
                            </div>
                            <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                            <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest text-center px-1">Global Chat</div>
                        </div>

                        {/* INPUT ROW */}
                         <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-zinc-900/50 p-1.5 rounded-[1.2rem] border border-white/5 transition-colors focus-within:border-zinc-700/50 focus-within:bg-zinc-900">
                             <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-sm border border-zinc-800 ml-1 overflow-hidden">
                                 {state.avatar.startsWith('/') || state.avatar.startsWith('http') ? <img src={state.avatar} className="w-full h-full object-cover" /> : state.avatar}
                             </div>
                             <input 
                                 type="text" 
                                 value={chatInput}
                                 onChange={(e) => setChatInput(e.target.value)}
                                 placeholder={isSending ? "Transmitting..." : `Message...`}
                                 disabled={isSending}
                                 className="flex-1 bg-transparent border-none text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:ring-0 px-2 h-10"
                             />
                             <button 
                                 type="submit" 
                                 disabled={!chatInput.trim() || isSending}
                                 style={{ width: '1.75rem', height: '1.75rem' }}
                                 className={`rounded-full transition-all flex items-center justify-center shrink-0 ${!chatInput.trim() ? 'text-zinc-700 bg-transparent' : 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg'}`}
                             >
                                 <div className="scale-75"><Icons.Send /></div>
                             </button>
                         </form>
                    </div>
               </div>
           </div>
        )}
        
        {activeTab === 'imperial' && (
           <div className="space-y-4 animate-in fade-in">
              <h4 className="text-center font-bebas text-lg tracking-widest text-white mb-4">IMPERIAL MARKET</h4>
              
              {SHOP_ITEMS.map(item => (
                 <div key={item.id} className="bg-zinc-900/60 border border-white/5 p-6 rounded-[3rem] flex items-center gap-6 shadow-2xl">
                    <div className="w-16 h-16 bg-black/40 rounded-3xl flex items-center justify-center p-4 border border-white/5 shrink-0">{(Icons as any)[item.icon] ? React.createElement((Icons as any)[item.icon]) : <Icons.Diamond />}</div>
                    <div className="flex-1 min-w-0">
                       <h3 className="font-black uppercase text-xs tracking-widest mb-1 truncate italic">{item.name}</h3>
                       <p className="text-[9px] text-zinc-500 uppercase font-bold leading-relaxed">{item.description}</p>
                    </div>
                    <button onClick={() => buyImperialItem(item)} disabled={state.diamonds < item.price || state.purchasedPermanentIds.includes(item.id)} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest ${state.purchasedPermanentIds.includes(item.id) ? 'bg-zinc-800 text-zinc-600' : 'bg-amber-500 text-black'}`}>{state.purchasedPermanentIds.includes(item.id) ? 'ACTIVE' : `${item.price}💎`}</button>
                 </div>
              ))}

              {/* BLACK MARKET (UNLOCKS AT RANK 3 OR PRESTIGE) */}
              {(state.rankId >= 3 || state.prestigeCount > 0) && (
                  <div className="mt-12 mb-6">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="h-[1px] flex-1 bg-zinc-800"></div>
                          <div className="flex flex-col items-center">
                              <span className="text-2xl animate-pulse">☠️</span>
                              <h4 className="font-bebas text-2xl text-red-600 tracking-[0.2em] animate-pulse">BLACK MARKET</h4>
                          </div>
                          <div className="h-[1px] flex-1 bg-zinc-800"></div>
                      </div>
                      
                      <div className="space-y-4">
                        {BLACK_MARKET_ITEMS.map(item => (
                             <div key={item.id} className="bg-zinc-950 border border-red-900/20 p-6 rounded-[2rem] flex items-center gap-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-600/5 blur-[50px] rounded-full group-hover:bg-red-600/10 transition-colors"></div>
                                
                                <div className="w-16 h-16 bg-red-950/20 rounded-2xl flex items-center justify-center text-3xl border border-red-500/20 relative z-10 italic">{(Icons as any)[item.icon] ? React.createElement((Icons as any)[item.icon]) : '☠️'}</div>
                                <div className="flex-1 min-w-0 relative z-10">
                                   <div className="flex items-center gap-2 mb-1">
                                       <h3 className="font-bebas text-lg text-red-100 tracking-wide truncate">{item.name}</h3>
                                       <span className="text-[8px] font-black bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800 uppercase">{item.tier || 'Illegal'}</span>
                                   </div>
                                   <p className="text-[9px] text-zinc-500 uppercase font-bold leading-relaxed">{item.description}</p>
                                </div>
                                <button onClick={() => buyImperialItem(item)} disabled={state.money < item.price || state.purchasedCosmetics.includes(item.id) || state.ownedTitles.includes(item.rewardMeta as string)} className={`relative z-10 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${state.purchasedCosmetics.includes(item.id) || state.ownedTitles.includes(item.rewardMeta as string) ? 'bg-zinc-900 text-zinc-600 border border-zinc-800' : 'bg-red-900/80 text-red-200 border border-red-500/50 hover:bg-red-800 hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.15)]'}`}>
                                    {state.purchasedCosmetics.includes(item.id) || state.ownedTitles.includes(item.rewardMeta as string) ? 'OWNED' : `$${formatMoney(item.price)}`}
                                </button>
                             </div>
                        ))}
                      </div>
                  </div>
              )}

               {/* ROYAL DABBA */}
               <div className="mt-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-zinc-950 border border-purple-900/30 p-6 rounded-[2.5rem] relative overflow-hidden shadow-[0_0_40px_rgba(147,51,234,0.1)] mb-6 group">
                   <div className="absolute top-0 right-0 p-4 opacity-50"><Icons.Cosmic /></div>
                   <div className="relative z-10">
                       <div className="flex justify-between items-center mb-2">
                           <h3 className="font-bebas text-3xl text-purple-400 tracking-widest">ROYAL DABBA</h3>
                           <span className="text-[8px] font-black bg-purple-900/50 border border-purple-500/30 text-purple-200 px-2 py-1 rounded">ULTRA RARE GACHA</span>
                       </div>
                       
                       <div className="flex items-center gap-4 mb-6">
                           <div className="w-20 h-20 bg-purple-900/20 rounded-2xl flex items-center justify-center text-5xl shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse border border-purple-500/30">📦</div>
                           <div>
                               <div className="text-[10px] font-black text-zinc-500 uppercase">Cost</div>
                               <div className="font-bebas text-3xl text-white">${formatMoney(50 * Math.pow(2, state.royalDabbaCount))}</div>
                           </div>
                       </div>

                       <div className="grid grid-cols-4 gap-1 mb-4">
                           <div className="bg-zinc-900 border border-zinc-800 p-1 text-[8px] text-center text-zinc-500 rounded font-black">COMMON<br/>60%</div>
                           <div className="bg-blue-900/20 border border-blue-900/50 p-1 text-[8px] text-center text-blue-400 rounded font-black">RARE<br/>30%</div>
                           <div className="bg-purple-900/20 border border-purple-900/50 p-1 text-[8px] text-center text-purple-400 rounded font-black">EPIC<br/>9%</div>
                           <div className="bg-amber-900/20 border border-amber-900/50 p-1 text-[8px] text-center text-amber-400 rounded font-black">LEGEND<br/>1%</div>
                       </div>

                       <button onClick={openRoyalDabba} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-xl uppercase tracking-[0.2em] shadow-lg shadow-purple-900/30 active:scale-95 transition-all">
                           OPEN CRATE
                       </button>
                   </div>
               </div>
           </div>
        )}

        {activeTab === 'status' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex bg-zinc-900/50 p-1.5 rounded-3xl border border-white/10 shadow-inner overflow-x-auto no-scrollbar">
                 {['stats', 'ranks', 'security', 'cyber'].map(tab => (
                   <button key={tab} onClick={() => setStatusSubTab(tab as any)} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-2xl transition-all ${statusSubTab === tab ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>{tab}</button>
                 ))}
              </div>
              
              {statusSubTab === 'stats' && (
                <div className="space-y-6 animate-in fade-in">
                    <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-24 opacity-30" style={{ backgroundColor: state.userBannerColor }}></div>
                        <button onClick={() => setShowProfileModal(true)} className="absolute top-6 right-6 p-2 bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white border border-white/5 z-10"><div className="w-4 h-4"><Icons.Tech /></div></button>
                        
                        <div className="flex items-center gap-6 mb-8 relative z-10 mt-4">
                            <div className="w-24 h-24 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center text-5xl border-4 border-[#050505] shadow-xl overflow-hidden">
                                {state.avatar.startsWith('/') || state.avatar.startsWith('http') ? <img src={state.avatar} className="w-full h-full object-cover" /> : state.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h2 className="text-3xl font-bebas tracking-widest text-white mb-1 truncate italic" style={{ color: state.equippedCosmetics.nameColor }}>{state.userName}</h2>
                               <div className="flex gap-2">
                                   <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">{currentRank.name}</span>
                                   {state.equippedCosmetics.titleTag && (<span className="text-[10px] font-black uppercase text-purple-400 tracking-[0.1em] bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">{state.equippedCosmetics.titleTag}</span>)}
                               </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-black/40 p-6 rounded-[2.2rem] border border-white/5 flex flex-col justify-center min-w-0"><div className="text-[8px] font-black uppercase text-zinc-600 mb-2">Net Worth</div><div className="text-xl font-bebas text-white">${formatMoney(state.money)}</div></div>
                           <div className="bg-black/40 p-6 rounded-[2.2rem] border border-white/5 flex flex-col justify-center min-w-0"><div className="text-[8px] font-black uppercase text-zinc-600 mb-2">Efficiency</div><div className="text-xl font-bebas text-emerald-500 italic">x{state.multiplier.toFixed(2)}</div></div>
                        </div>
                         <div className="mt-6 flex flex-col gap-3">
                             <button onClick={() => setShowAccountingModal(true)} className="w-full py-4 bg-zinc-800/50 rounded-2xl border border-white/5 font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors">View Financial Records</button>
                             <button onClick={handleLogout} className="w-full py-4 bg-red-950/20 border border-red-900/30 rounded-2xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"><div className="w-3 h-3"><Icons.Unlock /></div>DISCONNECT NEURAL LINK</button>
                             <a href="mailto:support@thelazybillionaire.com?subject=Account%20Deletion%20Request" className="w-full py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors text-center">REQUEST DATA DELETION</a>
                         </div>
                    </section>
                     <button onClick={() => setShowPrestigeModal(true)} className="w-full bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-[2.5rem] border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center text-purple-400"><div className="w-6 h-6"><Icons.Legacy /></div></div><div className="text-left"><div className="text-[10px] font-black uppercase text-purple-300 tracking-widest">Legacy Protocol</div><div className="font-bebas text-xl text-white">ABDICATE & RESTART</div></div></div>
                            <div className="text-right"><div className="text-2xl font-bebas text-white">{state.legacyKeys} 🔑</div></div>
                        </div>
                    </button>
                </div>
              )}
              {statusSubTab === 'ranks' && (
                 <div className="h-[60vh] animate-in fade-in relative">
                    <Leaderboard 
                        entries={throttledLeaderboardEntries} 
                        timeframe={leaderboardTimeframe} 
                        setTimeframe={setLeaderboardTimeframe}
                        userRank={currentUserRank as number}
                        userMoney={state.money as number}
                        userName={state.userName}
                        userAvatar={state.avatar}
                        onHack={handleLeaderboardHack}
                    />
                 </div>
              )}
              {statusSubTab === 'security' && (
                 <div className="space-y-6 animate-in fade-in">
                    <div className="bg-zinc-900/40 p-8 rounded-[3rem] border border-white/5 text-center">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"><div className="w-8 h-8 text-emerald-400"><Icons.Shield /></div></div>
                        <h3 className="font-bebas text-3xl tracking-widest text-white mb-2">FIREWALL STATUS</h3>
                        <div className="text-emerald-500 font-black text-4xl mb-6">{state.firewallStrength}%</div>
                        <p className="text-[10px] text-zinc-500 uppercase mb-8 max-w-[200px] mx-auto font-bold">Higher integrity reduces the chance of successful hacks against your empire.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><div className="text-[8px] text-zinc-600 uppercase font-black mb-1">Last Breach</div><div className="font-bebas text-lg text-white">{state.lastBreachAttempt ? '2m ago' : 'Never'}</div></div>
                            <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><div className="text-[8px] text-zinc-600 uppercase font-black mb-1">Risk Level</div><div className="font-bebas text-lg text-amber-500">LOW</div></div>
                        </div>
                    </div>
                 </div>
              )}
              {statusSubTab === 'cyber' && (
                  <div className="space-y-6 animate-in fade-in">
                      <div className="bg-zinc-900/40 p-6 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bebas text-2xl tracking-widest text-white text-center">OPERATIVE TERMINAL</h3>
                              <div className="text-[8px] font-mono text-green-500 animate-pulse">● LIVE LINK</div>
                          </div>
                          
                          <div className="space-y-3 relative z-10">
                              {HACKER_ROSTER.map(hacker => (
                                  <div key={hacker.id} onClick={() => setSelectedHacker(hacker)} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between active:scale-95 transition-all">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${hacker.tier === 'AI Construct' ? 'border-red-500 bg-red-900/20 text-red-500' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
                                              {hacker.tier === 'AI Construct' ? '👾' : '💻'}
                                          </div>
                                          <div>
                                              <div className="text-[10px] font-black uppercase text-white tracking-widest">{hacker.name}</div>
                                              <div className={`text-[8px] font-bold uppercase ${hacker.tier === 'AI Construct' ? 'text-red-500' : 'text-zinc-500'}`}>{hacker.tier}</div>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className="font-bebas text-lg text-white">${formatMoney(hacker.cost as number)}</div>
                                          <div className="text-[8px] font-black text-emerald-500">{Math.floor((hacker.successRate as number) * 100)}% SR</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="bg-zinc-900/30 p-6 rounded-[2.5rem] border border-white/5">
                          <h4 className="text-[9px] font-black uppercase text-zinc-500 mb-4 tracking-widest">ACTIVE NODES</h4>
                          <div className="space-y-2 font-mono text-[9px] text-zinc-400">
                              <div className="flex justify-between"><span>NODE_ALPHA</span><span className="text-emerald-500">CONNECTED</span></div>
                              <div className="flex justify-between"><span>NODE_BETA</span><span className="text-emerald-500">CONNECTED</span></div>
                              <div className="flex justify-between"><span>NODE_GAMMA</span><span className="text-emerald-500">CONNECTED</span></div>
                              <div className="flex justify-between"><span>PROXY_SERVER</span><span className="text-amber-500">REROUTING</span></div>
                          </div>
                      </div>
                  </div>
              )}
           </div>
        )}
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <nav className="absolute bottom-0 left-0 right-0 max-w-[480px] w-full bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-[200]">
          <div className="flex justify-around items-center p-2">
              <button onClick={() => handleTabChange('portfolio')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'portfolio' ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <div className="w-6 h-6"><Icons.Money /></div>
                  <span className="text-[9px] font-black uppercase tracking-wider">Empire</span>
              </button>
              
              <button onClick={() => handleTabChange('market')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative ${activeTab === 'market' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <div className="w-6 h-6 relative flex items-center justify-center">
                    <Icons.Finance />
                    {state.activeNews && (
                      <span className={`absolute -top-2 -right-3 text-[7px] font-black px-1 py-0.5 rounded-full animate-bounce shadow-md tracking-tighter ${
                        state.activeNews.multiplier >= 1.5 
                          ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                          : state.activeNews.multiplier <= 0.6 
                            ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                            : 'bg-amber-500 text-black'
                      }`}>
                        {state.activeNews.multiplier >= 1.5 ? `🔥${state.activeNews.multiplier}x` : `📉${state.activeNews.multiplier}x`}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider">Market</span>
              </button>

              <button onClick={() => handleTabChange('chat')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'chat' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <div className="w-6 h-6 relative">
                      <Icons.Send />
                      {state.rankId < 1 && state.prestigeCount === 0 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-zinc-700 rounded-full"><Icons.Lock /></div>}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider">Net</span>
              </button>

              <button onClick={() => handleTabChange('imperial')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'imperial' ? 'text-purple-500 bg-purple-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <div className="w-6 h-6"><Icons.Diamond /></div>
                  <span className="text-[9px] font-black uppercase tracking-wider">Shop</span>
              </button>
              <button onClick={() => handleTabChange('status')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'status' ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <div className="w-6 h-6 relative flex items-center justify-center overflow-hidden rounded-full">
                      {state.avatar.startsWith('/') || state.avatar.startsWith('http') ? <img src={state.avatar} className="w-full h-full object-cover" /> : state.avatar}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider">Status</span>
              </button>
          </div>
      </nav>
      
      </div>
    </div>
  );
};

export default App;