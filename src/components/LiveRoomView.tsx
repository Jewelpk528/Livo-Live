/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, User, Gift as GiftIcon, Heart, Send, Users, ShieldAlert, Zap, Mic, MicOff, Video, VideoOff, Award, Volume2, Flag, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveRoom, UserProfile, Gift, LiveMessage } from '../types';
import { GIFTS, MOCK_CHAT_POOL } from '../data';
import HeartsAnimation from './HeartsAnimation';
import GiftsAnimationOverlay from './GiftsAnimationOverlay';

interface LiveRoomViewProps {
  room: LiveRoom;
  user: UserProfile;
  onClose: () => void;
  onDeductCoins: (coins: number, type: 'gift_sent' | 'call_made', description: string, callback?: () => void) => void;
  onReport: (targetId: string, targetName: string, reason: string) => void;
}

export default function LiveRoomView({ room, user, onClose, onDeductCoins, onReport }: LiveRoomViewProps) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState(room.viewerCount);
  const [likesCount, setLikesCount] = useState(room.likesCount);
  const [followState, setFollowState] = useState(false);
  
  // Heart trigger counter
  const [heartTrigger, setHeartTrigger] = useState(0);
  
  // Active screen-wide gift animation
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<Gift | null>(null);

  // PK Battle State
  const [pkUserScore, setPkUserScore] = useState(room.pkBattle?.userScore || 0);
  const [pkOpponentScore, setPkOpponentScore] = useState(room.pkBattle?.opponentScore || 0);
  const [pkTimeLeft, setPkTimeLeft] = useState(room.pkBattle?.timeRemaining || 0);

  // Guest seat State
  const [guestSeats, setGuestSeats] = useState(room.multiGuest?.seats || []);
  const [mySeatId, setMySeatId] = useState<string | null>(null);

  // Selected chat user for Moderation
  const [selectedUserMod, setSelectedUserMod] = useState<{ id: string; name: string } | null>(null);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());

  // Gifts Sheet toggler
  const [showGifts, setShowGifts] = useState(false);

  // Report Form Toggler
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat & start simulation loops
  useEffect(() => {
    // Standard starting messages
    const initialMsgs: LiveMessage[] = [
      { id: 'm_init1', userId: 'system', userName: 'SYSTEM', userLevel: 0, isVIP: false, content: 'Welcome to Livo Live Stream! Please follow content guidelines.', type: 'system' },
      { id: 'm_init2', userId: 'join_1', userName: 'Ahmed_Dhaka', userLevel: 5, isVIP: false, content: 'joined the room', type: 'join' },
      { id: 'm_init3', userId: 'creator', userName: room.creatorName, userLevel: 30, isVIP: true, content: 'Hey everyone! Welcome to my stream! 💖 Let\'s chat or send some song requests!', type: 'chat' }
    ];
    setMessages(initialMsgs);

    // Dynamic Simulated Viewer Joins and Chats
    const msgInterval = setInterval(() => {
      const isJoin = Math.random() > 0.6;
      const randomUser = `User_${Math.floor(Math.random() * 9000) + 1000}`;
      const level = Math.floor(Math.random() * 25) + 1;
      const isVIP = Math.random() > 0.85;

      if (isJoin) {
        // Increment viewer count slightly
        setViewerCount(prev => prev + Math.floor(Math.random() * 6) - 2);
        
        const joinMsg: LiveMessage = {
          id: `msg_${Date.now()}`,
          userId: randomUser,
          userName: randomUser,
          userLevel: level,
          isVIP: isVIP,
          content: 'joined the live stream',
          type: 'join'
        };
        setMessages(prev => [...prev.slice(-40), joinMsg]);
      } else {
        const randomChatText = MOCK_CHAT_POOL[Math.floor(Math.random() * MOCK_CHAT_POOL.length)];
        
        // Don't append if user is muted
        if (!mutedUsers.has(randomUser)) {
          const chatMsg: LiveMessage = {
            id: `msg_${Date.now()}`,
            userId: randomUser,
            userName: randomUser,
            userLevel: level,
            isVIP: isVIP,
            content: randomChatText,
            type: 'chat'
          };
          setMessages(prev => [...prev.slice(-40), chatMsg]);
        }
      }
    }, 3800);

    // PK Battle Countdown
    let pkInterval: NodeJS.Timeout;
    if (room.pkBattle) {
      pkInterval = setInterval(() => {
        setPkTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(pkInterval);
            return 0;
          }
          // Opponent randomly scores during PK
          if (Math.random() > 0.7) {
            setPkOpponentScore(ops => ops + Math.floor(Math.random() * 120) + 20);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(msgInterval);
      if (pkInterval) clearInterval(pkInterval);
    };
  }, [room, mutedUsers]);

  // Scroll Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle User Send Chat Message
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (mutedUsers.has(user.id)) {
      const warningMsg: LiveMessage = {
        id: `msg_mute_${Date.now()}`,
        userId: 'system',
        userName: 'SYSTEM',
        userLevel: 0,
        isVIP: false,
        content: 'You are muted in this room by the moderator.',
        type: 'system'
      };
      setMessages(prev => [...prev, warningMsg]);
      setInputText('');
      return;
    }

    const myMsg: LiveMessage = {
      id: `msg_my_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userLevel: user.level,
      isVIP: user.isVIP,
      content: inputText,
      type: 'chat'
    };

    setMessages(prev => [...prev, myMsg]);
    setInputText('');

    // Small chance for streamer to acknowledge user's chat message instantly
    setTimeout(() => {
      if (Math.random() > 0.4) {
        const responses = [
          `Thank you so much ${user.name}! 🥰`,
          `Yes, I totally agree! ❤️`,
          `Wow, Jewel that's amazing!`,
          `Welcome, welcome! 🌹`,
          `Can we do a call later Jewel? 😘`
        ];
        const hostReply: LiveMessage = {
          id: `reply_${Date.now()}`,
          userId: 'creator',
          userName: room.creatorName,
          userLevel: 30,
          isVIP: true,
          content: responses[Math.floor(Math.random() * responses.length)],
          type: 'chat'
        };
        setMessages(prev => [...prev, hostReply]);
      }
    }, 1500);
  };

  // Handle Send Gift Action
  const handleSendGift = (gift: Gift) => {
    if (user.coins < gift.coinValue) {
      alert("⚠️ Low balance! Please recharge your wallet in the Wallet section.");
      return;
    }

    onDeductCoins(gift.coinValue, 'gift_sent', `Sent ${gift.name} to ${room.creatorName}`, () => {
      // Success Callback
      // Close gift panel for big gifts
      if (gift.coinValue >= 500) {
        setShowGifts(false);
      }

      // Launch full-screen overlays
      setActiveGiftAnimation(gift);

      // Add to PK score if active
      if (room.pkBattle) {
        setPkUserScore(prev => prev + gift.coinValue * 10); // 1 coin = 10 PK points
      }

      // Add message to chat
      const giftMsg: LiveMessage = {
        id: `gift_msg_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userLevel: user.level,
        isVIP: user.isVIP,
        content: `sent a ${gift.name} ${gift.icon}`,
        type: 'gift',
        giftName: gift.name,
        giftIcon: gift.icon
      };
      setMessages(prev => [...prev, giftMsg]);

      // Streamer reaction
      setTimeout(() => {
        const reactions = [
          `OMG! ${user.name} sent a ${gift.name}! Thank you so much! 😭😭❤️`,
          `Wow! ${gift.icon} ${gift.name}! You are incredible, ${user.name}! 🥰`,
          `My heart is beating so fast! Thank you for the ${gift.name} support! 👑`,
          `Ferraris & Yachts make me so happy! Thank you Jewel! 💋`
        ];
        const reactionText = gift.coinValue >= 500 
          ? reactions[Math.floor(Math.random() * 2) + 2] 
          : reactions[Math.floor(Math.random() * 2)];

        setMessages(prev => [...prev, {
          id: `reaction_${Date.now()}`,
          userId: 'creator',
          userName: room.creatorName,
          userLevel: 30,
          isVIP: true,
          content: reactionText,
          type: 'chat'
        }]);
      }, 1000);
    });
  };

  // Handle Double Tap / Tap Like
  const handleTapLike = () => {
    setHeartTrigger(prev => prev + 1);
    setLikesCount(prev => prev + 1);

    if (Math.random() > 0.8) {
      // Simulate chat likes
      const likeMsg: LiveMessage = {
        id: `like_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userLevel: user.level,
        isVIP: user.isVIP,
        content: 'liked the stream',
        type: 'join'
      };
      setMessages(prev => [...prev.slice(-45), likeMsg]);
    }
  };

  // Handle Multi Guest seat click
  const handleSeatClick = (seatId: string) => {
    const seat = guestSeats.find(s => s.id === seatId);
    if (!seat) return;

    if (seat.userId === user.id) {
      // Leave seat
      setGuestSeats(prev => prev.map(s => s.id === seatId ? { ...s, userId: null, userName: null, userAvatar: null, isVideoOn: false } : s));
      setMySeatId(null);
    } else if (!seat.userId) {
      if (mySeatId) {
        alert("You are already occupying another seat!");
        return;
      }
      // Join seat
      setGuestSeats(prev => prev.map(s => s.id === seatId ? { 
        ...s, 
        userId: user.id, 
        userName: user.name, 
        userAvatar: user.avatar,
        isVideoOn: true 
      } : s));
      setMySeatId(seatId);

      const seatJoinMsg: LiveMessage = {
        id: `seat_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userLevel: user.level,
        isVIP: user.isVIP,
        content: 'joined the multi-guest seat 🎙️',
        type: 'join'
      };
      setMessages(prev => [...prev, seatJoinMsg]);
    }
  };

  // Handle Toggle Mic/Video on Seat
  const toggleSeatDevice = (type: 'mic' | 'video') => {
    if (!mySeatId) return;
    setGuestSeats(prev => prev.map(s => {
      if (s.id === mySeatId) {
        return {
          ...s,
          isMuted: type === 'mic' ? !s.isMuted : s.isMuted,
          isVideoOn: type === 'video' ? !s.isVideoOn : s.isVideoOn
        };
      }
      return s;
    }));
  };

  // Moderator actions
  const handleModeratorAction = (type: 'kick' | 'mute') => {
    if (!selectedUserMod) return;
    const { id, name } = selectedUserMod;

    if (type === 'kick') {
      const kickMsg: LiveMessage = {
        id: `kick_${Date.now()}`,
        userId: 'system',
        userName: 'MODERATOR',
        userLevel: 99,
        isVIP: true,
        content: `${name} has been kicked from the live room by Moderator.`,
        type: 'system'
      };
      setMessages(prev => [...prev, kickMsg]);
      // Remove messages from that user
      setMessages(prev => prev.filter(m => m.userId !== id));
      setViewerCount(prev => Math.max(1, prev - 1));
    } else if (type === 'mute') {
      setMutedUsers(prev => {
        const n = new Set(prev);
        n.add(id);
        return n;
      });
      const muteMsg: LiveMessage = {
        id: `mute_${Date.now()}`,
        userId: 'system',
        userName: 'MODERATOR',
        userLevel: 99,
        isVIP: true,
        content: `${name} has been muted in this room.`,
        type: 'system'
      };
      setMessages(prev => [...prev, muteMsg]);
    }

    setSelectedUserMod(null);
  };

  // Handle Report creator
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    onReport(room.creatorId, room.creatorName, reportReason);
    setReportReason('');
    setShowReportModal(false);
    alert(`Report submitted successfully! Admins will review the stream for: "${reportReason}".`);
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
      
      {/* Dynamic Full Screen Live stream Simulated Background */}
      <div className="absolute inset-0 w-full h-full bg-cover bg-center z-0 filter brightness-90 saturate-125" style={{ backgroundImage: `url(${room.coverImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60 z-10" />
        
        {/* Glowing live visual effects (simulating active stream camera pixels) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-24 right-1/4 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

        {/* Floating live particle stream indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] uppercase font-mono tracking-widest border border-white/10">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span>HD Live</span>
        </div>
      </div>

      {/* Floating Hearts floating up layer */}
      <HeartsAnimation trigger={heartTrigger} />

      {/* Premium Gift animations overlay layer */}
      <GiftsAnimationOverlay activeGift={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />

      {/* TOP HEADER: Streamer Info, Viewer counts, Exit button */}
      <div className="relative z-20 p-3 flex justify-between items-start pt-4">
        {/* Host Avatar & follow controls */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 pr-3 rounded-full border border-white/10 max-w-[190px]">
          <div className="relative">
            <img src={room.creatorAvatar} className="w-8 h-8 rounded-full border border-pink-500 object-cover" alt="" />
            <div className="absolute bottom-0 right-0 bg-yellow-400 text-slate-900 rounded-full p-0.5 text-[7px] font-bold">LV30</div>
          </div>
          <div className="overflow-hidden">
            <h3 className="text-white text-[11px] font-bold truncate leading-tight">{room.creatorName}</h3>
            <p className="text-[9px] text-pink-300 flex items-center gap-0.5 font-medium leading-none">
              <span>🇧🇩</span>
              <span>{viewerCount.toLocaleString()} viewers</span>
            </p>
          </div>
          <button 
            onClick={() => setFollowState(!followState)}
            className={`ml-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold transition ${followState ? 'bg-white/20 text-white' : 'bg-pink-500 text-white hover:scale-105 active:scale-95'}`}
          >
            {followState ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Top Gifters, Flag, Close btn */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-2 mr-1">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60&h=60" className="w-6 h-6 rounded-full border border-yellow-400 object-cover" alt="" />
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=60&h=60" className="w-6 h-6 rounded-full border border-cyan-400 object-cover" alt="" />
            <div className="w-6 h-6 rounded-full bg-slate-900/60 border border-white/10 flex items-center justify-center text-[8px] text-yellow-400 font-bold">#1</div>
          </div>
          
          <button 
            onClick={() => setShowReportModal(true)}
            className="p-1.5 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-full border border-white/10 text-white transition active:scale-95"
            title="Report Stream"
          >
            <Flag className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" />
          </button>

          <button 
            onClick={onClose}
            className="p-1.5 bg-pink-500 hover:bg-pink-600 rounded-full text-white transition active:scale-95 shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DYNAMIC SCENE LAYOUT: PK Battle (Split Screen) OR Multi-Guest View */}
      <div className="relative z-10 w-full flex-grow flex flex-col justify-start px-3 py-1 overflow-hidden">
        
        {/* 1. PK BATTLE MODE LAYER ( Sophia vs Elena ) */}
        {room.pkBattle && (
          <div className="w-full mt-2 mb-2 bg-black/55 backdrop-blur-sm rounded-xl p-2 border border-yellow-500/20 flex flex-col">
            <div className="flex justify-between items-center px-2 pb-1 text-[10px] text-white/80 font-bold uppercase tracking-wider">
              <span className="text-rose-400 flex items-center gap-1"><Zap className="w-3 h-3 animate-bounce" /> Sophia</span>
              <span className="bg-yellow-500 text-slate-950 px-1.5 py-0.5 rounded text-[8px] animate-pulse">PK BATTLE</span>
              <span className="text-cyan-400">Elena Kiev</span>
            </div>

            {/* Score Bar */}
            <div className="w-full h-4 bg-slate-800 rounded-full flex overflow-hidden border border-slate-700 relative">
              <div 
                className="bg-gradient-to-r from-pink-500 to-rose-600 h-full transition-all duration-500 flex items-center pl-2"
                style={{ width: `${(pkUserScore / (pkUserScore + pkOpponentScore || 1)) * 100}%` }}
              >
                <span className="text-[9px] text-white font-black">{pkUserScore}</span>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-0.5 bg-yellow-400" />
              <div 
                className="bg-gradient-to-l from-cyan-500 to-blue-600 h-full transition-all duration-500 flex items-center justify-end pr-2 flex-grow"
              >
                <span className="text-[9px] text-white font-black">{pkOpponentScore}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[8px] text-slate-300 font-mono mt-1 px-1">
              <span>Send any gift to boost score!</span>
              <span className="text-yellow-400 font-bold">Ends in: {Math.floor(pkTimeLeft / 60)}:{(pkTimeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        )}

        {/* 2. MULTI-GUEST SEATS GRID */}
        {room.multiGuest && (
          <div className="w-full mt-2 grid grid-cols-4 gap-2 bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-white/5">
            {guestSeats.map((seat, idx) => (
              <div 
                key={seat.id} 
                onClick={() => handleSeatClick(seat.id)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer overflow-hidden border transition ${
                  seat.userId 
                    ? 'bg-slate-900/90 border-pink-500/40 shadow-md' 
                    : 'bg-black/30 border-dashed border-white/20 hover:border-pink-400/40'
                }`}
              >
                {seat.userId ? (
                  <div className="absolute inset-0 flex flex-col justify-between p-1">
                    {seat.isVideoOn ? (
                      <img src={seat.userAvatar!} className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-90 scale-110" alt="" />
                    ) : (
                      <div className="absolute inset-0 bg-slate-950 flex items-center justify-center z-0">
                        <User className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                    
                    {/* Top Seat Tag */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="text-[7px] px-1 bg-black/50 text-yellow-400 font-bold rounded">Seat {idx+1}</span>
                      {seat.isMuted ? (
                        <MicOff className="w-2.5 h-2.5 text-red-400 bg-black/40 p-0.5 rounded-full" />
                      ) : (
                        <Mic className="w-2.5 h-2.5 text-green-400 bg-black/40 p-0.5 rounded-full" />
                      )}
                    </div>
                    {/* Bottom Name Tag */}
                    <span className="relative z-10 text-[7px] text-white font-semibold truncate bg-black/40 px-1 py-0.5 rounded-sm">
                      {seat.userName?.split(' ')[0]}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[7px] text-white/50 font-bold uppercase tracking-wider">Join</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3. MULTI-GUEST CONTROLS (IF USER IS ON SEAT) */}
        {mySeatId && (
          <div className="w-full flex justify-center gap-4 mt-2 mb-1">
            <button 
              onClick={() => toggleSeatDevice('mic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold shadow-lg transition active:scale-95 ${
                guestSeats.find(s => s.id === mySeatId)?.isMuted 
                  ? 'bg-red-500 text-white' 
                  : 'bg-green-600 text-white'
              }`}
            >
              {guestSeats.find(s => s.id === mySeatId)?.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span>{guestSeats.find(s => s.id === mySeatId)?.isMuted ? 'Muted' : 'Speaking'}</span>
            </button>

            <button 
              onClick={() => toggleSeatDevice('video')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold shadow-lg transition active:scale-95 ${
                !guestSeats.find(s => s.id === mySeatId)?.isVideoOn 
                  ? 'bg-slate-800 text-slate-400' 
                  : 'bg-pink-500 text-white'
              }`}
            >
              {guestSeats.find(s => s.id === mySeatId)?.isVideoOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
              <span>{guestSeats.find(s => s.id === mySeatId)?.isVideoOn ? 'Video On' : 'Video Off'}</span>
            </button>
          </div>
        )}
      </div>

      {/* DYNAMIC AUTO-SCROLLING LIVE CHAT LOG */}
      <div className="relative z-10 w-full h-[210px] px-3 flex flex-col justify-end overflow-hidden pb-1">
        <div className="overflow-y-auto max-h-[200px] flex flex-col gap-1.5 pr-2 scrollbar-none">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              onClick={() => {
                if (msg.userId !== 'system' && msg.userId !== user.id) {
                  setSelectedUserMod({ id: msg.userId, name: msg.userName });
                }
              }}
              className="group cursor-pointer"
            >
              {/* System message */}
              {msg.type === 'system' && (
                <div className="flex items-start gap-1.5 bg-yellow-500/15 border border-yellow-500/20 p-2 rounded-xl text-[10px] text-yellow-300 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{msg.content}</span>
                </div>
              )}

              {/* Gift messages */}
              {msg.type === 'gift' && (
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 p-1.5 px-2.5 rounded-full text-[10px] shadow-sm">
                  <span className="text-yellow-400 font-bold">Lv.{msg.userLevel}</span>
                  <span className="text-white font-bold">{msg.userName}:</span>
                  <span className="text-pink-300 font-medium">{msg.content}</span>
                  <span className="text-sm scale-110 ml-1">{msg.giftIcon}</span>
                </div>
              )}

              {/* Join notifications */}
              {msg.type === 'join' && (
                <p className="text-[10px] text-slate-300/80 italic pl-1 leading-relaxed">
                  <span className="text-pink-400 font-semibold mr-1">{msg.userName}</span>
                  {msg.content}
                </p>
              )}

              {/* Standard chat */}
              {msg.type === 'chat' && (
                <div className="inline-flex flex-wrap items-center gap-1 bg-black/35 backdrop-blur-sm p-1.5 px-3 rounded-2xl max-w-[90%] border border-white/5 hover:bg-black/50 transition">
                  <span className="text-[8px] bg-yellow-400 text-slate-900 rounded font-black px-1 mr-0.5">Lv.{msg.userLevel}</span>
                  {msg.isVIP && <span className="text-[8px] bg-pink-500 text-white rounded font-black px-1.5">VIP</span>}
                  <span className="text-white font-bold text-[10px]">{msg.userName}:</span>
                  <span className="text-slate-100 font-medium text-[10px] ml-1">{msg.content}</span>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* FOOTER ACTIONS: Input chat field, Gift icon, Hearts trigger */}
      <div className="relative z-20 p-3 bg-gradient-to-t from-slate-950 to-transparent flex items-center justify-between gap-2.5 pb-4">
        {/* Input box */}
        <form onSubmit={handleSendChat} className="flex-grow flex items-center bg-black/45 backdrop-blur-md rounded-full border border-white/10 px-3 py-1">
          <input 
            type="text" 
            placeholder="Say something nice..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow bg-transparent text-white outline-none border-none text-[11px] placeholder-slate-400 py-1"
          />
          <button type="submit" className="p-1 hover:bg-white/10 rounded-full text-pink-500 transition active:scale-95">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Coins Badge display */}
        <div className="bg-black/50 px-2 py-1.5 rounded-full border border-yellow-500/20 text-yellow-400 text-[10px] font-bold flex items-center gap-1">
          <span>🪙</span>
          <span>{user.coins}</span>
        </div>

        {/* Gift Draw Trigger */}
        <button 
          onClick={() => setShowGifts(true)}
          className="p-2 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-full text-white shadow-lg transition hover:scale-105 active:scale-95"
          title="Send Gift"
        >
          <GiftIcon className="w-4 h-4" />
        </button>

        {/* Heart Tap Trigger */}
        <button 
          onClick={handleTapLike}
          className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition hover:scale-105 active:scale-95 shadow-lg relative"
          title="Tap Like"
        >
          <Heart className="w-4 h-4 fill-white" />
        </button>
      </div>

      {/* ============ OVERLAY DIALOGS ============ */}

      {/* 1. VIRTUAL GIFTS SELECTION DRAWER */}
      <AnimatePresence>
        {showGifts && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-white/15 rounded-t-3xl p-4 flex flex-col shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <GiftIcon className="w-4 h-4 text-yellow-400" /> Virtual Gift Shop
                </h3>
                <p className="text-[10px] text-slate-400">Coins automatically credited to {room.creatorName}</p>
              </div>
              <button 
                onClick={() => setShowGifts(false)}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid of Gifts */}
            <div className="grid grid-cols-4 gap-2.5 pb-4 max-h-[220px] overflow-y-auto scrollbar-none">
              {GIFTS.map((gift) => (
                <div 
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                    user.coins >= gift.coinValue 
                      ? 'bg-slate-800/55 border-white/10 hover:border-pink-500/50 hover:bg-slate-850' 
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-1 animate-pulse">{gift.icon}</div>
                  <span className="text-[9px] text-white font-bold">{gift.name}</span>
                  <span className="text-[8px] text-yellow-400 font-mono mt-0.5 flex items-center gap-0.5">
                    🪙 {gift.coinValue}
                  </span>
                </div>
              ))}
            </div>

            {/* Wallet Quick Recharge Footer */}
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-xs">🪙</span>
                <div>
                  <span className="text-white text-[11px] font-bold">Your Balance:</span>
                  <span className="text-yellow-400 text-[11px] font-mono font-bold ml-1">{user.coins} Coins</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400">Need more? Go to wallet panel!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHAT MODERATION DIALOG */}
      <AnimatePresence>
        {selectedUserMod && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-5 rounded-2xl w-full max-w-[260px] text-center shadow-2xl flex flex-col"
            >
              <ShieldAlert className="w-10 h-10 text-yellow-400 mx-auto mb-2.5" />
              <h3 className="text-white text-sm font-bold">Live Moderator Control</h3>
              <p className="text-slate-400 text-[10px] mt-1.5 mb-4">
                Choose action for <span className="text-pink-400 font-bold">{selectedUserMod.name}</span>
              </p>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleModeratorAction('mute')}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition active:scale-95"
                >
                  🤐 Mute User in Chat
                </button>
                <button 
                  onClick={() => handleModeratorAction('kick')}
                  className="py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition active:scale-95"
                >
                  🥾 Kick User from Room
                </button>
                <button 
                  onClick={() => setSelectedUserMod(null)}
                  className="py-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-lg text-xs transition mt-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/15 p-5 rounded-2xl w-full max-w-[280px] shadow-2xl flex flex-col"
            >
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-white text-xs font-bold uppercase tracking-wider">Report Host Content</h3>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed mb-4">
                Help us keep Livo Live safe! Submitting reports alerts the Admin Panel instantly for content moderation.
              </p>

              <form onSubmit={handleSubmitReport} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300 text-[10px] font-bold">Reason for Report:</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    className="bg-slate-950 border border-white/10 text-white rounded-lg text-xs p-2 outline-none"
                  >
                    <option value="">Select violation reason...</option>
                    <option value="Inappropriate Attire/Conduct">Inappropriate Attire/Conduct</option>
                    <option value="Hate Speech or Bullying">Hate Speech or Bullying</option>
                    <option value="Underage User Streaming">Underage User Streaming</option>
                    <option value="Intellectual Property Violation">Intellectual Property Violation</option>
                    <option value="Spam or Scams">Spam or Scams</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <button 
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
