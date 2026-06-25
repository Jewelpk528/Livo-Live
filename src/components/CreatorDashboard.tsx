/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, PhoneCall, Gift as GiftIcon, ArrowUpRight, Clock, Landmark, Users, PlusCircle
} from 'lucide-react';
import { UserProfile, CreatorStats, WithdrawalRequest } from '../types';

interface CreatorDashboardProps {
  creators: UserProfile[];
  stats: CreatorStats[];
  withdrawals: WithdrawalRequest[];
  onSubmitWithdrawal: (creatorId: string, coins: number, method: 'bKash' | 'Nagad' | 'Bank Account', accountDetails: string) => void;
}

export default function CreatorDashboard({ creators, stats, withdrawals, onSubmitWithdrawal }: CreatorDashboardProps) {
  const [activeCreatorIdx, setActiveCreatorIdx] = useState(0);
  const [withdrawalCoins, setWithdrawalCoins] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bKash' | 'Nagad' | 'Bank Account'>('bKash');
  const [accountDetails, setAccountDetails] = useState('');

  const currentCreator = creators[activeCreatorIdx];
  const creatorStat = stats.find(s => s.creatorId === currentCreator.id) || {
    creatorId: currentCreator.id,
    totalEarningsCoins: 0,
    liveEarningsCoins: 0,
    callEarningsCoins: 0,
    giftEarningsCoins: 0,
    pendingWithdrawalsCoins: 0
  };

  const availableCoins = creatorStat.totalEarningsCoins - creatorStat.pendingWithdrawalsCoins;

  // Submit withdrawal request
  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coinsNum = parseInt(withdrawalCoins);
    if (isNaN(coinsNum) || coinsNum <= 0) {
      alert('⚠️ Please enter a valid coins amount!');
      return;
    }
    if (coinsNum > availableCoins) {
      alert('⚠️ Insufficient coin balance available for withdrawal!');
      return;
    }
    if (!accountDetails.trim()) {
      alert('⚠️ Please enter payout account details!');
      return;
    }

    onSubmitWithdrawal(currentCreator.id, coinsNum, withdrawalMethod, accountDetails);
    setWithdrawalCoins('');
    setAccountDetails('');
    alert('🎉 Withdrawal request submitted! It has been posted to the Admin Panel for review.');
  };

  // Filter withdrawals for this host
  const myWithdrawals = withdrawals.filter(w => w.creatorId === currentCreator.id);

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col p-5 overflow-y-auto scrollbar-none pb-20">
      
      {/* 1. IDENTITY SELECTOR (To view different creator earnings) */}
      <div className="flex justify-between items-center bg-slate-900 border border-white/5 p-3 rounded-2xl mb-6">
        <div>
          <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black block">Studio Identity</span>
          <h3 className="text-white text-xs font-black uppercase mt-1">Creator Studio Dashboard</h3>
        </div>
        
        <select 
          value={activeCreatorIdx}
          onChange={(e) => setActiveCreatorIdx(parseInt(e.target.value))}
          className="bg-slate-950 border border-white/10 text-white rounded-lg text-xs p-1.5 outline-none font-bold"
        >
          {creators.map((c, idx) => (
            <option key={c.id} value={idx}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 2. CREATOR BIO HERO BANNER */}
      <div className="flex items-center gap-3 bg-slate-900/40 border border-white/5 p-4 rounded-3xl mb-6 text-left">
        <img src={currentCreator.avatar} className="w-12 h-12 rounded-full border-2 border-pink-500 object-cover shadow-md" alt="" />
        <div>
          <h3 className="text-white font-black text-sm flex items-center gap-1.5 leading-none">
            <span>{currentCreator.name}</span>
            <span className="text-[8px] bg-pink-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Host</span>
          </h3>
          <p className="text-slate-400 text-[10px] mt-1.5 flex items-center gap-1.5 leading-none">
            <span>UID: {currentCreator.uid}</span>
            <span>•</span>
            <span>Level {currentCreator.level}</span>
          </p>
        </div>
      </div>

      {/* 3. METRICS CARDS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        
        {/* Metric A: Total Earnings */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black">Gross Lifetime Earnings</span>
          <div className="mt-2.5">
            <h4 className="text-white text-xl font-black font-mono tracking-wide">
              🪙 {creatorStat.totalEarningsCoins.toLocaleString()}
            </h4>
            <span className="text-slate-500 text-[8px] block mt-1 uppercase font-bold">In-app Coins</span>
          </div>
        </div>

        {/* Metric B: Available Balance */}
        <div className="bg-gradient-to-tr from-green-500/10 to-emerald-500/10 p-4 rounded-2xl border border-green-500/20 flex flex-col justify-between">
          <span className="text-green-400 text-[8px] uppercase tracking-widest font-black">Withdrawable Balance</span>
          <div className="mt-2.5">
            <h4 className="text-green-400 text-xl font-black font-mono tracking-wide">
              🪙 {availableCoins.toLocaleString()}
            </h4>
            <span className="text-slate-500 text-[8px] block mt-1 uppercase font-bold">excluding pending: {creatorStat.pendingWithdrawalsCoins}</span>
          </div>
        </div>
      </div>

      {/* 5. SUBMIT WITHDRAWAL REQUEST FORM */}
      <h3 className="text-white text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1 px-1">
        <ArrowUpRight className="w-4 h-4 text-green-400" />
        <span>Withdraw Earnings</span>
      </h3>

      <form onSubmit={handleWithdrawalSubmit} className="bg-[#0D0D0D] border border-white/10 p-4 rounded-3xl mb-6 text-left flex flex-col gap-4">
        
        {/* Amount to withdraw */}
        <div className="flex flex-col gap-1">
          <label className="text-slate-300 text-[10px] font-bold">Amount of Coins to Withdraw (Min 100):</label>
          <input 
            type="number" 
            placeholder="e.g. 500"
            required
            value={withdrawalCoins}
            onChange={(e) => setWithdrawalCoins(e.target.value)}
            className="bg-[#090909] border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none font-bold"
          />
        </div>

        {/* Withdrawal payout method */}
        <div className="flex flex-col gap-1">
          <label className="text-slate-300 text-[10px] font-bold">Payout Receiving Method:</label>
          <select 
            value={withdrawalMethod}
            onChange={(e: any) => setWithdrawalMethod(e.target.value)}
            className="bg-[#090909] border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none font-bold"
          >
            <option value="bKash">bKash Mobile Wallet (Bangladesh)</option>
            <option value="Nagad">Nagad Mobile Wallet (Bangladesh)</option>
            <option value="Bank Account">Bank Wire Transfer (Global)</option>
          </select>
        </div>

        {/* Payout accounts detail */}
        <div className="flex flex-col gap-1">
          <label className="text-slate-300 text-[10px] font-bold">Receiving Wallet / Bank Details:</label>
          <input 
            type="text" 
            placeholder={withdrawalMethod === 'Bank Account' ? 'e.g. Citibank, A/C: 12345678, SWIFT: CITISGXX' : 'e.g. +88017XXXXXXXX'}
            required
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            className="bg-[#090909] border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition"
        >
          Submit Withdrawal Request
        </button>
      </form>

      {/* 6. WITHDRAWAL TRANSACTIONS LOG HISTORY */}
      <h3 className="text-white text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
        <Clock className="w-4 h-4 text-slate-400" />
        <span>Recent Withdrawal Filings</span>
      </h3>

      <div className="flex flex-col gap-2.5">
        {myWithdrawals.length === 0 ? (
          <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-6 text-center">
            <p className="text-slate-500 text-[9px]">No payout requests filed from this studio yet.</p>
          </div>
        ) : (
          myWithdrawals.map((wd) => (
            <div 
              key={wd.id}
              className="bg-[#0D0D0D]/40 p-3 rounded-2xl border border-white/10 flex justify-between items-center"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-[#090909] rounded-xl text-slate-400">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-white text-[10px] font-bold">{wd.method} Payout</h4>
                  <p className="text-[8px] text-slate-500 mt-0.5">{wd.timestamp} | {wd.accountDetails}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-slate-200 font-mono text-[10px] font-bold block">
                  {wd.currency === 'BDT' ? `৳${wd.payoutAmount}` : `$${wd.payoutAmount}`}
                </span>
                
                {/* Status Badge */}
                <span className={`inline-block text-[7px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded mt-1 ${
                  wd.status === 'pending' 
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10' 
                    : wd.status === 'approved' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/10' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/10'
                }`}>
                  {wd.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
