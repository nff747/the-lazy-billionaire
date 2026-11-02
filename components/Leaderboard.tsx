
import React from 'react';
import { LeaderboardEntry, LeaderboardTimeframe } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  timeframe: LeaderboardTimeframe;
  setTimeframe: (t: LeaderboardTimeframe) => void;
  userRank: number;
  userMoney: number;
  userName: string;
  userAvatar: string;
  onHack?: (entry: LeaderboardEntry) => void; 
}

const formatShort = (n: number) => {
  if (n < 1000000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const formatRank = (r: number) => {
  return r.toLocaleString('en-US');
};

const isImageUrl = (avatar?: string) => Boolean(avatar && (avatar.startsWith('/') || avatar.startsWith('http') || avatar.startsWith('data:')));

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
    entries, 
    timeframe, 
    setTimeframe,
    userRank,
    userMoney,
    userName,
    userAvatar,
    onHack
}) => {
  
  // Check if the user is currently rendered in the list
  const isUserInList = entries.some(e => e.isPlayer);

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
      {/* Header & Switcher */}
      <div className="p-4 border-b border-white/5 bg-black/40">
        <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5">
            <button
                onClick={() => setTimeframe('global')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${
                timeframe === 'global' 
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Global Elite
            </button>
            <button
                onClick={() => setTimeframe('local')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${
                timeframe === 'local' 
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Rivals League
            </button>
        </div>
      </div>

      {/* List Container */}
      <div className={`flex-1 px-2 py-4 space-y-2 pb-32 no-scrollbar ${timeframe === 'global' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {entries.map((entry, idx) => {
          const rank = entry.rank;
          const isPlayer = entry.isPlayer;
          const isZenith = entry.personality === 'zenith';
          
          let cardBg = "bg-zinc-900/40";
          let borderClass = "border-transparent";
          let rankColor = "text-zinc-500";
          
          if (rank === 1) {
             cardBg = "bg-gradient-to-r from-yellow-950/40 to-black";
             borderClass = "border-yellow-500/30";
             rankColor = "text-yellow-500";
          } else if (rank === 2) {
             borderClass = "border-zinc-400/30";
             rankColor = "text-zinc-300";
          } else if (rank === 3) {
             borderClass = "border-orange-700/30";
             rankColor = "text-orange-400";
          }
          
          if (isPlayer) {
             cardBg = "bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
             borderClass = "border-emerald-500/50";
          }

          if (isZenith) {
             cardBg = "bg-purple-950/20";
             borderClass = "border-purple-500/50";
          }

          return (
            <div 
              key={entry.id}
              className={`flex items-center gap-4 p-3 rounded-2xl border ${borderClass} ${cardBg} transition-all duration-300 relative overflow-hidden group ${isPlayer ? 'scale-[1.02] z-10' : 'scale-100'}`}
            >
              <div className="w-10 text-center shrink-0">
                  <span className={`font-bebas text-xl ${rankColor}`}>#{formatRank(rank)}</span>
              </div>
              
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-xl shadow-inner overflow-hidden relative">
                  {isImageUrl(entry.avatar) ? (
                    <img src={entry.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl select-none">{entry.avatar || '👤'}</span>
                  )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-xs truncate ${isPlayer ? 'text-emerald-400' : isZenith ? 'text-purple-400' : 'text-zinc-200'}`}>
                    {entry.name}
                    </h4>
                    {isZenith && <span className="text-[6px] bg-purple-500/20 text-purple-300 px-1 rounded uppercase font-black">AI</span>}
                </div>
                <div className="text-[9px] text-zinc-500 font-mono">
                    {entry.personality === 'player' ? 'YOU' : entry.personality?.toUpperCase() || 'UNKNOWN'}
                </div>
              </div>

              <div className="text-right">
                <p className={`font-bebas text-lg tracking-wide ${isPlayer ? 'text-emerald-400' : 'text-white'}`}>
                  ${formatShort(entry.money)}
                </p>
                {!isPlayer && onHack && (
                    <button 
                        onClick={() => onHack(entry)}
                        className="text-[8px] font-black uppercase text-red-500 hover:text-red-400 hover:bg-red-950/50 px-2 py-0.5 rounded transition-colors"
                    >
                        HACK SYSTEM
                    </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky User Footer (Always show if user is NOT in the visible list, e.g. Rank 2M) */}
      {!isUserInList && timeframe === 'global' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-xl border-t border-zinc-800 z-30 animate-in slide-in-from-bottom-10">
              <div className="bg-zinc-900 p-3 rounded-2xl border border-emerald-500/30 flex items-center gap-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-lg overflow-hidden shrink-0">
                    {isImageUrl(userAvatar) ? (
                      <img src={userAvatar} alt="Your Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{userAvatar || '👤'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                      <div className="text-[8px] font-black uppercase text-emerald-500">Your Rank</div>
                      <div className="font-bebas text-xl text-white">${formatShort(userMoney)}</div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
