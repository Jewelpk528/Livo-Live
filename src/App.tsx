/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Tv, Wallet, Film, Compass, MessageCircle, BarChart3, Shield, Star, Users, Bell, 
  Settings, User, Phone, Video, Heart, X, Sparkles, LogOut, CheckCircle, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, LiveRoom, Post, Gift, Transaction, WithdrawalRequest, CreatorStats } from './types';

// Child view components
import LiveRoomView from './components/LiveRoomView';
import CreateLiveRoomModal from './components/CreateLiveRoomModal';
import CallingView from './components/CallingView';
import WalletView from './components/WalletView';
import FeedView from './components/FeedView';
import ExploreView from './components/ExploreView';
import MessagesView from './components/MessagesView';
import CreatorDashboard from './components/CreatorDashboard';
import AdminPanel from './components/AdminPanel';
import ProfileView from './components/ProfileView';
import UserProfileView from './components/UserProfileView';

export default function App() {
  // Global Database state synced from server
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<CreatorStats[]>([]);
  const [adminCallStats, setAdminCallStats] = useState<any>({
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    totalVoiceCalls: 0,
    totalVideoCalls: 0,
    totalCharged: 0
  });

  // Local active app views state
  const [activeTab, setActiveTab] = useState<'live' | 'wallet' | 'feed' | 'explore' | 'messages' | 'creator' | 'admin' | 'profile'>('live');
  const [selectedCreatorProfile, setSelectedCreatorProfile] = useState<UserProfile | null>(null);
  const [activeUserProfile, setActiveUserProfile] = useState<UserProfile | null>(null);
  const [activeLiveRoom, setActiveLiveRoom] = useState<LiveRoom | null>(null);
  const [showCreateLiveModal, setShowCreateLiveModal] = useState(false);
  
  // Call simulation state
  const [activeCallCreator, setActiveCallCreator] = useState<UserProfile | null>(null);
  const [activeCallType, setActiveCallType] = useState<'voice' | 'video'>('voice');

  // Direct chat shortcuts
  const [activeCreatorChatId, setActiveCreatorChatId] = useState<string | null>(null);

  // Followed creator IDs tracking
  const [followedCreatorIds, setFollowedCreatorIds] = useState<string[]>([]);

  const handleFollowCreator = (creatorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Toggle follow in creators list
    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        const isCurrentlyFollowing = followedCreatorIds.includes(creatorId);
        return {
          ...c,
          followersCount: isCurrentlyFollowing ? Math.max(0, c.followersCount - 1) : c.followersCount + 1
        };
      }
      return c;
    }));
    
    if (followedCreatorIds.includes(creatorId)) {
      setFollowedCreatorIds(prev => prev.filter(id => id !== creatorId));
    } else {
      setFollowedCreatorIds(prev => [...prev, creatorId]);
    }
  };

  // In-app notifications
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'info' | 'success' | 'live' }[]>([]);

  // Initialize and fetch state from server
  const fetchGlobalState = async () => {
    try {
      const res = await fetch('/api/init');
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators);
        setUser(data.user);
        setRooms(data.rooms);
        setPosts(data.posts);
        setTransactions(data.transactions);
        setWithdrawals(data.withdrawals);
        setStats(data.stats);
        if (data.adminCallStats) {
          setAdminCallStats(data.adminCallStats);
        }
      }
    } catch (err) {
      console.error('Error fetching Livo Live initial state:', err);
    }
  };

  useEffect(() => {
    fetchGlobalState();

    // Spawn a welcoming notification after 3 seconds
    const timer = setTimeout(() => {
      addNotification('🔥 Elena is live now! Swipe to watch her stream.', 'live');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Helper to add notifications
  const addNotification = (message: string, type: 'info' | 'success' | 'live') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    // Auto dismiss after 5.5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5500);
  };

  // 1. RECHARGE COINS FLOW
  const handleRechargeSuccess = async (coins: number, price: number, method: string) => {
    try {
      const res = await fetch('/api/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins, price, method })
      });
      if (res.ok) {
        await fetchGlobalState();
        addNotification(`🪙 Succesfully purchased ${coins} Coins via ${method}!`, 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. DEDUCT COINS (calls or gifts)
  const handleDeductCoins = async (coins: number, type: 'gift_sent' | 'call_made', description: string, creatorId?: string, callback?: () => void) => {
    try {
      const res = await fetch('/api/deduct-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins, type, description, creatorId })
      });
      if (res.ok) {
        await fetchGlobalState();
        if (callback) callback();
      } else {
        const data = await res.json();
        alert(data.error || 'Insufficient balance to complete action.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. SEND GIFT TO CREATOR
  const handleSendGift = async (creatorId: string, gift: Gift) => {
    try {
      const res = await fetch('/api/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, giftId: gift.id })
      });
      if (res.ok) {
        await fetchGlobalState();
        addNotification(`🎁 You sent a ${gift.name} to host!`, 'success');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send virtual gift.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3a. UNLOCK PRIVATE LIVE
  const handleUnlockPrivateLive = async (creator: UserProfile) => {
    if (!user) return;
    if (user.coins < 1000) {
      alert(`⚠️ You need 1,000 coins to unlock ${creator.name}'s Private Live Stream. Current balance: 🪙 ${user.coins}`);
      return;
    }
    try {
      const res = await fetch('/api/deduct-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coins: 1000, 
          type: 'private_live', 
          creatorId: creator.id, 
          description: `Unlocked 1-on-1 Private Live Stream with ${creator.name}`
        })
      });
      if (res.ok) {
        await fetchGlobalState();
        alert(`🎉 Success! You have unlocked a Private 1-on-1 Live Stream with ${creator.name}. She will contact you directly via DMs to schedule your private call session.`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to unlock Private Live.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3b. UNLOCK PREMIUM CONTENT
  const handleUnlockPremiumContent = async (creator: UserProfile) => {
    if (!user) return;
    if (user.coins < 500) {
      alert(`⚠️ You need 500 coins to unlock ${creator.name}'s Premium Photo Album. Current balance: 🪙 ${user.coins}`);
      return;
    }
    try {
      const res = await fetch('/api/deduct-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coins: 500, 
          type: 'premium_content', 
          creatorId: creator.id, 
          description: `Unlocked Premium Album Content for ${creator.name}`
        })
      });
      if (res.ok) {
        await fetchGlobalState();
        alert(`🎉 Success! You unlocked ${creator.name}'s Exclusive VIP Album Photos. Check out her private feed & messages for premium high-resolution media.`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to unlock Premium Content.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. SUBMIT WITHDRAWAL REQUEST
  const handleSubmitWithdrawal = async (creatorId: string, coins: number, method: string, accountDetails: string) => {
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, coins, method, accountDetails })
      });
      if (res.ok) {
        await fetchGlobalState();
        addNotification('💸 Payout request filed! Pending review.', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. LIKE POSTS
  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      if (res.ok) {
        await fetchGlobalState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. COMMENT ON POSTS
  const handleCommentPost = async (postId: string, content: string) => {
    try {
      const res = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content })
      });
      if (res.ok) {
        await fetchGlobalState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. UPLOAD POSTS TO FEED
  const handleUploadPost = async (type: 'photo' | 'video', content: string, url: string) => {
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, mediaUrl: url })
      });
      if (res.ok) {
        await fetchGlobalState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 8. APPROVE/VERIFY CREATOR STAR STATUS (Admin action)
  const handleVerifyCreator = async (creatorId: string, isVerified: boolean) => {
    try {
      const res = await fetch('/api/creators/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, isVerified })
      });
      if (res.ok) {
        await fetchGlobalState();
        addNotification(`Host verified credentials updated.`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 9. SUSPEND USER STATUS (Admin action)
  const handleSuspendUser = async (userId: string, isSuspended: boolean) => {
    try {
      const res = await fetch('/api/users/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isSuspended })
      });
      if (res.ok) {
        await fetchGlobalState();
        addNotification(`User suspension status updated.`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 10. APPROVE CASHOUT WITHDRAWAL PAYOUT (Admin action)
  const handleApproveWithdrawal = async (withdrawalId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/withdrawals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, status })
      });
      if (res.ok) {
        await fetchGlobalState();
        addNotification(`Cashout request status set to ${status}!`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 11. SUBMIT LIVE STREAM REPORT
  const handleReport = async (targetId: string, targetName: string, reason: string) => {
    try {
      const res = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, targetName, reason })
      });
      if (res.ok) {
        addNotification(`⚠️ Flag reported: "${reason}" has been dispatched to administrators.`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Call termination callback
  const handleCallFinished = (durationSec: number, cost: number, rating?: number) => {
    setActiveCallCreator(null);
    if (durationSec > 0 && cost > 0) {
      addNotification(`📞 Finished call! Duration: ${Math.floor(durationSec / 60)}m ${durationSec % 60}s. Spent 🪙 ${cost}`, 'info');
    }
  };

  const handleRoleChanged = (newRole: 'user' | 'admin' | 'superadmin') => {
    setUser(prev => prev ? { ...prev, role: newRole } : null);
    if (newRole === 'user' && activeTab === 'admin') {
      setActiveTab('profile');
    } else if ((newRole === 'admin' || newRole === 'superadmin') && activeTab === 'profile') {
      setActiveTab('admin');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center font-sans">
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-lg font-black tracking-widest uppercase text-pink-500">Livo Live</h2>
          <p className="text-slate-400 text-xs mt-1">Starting live streaming app servers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white font-sans flex items-center justify-center relative overflow-hidden">
      
      {/* Dynamic Background visual design */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* MOBILE CONTAINER FRAME SIMULATOR (Aspect ratio locked for pristine review) */}
      <div className="w-full max-w-[412px] h-[844px] bg-[#090909] border border-white/10 rounded-[36px] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Dynamic Notch / Status bar */}
        <div className="bg-[#0D0D0D] text-white text-[9px] font-mono p-1 px-4 flex justify-between items-center select-none relative z-40 border-b border-white/10">
          <span>9:41</span>
          <div className="w-20 h-4 bg-black rounded-full border border-white/5 flex items-center justify-center text-[7px] text-pink-400 font-bold uppercase tracking-widest leading-none">
            ● Livo Live
          </div>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <span>🔋 99%</span>
          </div>
        </div>

        {/* APP TOP NAVIGATION BAR */}
        <div className="bg-[#0D0D0D] border-b border-white/10 p-3 flex justify-between items-center z-35 relative">
          <div className="flex items-center gap-2">
            <img 
              src={user.avatar} 
              className="w-7 h-7 rounded-full border border-pink-500 object-cover cursor-pointer hover:scale-105 transition" 
              alt="" 
              onClick={() => {
                // Click avatar to see own stats / simulation details
                alert(`🙋‍♂️ Logged in as Jewel (Super Gifter)\n🪙 Coins Balance: ${user.coins} Coins\nLevel: ${user.level}`);
              }}
            />
            <div>
              <span className="text-[7px] text-slate-400 uppercase tracking-widest font-black leading-none block">User Account</span>
              <h1 className="text-white text-[10px] font-extrabold leading-none mt-0.5">Jewel (Super Gifter)</h1>
            </div>
          </div>

          {/* Wallet Coin Pill shortcut (click to open recharge) */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('wallet')}
              className="bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 border border-pink-500/25 rounded-full p-1 px-3 flex items-center gap-1 text-[9px] font-mono font-bold active:scale-95 transition"
              title="Click to recharge wallet"
            >
              <span>🪙</span>
              <span>{user.coins.toLocaleString()}</span>
            </button>

            {/* Notification alert Bell */}
            <button 
              onClick={() => addNotification('🔔 Welcome back to Livo Live! Explore creators nearby.', 'info')}
              className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 relative transition"
            >
              <Bell className="w-4 h-4" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* FLOATING PUSH TOAST NOTIFICATIONS DRAWER */}
        <div className="absolute top-16 left-3 right-3 z-50 flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`p-3 rounded-2xl shadow-xl flex items-center gap-2 border text-[10.5px] leading-tight font-bold pointer-events-auto ${
                  notif.type === 'success' 
                    ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                    : notif.type === 'live' 
                      ? 'bg-pink-950/90 border-pink-500/30 text-pink-300' 
                      : 'bg-slate-900/90 border-white/10 text-white'
                }`}
              >
                <div className="flex-grow">{notif.message}</div>
                <button 
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="text-white/40 hover:text-white p-0.5 text-[9px]"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ================= PRIMARY CONTENT AREA ================= */}
        <div className="flex-grow overflow-hidden relative bg-[#090909]">
          
          {/* TAB A: ACTIVE LIVE STREAMING ROOMS */}
          {activeTab === 'live' && (
            <div className="w-full h-full relative">
              <div className="w-full h-full p-4 overflow-y-auto pb-20 scrollbar-none">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-pink-500" /> Live Broadcasters
                  </h3>
                  <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5 uppercase tracking-widest font-black flex items-center gap-1 animate-pulse">
                    ● Live Status
                  </span>
                </div>

                {/* Grid of streaming channels */}
                <div className="grid grid-cols-2 gap-3.5">
                  {rooms.map((room) => (
                    <div 
                      key={room.id}
                      onClick={() => setActiveLiveRoom(room)}
                      className="bg-[#0D0D0D] rounded-3xl overflow-hidden border border-white/10 relative group cursor-pointer hover:border-pink-500/25 active:scale-[0.98] transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative">
                          <img src={room.coverImage || room.creatorAvatar} className="w-full h-32 object-cover" alt="" />
                          
                          {/* Heart overlays or viewer count banner */}
                          <div className="absolute top-2.5 left-2.5 bg-pink-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live
                          </div>

                          <div className="absolute top-2.5 right-2.5 bg-black/45 backdrop-blur-md p-0.5 px-2 rounded-full text-[8px] font-bold text-white flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> {room.viewerCount.toLocaleString()}
                          </div>
                        </div>

                        <div className="p-2.5 text-left pb-1">
                          <h4 className="text-white font-bold text-[10.5px] leading-tight truncate">{room.creatorName}</h4>
                          <p className="text-[9px] text-slate-300 truncate mt-0.5 font-medium">{room.title || 'Welcome to my live stream! ✨'}</p>
                          
                          <div className="flex justify-between items-center mt-1.5 border-t border-white/5 pt-1.5">
                            <span className="text-[7.5px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[50px]">{room.tags[0] || 'Chat'}</span>
                            <span className="text-pink-400 font-bold text-[8px] flex items-center gap-0.5 truncate max-w-[70px]">
                              {room.creatorCountry}
                            </span>
                          </div>

                          {/* Voice and Video Call Rates */}
                          {(() => {
                            const creator = creators.find(c => c.id === room.creatorId);
                            const voiceRate = creator?.voiceCallRate || 5;
                            const videoRate = creator?.videoCallRate || 15;
                            return (
                              <div className="flex gap-2 items-center mt-1.5 text-[7.5px] font-mono text-slate-500 font-bold">
                                <span className="flex items-center gap-0.5">🎙️ {voiceRate}/m</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">📹 {videoRate}/m</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="p-2.5 pt-0">
                        <button
                          type="button"
                          onClick={(e) => handleFollowCreator(room.creatorId, e)}
                          className={`w-full py-1.5 rounded-xl text-[8px] uppercase tracking-wider font-extrabold transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                            followedCreatorIds.includes(room.creatorId)
                              ? 'bg-slate-800 text-slate-400 border border-white/5'
                              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow shadow-pink-500/20'
                          }`}
                        >
                          {followedCreatorIds.includes(room.creatorId) ? '✓ Following' : '+ Follow'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-[#0D0D0D]/40 p-4 rounded-3xl border border-white/5 text-center max-w-xs mx-auto">
                  <span className="text-yellow-400 font-bold text-xs uppercase flex items-center gap-1 justify-center mb-1">
                    <Sparkles className="w-4 h-4" /> VIP Privilege Info
                  </span>
                  <p className="text-[8.5px] leading-relaxed text-slate-400">
                    Approved host certification remains high. Only certified creators can broadcast. Click any grid card to join!
                  </p>
                </div>
              </div>

              {/* Floating Action Button (FAB) in the bottom-right corner */}
              <button
                type="button"
                onClick={() => setShowCreateLiveModal(true)}
                className="absolute bottom-6 right-6 z-30 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full p-4.5 shadow-xl shadow-pink-500/40 active:scale-95 hover:scale-105 transition-all flex items-center justify-center border border-white/10 group cursor-pointer"
                title="Go Live"
              >
                <Video className="w-5.5 h-5.5 stroke-[2.5]" />
                <span className="absolute right-full mr-2 px-2.5 py-1 bg-black/90 backdrop-blur-md border border-white/15 rounded-lg text-[8px] uppercase tracking-wider font-extrabold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Go Live Now! 🚀
                </span>
              </button>
            </div>
          )}

          {/* TAB B: RECHARGE COIN WALLET */}
          {activeTab === 'wallet' && (
            <WalletView 
              user={user}
              transactions={transactions}
              onRechargeSuccess={handleRechargeSuccess}
            />
          )}

          {/* TAB C: SWIPEABLE TIKTOK FEED */}
          {activeTab === 'feed' && (
            <FeedView 
              posts={posts}
              user={user}
              onLikePost={handleLikePost}
              onCommentPost={handleCommentPost}
              onUploadPost={handleUploadPost}
            />
          )}

          {/* TAB D: SEARCH AND LEADERBOARDS */}
          {activeTab === 'explore' && (
            <ExploreView 
              creators={creators}
              rooms={rooms}
              onSelectCreator={(c) => setSelectedCreatorProfile(c)}
              onJoinRoom={(r) => setActiveLiveRoom(r)}
            />
          )}

          {/* TAB E: CONVERSATION DM CHATS (GEMINI SYSTEM) */}
          {activeTab === 'messages' && (
            <MessagesView 
              creators={creators}
              user={user}
              activeCreatorId={activeCreatorChatId}
              onSelectCreatorChat={(id) => setActiveCreatorChatId(id)}
              onStartCall={(creator, type) => {
                setActiveCallCreator(creator);
                setActiveCallType(type);
              }}
            />
          )}

          {/* TAB F: CREATOR STUDIO REVENUE PANEL */}
          {activeTab === 'creator' && (
            <CreatorDashboard 
              creators={creators}
              stats={stats}
              withdrawals={withdrawals}
              onSubmitWithdrawal={handleSubmitWithdrawal}
              rooms={rooms}
            />
          )}

          {/* TAB G: SUPER ADMINISTRATION PORTAL */}
          {activeTab === 'admin' && (
            <AdminPanel 
              creators={creators}
              rooms={rooms}
              withdrawals={withdrawals}
              onVerifyCreator={handleVerifyCreator}
              onSuspendUser={handleSuspendUser}
              onApproveWithdrawal={handleApproveWithdrawal}
              onRefreshState={fetchGlobalState}
            />
          )}

          {/* TAB H: USER PROFILE & SETTINGS PORTAL */}
          {activeTab === 'profile' && user && (
            <ProfileView 
              user={user}
              transactions={transactions}
              onRoleChanged={handleRoleChanged}
              onUserUpdated={(updatedUser) => {
                setUser(updatedUser);
                setCreators(prev => prev.map(c => c.id === updatedUser.id ? { ...c, ...updatedUser } : c));
              }}
              onNavigateToTab={(tab) => {
                setActiveTab(tab);
                setSelectedCreatorProfile(null);
              }}
            />
          )}

        </div>

        {/* BOTTOM NAVIGATION TAB CONTROLS (Material 3 style) */}
        <div className="bg-[#0D0D0D] border-t border-white/10 p-2 px-3 flex justify-between items-center z-35 relative select-none">
          
          {/* Nav Item A: Live Streams (Camera Icon) */}
          <button 
            onClick={() => { setActiveTab('live'); setSelectedCreatorProfile(null); }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'live' ? 'text-pink-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider">Live</span>
          </button>

          {/* Nav Item B: TikTok Feed */}
          <button 
            onClick={() => { setActiveTab('feed'); setSelectedCreatorProfile(null); }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'feed' ? 'text-pink-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider">Feed</span>
          </button>

          {/* Nav Item C: Explore */}
          <button 
            onClick={() => { setActiveTab('explore'); setSelectedCreatorProfile(null); }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'explore' ? 'text-pink-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider">Explore</span>
          </button>

          {/* Nav Item D: Direct Messages */}
          <button 
            onClick={() => { setActiveTab('messages'); setActiveCreatorChatId(null); setSelectedCreatorProfile(null); }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'messages' ? 'text-pink-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider">DMs</span>
          </button>

          {/* Nav Item E: Creator Studio */}
          <button 
            onClick={() => { setActiveTab('creator'); setSelectedCreatorProfile(null); }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'creator' ? 'text-pink-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider">Studio</span>
          </button>

          {/* Nav Item F: Super Admin / Profile */}
          {user.role === 'admin' || user.role === 'superadmin' ? (
            <button 
              onClick={() => { setActiveTab('admin'); setSelectedCreatorProfile(null); }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                activeTab === 'admin' ? 'text-red-500' : 'text-slate-500 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="text-[7.5px] font-bold uppercase tracking-wider">Admin</span>
            </button>
          ) : (
            <button 
              onClick={() => { setActiveTab('profile'); setSelectedCreatorProfile(null); }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                activeTab === 'profile' ? 'text-pink-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[7.5px] font-bold uppercase tracking-wider">Profile</span>
            </button>
          )}

        </div>


        {/* ================= SCREEN PORTALS & FULLSCREEN OVERLAYS ================= */}

        {/* 1. CREATOR PROFILE MODAL (Sliding bottom sheet overlay) */}
        <AnimatePresence>
          {selectedCreatorProfile && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end justify-center">
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-[#0D0D0D] border-t border-white/10 rounded-t-[32px] w-full max-h-[580px] p-5 shadow-2xl flex flex-col text-left overflow-y-auto scrollbar-none"
              >
                {/* Close handle */}
                <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
                  <span className="text-[8.5px] text-[#FF007A] font-black uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> creator profile
                  </span>
                  <button 
                    onClick={() => setSelectedCreatorProfile(null)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-bold transition active:scale-75"
                  >
                    ✕
                  </button>
                </div>

                {/* Profile Header card info */}
                <div className="flex items-center gap-4 mb-5">
                  <img src={selectedCreatorProfile.avatar} className="w-16 h-16 rounded-full border-2 border-[#FF007A] object-cover shadow-lg" alt="" />
                  <div>
                    <h2 className="text-white font-black text-sm flex items-center gap-1.5 leading-none">
                      <span>{selectedCreatorProfile.name}</span>
                      <span className="text-[8px] bg-[#FF007A]/10 text-[#FF007A] border border-[#FF007A]/25 px-1.5 py-0.5 rounded font-bold">Lv.{selectedCreatorProfile.level}</span>
                    </h2>
                    <p className="text-slate-400 text-[10px] mt-1.5 leading-none">
                      UID: {selectedCreatorProfile.uid} | {selectedCreatorProfile.age} yrs | {selectedCreatorProfile.gender}
                    </p>
                    <p className="text-[#FF007A] font-black text-[9px] mt-2 uppercase tracking-wider">{selectedCreatorProfile.country}</p>
                  </div>
                </div>

                {/* Followers following count stats */}
                <div className="grid grid-cols-2 gap-3 mb-5 text-center">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="text-white font-mono text-xs font-bold">{selectedCreatorProfile.followersCount.toLocaleString()}</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase">Followers</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="text-white font-mono text-xs font-bold">{selectedCreatorProfile.followingCount.toLocaleString()}</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase">Following</p>
                  </div>
                </div>

                {/* Bio text */}
                <div className="mb-5">
                  <span className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">About Star Creator</span>
                  <p className="text-slate-200 text-[10px] mt-1.5 leading-relaxed font-medium bg-white/5 p-2.5 rounded-xl border border-white/10">
                    {selectedCreatorProfile.bio}
                  </p>
                </div>

                {/* Action CTA triggers */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <button 
                    onClick={() => {
                      setSelectedCreatorProfile(null);
                      setActiveTab('messages');
                      setActiveCreatorChatId(selectedCreatorProfile.id);
                    }}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-xl text-[10px] text-center shadow transition active:scale-95 border border-white/10 flex flex-col items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-4 h-4 text-[#FF007A]" />
                    <span>Private DM</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedCreatorProfile(null);
                      setActiveCallCreator(selectedCreatorProfile);
                      setActiveCallType('voice');
                    }}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-xl text-[10px] text-center shadow transition active:scale-95 border border-white/10 flex flex-col items-center justify-center gap-1"
                  >
                    <Phone className="w-4 h-4 text-[#FF007A]" />
                    <span>Voice Call</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedCreatorProfile(null);
                      setActiveCallCreator(selectedCreatorProfile);
                      setActiveCallType('video');
                    }}
                    className="bg-gradient-to-r from-[#FF007A] to-[#8E2DE2] text-white font-bold py-2 rounded-xl text-[10px] text-center shadow transition active:scale-95 flex flex-col items-center justify-center gap-1"
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Call</span>
                  </button>
                </div>

                {/* Premium Services */}
                <div className="mb-5 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-yellow-400 text-[8px] uppercase tracking-wider font-extrabold flex items-center gap-1 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" /> Approved Premium Services
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    
                    {/* Private Live Button */}
                    <button 
                      onClick={() => {
                        setSelectedCreatorProfile(null);
                        handleUnlockPrivateLive(selectedCreatorProfile);
                      }}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl p-2.5 text-left flex flex-col justify-between h-20 transition hover:opacity-95 active:scale-[0.98] border border-orange-500/30 cursor-pointer"
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[9px] uppercase font-black tracking-wide">Private Live</span>
                        <Flame className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <div>
                        <span className="text-[8px] text-amber-200 block font-bold">1-on-1 VIP Stream</span>
                        <span className="text-[10px] font-extrabold font-mono mt-0.5 block">🪙 1,000 Coins</span>
                      </div>
                    </button>

                    {/* Premium Content Button */}
                    <button 
                      onClick={() => {
                        setSelectedCreatorProfile(null);
                        handleUnlockPremiumContent(selectedCreatorProfile);
                      }}
                      className="bg-gradient-to-r from-[#FF007A] to-purple-600 text-white rounded-xl p-2.5 text-left flex flex-col justify-between h-20 transition hover:opacity-95 active:scale-[0.98] border border-[#FF007A]/30 cursor-pointer"
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[9px] uppercase font-black tracking-wide">Premium Media</span>
                        <Star className="w-3.5 h-3.5 text-pink-300" />
                      </div>
                      <div>
                        <span className="text-[8px] text-pink-200 block font-bold font-bold">Exclusive Photos</span>
                        <span className="text-[10px] font-extrabold font-mono mt-0.5 block">🪙 500 Coins</span>
                      </div>
                    </button>

                  </div>
                </div>

                {/* Uploaded Gallery listings */}
                <div>
                  <h4 className="text-slate-400 text-[8px] uppercase tracking-wider font-bold mb-2">Host Media Stream Gallery</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCreatorProfile.gallery.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10 relative group">
                        <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition" alt="" />
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. ACTIVE LIVE STREAMING ROOM VIEW OVERLAY */}
        <AnimatePresence>
          {activeLiveRoom && (
            <LiveRoomView 
              room={activeLiveRoom}
              user={user}
              creators={creators}
              onClose={() => {
                setActiveLiveRoom(null);
                fetchGlobalState(); // reload coins and metrics
              }}
              onDeductCoins={handleDeductCoins}
              onReport={handleReport}
              onStartCall={(creator, type) => {
                setActiveCallCreator(creator);
                setActiveCallType(type);
              }}
              onOpenUserProfile={(creator) => setActiveUserProfile(creator)}
            />
          )}
        </AnimatePresence>

        {/* 3. ACTIVE VOICE/VIDEO DIALING CALL SIMULATOR OVERLAY */}
        <AnimatePresence>
          {activeCallCreator && (
            <CallingView 
              creator={activeCallCreator}
              user={user}
              callType={activeCallType}
              onDeductCoins={handleDeductCoins}
              onClose={handleCallFinished}
            />
          )}
        </AnimatePresence>

        {/* 4. CREATE LIVE ROOM FORM MODAL OVERLAY */}
        <AnimatePresence>
          {showCreateLiveModal && (
            <CreateLiveRoomModal 
              user={user}
              onClose={() => setShowCreateLiveModal(false)}
              onRoomCreated={(newRoom) => {
                setShowCreateLiveModal(false);
                setActiveLiveRoom(newRoom);
                fetchGlobalState(); // Fetch newly created room instantly!
              }}
            />
          )}
        </AnimatePresence>

        {/* 5. FULLSCREEN USER PROFILE OVERLAY VIEW */}
        <AnimatePresence>
          {activeUserProfile && user && (
            <UserProfileView 
              creator={activeUserProfile}
              currentUser={user}
              onClose={() => setActiveUserProfile(null)}
              onSendMessage={(creatorId) => {
                setActiveUserProfile(null);
                setActiveLiveRoom(null); // Leave live room on DM transition
                setActiveTab('messages');
                setActiveCreatorChatId(creatorId);
              }}
              onStartCall={(creator, type) => {
                setActiveCallCreator(creator);
                setActiveCallType(type);
              }}
              onReport={handleReport}
              onSendGiftDirect={(creatorId, gift) => {
                handleDeductCoins(
                  gift.coinValue,
                  'gift_sent',
                  `Sent ${gift.icon} ${gift.name} from User Profile`,
                  creatorId,
                  () => {
                    // Update creators local state / user balance after send
                    fetchGlobalState();
                  }
                );
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
