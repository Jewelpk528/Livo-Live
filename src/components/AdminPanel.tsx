/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Flame, DollarSign, ShieldAlert, CheckCircle, Ban, RefreshCw, Layers, Landmark, UserCheck, AlertTriangle
} from 'lucide-react';
import { UserProfile, LiveRoom, WithdrawalRequest, CreatorStats } from '../types';

interface AdminPanelProps {
  creators: UserProfile[];
  rooms: LiveRoom[];
  withdrawals: WithdrawalRequest[];
  onVerifyCreator: (creatorId: string, isVerified: boolean) => void;
  onSuspendUser: (userId: string, isSuspended: boolean) => void;
  onApproveWithdrawal: (withdrawalId: string, status: 'approved' | 'rejected') => void;
}

export interface ReportItem {
  id: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'resolved';
}

export default function AdminPanel({ 
  creators, rooms, withdrawals, onVerifyCreator, onSuspendUser, onApproveWithdrawal 
}: AdminPanelProps) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'creators' | 'reports' | 'payouts'>('dashboard');

  // Load Reported Flags from server
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
    // Refresh reports every 6 seconds to capture user actions
    const intv = setInterval(fetchReports, 6000);
    return () => clearInterval(intv);
  }, []);

  // Handle report resolution
  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await fetch('/api/reports/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId })
      });
      if (res.ok) {
        fetchReports();
        alert('Report resolved and archived successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations for dashboard counters
  const totalRechargingUSD = withdrawals.reduce((acc, curr) => curr.status === 'approved' ? acc + curr.payoutAmount : acc, 0) + 18450.50; // hardcoded base + approved
  const pendingPayoutsCount = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="w-full h-full bg-[#090909] flex flex-col p-5 overflow-y-auto scrollbar-none pb-20">
      
      {/* ADMIN LEVEL CONTROL HEADER */}
      <div className="flex justify-between items-center bg-red-950/20 border border-red-500/20 p-4 rounded-3xl mb-6 text-left">
        <div>
          <span className="text-red-400 text-[8px] uppercase tracking-widest font-black block">Operational Access Level</span>
          <h2 className="text-white text-md font-black uppercase mt-1 flex items-center gap-1.5 font-display">
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Livo Admin Control Panel</span>
          </h2>
        </div>
        <div className="bg-red-500/10 px-2.5 py-0.5 rounded text-[8px] text-red-400 border border-red-500/20 font-bold uppercase tracking-wider">
          Super Admin
        </div>
      </div>

      {/* ADMIN CONTROLS SUB-TAB SELECTION */}
      <div className="flex bg-[#0D0D0D] p-1.5 rounded-2xl border border-white/10 mb-6 justify-between gap-1">
        {(['dashboard', 'creators', 'reports', 'payouts'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-grow py-1.5 text-[8.5px] uppercase tracking-wider font-extrabold rounded-xl transition ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-[#FF007A] to-[#8E2DE2] text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB SUBVIEW A: OPERATIONS DASHBOARD METRICS */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Stat A: Total Accounts */}
            <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-2xl text-left flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black">Registered Accounts</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="text-white text-xl font-black mt-3 font-mono">12,490</h3>
              <p className="text-[7.5px] text-green-400 font-bold mt-1">↑ 14% growth monthly</p>
            </div>

            {/* Stat B: Broadcast Rooms */}
            <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-2xl text-left flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black">Broadcast Channels</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className="text-white text-xl font-black mt-3 font-mono">{rooms.length} Active</h3>
              <p className="text-[7.5px] text-slate-400 mt-1">Online female streams</p>
            </div>

            {/* Stat C: Gateways Revenue */}
            <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-2xl text-left flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black">Recharge Revenue</span>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="text-green-400 text-xl font-black mt-3 font-mono">${totalRechargingUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
              <p className="text-[7.5px] text-slate-500 mt-1">Stripe & Local Wallets</p>
            </div>

            {/* Stat D: Pending Cashouts */}
            <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-2xl text-left flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black">Pending Payouts</span>
                <Landmark className="w-4 h-4 text-yellow-500" />
              </div>
              <h3 className="text-yellow-400 text-xl font-black mt-3 font-mono">{pendingPayoutsCount} Filed</h3>
              <p className="text-[7.5px] text-slate-400 mt-1">Awaiting admin review</p>
            </div>

          </div>

          {/* Quick Info Box */}
          <div className="bg-[#0D0D0D]/30 p-4 rounded-3xl border border-white/10 text-left text-slate-300">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 font-display">
              <span>🛡️</span> Security & Compliance Directive
            </h4>
            <p className="text-[9px] leading-relaxed text-slate-400">
              Livo Live relies on active content moderation. Report cards are populated in real-time when viewers flag creators inside streams. Review them instantly below or on the Moderation Tab.
            </p>
          </div>

        </div>
      )}

      {/* TAB SUBVIEW B: CREATOR VERIFICATION AND APPROVALS */}
      {activeTab === 'creators' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-white text-xs font-black uppercase tracking-wider font-display">Female Host Verification Panel</h3>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">Real-time sync</span>
          </div>

          <div className="flex flex-col gap-3">
            {creators.map((c) => (
              <div 
                key={c.id}
                className="bg-[#0D0D0D]/60 p-3.5 rounded-2xl border border-white/10 flex justify-between items-center text-left"
              >
                <div className="flex items-center gap-3">
                  <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                  <div>
                    <h4 className="text-white text-[11px] font-black">{c.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">UID: {c.uid} | Country: {c.country}</p>
                    
                    {/* Approved badge */}
                    <span className={`inline-block text-[7px] uppercase tracking-widest font-black mt-1 ${
                      c.isApprovedCreator ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {c.isApprovedCreator ? '✓ Approved Creator' : '⏳ Pending verification'}
                    </span>
                  </div>
                </div>

                {/* Approve/Revoke controls */}
                <div className="flex flex-col gap-1.5">
                  <button 
                    onClick={() => onVerifyCreator(c.id, !c.isApprovedCreator)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition active:scale-95 flex items-center gap-1 ${
                      c.isApprovedCreator 
                        ? 'bg-[#090909] text-slate-300 hover:bg-neutral-800 border border-white/10' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>{c.isApprovedCreator ? 'Revoke Verified' : 'Verify Creator'}</span>
                  </button>

                  <button 
                    onClick={() => onSuspendUser(c.id, c.onlineStatus !== 'busy')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition active:scale-95 flex items-center gap-1 ${
                      c.onlineStatus === 'busy'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-955/30 text-red-400 hover:bg-red-900/50 border border-red-900/20'
                    }`}
                  >
                    <Ban className="w-3 h-3" />
                    <span>{c.onlineStatus === 'busy' ? 'Unsuspend' : 'Suspend User'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB SUBVIEW C: REAL-TIME STREAM FLAGS & REPORTS MODERATION */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-white text-xs font-black uppercase tracking-wider font-display">Reported Flags Moderation</h3>
            <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 rounded px-2 py-0.5 uppercase tracking-widest font-black flex items-center gap-1 animate-pulse">
              Live Feed
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {reports.length === 0 ? (
              <div className="bg-[#0D0D0D]/40 border border-white/10 border-dashed rounded-3xl p-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">System Cleared</p>
                <p className="text-slate-500 text-[9px] mt-1 leading-relaxed">No stream flag warnings reported from live rooms.</p>
              </div>
            ) : (
              reports.map((rep) => (
                <div 
                  key={rep.id}
                  className="bg-[#0D0D0D] p-4 rounded-2xl border border-white/10 text-left flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white text-[11px] font-black flex items-center gap-1">
                        <span>Flag on host: {rep.targetName}</span>
                      </h4>
                      <p className="text-[8.5px] text-slate-500 mt-1">Reporter: {rep.reporterName} | Filed: {rep.timestamp}</p>
                    </div>

                    <span className={`text-[7px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded ${
                      rep.status === 'pending' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {rep.status}
                    </span>
                  </div>

                  <div className="bg-black/35 p-2 rounded-xl border border-white/5 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[9.5px] text-slate-300 font-medium leading-normal">
                      Violation reason: <span className="text-white font-bold">{rep.reason}</span>
                    </p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex gap-2 justify-end mt-1">
                      <button 
                        onClick={() => handleResolveReport(rep.id)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF007A] to-red-600 hover:opacity-95 text-white rounded-lg text-[9px] font-bold shadow transition active:scale-95"
                      >
                        ⚠️ Action Taken (Resolve)
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB SUBVIEW D: FINANCE CASHOUTS AND PAYOUT APPROVALS */}
      {activeTab === 'payouts' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-white text-xs font-black uppercase tracking-wider font-display">Filing Cashout Requests</h3>
            <span className="text-[8px] text-yellow-400 font-mono font-black">Sync active</span>
          </div>

          <div className="flex flex-col gap-3">
            {withdrawals.length === 0 ? (
              <div className="bg-[#0D0D0D] border border-white/10 border-dashed rounded-3xl p-8 text-center">
                <p className="text-slate-400 text-[10px]">No host cashout requests filed.</p>
              </div>
            ) : (
              withdrawals.map((wd) => (
                <div 
                  key={wd.id}
                  className="bg-[#0D0D0D] p-4 rounded-2xl border border-white/10 text-left flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white text-[11px] font-black">{wd.creatorName} Cashout</h4>
                      <span className="text-[8.5px] text-slate-500 mt-1 block">Filed: {wd.timestamp}</span>
                    </div>

                    <span className={`text-[7px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded ${
                      wd.status === 'pending' 
                        ? 'bg-yellow-500/10 text-yellow-400' 
                        : wd.status === 'approved' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-red-500/10 text-red-400'
                    }`}>
                      {wd.status}
                    </span>
                  </div>

                  <div className="bg-black/35 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-slate-500 font-black block">Filing Method</span>
                      <span className="text-white font-bold text-[10px] mt-0.5 block flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5 text-slate-400" /> {wd.method}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-slate-500 font-black block">Payout Amount</span>
                      <span className="text-green-400 font-mono font-black text-xs mt-0.5 block">
                        {wd.currency === 'BDT' ? `৳${wd.payoutAmount}` : `$${wd.payoutAmount}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-slate-500 font-black block">Coins Debited</span>
                      <span className="text-yellow-400 font-mono font-black text-[10px] mt-0.5 block">
                        🪙 {wd.coinAmount}
                      </span>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400">Account Details: <span className="text-white font-mono font-semibold">{wd.accountDetails}</span></p>

                  {wd.status === 'pending' && (
                    <div className="flex gap-2 justify-end border-t border-white/5 pt-3 mt-1">
                      <button 
                        onClick={() => onApproveWithdrawal(wd.id, 'rejected')}
                        className="px-3.5 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg text-[9px] font-black transition active:scale-95"
                      >
                        Reject Request
                      </button>
                      <button 
                        onClick={() => onApproveWithdrawal(wd.id, 'approved')}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-95 text-white rounded-lg text-[9px] font-black shadow transition active:scale-95"
                      >
                        ✓ Approve Payout
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
