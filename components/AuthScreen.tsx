
import React, { useState } from 'react';
import { Icons } from '../icons';
import { firebaseService } from '../services/firebaseService';

interface AuthScreenProps {
  onLogin: (name: string, isGuest: boolean, uid?: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'email_login'>('landing');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGuest = () => {
    setLoading(true);
    // Guest is always simulated
    setTimeout(() => onLogin("Shadow Mogul", true), 800);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setErrorMsg(null);

    // 1. Try Real Firebase
    if (firebaseService.isConfigured) {
        const { user, error } = await firebaseService.loginGoogle();
        if (user) {
            onLogin(user.displayName || "Google User", false, user.uid);
            return;
        } else if (error) {
            // If user closed popup or error, stop loading
            setLoading(false);
            if (error !== "Simulation Mode") {
                setErrorMsg(error);
                return;
            }
        }
    }

    // 2. Fallback to Simulation if keys missing or failed gracefully
    setTimeout(() => {
        onLogin("Google User", false);
    }, 1500);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);

    // 1. Try Real Firebase
    if (firebaseService.isConfigured) {
        const { user, error } = await firebaseService.loginEmail(email, password);
        if (user) {
            onLogin(user.displayName || email.split('@')[0], false, user.uid);
            return;
        } else if (error) {
            setLoading(false);
            setErrorMsg(error);
            return;
        }
    }

    // 2. Fallback Simulation
    setTimeout(() => {
        const name = email.split('@')[0];
        onLogin(name, false);
    }, 1200);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    setLoading(true);
    setErrorMsg(null);

    // 1. Try Real Firebase
    if (firebaseService.isConfigured) {
        const { user, error } = await firebaseService.signupEmail(email, password, username);
        if (user) {
            onLogin(username, false, user.uid);
            return;
        } else if (error) {
            setLoading(false);
            setErrorMsg(error);
            return;
        }
    }

    // 2. Fallback Simulation
    setTimeout(() => {
        onLogin(username, false);
    }, 1200);
  };

  if (loading) {
      return (
          <div className="fixed inset-0 z-[6000] bg-black flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin mb-8"></div>
              <div className="font-bebas text-2xl text-white tracking-widest animate-pulse">AUTHENTICATING...</div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-[#050505] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-500">
      <div className="w-full max-w-sm">
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-10">
            <div className="relative mb-5 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 rounded-3xl p-3.5 border border-amber-500/40 shadow-2xl flex items-center justify-center">
                    <img 
                      src="/assets/icons/1.png" 
                      alt="The Lazy Billionaire Logo" 
                      className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]" 
                    />
                </div>
            </div>
            <h1 className="font-bebas text-5xl text-center leading-none tracking-wide mb-2">
              THE LAZY<br/><span className="money-text">BILLIONAIRE</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <p className="text-zinc-400 text-[9px] font-black tracking-[0.35em] uppercase">High-Stakes Empire Simulator</p>
            </div>
        </div>

        {errorMsg && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center animate-in slide-in-from-top-2">
                <p className="text-red-400 text-xs font-bold">{errorMsg}</p>
            </div>
        )}

        {view === 'landing' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-500">
                <button 
                    onClick={handleGoogle}
                    className="w-full bg-white text-black h-14 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                    <div className="w-5 h-5"><Icons.Google /></div>
                    <span>Continue with Google</span>
                </button>

                <button 
                    onClick={() => setView('email_login')}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-zinc-800"
                >
                    <div className="w-5 h-5"><Icons.Email /></div>
                    <span>Continue with Email</span>
                </button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-900"></div></div>
                    <div className="relative flex justify-center"><span className="bg-[#050505] px-4 text-xs text-zinc-600 font-bold uppercase">Or</span></div>
                </div>

                <button 
                    onClick={handleGuest}
                    className="w-full bg-zinc-900/50 text-zinc-500 h-14 rounded-2xl font-bold text-sm uppercase tracking-wider hover:text-white active:scale-95 transition-all"
                >
                    Play as Guest
                </button>
                
                {!firebaseService.isConfigured && (
                    <p className="text-center text-[9px] text-zinc-700 font-mono mt-4">RUNNING IN SIMULATION MODE</p>
                )}
            </div>
        )}

        {view === 'email_login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                <div className="space-y-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-transparent outline-none text-white font-medium"
                            placeholder="tycoon@empire.com"
                        />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-transparent outline-none text-white font-medium"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-amber-500 text-black h-14 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 transition-transform mt-6"
                >
                    Sign In
                </button>

                <div className="flex justify-between items-center mt-6">
                    <button type="button" onClick={() => setView('landing')} className="text-xs text-zinc-500 hover:text-white font-bold">← Back</button>
                    <button type="button" onClick={() => setView('signup')} className="text-xs text-amber-500 hover:text-amber-400 font-bold">Create Account</button>
                </div>
            </form>
        )}

        {view === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                 <div className="space-y-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-transparent outline-none text-white font-medium"
                            placeholder="ShadowMogul"
                        />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-transparent outline-none text-white font-medium"
                            placeholder="tycoon@empire.com"
                        />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-transparent outline-none text-white font-medium"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black h-14 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 transition-transform mt-6"
                >
                    Create Account
                </button>

                <div className="flex justify-between items-center mt-6">
                    <button type="button" onClick={() => setView('landing')} className="text-xs text-zinc-500 hover:text-white font-bold">← Back</button>
                    <button type="button" onClick={() => setView('email_login')} className="text-xs text-amber-500 hover:text-amber-400 font-bold">Sign In</button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};
