
import { Asset, Rank, LifestyleItem, ShopItem, SimulatedUser, Stock, DiamondBundle, HackerProfile } from './types';

export const AVATAR_OPTIONS = [
  ...[10, 12, 15, 17, 19, 2, 21, 25, 29, 3, 31, 33, 34, 35, 36, 37, 38, 5, 6].map(i => `/assets/avatars/free/default/cropped_circle_image (${i}).png`)
];

export const RARE_AVATARS = [
  ...[11, 14, 20, 22, 28, 39, 7, 8].map(i => `/assets/avatars/free/event/rare/cropped_circle_image (${i}).png`)
];

export const ULTRA_RARE_AVATARS = [
  ...[23, 27, 4, 40].map(i => `/assets/avatars/free/event/Ultra rare/cropped_circle_image (${i}).png`)
];

export const PREMIUM_AVATARS = [
  ...[13, 16, 18, 24, 26, 30, 42, 43].map(i => `/assets/avatars/premium/cropped_circle_image (${i}).png`)
];

export const ALL_TITLES = [
  { id: 'Novice', category: 'Standard', rarity: 'common' },
  { id: 'Hustler', category: 'Standard', rarity: 'common' },
  { id: 'Entrepreneur', category: 'Standard', rarity: 'rare' },
  { id: 'Mogul', category: 'Standard', rarity: 'epic' },
  { id: 'Tycoon', category: 'Standard', rarity: 'legendary' },
  { id: 'Oligarch', category: 'Standard', rarity: 'legendary' },
  { id: 'Shadow Sovereign', category: 'Standard', rarity: 'exotic' },
  { id: 'Universal Constant', category: 'Cosmic', rarity: 'exotic' },
  { id: 'The Glitch', category: 'Hacker', rarity: 'epic' },
  { id: 'Loan Shark', category: 'Business', rarity: 'rare' },
  { id: 'The Eye', category: 'Secret', rarity: 'legendary' },
  { id: 'Architect', category: 'Cosmic', rarity: 'exotic' },
  { id: 'APEX', category: 'Predator', rarity: 'exotic' },
  { id: 'DEITY', category: 'God', rarity: 'exotic' },
  { id: 'VIP', category: 'Premium', rarity: 'rare' },
  { id: 'Early Adopter', category: 'Legacy', rarity: 'uncommon' }
];

export const REALITY_ICONS = [
  '/assets/icons/2.png',
  '/assets/icons/3.png',
  '/assets/icons/4.png'
];

export const RANKS: Rank[] = [
  { id: 0, name: 'Hustler', requirement: 0, perks: 'Standard Status', color: '#71717a', description: 'Just starting the climb.', dominancePercent: 0.001 },
  { id: 1, name: 'Entrepreneur', requirement: 100000, perks: '+10% Yield', color: '#10b981', description: 'Founding the future.', dominancePercent: 0.1 },
  { id: 2, name: 'Mogul', requirement: 10000000, perks: '+25% Yield', color: '#3b82f6', description: 'Dominating the local scene.', dominancePercent: 1.5 },
  { id: 3, name: 'Tycoon', requirement: 1000000000, perks: '+50% Yield', color: '#f59e0b', description: 'Generational wealth secured.', dominancePercent: 12.4 },
  { id: 4, name: 'Oligarch', requirement: 100000000000, perks: '+100% Yield', color: '#a855f7', description: 'The law belongs to you.', dominancePercent: 35.8 },
  { id: 5, name: 'Shadow Sovereign', requirement: 10000000000000, perks: 'Global Influence', color: '#ffffff', description: 'Invisible hand of the market.', dominancePercent: 68.2 },
  { id: 6, name: 'Universal Constant', requirement: 1e15, perks: 'Ascended Being', color: '#fbbf24', description: 'Reality bends to your wallet.', dominancePercent: 99.99 }
];

export const HACKER_ROSTER: HackerProfile[] = [
  { id: 'h_1', name: 'Script Kiddie', cost: 50000, successRate: 0.3, detectionRate: 0.6, tier: 'Script Kiddie', description: 'Cheap. Messy. High risk of backfire.' },
  { id: 'h_2', name: 'Dark Web Freelancer', cost: 1000000, successRate: 0.55, detectionRate: 0.4, tier: 'Black Hat', description: 'Professional standard. Knows how to hide traces.' },
  { id: 'h_3', name: 'Ex-NSA Operative', cost: 50000000, successRate: 0.8, detectionRate: 0.15, tier: 'State Actor', description: 'Surgical precision. Almost undetectable.' },
  { id: 'h_4', name: 'Sentient AI Worm', cost: 5000000000, successRate: 0.98, detectionRate: 0.01, tier: 'AI Construct', description: 'The perfect virus. Guaranteed devastation.' },
];

export const DIAMOND_BUNDLES: DiamondBundle[] = [
  { id: 'd_1', name: 'Elite Starter', amount: 100, price: 1.99, icon: 'Diamond', productId: 'lb_diamonds_100' },
  { id: 'd_2', name: 'Mogul Stash', amount: 600, price: 9.99, icon: 'Diamond', isPopular: true, productId: 'lb_diamonds_600' },
  { id: 'd_3', name: 'Billionaire Vault', amount: 1500, price: 19.99, icon: 'Diamond', productId: 'lb_diamonds_1500' },
  { id: 'd_4', name: 'The Treasury', amount: 5000, price: 49.99, icon: 'Diamond', productId: 'lb_diamonds_5000' }
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'vip_pass', name: 'VIP Dynasty Pass', description: 'Permanent x2 passive yield and Gold Profile Name.', price: 5000, type: 'permanent', rewardValue: 2, icon: 'Luxury' },
  { id: 'quantum_aegis', name: 'Quantum Aegis', description: '100% Breach Proof. Permanent hack immunity.', price: 3500, type: 'security', rewardValue: 100, icon: 'Shield' },
  { id: 'neural_encrypt', name: 'Neural Encryptor', description: 'Increases firewall strength by 50% permanently.', price: 1200, type: 'security', rewardValue: 50, icon: 'Lock' },
  { id: 'auto_exec', name: 'Neural Tapper', description: 'Automates all tapping at max speed for 5 minutes.', price: 150, type: 'action', rewardValue: 300, icon: 'Tech' },
  { id: 'smart_trade', name: 'Neural Trading', description: 'Triple Tech and Finance sector income permanently.', price: 800, type: 'permanent', rewardValue: 3, icon: 'Tech' },
  { id: 'quantum_leap', name: 'Temporal Jump', description: 'Instantly gain 24 hours of total passive yield.', price: 250, type: 'booster', rewardValue: 86400, icon: 'Cosmic' },
  { id: 'satellite_feed', name: 'Bloomberg Satellite Feed', description: 'Live news and market announcements pop up instantly on your screen.', price: 200, type: 'permanent', rewardValue: 1, icon: 'Finance' },
];

// BLACK MARKET: Prices double for each item. Start at 1 Trillion.
const BASE_BM_PRICE = 1000000000000; // 1T

export const BLACK_MARKET_ITEMS: ShopItem[] = [
  // 1T
  { id: 'bm_cosmetic_red', name: 'Neon Blood', description: 'Chat name color.', price: BASE_BM_PRICE * Math.pow(2, 0), currency: 'money', type: 'cosmetic', rewardValue: 0, rewardMeta: '#ef4444', icon: 'Luxury', requiredRank: 4, tier: 'rare' }, 
  // 2T
  { id: 'bm_title_hacker', name: 'The Glitch', description: 'Unique profile title.', price: BASE_BM_PRICE * Math.pow(2, 1), currency: 'money', type: 'title', rewardValue: 0, rewardMeta: 'The Glitch', icon: 'Tech', requiredRank: 4, tier: 'epic' },
  // 4T
  { id: 'bm_avatar_alien', name: 'The Grey', description: 'Unlock Alien Avatar.', price: BASE_BM_PRICE * Math.pow(2, 2), currency: 'money', type: 'avatar', rewardValue: 0, rewardMeta: PREMIUM_AVATARS[0], icon: 'Space', requiredRank: 4, tier: 'rare' },
  // 8T
  { id: 'bm_risk_gamble_1', name: 'Chaos Protocol I', description: '50% Chance: x5 Money OR /2 Money.', price: BASE_BM_PRICE * Math.pow(2, 3), currency: 'money', type: 'risk', rewardValue: 0, icon: 'Finance', requiredRank: 4, tier: 'rare' },
  // 16T
  { id: 'bm_cosmetic_blue', name: 'Cyber Soul', description: 'Chat name color.', price: BASE_BM_PRICE * Math.pow(2, 4), currency: 'money', type: 'cosmetic', rewardValue: 0, rewardMeta: '#06b6d4', icon: 'Tech', requiredRank: 4, tier: 'epic' },
  // 32T
  { id: 'bm_title_shark', name: 'Loan Shark', description: 'Unique profile title.', price: BASE_BM_PRICE * Math.pow(2, 5), currency: 'money', type: 'title', rewardValue: 0, rewardMeta: 'Loan Shark', icon: 'Money', requiredRank: 4, tier: 'rare' },
  // 64T
  { id: 'bm_bgm_cyber', name: 'Cyberpunk 2099', description: 'Unlock Synthwave BGM.', price: BASE_BM_PRICE * Math.pow(2, 6), currency: 'money', type: 'bgm', rewardValue: 0, rewardMeta: 'cyber_theme', icon: 'Tech', requiredRank: 5, tier: 'legendary' },
  // 128T
  { id: 'bm_avatar_dragon', name: 'Elder Drake', description: 'Unlock Dragon Avatar.', price: BASE_BM_PRICE * Math.pow(2, 7), currency: 'money', type: 'avatar', rewardValue: 0, rewardMeta: PREMIUM_AVATARS[1], icon: 'Legacy', requiredRank: 5, tier: 'epic' },
  // 256T
  { id: 'bm_cosmetic_gold', name: 'Midas Touch', description: 'Golden chat name.', price: BASE_BM_PRICE * Math.pow(2, 8), currency: 'money', type: 'cosmetic', rewardValue: 0, rewardMeta: '#fbbf24', icon: 'Money', requiredRank: 5, tier: 'legendary' },
  // 512T
  { id: 'bm_title_illuminati', name: 'The Eye', description: 'Unique profile title.', price: BASE_BM_PRICE * Math.pow(2, 9), currency: 'money', type: 'title', rewardValue: 0, rewardMeta: 'The Eye', icon: 'Shield', requiredRank: 5, tier: 'legendary' },
  // 1.02 Qd
  { id: 'bm_risk_gamble_2', name: 'Chaos Protocol II', description: '50% Chance: x10 Money OR /4 Money.', price: BASE_BM_PRICE * Math.pow(2, 10), currency: 'money', type: 'risk', rewardValue: 0, icon: 'Finance', requiredRank: 5, tier: 'epic' },
  // 2.04 Qd
  { id: 'bm_bgm_void', name: 'Void Symphony', description: 'Unlock Void BGM.', price: BASE_BM_PRICE * Math.pow(2, 11), currency: 'money', type: 'bgm', rewardValue: 0, rewardMeta: 'void_theme', icon: 'Cosmic', requiredRank: 5, tier: 'exotic' },
  // 4.09 Qd
  { id: 'bm_avatar_robot', name: 'Singularity', description: 'Unlock Robot Avatar.', price: BASE_BM_PRICE * Math.pow(2, 12), currency: 'money', type: 'avatar', rewardValue: 0, rewardMeta: PREMIUM_AVATARS[2], icon: 'Tech', requiredRank: 5, tier: 'legendary' },
  // 8.19 Qd
  { id: 'bm_title_architect', name: 'Architect', description: 'The Architect Title.', price: BASE_BM_PRICE * Math.pow(2, 13), currency: 'money', type: 'title', rewardValue: 0, rewardMeta: 'The Architect', icon: 'Legacy', requiredRank: 5, tier: 'exotic' },
  // 16.3 Qd
  { id: 'bm_cosmetic_void', name: 'Void Essence', description: 'Purple chat name.', price: BASE_BM_PRICE * Math.pow(2, 14), currency: 'money', type: 'cosmetic', rewardValue: 0, rewardMeta: '#d8b4fe', icon: 'Cosmic', requiredRank: 5, tier: 'exotic' },
  // 32.7 Qd
  { id: 'bm_title_apex', name: 'APEX', description: 'APEX PREDATOR Title.', price: BASE_BM_PRICE * Math.pow(2, 15), currency: 'money', type: 'title', rewardValue: 0, rewardMeta: 'APEX', icon: 'Shield', requiredRank: 5, tier: 'exotic' },
  // 65.5 Qd
  { id: 'bm_avatar_ghost', name: 'Phantom', description: 'Unlock Ghost Avatar.', price: BASE_BM_PRICE * Math.pow(2, 16), currency: 'money', type: 'avatar', rewardValue: 0, rewardMeta: PREMIUM_AVATARS[3], icon: 'Cosmic', requiredRank: 5, tier: 'legendary' },
  // 131 Qd
  { id: 'bm_risk_gamble_3', name: 'Chaos Protocol MAX', description: '50% Chance: x100 Money OR Reset Cash.', price: BASE_BM_PRICE * Math.pow(2, 17), currency: 'money', type: 'risk', rewardValue: 0, icon: 'Finance', requiredRank: 5, tier: 'exotic' },
  // 262 Qd
  { id: 'bm_title_god', name: 'DEITY', description: 'The Ultimate Title.', price: BASE_BM_PRICE * Math.pow(2, 18), currency: 'money', type: 'title', rewardValue: 0, rewardMeta: 'DEITY', icon: 'Cosmic', requiredRank: 6, tier: 'exotic' },
  // 524 Qd
  { id: 'bm_avatar_crown', name: 'The Crown', description: 'Unlock Crown Avatar.', price: BASE_BM_PRICE * Math.pow(2, 19), currency: 'money', type: 'avatar', rewardValue: 0, rewardMeta: PREMIUM_AVATARS[4], icon: 'Luxury', requiredRank: 6, tier: 'exotic' },
];

const genHistory = (base: number, volatility: number) => {
  let current = base;
  // Generate 100 points for better 1M/1Y granularity
  return Array(100).fill(0).map(() => {
    const change = (Math.random() - 0.5) * volatility * current;
    current += change;
    return Math.max(0.1, current);
  });
};

export const INITIAL_STOCKS: Stock[] = [
  { id: 'BTC', name: 'Bitcoin', price: 67420, history: genHistory(67420, 0.04), volatility: 0.04, trend: 'up', category: 'crypto', sector: 'Digital Gold / L0', icon: '₿', openPrice: 65100, high24h: 68200, low24h: 64800, volume24h: 38500000000, marketCap: 1320000000000, peRatio: 0, analystRating: 'Strong Buy', summary: 'Leading decentralized global digital store of value & macro liquidity proxy.', totalFloat: 50000, dividendYieldPerSec: 150 },
  { id: 'ETH', name: 'Ethereum', price: 3480, history: genHistory(3480, 0.05), volatility: 0.05, trend: 'flat', category: 'crypto', sector: 'Smart Contracts', icon: 'Ξ', openPrice: 3410, high24h: 3560, low24h: 3380, volume24h: 18200000000, marketCap: 418000000000, peRatio: 0, analystRating: 'Buy', summary: 'Decentralized global computation platform & institutional tokenization hub.', totalFloat: 120000, dividendYieldPerSec: 45 },
  { id: 'SOL', name: 'Solana', price: 178, history: genHistory(178, 0.07), volatility: 0.07, trend: 'up', category: 'crypto', sector: 'High-Speed L1', icon: '◎', openPrice: 165, high24h: 184, low24h: 162, volume24h: 6400000000, marketCap: 82000000000, peRatio: 0, analystRating: 'Buy', summary: 'Sub-second latency blockchain powering high-frequency consumer web3 trading.', totalFloat: 250000, dividendYieldPerSec: 15 },
  { id: 'DGE', name: 'DogeNode', price: 0.165, history: genHistory(0.165, 0.09), volatility: 0.09, trend: 'down', category: 'crypto', sector: 'Meme Liquidity', icon: '🐕', openPrice: 0.152, high24h: 0.182, low24h: 0.148, volume24h: 2100000000, marketCap: 24000000000, peRatio: 0, analystRating: 'Hold', summary: 'High-beta viral digital currency driven by social momentum and retail velocity.', totalFloat: 10000000, dividendYieldPerSec: 5 },
  { id: 'NOVI', name: 'Novida Systems', price: 924.5, history: genHistory(924.5, 0.04), volatility: 0.04, trend: 'up', category: 'stock', sector: 'AI Compute & GPUs', icon: '🟢', openPrice: 890, high24h: 935, low24h: 885, volume24h: 42000000000, marketCap: 2280000000000, peRatio: 64.2, analystRating: 'Strong Buy', summary: 'Monopoly supplier of tensor GPUs and accelerated architecture for generative AI clusters.', totalFloat: 25000, dividendYieldPerSec: 250 },
  { id: 'PEAR', name: 'Pear Inc', price: 184.2, history: genHistory(184.2, 0.025), volatility: 0.025, trend: 'flat', category: 'stock', sector: 'Consumer Hardware', icon: '🍐', openPrice: 181.5, high24h: 186, low24h: 180.8, volume24h: 15400000000, marketCap: 2840000000000, peRatio: 29.8, analystRating: 'Buy', summary: 'Global hardware titan with deep brand moat, high-margin service retainers, and AR devices.', totalFloat: 80000, dividendYieldPerSec: 60 },
  { id: 'MHRD', name: 'Microhard', price: 428.1, history: genHistory(428.1, 0.022), volatility: 0.022, trend: 'up', category: 'stock', sector: 'Enterprise Cloud & AI', icon: '🪟', openPrice: 422, high24h: 431.5, low24h: 419, volume24h: 18700000000, marketCap: 3180000000000, peRatio: 35.1, analystRating: 'Strong Buy', summary: 'Enterprise OS, Azure Cloud computing, and commercial generative copilot ecosystem.', totalFloat: 75000, dividendYieldPerSec: 110 },
  { id: 'VOLT', name: 'Volt Dynamics', price: 248.8, history: genHistory(248.8, 0.05), volatility: 0.05, trend: 'up', category: 'stock', sector: 'Clean Energy & Autonomy', icon: '⚡', openPrice: 235, high24h: 254, low24h: 232, volume24h: 24500000000, marketCap: 790000000000, peRatio: 72.4, analystRating: 'Hold', summary: 'Vertical electric vehicle manufacturer, grid megabattery storage, and humanoid robotics.', totalFloat: 90000, dividendYieldPerSec: 75 },
  { id: 'OMNI', name: 'OmniNet', price: 172.4, history: genHistory(172.4, 0.03), volatility: 0.03, trend: 'flat', category: 'stock', sector: 'Search & Generative AI', icon: '🌐', openPrice: 169.5, high24h: 174.2, low24h: 168, volume24h: 11200000000, marketCap: 2150000000000, peRatio: 24.6, analystRating: 'Buy', summary: 'Dominant global search index, ad network engine, and multi-modal foundation AI labs.', totalFloat: 110000, dividendYieldPerSec: 50 },
  { id: 'NILE', name: 'Nile Retail', price: 188.75, history: genHistory(188.75, 0.035), volatility: 0.035, trend: 'up', category: 'stock', sector: 'Cloud AWS & Logistics', icon: '📦', openPrice: 184, high24h: 191, low24h: 183.5, volume24h: 14200000000, marketCap: 1960000000000, peRatio: 41.2, analystRating: 'Strong Buy', summary: 'Global e-commerce marketplace and industry-leading Amazon Web Services infrastructure.', totalFloat: 105000, dividendYieldPerSec: 55 },
  { id: 'VEO', name: 'Veo Systems', price: 462.5, history: genHistory(462.5, 0.045), volatility: 0.045, trend: 'up', category: 'stock', sector: 'Diffusion AI Models', icon: '🎥', openPrice: 448, high24h: 472, low24h: 442, volume24h: 8400000000, marketCap: 240000000000, peRatio: 88.5, analystRating: 'Strong Buy', summary: 'Pioneering photorealistic video synthesis and spatial world models for next-gen media.', totalFloat: 40000, dividendYieldPerSec: 120 },
  { id: 'GMC', name: 'Galactic Mining', price: 12450, history: genHistory(12450, 0.025), volatility: 0.025, trend: 'flat', category: 'stock', sector: 'Aerospace & Asteroid Ore', icon: '⛏️', openPrice: 12100, high24h: 12600, low24h: 11950, volume24h: 4500000000, marketCap: 450000000000, peRatio: 18.2, analystRating: 'Buy', summary: 'Orbital resource extraction, rare earth asteroid refining, and interplanetary logistics.', totalFloat: 12000, dividendYieldPerSec: 850 },
  { id: 'FRX', name: 'FruitX Corp', price: 154.6, history: genHistory(154.6, 0.028), volatility: 0.028, trend: 'flat', category: 'stock', sector: 'Silicon Wearables', icon: '🍎', openPrice: 152, high24h: 156, low24h: 151, volume24h: 9800000000, marketCap: 1250000000000, peRatio: 26.5, analystRating: 'Hold', summary: 'Custom silicon architectures and biometric wearable ecosystem with recurring subscription cashflow.', totalFloat: 85000, dividendYieldPerSec: 40 },
  { id: 'TLA', name: 'Tesla-2', price: 812, history: genHistory(812, 0.04), volatility: 0.04, trend: 'up', category: 'stock', sector: 'Autonomous Fleets', icon: '🏎️', openPrice: 795, high24h: 825, low24h: 790, volume24h: 19000000000, marketCap: 890000000000, peRatio: 68, analystRating: 'Buy', summary: 'End-to-end neural autonomous robotaxi network and clean gigafactory automation.', totalFloat: 35000, dividendYieldPerSec: 210 }
];

export const INITIAL_ASSETS: Asset[] = [
  // TIER 1: Street Level (Tens - Thousands)
  { id: 'lemonade', name: 'Lemonade Stand', category: 'business', sector: 'service', baseCost: 18, baseIncome: 1.5, description: 'Childhood dream.', icon: 'Money', count: 0, level: 1 },
  { id: 'vending_machine', name: 'Vending Route', category: 'business', sector: 'service', baseCost: 120, baseIncome: 4, description: 'Passive snacking income.', icon: 'Money', count: 0, level: 1 },
  { id: 'laundromat', name: 'Clean Coin Laundry', category: 'business', sector: 'service', baseCost: 350, baseIncome: 12, description: 'Cleaning more than clothes.', icon: 'Money', count: 0, level: 1 },
  { id: 'logistics_van', name: 'Local Logistics', category: 'business', sector: 'service', baseCost: 800, baseIncome: 25, description: 'Moving goods locally.', icon: 'Tech', count: 0, level: 1, requiredAssetId: 'lemonade', requiredAssetCount: 10 },
  
  // TIER 2: Small Business (Thousands - Millions)
  { id: 'food_truck', name: 'Gourmet Truck', category: 'business', sector: 'service', baseCost: 2500, baseIncome: 80, description: 'Artisan street food.', icon: 'Money', count: 0, level: 1 },
  { id: 'startup', name: 'Tech Incubator', category: 'business', sector: 'tech', baseCost: 7500, baseIncome: 220, description: 'Burning cash for growth.', icon: 'Tech', count: 0, level: 1 },
  { id: 'penthouse', name: 'Sky Penthouse', category: 'luxury', sector: 'luxury', baseCost: 25000, baseIncome: 650, description: 'A view from the top.', icon: 'Luxury', count: 0, level: 1 },
  { id: 'indie_game', name: 'Game Studio', category: 'business', sector: 'entertainment', baseCost: 80000, baseIncome: 1800, description: 'Indie hit factory.', icon: 'Entertainment', count: 0, level: 1 },

  // TIER 3: Corporate (Millions - Billions)
  { id: 'bot_farm', name: 'Social Bot Net', category: 'business', sector: 'tech', baseCost: 350000, baseIncome: 6500, description: 'Influencing the algorithm.', icon: 'Tech', count: 0, level: 1 },
  { id: 'luxury_car', name: 'Supercar Garage', category: 'luxury', sector: 'luxury', baseCost: 1200000, baseIncome: 15000, description: 'Speed is asset.', icon: 'Luxury', count: 0, level: 1 },
  { id: 'crypto_farm', name: 'Mining Facility', category: 'business', sector: 'finance', baseCost: 5000000, baseIncome: 55000, description: 'Verify the chain.', icon: 'Finance', count: 0, level: 1 },
  { id: 'stadium', name: 'eSports Arena', category: 'luxury', sector: 'entertainment', baseCost: 25000000, baseIncome: 240000, description: 'Digital coliseum.', icon: 'Entertainment', count: 0, level: 1 },
  { id: 'media', name: 'News Network', category: 'business', sector: 'entertainment', baseCost: 150000000, baseIncome: 1100000, description: 'Control the narrative.', icon: 'Entertainment', count: 0, level: 1 },

  // TIER 4: Conglomerate (Billions - Trillions)
  { id: 'vertical_farm', name: 'Vertical Agro-Tech', category: 'business', sector: 'tech', baseCost: 850000000, baseIncome: 5000000, description: 'Farming the sky.', icon: 'Energy', count: 0, level: 1 },
  { id: 'neo_bank', name: 'Neo-Bank System', category: 'business', sector: 'finance', baseCost: 5000000000, baseIncome: 25000000, description: 'Banking without borders.', icon: 'Finance', count: 0, level: 1 },
  { id: 'delivery_drone', name: 'Drone Hive', category: 'business', sector: 'tech', baseCost: 25000000000, baseIncome: 120000000, description: 'Automated logistics.', icon: 'Tech', count: 0, level: 1, requiredAssetId: 'ecommerce', requiredAssetCount: 20 },
  { id: 'pmc', name: 'Private Military', category: 'business', sector: 'service', baseCost: 150000000000, baseIncome: 650000000, description: 'Security on demand.', icon: 'Luxury', count: 0, level: 1 },
  
  // TIER 5: Megaprojects (Trillions - Quadrillions)
  { id: 'mars_base', name: 'Mars Colony', category: 'megaproject', sector: 'space', baseCost: 2000000000000, baseIncome: 7500000000, description: 'Wait, is that Elon?', icon: 'Space', count: 0, level: 1 },
  { id: 'ocean_city', name: 'Atlantis Prime', category: 'megaproject', sector: 'luxury', baseCost: 15000000000000, baseIncome: 45000000000, description: 'Undersea metropolis.', icon: 'Luxury', count: 0, level: 1 },
  { id: 'fusion_plant', name: 'Fusion Reactor', category: 'megaproject', sector: 'energy', baseCost: 85000000000000, baseIncome: 220000000000, description: 'A star in a jar.', icon: 'Energy', count: 0, level: 1 },
  { id: 'asteroid_mine', name: 'Belt Mining Op', category: 'megaproject', sector: 'space', baseCost: 500000000000000, baseIncome: 1200000000000, description: 'Rare earth metals.', icon: 'Space', count: 0, level: 1 },

  // TIER 6: Sci-Fi (Quadrillions - ???)
  { id: 'genetic_lab', name: 'Gene Foundry', category: 'business', sector: 'tech', baseCost: 10000000000000000, baseIncome: 15000000000000, description: 'Designing better humans.', icon: 'Tech', count: 0, level: 1 }, // 10 Qd
  { id: 'weather_control', name: 'Weather Engine', category: 'megaproject', sector: 'energy', baseCost: 85000000000000000, baseIncome: 120000000000000, description: 'Rain on command.', icon: 'Energy', count: 0, level: 1 }, // 85 Qd
  { id: 'dyson_sphere', name: 'Dyson Swarm', category: 'megaproject', sector: 'energy', baseCost: 500000000000000000, baseIncome: 850000000000000, description: 'Harvesting the sun.', icon: 'Energy', count: 0, level: 1 }, // 0.5 Qi
  { id: 'orbital_ring', name: 'Orbital Ring', category: 'megaproject', sector: 'space', baseCost: 7500000000000000000, baseIncome: 12000000000000000, description: 'Planetary transit.', icon: 'Space', count: 0, level: 1 }, // 7.5 Qi
  
  // TIER 7: Cosmic (Cosmic Scale)
  { id: 'antimatter_factory', name: 'Antimatter Rig', category: 'megaproject', sector: 'energy', baseCost: 150000000000000000000, baseIncome: 250000000000000000, description: 'The ultimate fuel.', icon: 'Energy', count: 0, level: 1 }, // 150 Sx
  { id: 'time_node', name: 'Chronos Server', category: 'megaproject', sector: 'tech', baseCost: 5000000000000000000000, baseIncome: 7500000000000000000, description: 'Computing the future.', icon: 'Cosmic', count: 0, level: 1 }, // 5 Sx
  { id: 'consciousness_cloud', name: 'Mind Upload', category: 'cosmic', sector: 'cosmic', baseCost: 85000000000000000000000, baseIncome: 120000000000000000000, description: 'Immortality v1.0.', icon: 'Cosmic', count: 0, level: 1 }, // 85 Sx
  { id: 'galaxy_sim', name: 'Galaxy Simulation', category: 'cosmic', sector: 'cosmic', baseCost: 1000000000000000000000000000, baseIncome: 15000000000000000000000000, description: 'Playing god.', icon: 'Cosmic', count: 0, level: 1 }, // 1 Octillion
  { id: 'reality_engine', name: 'Reality Editor', category: 'cosmic', sector: 'cosmic', baseCost: 1000000000000000000000000000000, baseIncome: 5000000000000000000000000000000, description: 'Admin access to the universe.', icon: 'Cosmic', count: 0, level: 1 } // 1 Nonillion
];

export const BOOSTER_DURATION = 60 * 1000; 
export const TICK_RATE = 100;

// GENERATE 50 BOTS
const generateBots = (): SimulatedUser[] => {
  const bots: SimulatedUser[] = [
    // Zenith: The Unreachable God
    // Starts at 50 Quintillion (50e18) to be safely above normal gameplay but below endgame cosmic players.
    // Has insane growth rate.
    { id: 'bot-zenith', name: 'Zenith', avatar: PREMIUM_AVATARS[0], personality: 'zenith', money: 5e32, diamonds: 999999999, isOnline: true, wakeHour: 0, sleepHour: 24, location: 'Sanctum', growthRate: 1e25, isLegendary: true },
    
    // Other High Rankers
    { id: 'bot-gent-1', name: 'Arthur', avatar: PREMIUM_AVATARS[1], personality: 'gentleman', money: 2.5e20, diamonds: 15000, isOnline: true, wakeHour: 5, sleepHour: 23, location: 'London', growthRate: 1e12 },
    { id: 'bot-whale-1', name: 'Moby Rich', avatar: PREMIUM_AVATARS[2], personality: 'whale', money: 1.2e18, diamonds: 5000, isOnline: true, wakeHour: 10, sleepHour: 2, location: 'Dubai', growthRate: 5e11 },
    { id: 'bot-tech-1', name: 'Silicon Sage', avatar: PREMIUM_AVATARS[3], personality: 'grinder', money: 8e17, diamonds: 200, isOnline: true, wakeHour: 0, sleepHour: 24, location: 'Valley', growthRate: 3e11 },
  ];

  const genericNames = ["Viper", "Ghost", "Neo", "Trinity", "Cipher", "Baron", "Duke", "Prince", "King", "Ace", "Joker", "Queen", "Jack", "Ten", "Wolf", "Fox", "Bear", "Bull", "Hawk", "Eagle", "Shark", "Cobra", "Titan", "Atlas", "Apollo", "Zeus", "Hera", "Thor", "Loki", "Odin", "Mars", "Venus", "Pluto", "Sol", "Luna", "Star", "Comet", "Nova", "Pulse", "Wave", "Sonic", "Blaze", "Frost", "Storm", "Rain", "Cloud", "Sky"];
  const personalities: any[] = ['grinder', 'socialite', 'newbie', 'troll', 'lover', 'gentleman'];

  for (let i = 0; i < 46; i++) {
    const isRich = i < 10;
    const baseMoney = isRich ? 1e11 : 1e6;
    const mult = isRich ? 100 : 10;
    bots.push({
      id: `bot-gen-${i}`,
      name: genericNames[i % genericNames.length] + (isRich ? " IV" : ""),
      avatar: AVATAR_OPTIONS[i % AVATAR_OPTIONS.length],
      personality: personalities[i % personalities.length],
      money: baseMoney * (Math.random() * mult),
      diamonds: Math.floor(Math.random() * 100),
      isOnline: Math.random() > 0.5,
      wakeHour: 8,
      sleepHour: 22,
      location: 'Web',
      growthRate: baseMoney * 0.0001
    });
  }
  return bots.sort((a, b) => b.money - a.money);
};

export const SIMULATED_USERS: SimulatedUser[] = generateBots();

export const LIFESTYLE_ITEMS: LifestyleItem[] = [
  { id: 'watch', name: 'Vacheron Constantin', cost: 150000, multiplierAdd: 0.1, icon: 'Luxury', unlocked: false },
  { id: 'car', name: 'Rimac Nevera', cost: 2500000, multiplierAdd: 0.3, icon: 'Tech', unlocked: false },
  { id: 'jet', name: 'Bombardier Global 7500', cost: 75000000, multiplierAdd: 1.0, icon: 'Space', unlocked: false },
  { id: 'yacht', name: 'The Gigayacht', cost: 450000000, multiplierAdd: 2.5, icon: 'Luxury', unlocked: false },
  { id: 'island', name: 'Private Atoll', cost: 1500000000, multiplierAdd: 5.0, icon: 'Luxury', unlocked: false },
  { id: 'moon', name: 'Lunar Estate', cost: 50000000000, multiplierAdd: 15.0, icon: 'Cosmic', unlocked: false }
];
