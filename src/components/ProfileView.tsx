/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Shield, ShieldAlert, Award, Star, MapPin, Heart, List, Settings, RefreshCw, Sparkles, LogOut, CheckCircle, Flame, DollarSign, Wallet,
  Phone, Video, AlertCircle, Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile, Transaction } from '../types';

interface ProfileViewProps {
  user: UserProfile;
  transactions: Transaction[];
  onRoleChanged: (newRole: 'user' | 'admin' | 'superadmin') => void;
  onNavigateToTab: (tab: 'live' | 'wallet' | 'feed' | 'explore' | 'messages' | 'creator' | 'admin') => void;
  onUserUpdated: (updatedUser: UserProfile) => void;
}

export default function ProfileView({ user, transactions, onRoleChanged, onNavigateToTab, onUserUpdated }: ProfileViewProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const [voiceRate, setVoiceRate] = useState(user.voiceCallRate ?? 1);
  const [videoRate, setVideoRate] = useState(user.videoCallRate ?? 5);
  const [rateSuccess, setRateSuccess] = useState('');
  const [rateError, setRateError] = useState('');
  const [countdown, setCountdown] = useState('');
  const [canUpdate, setCanUpdate] = useState(true);
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);

  useEffect(() => {
    setVoiceRate(user.voiceCallRate ?? 1);
    setVideoRate(user.videoCallRate ?? 5);
  }, [user.voiceCallRate, user.videoCallRate]);

  useEffect(() => {
    const checkUpdateEligibility = () => {
      if (!user.lastRateUpdated) {
        setCanUpdate(true);
        setCountdown('');
        return;
      }

      const lastUpdatedMs = new Date(user.lastRateUpdated).getTime();
      const nowMs = Date.now();
      const durationMs = 24 * 60 * 60 * 1000;
      const difference = nowMs - lastUpdatedMs;

      if (difference >= durationMs) {
        setCanUpdate(true);
        setCountdown('');
      } else {
        setCanUpdate(false);
        const remainingMs = durationMs - difference;
        const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
        const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setCountdown(`${hrs}h ${mins}m ${secs}s`);
      }
    };

    checkUpdateEligibility();
    const timer = setInterval(checkUpdateEligibility, 1000);
    return () => clearInterval(timer);
  }, [user.lastRateUpdated]);

  const handleUpdateCallRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;

    setRateError('');
    setRateSuccess('');
    setIsSubmittingRate(true);

    try {
      const res = await fetch('/api/user/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceCallRate: voiceRate, videoCallRate: videoRate })
      });

      const data = await res.json();
      if (res.ok) {
        setRateSuccess('Call rates updated successfully!');
        onUserUpdated(data.user);
      } else {
        setRateError(data.error || 'Failed to update rates.');
      }
    } catch (err) {
      console.error(err);
      setRateError('Failed to communicate with the server.');
    } finally {
      setIsSubmittingRate(false);
    }
  };

  const handleRoleSwitch = async (role: 'user' | 'admin' | 'superadmin') => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        onRoleChanged(role);
      }
    } catch (e) {
      console.error("Error switching role:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    if (role === 'superadmin') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (role === 'admin') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'superadmin') return 'Super Admin';
    if (role === 'admin') return 'Administrator';
    return 'Regular User';
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-24 scrollbar-none text-left bg-[#090909]">
      {/* Cover Photo Banner */}
      <div className="w-full h-28 relative">
        <img 
          src={user.coverPhoto} 
          className="w-full h-full object-cover filter brightness-75" 
          alt="Profile Cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] to-transparent" />
      </div>

      {/* Main Profile Info Card */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="flex items-end gap-3.5 mb-3">
          <img 
            src={user.avatar} 
            className="w-20 h-20 rounded-full border-4 border-slate-900 object-cover shadow-2xl shadow-black/60" 
            alt={user.name} 
          />
          <div className="flex-grow pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-white text-base font-black tracking-tight leading-none">{user.name}</h3>
              <div className="bg-pink-500/20 text-pink-400 text-[8px] border border-pink-500/30 font-black px-1.5 py-0.5 rounded leading-none uppercase">
                Lv.{user.level}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              UID: {user.uid}
            </p>
          </div>
        </div>

        {/* User Bio and Location */}
        <div className="p-3 bg-[#0D0D0D] border border-white/5 rounded-2xl mb-4">
          <p className="text-[10px] text-slate-200 leading-relaxed font-medium">
            {user.bio}
          </p>
          <div className="flex items-center gap-1 mt-2.5 text-slate-400 text-[9px] font-bold">
            <MapPin className="w-3 h-3 text-pink-500" />
            <span>{user.country}</span>
            <span className="mx-1">•</span>
            <span>{user.gender === 'male' ? '♂ Male' : '♀ Female'}</span>
            <span className="mx-1">•</span>
            <span>{user.age} Years Old</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="p-2 bg-[#0D0D0D] rounded-xl border border-white/5 text-center">
            <div className="text-white font-mono text-xs font-black">{user.followersCount}</div>
            <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Followers</div>
          </div>
          <div className="p-2 bg-[#0D0D0D] rounded-xl border border-white/5 text-center">
            <div className="text-white font-mono text-xs font-black">{user.followingCount}</div>
            <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Following</div>
          </div>
          <button 
            onClick={() => onNavigateToTab('wallet')}
            className="p-2 bg-[#0D0D0D] hover:bg-pink-950/20 rounded-xl border border-white/5 text-center transition group active:scale-95"
          >
            <div className="text-pink-400 font-mono text-xs font-black flex items-center justify-center gap-0.5">
              <span>🪙</span>
              <span>{user.coins.toLocaleString()}</span>
            </div>
            <div className="text-[7.5px] text-slate-500 group-hover:text-pink-400 transition font-bold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-0.5">
              <span>Wallet</span>
              <span>→</span>
            </div>
          </button>
        </div>

        {/* ROLE SIMULATION AND SWITCHER (Critical testing utility) */}
        <div className="p-3.5 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 rounded-2.5xl border border-purple-500/20 mb-4">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                Testing Role Switcher
              </span>
            </div>
            <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 border rounded-full ${getRoleBadgeColor(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
          </div>
          <p className="text-[9px] leading-relaxed text-slate-400 mb-3 font-medium">
            Toggle your account role below to dynamically inspect bottom navigation. Admin & Super Admin users will see the <strong>Admin</strong> panel, while standard users see this <strong>Profile</strong> tab!
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              disabled={isUpdating}
              onClick={() => handleRoleSwitch('user')}
              className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition active:scale-95 ${
                user.role === 'user' || !user.role
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:bg-black/50'
              }`}
            >
              Regular
            </button>
            <button 
              disabled={isUpdating}
              onClick={() => handleRoleSwitch('admin')}
              className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition active:scale-95 ${
                user.role === 'admin' 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20' 
                  : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:bg-black/50'
              }`}
            >
              Admin
            </button>
            <button 
              disabled={isUpdating}
              onClick={() => handleRoleSwitch('superadmin')}
              className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition active:scale-95 ${
                user.role === 'superadmin' 
                  ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-500/20' 
                  : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:bg-black/50'
              }`}
            >
              Super Admin
            </button>
          </div>
        </div>

        {/* VIP Membership Perks Display */}
        {user.isVIP && (
          <div className="p-3 bg-[#0D0D0D] border border-yellow-500/20 rounded-2xl mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">
                VIP Membership Active
              </span>
            </div>
            <p className="text-[9px] leading-normal text-slate-400 font-medium">
              Plan: <span className="text-yellow-400 font-bold capitalize">{user.vipPlan} Plan</span> • Expiry: <span className="text-slate-200 font-bold">{user.vipExpiry || 'Indefinite'}</span>
            </p>
            <ul className="mt-2.5 space-y-1.5">
              <li className="text-[8.5px] text-slate-300 flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Priority placement in Broadcaster Streams</span>
              </li>
              <li className="text-[8.5px] text-slate-300 flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Exclusive premium badge overlay on chat messages</span>
              </li>
            </ul>
          </div>
        )}

        {/* Customizable Incoming Call Rates */}
        <div className="p-4 bg-[#0D0D0D] border border-white/5 rounded-2.5xl mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-pink-500/15 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Settings className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">
              Custom Incoming Call Rates
            </span>
          </div>

          <p className="text-[9px] leading-relaxed text-slate-400 mb-3 font-medium">
            Set your customized rates for incoming calls.
            <br />
            Voice limit: <strong className="text-white">1 - 20 Coins/min</strong> • Video limit: <strong className="text-white">5 - 50 Coins/min</strong>
          </p>

          <form onSubmit={handleUpdateCallRates} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Voice Rate */}
              <div>
                <label className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block mb-1">
                  📞 Voice Rate (Coins/min)
                </label>
                <input 
                  type="number" 
                  min={1}
                  max={20}
                  disabled={!canUpdate || isSubmittingRate}
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(Number(e.target.value))}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Video Rate */}
              <div>
                <label className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block mb-1">
                  📹 Video Rate (Coins/min)
                </label>
                <input 
                  type="number" 
                  min={5}
                  max={50}
                  disabled={!canUpdate || isSubmittingRate}
                  value={videoRate}
                  onChange={(e) => setVideoRate(Number(e.target.value))}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Success and Error Indicators */}
            {rateSuccess && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-[9px] text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{rateSuccess}</span>
              </div>
            )}
            {rateError && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/25 rounded-xl text-[9px] text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{rateError}</span>
              </div>
            )}

            {/* Dynamic Countdown Rule Warnings */}
            {!canUpdate ? (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                <div className="text-left">
                  <span className="text-[8.5px] text-amber-300 font-bold block">Rate Update Locked</span>
                  <span className="text-[7.5px] text-slate-400 font-medium block mt-0.5">
                    Rates can be customized only once every 24 hours. Next edit available in: <strong className="text-amber-400 font-mono">{countdown}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmittingRate}
                className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-101 active:scale-99 text-white font-black uppercase tracking-wider rounded-xl text-[9px] transition disabled:opacity-50 shadow-md shadow-pink-500/10"
              >
                {isSubmittingRate ? 'Saving Rate Changes...' : 'Save Rate Changes'}
              </button>
            )}
          </form>
        </div>

        {/* Transaction History Sub-Section */}
        <div>
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 flex items-center gap-1">
            <List className="w-3.5 h-3.5 text-pink-500" />
            <span>Recent Transactions</span>
          </h4>
          
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
            {transactions.slice(0, 6).map((tx) => (
              <div 
                key={tx.id} 
                className="p-2.5 bg-[#0D0D0D] border border-white/5 rounded-xl flex justify-between items-center"
              >
                <div>
                  <span className="text-[9.5px] text-slate-200 font-bold block leading-none">
                    {tx.description}
                  </span>
                  <span className="text-[8px] text-slate-500 mt-1 block">
                    {tx.timestamp}
                  </span>
                </div>
                
                <div className="text-right">
                  <span className={`text-[10.5px] font-mono font-black ${
                    tx.coinDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {tx.coinDelta > 0 ? '+' : ''}{tx.coinDelta.toLocaleString()} 🪙
                  </span>
                  {tx.currencyAmount && (
                    <span className="text-[8px] text-slate-400 block mt-0.5">
                      {tx.currencyAmount} {tx.currencyType}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-[9px] font-bold">
                No recent wallet transactions.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
