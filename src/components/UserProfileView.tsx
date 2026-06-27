/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MessageCircle, Heart, Phone, Video, Ban, Flag, Share2, MapPin, 
  Sparkles, CheckCircle, Award, List, Lock, Play, Film, ShieldAlert, Users, 
  DollarSign, Clock, Calendar, Shield, EyeOff, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Gift, Post } from '../types';
import { GIFTS } from '../data';

interface UserProfileViewProps {
  creator: UserProfile;
  currentUser: UserProfile;
  onClose: () => void;
  onSendMessage: (creatorId: string) => void;
  onStartCall: (creator: UserProfile, type: 'voice' | 'video') => void;
  onReport: (targetId: string, targetName: string, reason: string) => void;
  onSendGiftDirect?: (creatorId: string, gift: Gift) => void;
}

export default function UserProfileView({ 
  creator, 
  currentUser, 
  onClose, 
  onSendMessage, 
  onStartCall, 
  onReport,
  onSendGiftDirect
}: UserProfileViewProps) {
  
  // Custom states matching the required features
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'videos' | 'posts' | 'reels'>('photos');

  // Extended Profile parameters with beautiful defaults if not present
  const city = creator.country === 'Bangladesh' ? 'Dhaka' : creator.country === 'India' ? 'Mumbai' : 'New York';
  const language = creator.country === 'Bangladesh' ? 'Bengali, English' : creator.country === 'India' ? 'Hindi, English' : 'English';
  const friendsCount = Math.floor(creator.followersCount * 0.08) + 12;
  const diamondsCount = Math.floor(creator.followersCount * 1.2) + 140;
  const totalGiftsReceived = Math.floor(creator.followersCount * 5.5) + 320;
  const totalGiftsSent = Math.floor(creator.followersCount * 0.2) + 45;
  const totalLiveHours = Math.floor(creator.level * 12.5) + 40;
  const totalVideoCalls = Math.floor(creator.level * 6.2) + 15;
  const joinDate = new Date(Date.now() - (creator.level * 15 * 24 * 60 * 60 * 1000)).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Media Mock lists matching requirements
  const imagesList = [
    creator.avatar,
    creator.coverPhoto,
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400&h=500',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=500'
  ];

  const introVideos = [
    'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-with-headphones-singing-40348-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-young-woman-vlogging-at-home-40346-large.mp4'
  ];

  const reelsList = [
    { id: 'reel1', thumbnail: creator.avatar, videoUrl: introVideos[0], views: '45.2K', likes: '12.4K' },
    { id: 'reel2', thumbnail: creator.coverPhoto, videoUrl: introVideos[1], views: '28.1K', likes: '8.9K' }
  ];

  const postsList = [
    { id: 'p1', content: `Hey everyone! Join my stream later today. Sending love! 💖`, date: '2 hours ago', likes: 245, comments: 18 },
    { id: 'p2', content: `Unlocked new premium rewards! Thank you so much for the gorgeous gifts yesterday. You guys are the absolute best! ✨🏆`, date: 'Yesterday', likes: 489, comments: 34 }
  ];

  // Try saving follower/blocked states to firestore if available
  useEffect(() => {
    // Determine random privacy state for demonstration of rules
    setIsPrivate(creator.level % 4 === 0);
  }, [creator]);

  const handleFollowToggle = async () => {
    setIsFollowing(!isFollowing);
    // If Firebase was available, we could sync it to the followers/ collection
    try {
      await fetch('/api/firebase-simulation-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          collection: 'followers', 
          docId: `${currentUser.id}_${creator.id}`, 
          data: { callerId: currentUser.id, receiverId: creator.id, status: !isFollowing } 
        })
      }).catch(() => {});
    } catch(e) {}
  };

  const handleBlockToggle = async () => {
    setIsBlocked(!isBlocked);
    try {
      await fetch('/api/firebase-simulation-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          collection: 'blocks', 
          docId: `${currentUser.id}_${creator.id}`, 
          data: { userId: currentUser.id, blockedId: creator.id, active: !isBlocked } 
        })
      }).catch(() => {});
    } catch(e) {}
  };

  const handleShareProfile = () => {
    setCopiedLink(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendGift = (gift: Gift) => {
    if (onSendGiftDirect) {
      onSendGiftDirect(creator.id, gift);
    } else {
      alert(`🎁 Successfully sent ${gift.name} (${gift.icon}) to ${creator.name}!`);
    }
    setShowGiftDrawer(false);
  };

  const isRestricted = isPrivate && !isFollowing;

  return (
    <div className="absolute inset-0 bg-[#090909] text-white z-50 flex flex-col overflow-hidden select-none">
      
      {/* 1. TOP HEADER BANNER CONTROLS */}
      <div className="bg-[#0D0D0D] border-b border-white/10 p-3 flex justify-between items-center z-40 relative pt-5">
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 transition active:scale-75"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-[10px] text-[#FF007A] font-black uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-amber-400" /> Star User Profile
        </span>
        <div className="flex gap-1.5">
          <button 
            onClick={handleShareProfile}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 transition active:scale-75"
            title="Share Profile Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => onReport(creator.id, creator.name, "Inappropriate profile contents")}
            className="p-1.5 hover:bg-white/10 rounded-full text-rose-400 transition active:scale-75"
            title="Report User Profile"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SCROLLABLE INNER AREA */}
      <div className="flex-grow overflow-y-auto pb-24 scrollbar-none text-left bg-[#090909]">
        
        {/* Cover Photo */}
        <div className="w-full h-36 relative">
          <img 
            src={creator.coverPhoto} 
            className="w-full h-full object-cover filter brightness-75" 
            alt="Cover Banner" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] to-transparent" />
          
          {/* Status Overlay */}
          <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-white/10 text-[8px] uppercase tracking-wider font-extrabold text-white">
            <span className={`w-1.5 h-1.5 rounded-full ${
              creator.onlineStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
            }`} />
            <span>{creator.onlineStatus}</span>
          </div>
        </div>

        {/* Main Details and Badges Container */}
        <div className="px-4 -mt-10 relative z-10">
          <div className="flex items-end gap-3.5 mb-3.5">
            <img 
              src={creator.avatar} 
              className="w-20 h-20 rounded-2xl border-4 border-slate-900 object-cover shadow-2xl shadow-black/80" 
              alt={creator.name} 
            />
            <div className="flex-grow pb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-white text-base font-black tracking-tight leading-none">
                  {creator.name}
                </h2>
                {creator.isApprovedCreator && (
                  <CheckCircle className="w-4 h-4 text-pink-500 fill-pink-500/20" title="Verified Creator" />
                )}
                {creator.isVIP && (
                  <span className="bg-yellow-500/10 text-yellow-400 text-[7px] border border-yellow-500/20 font-black px-1.5 py-0.5 rounded uppercase leading-none">
                    VIP
                  </span>
                )}
                <span className="bg-pink-500/20 text-pink-400 text-[7.5px] border border-pink-500/30 font-black px-1.5 py-0.5 rounded leading-none uppercase">
                  Lv.{creator.level}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                UID: {creator.uid}
              </p>
            </div>
          </div>

          {/* Followers & Friends Statistics Row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#0D0D0D] p-2 rounded-xl border border-white/5 text-center">
              <span className="text-white font-mono text-xs font-black">{creator.followersCount.toLocaleString()}</span>
              <p className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Followers</p>
            </div>
            <div className="bg-[#0D0D0D] p-2 rounded-xl border border-white/5 text-center">
              <span className="text-white font-mono text-xs font-black">{creator.followingCount.toLocaleString()}</span>
              <p className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Following</p>
            </div>
            <div className="bg-[#0D0D0D] p-2 rounded-xl border border-white/5 text-center">
              <span className="text-white font-mono text-xs font-black">{friendsCount}</span>
              <p className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Friends</p>
            </div>
          </div>

          {/* Core metadata summary */}
          <div className="p-3.5 bg-[#0D0D0D] border border-white/5 rounded-2xl mb-4 text-[10px] font-medium leading-relaxed">
            <p className="text-slate-200">{creator.bio}</p>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3.5 pt-3 border-t border-white/5 text-slate-400 text-[9px] font-bold">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-pink-500" />
                <span>{city}, {creator.country}</span>
              </div>
              <div className="flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-pink-500" />
                <span>{isPrivate ? 'Private Profile' : 'Public Profile'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-pink-500" />
                <span>Gender: <span className="text-white font-semibold">{creator.gender}</span></span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-pink-500" />
                <span>Age: <span className="text-white font-semibold">{creator.age}</span></span>
              </div>
              <div className="flex items-center gap-1 col-span-2">
                <List className="w-3.5 h-3.5 text-pink-500" />
                <span>Languages: <span className="text-white font-semibold">{language}</span></span>
              </div>
            </div>
          </div>

          {/* Coin & Diamond balances metadata */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-yellow-500/25 p-2.5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[8px] text-yellow-500 uppercase font-black tracking-wider block">Coins Received</span>
                <span className="text-white font-mono text-xs font-black mt-0.5 block">🪙 {creator.coins.toLocaleString()}</span>
              </div>
              <DollarSign className="w-5 h-5 text-yellow-500 opacity-60" />
            </div>
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/25 p-2.5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[8px] text-cyan-400 uppercase font-black tracking-wider block">Diamonds Balance</span>
                <span className="text-white font-mono text-xs font-black mt-0.5 block">💎 {diamondsCount.toLocaleString()}</span>
              </div>
              <Sparkles className="w-5 h-5 text-cyan-400 opacity-60" />
            </div>
          </div>

          {/* Incoming Call Rates */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-[#0D0D0D] border border-green-500/20 p-2.5 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">Voice Call Rate</span>
                <span className="text-white font-mono text-[10px] font-black mt-0.5 block">📞 {creator.voiceCallRate ?? 1} Coins/min</span>
              </div>
            </div>
            <div className="bg-[#0D0D0D] border border-pink-500/20 p-2.5 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">Video Call Rate</span>
                <span className="text-white font-mono text-[10px] font-black mt-0.5 block">📹 {creator.videoCallRate ?? 5} Coins/min</span>
              </div>
            </div>
          </div>

          {/* Premium stats panel */}
          <div className="p-3.5 bg-[#0D0D0D]/60 border border-white/5 rounded-2xl mb-4">
            <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block mb-2.5">Broadcast and Call Metrics</span>
            <div className="grid grid-cols-2 gap-3 text-[9px] font-mono">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Total Gifts Sent:</span>
                <span className="text-white font-bold">{totalGiftsSent}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Gifts Received:</span>
                <span className="text-pink-400 font-bold">{totalGiftsReceived}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Live Hours:</span>
                <span className="text-white font-bold">{totalLiveHours} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Video Calls:</span>
                <span className="text-white font-bold">{totalVideoCalls}</span>
              </div>
            </div>
            <div className="mt-3.5 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[8.5px] text-slate-500 font-bold">
              <Calendar className="w-3.5 h-3.5 text-pink-500" />
              <span>Registered Since: {joinDate}</span>
            </div>
          </div>

          {/* MEDIA SECTION AND TAB CONTROLS */}
          <div className="mb-4">
            <div className="flex bg-[#0D0D0D] p-1 rounded-xl border border-white/10 mb-3 select-none">
              <button 
                onClick={() => setActiveMediaTab('photos')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition ${
                  activeMediaTab === 'photos' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Photos
              </button>
              <button 
                onClick={() => setActiveMediaTab('videos')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition ${
                  activeMediaTab === 'videos' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Videos
              </button>
              <button 
                onClick={() => setActiveMediaTab('posts')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition ${
                  activeMediaTab === 'posts' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Posts
              </button>
              <button 
                onClick={() => setActiveMediaTab('reels')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition ${
                  activeMediaTab === 'reels' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Reels
              </button>
            </div>

            {/* Check privacy settings rule constraint */}
            {isRestricted ? (
              <div className="bg-slate-950 rounded-2xl p-8 border border-white/5 text-center flex flex-col items-center justify-center gap-2">
                <Lock className="w-8 h-8 text-pink-500 opacity-80" />
                <h4 className="text-white text-xs font-black uppercase tracking-wider">This profile is Private</h4>
                <p className="text-[9.5px] text-slate-500 max-w-[220px] leading-relaxed">
                  Only approved followers can view media files, posts, reels, and stories. Tap the Follow button to send a request!
                </p>
              </div>
            ) : (
              <div>
                {/* A. PHOTOS GRID (5 Images) */}
                {activeMediaTab === 'photos' && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagesList.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`aspect-square bg-white/5 rounded-xl overflow-hidden border border-white/10 relative group ${
                          idx === 0 ? 'col-span-2 row-span-2' : ''
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition" alt="" />
                      </div>
                    ))}
                  </div>
                )}

                {/* B. INTRO VIDEOS (2 Videos) */}
                {activeMediaTab === 'videos' && (
                  <div className="grid grid-cols-2 gap-3">
                    {introVideos.map((vid, idx) => (
                      <div key={idx} className="bg-[#0D0D0D] rounded-2xl border border-white/10 overflow-hidden relative">
                        <video 
                          src={vid} 
                          controls 
                          playsInline
                          className="w-full h-44 object-cover" 
                        />
                        <div className="absolute top-2 left-2 bg-pink-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">
                          Intro #{idx+1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* C. USER POSTS */}
                {activeMediaTab === 'posts' && (
                  <div className="space-y-2.5">
                    {postsList.map((post) => (
                      <div key={post.id} className="p-3 bg-[#0D0D0D] border border-white/5 rounded-2xl">
                        <p className="text-[10px] text-slate-100 font-medium leading-relaxed">{post.content}</p>
                        <div className="flex justify-between items-center mt-3 text-[8.5px] text-slate-500 font-bold">
                          <span>{post.date}</span>
                          <div className="flex gap-3">
                            <span>❤️ {post.likes} Likes</span>
                            <span>💬 {post.comments} Comments</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* D. USER REELS */}
                {activeMediaTab === 'reels' && (
                  <div className="grid grid-cols-2 gap-3">
                    {reelsList.map((reel) => (
                      <div key={reel.id} className="bg-[#0D0D0D] rounded-2xl border border-white/10 overflow-hidden relative aspect-[9/16] max-h-56">
                        <img src={reel.thumbnail} className="w-full h-full object-cover filter brightness-90" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-center text-white text-[9px] font-bold">
                          <div className="flex items-center gap-0.5">
                            <Play className="w-3 h-3 fill-white stroke-none" />
                            <span>{reel.views}</span>
                          </div>
                          <span>❤️ {reel.likes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. FIXED BOTTOM INTERACTIVE ACTION BUTTONS */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-white/10 p-3 flex gap-2 z-40 pb-5 select-none">
        
        {/* Blocked state verification checks */}
        {isBlocked ? (
          <div className="w-full flex items-center justify-between bg-rose-950/20 border border-rose-500/20 rounded-2xl p-2 px-3">
            <span className="text-[10px] text-rose-300 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> You blocked this user
            </span>
            <button 
              onClick={handleBlockToggle}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
            >
              Unblock
            </button>
          </div>
        ) : (
          <div className="flex w-full gap-2 items-center">
            
            {/* Follow / Following Toggle CTA */}
            <button 
              onClick={handleFollowToggle}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                isFollowing 
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-103 active:scale-95 text-white'
              }`}
            >
              {isFollowing ? '✓ Following' : '➕ Follow'}
            </button>

            {/* Direct Send Message DM */}
            <button 
              onClick={() => onSendMessage(creator.id)}
              className="p-2.5 bg-[#090909] hover:bg-white/5 text-pink-400 border border-white/10 rounded-xl transition active:scale-95"
              title="Send Direct Message"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* Virtual Gift Button */}
            <button 
              onClick={() => setShowGiftDrawer(true)}
              className="p-2.5 bg-[#090909] hover:bg-white/5 text-yellow-400 border border-white/10 rounded-xl transition active:scale-95"
              title="Send Gift"
            >
              <span>🎁</span>
            </button>

            {/* Calling Triggers */}
            <button 
              onClick={() => onStartCall(creator, 'voice')}
              className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition active:scale-95 flex-shrink-0"
              title="1-on-1 Voice Call"
            >
              <Phone className="w-4 h-4" />
            </button>

            <button 
              onClick={() => onStartCall(creator, 'video')}
              className="p-2.5 bg-gradient-to-r from-[#FF007A] to-[#8E2DE2] text-white rounded-xl transition active:scale-95 flex-shrink-0"
              title="1-on-1 Video Call"
            >
              <Video className="w-4 h-4" />
            </button>

            {/* Block CTA */}
            <button 
              onClick={handleBlockToggle}
              className="p-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition active:scale-95 border border-red-500/15"
              title="Block User"
            >
              <Ban className="w-4 h-4" />
            </button>

          </div>
        )}
      </div>

      {/* 4. FLOATING DIRECT GIFT SELECTOR SHEET */}
      <AnimatePresence>
        {showGiftDrawer && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-end justify-center">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#0D0D0D] border-t border-white/10 rounded-t-3xl w-full p-5 max-h-[380px] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
                <span className="text-[9.5px] uppercase font-black text-yellow-400 tracking-wider">
                  🎁 Select Gift for {creator.name}
                </span>
                <button 
                  onClick={() => setShowGiftDrawer(false)}
                  className="p-1 hover:bg-white/15 rounded-full text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center mb-4">
                {GIFTS.map((gift) => (
                  <button 
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    className="p-2 bg-white/5 rounded-2xl border border-white/5 hover:border-pink-500/50 transition active:scale-95"
                  >
                    <span className="text-2xl block">{gift.icon}</span>
                    <span className="text-[8px] text-slate-300 block mt-1 truncate">{gift.name}</span>
                    <span className="text-[7.5px] font-mono text-yellow-400 font-bold block mt-0.5">🪙 {gift.coinValue}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
