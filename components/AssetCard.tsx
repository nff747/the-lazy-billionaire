
import React, { useState, useEffect } from 'react';
import { Asset } from '../types';
import { Icons } from '../icons';

interface AssetCardProps {
  asset: Asset;
  playerMoney: number;
  playerDiamonds: number;
  isHardened: boolean;
  onBuy: (id: string) => void;
  onHarden: (id: string) => void;
}

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
        const scaled = n / tier.v;
        const intLen = Math.floor(scaled).toString().length;
        const decimals = Math.max(0, 5 - intLen);
        return scaled.toFixed(decimals) + tier.s;
    }
  }
  return n.toExponential(1);
}

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

const formatYield = (n: number) => {
  if (n < 1000000) return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const tiers = [
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

export const AssetCard: React.FC<AssetCardProps> = ({ asset, playerMoney, playerDiamonds, isHardened, onBuy, onHarden }) => {
  const [shake, setShake] = useState(false);
  const level = getLevel(asset.count);
  const currentCost = Math.floor(asset.baseCost * Math.pow(1.22, asset.count) * getLevelCostMultiplier(level));
  const canAfford = playerMoney >= currentCost;
  const IconComponent = (Icons as any)[asset.icon] || Icons.Money;
  const isRealityEditor = asset.id === 'reality_engine';
  const isRealityUnlocked = isRealityEditor && asset.count > 0;

  useEffect(() => {
    if (asset.count > 0 && !isRealityEditor) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 200);
      return () => clearTimeout(timer);
    }
  }, [asset.count]);
  
  return (
    <div 
      className={`relative p-5 sm:p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden ${
      isRealityEditor 
        ? 'bg-gradient-to-br from-purple-950/90 to-black border-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.25)]'
        : isHardened 
            ? 'bg-gradient-to-br from-emerald-950/70 to-zinc-950 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]' 
            : (canAfford ? 'bg-zinc-900/90 border-white/15 shadow-xl hover:border-amber-400/40' : 'bg-zinc-950 border-white/10 shadow-lg')
    } ${shake ? 'scale-[1.02]' : ''}`}>
       
       <div className="flex justify-between items-start mb-5 relative z-10 gap-3">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
             <div className="w-13 h-13 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center bg-black/60 p-3 rounded-[1.2rem] border border-white/10 relative">
                <div className={`w-full h-full ${isRealityEditor ? 'text-purple-400' : canAfford || isHardened ? 'text-emerald-400' : 'text-zinc-400'}`}>
                   <IconComponent />
                </div>
                {isHardened && !isRealityEditor && (
                   <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-black flex items-center justify-center rounded-full text-[8px] font-black border-2 border-black">
                      <Icons.Shield />
                   </div>
                )}
             </div>
             <div className="min-w-0 flex-1">
                <h3 className={`text-xs font-black uppercase tracking-widest mb-0.5 italic truncate ${isRealityEditor ? 'text-purple-300' : 'text-white'}`}>{asset.name}</h3>
                <p className="text-[10px] text-zinc-400 font-medium italic line-clamp-1 mb-1.5">{asset.description}</p>
                {!isRealityEditor ? (
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border text-amber-400 border-amber-400/30 shrink-0">LVL {level}</span>
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest truncate">{asset.sector}</span>
                    </div>
                ) : (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border text-purple-400 border-purple-400/30 shrink-0">ENDGAME</span>
                )}
             </div>
          </div>
          <div className="text-right shrink-0">
             <div className="text-[8px] text-zinc-500 font-black uppercase mb-1 italic">Passive Yield</div>
             <div className={`font-bold text-sm tracking-tighter tabular-nums drop-shadow-lg truncate ${isRealityEditor ? 'text-purple-400' : 'text-emerald-400'}`}>
                {isRealityUnlocked ? 'INFINITE' : `+$${formatYield(asset.count * asset.baseIncome)}/s`}
             </div>
          </div>
       </div>

       <div className="flex justify-between items-center gap-4 relative z-10">
          {!isRealityEditor ? (
              <div className="flex-1 bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                 <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700" style={{ width: `${(asset.count % 100)}%` }}></div>
              </div>
          ) : (
              <div className="flex-1 text-[8px] font-black uppercase text-purple-500 tracking-[0.2em]">{isRealityUnlocked ? 'REALITY BENT' : 'AWAITING SINGULARITY'}</div>
          )}
          
          <div className="flex gap-2 relative z-30">
            {!isHardened && asset.count > 0 && !isRealityEditor && (
               <button 
                  onClick={() => onHarden(asset.id)}
                  disabled={playerDiamonds < 50}
                  title="Harden asset against market crashes (50 Diamonds)"
                  className={`p-2.5 rounded-xl transition-all active:scale-90 ${playerDiamonds >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'}`}
               >
                  <div className="w-3.5 h-3.5"><Icons.Shield /></div>
               </button>
            )}
            
            {isRealityEditor ? (
                 <button 
                    onClick={() => onBuy(asset.id)} 
                    disabled={!canAfford && !isRealityUnlocked}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-md min-w-[85px] flex items-center justify-center gap-1.5 ${
                        isRealityUnlocked 
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50 hover:bg-purple-500 cursor-pointer' 
                          : canAfford 
                            ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-black shadow-[0_0_15px_rgba(232,121,249,0.4)] hover:brightness-110 cursor-pointer' 
                            : 'bg-zinc-900 text-purple-300/60 border border-purple-900/50 cursor-not-allowed'
                    }`}
                 >
                    {isRealityUnlocked ? (
                      <span>ENTER</span>
                    ) : (
                      <>
                        <span className={`text-[8px] font-extrabold ${canAfford ? 'text-black/70' : 'text-purple-400/50'}`}>BUY</span>
                        <span className="font-bebas text-sm tracking-wider">${formatCost(currentCost)}</span>
                      </>
                    )}
                 </button>
            ) : (
                <button 
                   onClick={() => onBuy(asset.id)} 
                   disabled={!canAfford} 
                   className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 min-w-[85px] flex items-center justify-center gap-1.5 shadow-md ${
                      canAfford 
                        ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-black border border-amber-300/80 shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:scale-105 cursor-pointer' 
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-700/80 hover:border-zinc-500 cursor-not-allowed'
                   }`}
                >
                   <span className={`text-[8px] font-extrabold ${canAfford ? 'text-black/70' : 'text-zinc-500'}`}>BUY</span>
                   <span className="font-bebas text-sm tracking-wider">${formatCost(currentCost)}</span>
                </button>
            )}
          </div>
       </div>
    </div>
  );
};
