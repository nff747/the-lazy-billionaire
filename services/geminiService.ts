
import { Sector, ChatMessage, SimulatedUser, Stock, GlobalNews, GameState } from "../types";
import { RANKS } from "../constants";

// --- EXPANDED CHAT DATASETS ---

const ZENITH_PHRASES = [
  "accumulation phase complete.",
  "the math doesn't lie. wealth is inevitable.",
  "they are printing more fiat. buy assets.",
  "reset imminent.",
  "just hedged my entire portfolio against the dollar.",
  "silence is expensive.",
  "we are early.",
  "algorithm optimized.",
  "human emotion is a market inefficiency.",
  "observe the flow of capital.",
];

// When Zenith speaks, other bots react realistically
const ZENITH_REACTIONS = [
  "yo zenith speaks??",
  "screenshot that",
  "what does that mean zenith",
  "is this financial advice?",
  "THE ORACLE",
  "all in.",
  "wait is that a bot or a dev?",
  "following this guy",
];

// Dynamic placeholders like {stock} will be replaced at runtime
const MARKET_BULL_PHRASES = [
  "green candles lookin tasty",
  "we are so back",
  "WAGMI",
  "{stock} going parabolic rn",
  "bears in shambles",
  "just ordered the porsche lol",
  "number go up",
  "who is selling {stock}?? stop it",
  "moon mission initiated 🚀",
  "LFG!!!!",
  "feels good not to be poor today",
  "yields are insane rn",
  "{stock} to the moon 🌙",
  "short sellers getting wrecked on {stock}",
];

const MARKET_BEAR_PHRASES = [
  "bruh why is everything red",
  "i am never financially recovering from this",
  "buying the dip... again",
  "falling knives everywhere",
  "got liquidated on {stock}. rip.",
  "is the app bugged or am i just losing money?",
  "holding forever i guess",
  "mcdonalds application sent",
  "its over",
  "stop the count!!",
  "my net worth just halved in 10 seconds",
  "why is {stock} dumping?",
  "panic selling {stock} rn",
];

const FLEX_PHRASES = [
  "just bought another island. bored.",
  "imagine not having e12 net worth lol",
  "my watch costs more than your life",
  "anyone else flying to monaco tonight?",
  "money is just a high score",
  "peasant yields vs king yields",
  "just hardened my whole list. come at me hackers.",
  "coffee money > your rent",
  "passive income is the only income",
];

const CASUAL_PHRASES = [
  "lag is real today",
  "anyone watching the game?",
  "need more diamonds asap",
  "rank up is taking forever",
  "is the ad boost working for u guys?",
  "crypto farm yield needs a buff",
  "just woke up what did i miss",
  "pizza time",
  "this ui is clean tho",
  "global ranking is bugged i swear",
  "any tips for the tech sector?",
  "{stock} looking sus",
  "wen prestige update?",
  "my firewall is holding barely",
];

// Generic names for dynamic rivals
export const RIVAL_NAMES = [
  "CryptoKing", "ElonWannabe", "HustleGpt", "AlphaMale", "YieldFarming", 
  "Satoshi", "DiamondHandz", "BagHolder", "MoonBoi", "StonkLover",
  "TechBro", "VentureCap", "AngelInvestor", "WhaleWatcher", "NoCoiner",
  "DayTrader", "Arbitrage", "LiquidityProvider", "MarketMaker", "Quant"
];

// Extended News Templates with "Type" for smarter selection
interface WeightedNewsTemplate {
  headline: string;
  sector: Sector | 'all';
  mult: number;
  type: 'tech_buff' | 'tech_nerf' | 'finance_buff' | 'finance_nerf' | 'luxury_buff' | 'general' | 'disaster' | 'utopia' | 'security_alert' | 'security_buff';
}

const EXTENDED_NEWS_TEMPLATES: WeightedNewsTemplate[] = [
  // TECH
  { headline: "AI Singularity: Tech Productivity Explodes.", sector: "tech", mult: 3.5, type: 'tech_buff' },
  { headline: "Global Silicon Shortage Halts Production.", sector: "tech", mult: 0.4, type: 'tech_nerf' },
  { headline: "Quantum Internet Beta Live: Tech Stocks Soar.", sector: "tech", mult: 2.0, type: 'tech_buff' },
  { headline: "Anti-Trust Laws Break Up Big Tech.", sector: "tech", mult: 0.6, type: 'tech_nerf' },
  
  // FINANCE
  { headline: "Crypto Legitimized as Global Currency.", sector: "finance", mult: 2.5, type: 'finance_buff' },
  { headline: "Central Bank Digital Currency Failure.", sector: "finance", mult: 0.5, type: 'finance_nerf' },
  { headline: "DeFi Regulation Act Passed: Markets Dip.", sector: "finance", mult: 0.7, type: 'finance_nerf' },
  { headline: "Institutional Investors Flood DeFi Markets.", sector: "finance", mult: 1.8, type: 'finance_buff' },

  // LUXURY
  { headline: "Golden Age of Opulence: Luxury Demand Peak.", sector: "luxury", mult: 2.2, type: 'luxury_buff' },
  { headline: "Global Wealth Tax Implementation.", sector: "luxury", mult: 0.5, type: 'general' },
  
  // GENERAL / DISASTER / UTOPIA
  { headline: "Global Economic Boom: Bull Market Confirmed.", sector: "all", mult: 1.5, type: 'utopia' },
  { headline: "Supply Chain Collapse: Global Recession.", sector: "all", mult: 0.5, type: 'disaster' },
  { headline: "Fusion Energy Solves Power Crisis.", sector: "energy", mult: 4.0, type: 'utopia' },
  { headline: "Solar Flare Disrupts Global Grid.", sector: "energy", mult: 0.2, type: 'disaster' },
  
  // SECURITY (New)
  { headline: "Zero-Day Exploit Leaked: Firewalls Failing.", sector: "tech", mult: 0.8, type: 'security_alert' },
  { headline: "Interpol Cyber-Division Cracks Down.", sector: "all", mult: 1.1, type: 'security_buff' },
];

// --- LOGIC ---

// Helper to get random rank for bots
const getRandomRank = (personality: string) => {
  if (personality === 'zenith') return RANKS[RANKS.length - 1]; // Zenith is always max
  if (personality === 'whale') return RANKS[Math.floor(Math.random() * 2) + 4]; // Oligarch+
  if (personality === 'newbie') return RANKS[0];
  // Random mid-tier for others
  return RANKS[Math.floor(Math.random() * 4) + 1];
};

export const generateGlobalNews = async (state: GameState): Promise<GlobalNews | null> => {
  // 30% chance for news to appear per check
  if (Math.random() > 0.3) return null;

  // 1. Analyze Player Portfolio to find Dominant Sector
  const sectorCounts: Record<string, number> = {};
  state.assets.forEach(asset => {
    if (asset.count > 0) {
      sectorCounts[asset.sector] = (sectorCounts[asset.sector] || 0) + asset.count;
    }
  });

  // Find the sector the player is most invested in
  let topSector: Sector | null = null;
  let maxCount = 0;
  Object.entries(sectorCounts).forEach(([sec, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topSector = sec as Sector;
    }
  });

  // 2. Determine News Type Probability based on State
  let candidatePool = [...EXTENDED_NEWS_TEMPLATES];
  
  // If player has been hacked a lot recently, increase chance of Security news
  if (state.financials.totalHackLosses > state.money * 0.2) {
     // Boost security-related templates weight by duplicating them in pool
     const securityNews = EXTENDED_NEWS_TEMPLATES.filter(t => t.type.includes('security'));
     candidatePool = [...candidatePool, ...securityNews, ...securityNews];
  }

  // If player is heavily invested in a sector, increase volatility for that sector (Buffs AND Nerfs)
  if (topSector) {
     const sectorNews = EXTENDED_NEWS_TEMPLATES.filter(t => t.sector === topSector);
     // Add them 3 times to significantly increase odds of personalized news
     candidatePool = [...candidatePool, ...sectorNews, ...sectorNews, ...sectorNews];
  }

  // If player is very rich (Top Ranks), add "Wealth Tax" or "Luxury" risks
  if (state.rankId >= 4) {
     const richNews = EXTENDED_NEWS_TEMPLATES.filter(t => t.headline.includes("Tax") || t.sector === 'luxury');
     candidatePool = [...candidatePool, ...richNews, ...richNews];
  }

  // 3. Select Template
  const template = candidatePool[Math.floor(Math.random() * candidatePool.length)];

  // 4. Generate Final News Object
  // Add some flavor text based on magnitude
  let flavor = "";
  if (template.mult >= 2.0) flavor = " (BOOM)";
  if (template.mult <= 0.5) flavor = " (CRASH)";

  return {
    id: Math.random().toString(36).substr(2, 9),
    headline: template.headline + flavor,
    targetSector: template.sector,
    multiplier: template.mult,
    expiresAt: Date.now() + (45 + Math.random() * 45) * 1000 // 45-90 seconds duration
  };
};

export const generateAutonomousChat = async (
  onlineBots: SimulatedUser[], 
  lastMessages: ChatMessage[], 
  playerData: { userName: string, money: number },
  stocks: Stock[]
): Promise<ChatMessage[]> => {
  
  const newMessages: ChatMessage[] = [];
  
  // 1. Determine Market Sentiment and Context
  const marketTrend = stocks.reduce((acc, s) => acc + (s.trend === 'up' ? 1 : -1), 0);
  
  // Find interesting stocks (very high or very low price change)
  const volatileStock = stocks.reduce((prev, current) => 
    (Math.abs(current.volatility) > Math.abs(prev.volatility) ? current : prev)
  );
  
  let pool = CASUAL_PHRASES;
  
  // Dynamic Probability based on trend
  if (marketTrend > 1) {
    pool = Math.random() < 0.6 ? MARKET_BULL_PHRASES : CASUAL_PHRASES;
  } else if (marketTrend < -1) {
    pool = Math.random() < 0.6 ? MARKET_BEAR_PHRASES : CASUAL_PHRASES;
  } else {
    pool = [...CASUAL_PHRASES, ...FLEX_PHRASES];
  }

  // 2. Zenith Check (Rare Event)
  const zenith = onlineBots.find(b => b.personality === 'zenith');
  const zenithSpeaks = zenith && Math.random() < 0.005;

  if (zenithSpeaks && zenith) {
    const rank = getRandomRank('zenith');
    const zMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: zenith.id,
      userName: zenith.name,
      avatar: zenith.avatar,
      text: ZENITH_PHRASES[Math.floor(Math.random() * ZENITH_PHRASES.length)],
      timestamp: Date.now(),
      isZenith: true,
      rankName: rank.name,
      rankColor: rank.color
    };
    newMessages.push(zMsg);

    // The Uproar
    const reactionCount = Math.floor(Math.random() * 3) + 2; 
    const reactors = onlineBots.filter(b => b.id !== zenith.id).sort(() => 0.5 - Math.random()).slice(0, reactionCount);
    
    reactors.forEach((bot, idx) => {
      const rRank = getRandomRank(bot.personality);
      newMessages.push({
        id: Math.random().toString(36).substr(2, 9) + idx,
        userId: bot.id,
        userName: bot.name,
        avatar: bot.avatar,
        text: ZENITH_REACTIONS[Math.floor(Math.random() * ZENITH_REACTIONS.length)],
        timestamp: Date.now() + (idx * 1500) + 1000, 
        rankName: rRank.name,
        rankColor: rRank.color
      });
    });

    return newMessages;
  }

  // 3. Normal Chat Flow
  // Lower frequency of messages to make it readable
  const numMessages = Math.random() > 0.7 ? 1 : 0; 

  if (numMessages > 0) {
    const bot = onlineBots[Math.floor(Math.random() * onlineBots.length)];
    if (bot.personality !== 'zenith') {
        let text = pool[Math.floor(Math.random() * pool.length)];

        // Inject stock context
        if (text.includes('{stock}')) {
             text = text.replace('{stock}', volatileStock.id);
        }

        // Personality overrides - add typos and lowercase to make it real
        if (bot.personality === 'troll') {
           const trollPhrases = ["have fun staying poor", "imagine buying at the top lol", "rug pull incoming", "devs do something"];
           text = Math.random() > 0.7 ? trollPhrases[Math.floor(Math.random() * trollPhrases.length)] : text;
        }
        if (bot.personality === 'newbie') {
           const noobPhrases = ["how do i get diamonds??", "this game is hard", "where is the sell button", "is this real money?"];
           text = Math.random() > 0.7 ? noobPhrases[Math.floor(Math.random() * noobPhrases.length)] : text;
        }
        
        // Randomly add typos
        if (Math.random() < 0.1) {
            text = text.replace('the', 'teh').replace('and', 'adn');
        }

        const rank = getRandomRank(bot.personality);

        newMessages.push({
          id: Math.random().toString(36).substr(2, 9),
          userId: bot.id,
          userName: bot.name,
          avatar: bot.avatar,
          text: text,
          timestamp: Date.now(),
          rankName: rank.name,
          rankColor: rank.color
        });
    }
  }

  return newMessages;
};

// --- SMART CONTEXTUAL SIMULATION ENGINE (0 MB, 0ms Latency, 100% Offline) ---

const ADVICE_DIAMONDS = [
  "watch ad boosts and prestige to stack diamonds fast",
  "daily login rewards give free diamonds don't miss them",
  "hack high rank players, don't waste diamonds on trash",
  "stack diamonds for cosmic prestige keys, trust me",
];

const ADVICE_STOCKS = [
  "buy {stock} before it goes parabolic",
  "short {stock} lol free money",
  "{stock} is wild today, get in or get rekt",
  "never panic sell at a loss, diamond hands only",
  "watch for global news events, 3x multipliers are insane",
];

const ADVICE_PROGRESS = [
  "buy tech and energy assets, service businesses yield pennies",
  "reinvest 90% of your dividends immediately",
  "upgrade firewalls first or hackers will siphon your vault",
  "grind until you reach billionaire rank, then prestige",
];

const ADVICE_HACKING = [
  "hire state actor hackers for maximum breach probability",
  "buy firewall hardening in the black market immediately",
  "if your logs turn red, transfer funds into stocks fast",
];

const ZENITH_LORE = [
  "zenith does not answer mortals.",
  "zenith bought the dip at 3am. we just follow.",
  "all hail zenith, the algorithmic overlord.",
  "zenith is already on e18 net worth.",
];

const GREETINGS = [
  "gm king ☕",
  "yo, get back to work markets are moving",
  "gm grind never stops",
  "wagmi",
  "sup peasant",
];

const TOXIC_RESPONSES = [
  "sounds like someone got liquidated lol",
  "have fun staying broke",
  "cry more, market doesn't care",
  "skill issue tbh",
  "stay mad while my dividends print",
];

// Content safety filter for App Store compliance
const sanitizeOutput = (text: string): string => {
  return text
    .replace(/\b(fuck|shit|bitch|asshole|dick|cunt|nigger|faggot)\b/gi, '***')
    .trim();
};

export const generateChatReplies = async (
  userMessage: string, 
  userData: { userName: string; money: number; stocks?: Stock[]; rankId?: number }, 
  onlineBots: SimulatedUser[]
): Promise<ChatMessage[]> => {
  
  // 25% chance no one replies (makes chat feel authentic, not like an echo chamber)
  if (Math.random() < 0.25) return [];

  const lowerMsg = userMessage.toLowerCase().trim();
  const isWorthy = userData.money > 1000000;
  
  // Available stock tickers
  const stockList = userData.stocks && userData.stocks.length > 0 
    ? userData.stocks 
    : [{ id: 'NOVI' }, { id: 'PEAR' }, { id: 'VOLT' }, { id: 'OMNI' }];
  const randomStock = stockList[Math.floor(Math.random() * stockList.length)].id;

  // Determine Contextual Reply Pool based on user input intent
  let replyPool: string[];

  if (lowerMsg.includes('diamond') || lowerMsg.includes('gem')) {
    replyPool = ADVICE_DIAMONDS;
  } else if (lowerMsg.includes('stock') || lowerMsg.includes('crypto') || lowerMsg.includes('buy') || lowerMsg.includes('sell') || lowerMsg.includes('trade')) {
    replyPool = ADVICE_STOCKS;
  } else if (lowerMsg.includes('rank') || lowerMsg.includes('prestige') || lowerMsg.includes('how to') || lowerMsg.includes('tip') || lowerMsg.includes('advice')) {
    replyPool = ADVICE_PROGRESS;
  } else if (lowerMsg.includes('hack') || lowerMsg.includes('firewall') || lowerMsg.includes('breach')) {
    replyPool = ADVICE_HACKING;
  } else if (lowerMsg.includes('zenith')) {
    replyPool = ZENITH_LORE;
  } else if (/^(hi|hello|gm|yo|sup|hey)\b/.test(lowerMsg)) {
    replyPool = GREETINGS;
  } else if (lowerMsg.includes('trash') || lowerMsg.includes('scam') || lowerMsg.includes('hate') || lowerMsg.includes('loser') || lowerMsg.includes('bot')) {
    replyPool = TOXIC_RESPONSES;
  } else if (lowerMsg.includes('rich') || lowerMsg.includes('billion') || lowerMsg.includes('million') || lowerMsg.includes('flex')) {
    replyPool = isWorthy 
      ? ["whale alert 🚨", "sheesh calm down buffett", "teach me ur ways king", "prove it drop a red packet", "based portfolio"]
      : ["smol bags detected", "bro you have rookie numbers", "cope harder", "mcdonalds is hiring", "post proof or ban"];
  } else {
    // General chat
    const richTemplates = ["respect", "whale alert 🚨", "W", "teach me ur ways", "based", "sheesh", "gm king", "{stock} to the moon"];
    const poorTemplates = ["smol bags", "cope", "who is this?", "lol poor", "keep grinding", "ngmi", "post bags or ban", "buy {stock} instead"];
    replyPool = isWorthy ? richTemplates : poorTemplates;
  }

  const numReplies = Math.floor(Math.random() * 2) + 1;
  const replies: ChatMessage[] = [];

  for (let i = 0; i < numReplies; i++) {
    const candidateBots = onlineBots.filter(b => b.personality !== 'zenith');
    const bot = candidateBots[Math.floor(Math.random() * candidateBots.length)];
    if (!bot) continue;
    
    const rank = getRandomRank(bot.personality);

    let rawText = replyPool[Math.floor(Math.random() * replyPool.length)];
    rawText = rawText.replace(/{stock}/g, randomStock);

    replies.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: bot.id,
      userName: bot.name,
      avatar: bot.avatar,
      text: sanitizeOutput(rawText),
      timestamp: Date.now(),
      rankName: rank.name,
      rankColor: rank.color
    });
  }

  return replies;
};
