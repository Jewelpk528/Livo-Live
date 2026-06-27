/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, TrendingUp, Award, Flame, Star, Compass, Play, Users, Sparkles
} from 'lucide-react';
import { UserProfile, LiveRoom } from '../types';

interface ExploreViewProps {
  creators: UserProfile[];
  rooms: LiveRoom[];
  onSelectCreator: (creator: UserProfile) => void;
  onJoinRoom: (room: LiveRoom) => void;
}

const TOP_GIFTERS_MOCK = {
  daily: [
    { name: 'Gifter_Boss 👑', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100', level: 45, spentCoins: 28400 },
    { name: 'Jewel Gifter (You) 🇧🇩', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100', level: 12, spentCoins: 15500 },
    { name: 'Tina_Pro 💎', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100&h=100', level: 21, spentCoins: 9200 }
  ],
  weekly: [
    { name: 'Sheikh_Raj 🇧🇩', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100', level: 52, spentCoins: 184500 },
    { name: 'Gifter_Boss 👑', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100', level: 45, spentCoins: 92000 },
    { name: 'Bigo_Lord 🇺🇸', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', level: 48, spentCoins: 85000 }
  ],
  monthly: [
    { name: 'Diamond_King 🏆', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100&h=100', level: 60, spentCoins: 754000 },
    { name: 'Sheikh_Raj 🇧🇩', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100', level: 52, spentCoins: 612000 },
    { name: 'Bigo_Lord 🇺🇸', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', level: 48, spentCoins: 485000 }
  ]
};

export default function ExploreView({ creators, rooms, onSelectCreator, onJoinRoom }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rankingPeriod, setRankingPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Filter creators based on search query
  const filteredCreators = creators.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.uid.includes(searchQuery)
  );

  return (
    <div className="w-full h-full bg-[#090909] flex flex-col p-4 overflow-y-auto scrollbar-none pb-20">
      
      {/* 1. COMPASS SEARCH BAR */}
      <div className="relative mb-5 flex items-center bg-[#0D0D0D] border border-white/10 rounded-full px-3.5 py-1.5 focus-within:border-[#FF007A]/30 transition">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search creators by UID, name, or country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-white outline-none border-none text-[11px] placeholder-slate-400 w-full"
        />
        <Compass className="w-4 h-4 text-[#FF007A] ml-1.5" />
      </div>

      {/* 2. DYNAMIC SLIDING BANNER */}
      <div className="bg-gradient-to-r from-[#8E2DE2]/30 to-[#0D0D0D] rounded-3xl p-4 border border-[#8E2DE2]/20 mb-6 flex items-center justify-between">
        <div className="max-w-[70%]">
          <span className="text-[#FFD700] text-[8px] tracking-widest font-extrabold uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-300" /> Weekly Campaign
          </span>
          <h3 className="text-white text-xs font-black uppercase mt-1 leading-snug">Livo Golden Star Gifter Battle</h3>
          <p className="text-slate-400 text-[9px] mt-1 leading-relaxed">Top 3 Gifters earn rare Profile Entrance effects!</p>
        </div>
        <div className="text-3xl animate-bounce">🏆</div>
      </div>

      {/* 3. ACTIVE LIVE ROOMS GRID */}
      {searchQuery === '' && (
        <>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
              <span>Hot Live Streaming Rooms</span>
            </h3>
            <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider">HD Live</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-6">
            {rooms.length === 0 ? (
              <div className="col-span-2 bg-[#0D0D0D] p-6 rounded-2xl text-center border border-white/10">
                <p className="text-slate-400 text-[10px]">No host currently broadcasting live.</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div 
                  key={room.id}
                  onClick={() => onJoinRoom(room)}
                  className="bg-[#0D0D0D] rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer hover:border-[#FF007A]/20 active:scale-95 transition"
                >
                  <img src={room.coverImage} className="w-full h-32 object-cover filter brightness-90 group-hover:scale-105 transition duration-350" alt="" />
                  
                  {/* Absolute Stream Badges */}
                  <div className="absolute top-2 left-2 bg-pink-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    <span>Live</span>
                  </div>

                  <div className="absolute top-2 right-2 bg-black/45 backdrop-blur px-2 py-0.5 rounded-full text-[8px] text-slate-200 flex items-center gap-1 font-mono">
                    <Users className="w-2.5 h-2.5" /> {room.viewerCount.toLocaleString()}
                  </div>

                  {/* Room metadata overlay */}
                  <div className="p-2.5">
                    <h4 className="text-white text-[11px] font-bold leading-tight truncate">{room.creatorName}</h4>
                    <p className="text-[9px] text-slate-400 mt-1 flex items-center justify-between">
                      <span className="truncate">{room.tags[0] || 'Chitchat'}</span>
                      <span className="text-pink-400 font-bold">{room.creatorCountry}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* 4. CREATOR EXPLORER GRID */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-pink-500" />
          <span>Approved Female Creator Stars</span>
        </h3>
        <span className="text-[9px] text-slate-500 font-bold font-mono">Total {filteredCreators.length}</span>
      </div>

      <div className="flex flex-col gap-2.5 mb-6">
        {filteredCreators.length === 0 ? (
          <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-[10px]">No creators match "{searchQuery}"</p>
          </div>
        ) : (
          filteredCreators.map((creator) => (
            <div 
              key={creator.id}
              onClick={() => onSelectCreator(creator)}
              className="bg-[#0D0D0D]/40 hover:bg-[#0D0D0D] p-3 rounded-2xl border border-white/10 flex justify-between items-center cursor-pointer transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <img src={creator.avatar} className="w-10 h-10 rounded-full border border-[#FF007A] object-cover" alt="" />
                <div>
                  <h4 className="text-white text-[11px] font-black flex items-center gap-1">
                    <span>{creator.name}</span>
                    <span className="text-[8px] bg-[#FF007A]/15 text-[#FF007A] border border-[#FF007A]/25 px-1 rounded font-bold">Lv.{creator.level}</span>
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>{creator.country}</span>
                    <span>•</span>
                    <span>{creator.age} yrs</span>
                  </p>
                  <p className="text-[8px] text-pink-400 font-bold font-mono mt-1 flex items-center gap-1 bg-[#FF007A]/10 border border-[#FF007A]/15 rounded-md px-1.5 py-0.5 w-fit">
                    <span>📞 {creator.voiceCallRate ?? 1} / min</span>
                    <span>•</span>
                    <span>📹 {creator.videoCallRate ?? 5} / min</span>
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] text-slate-300 font-semibold">{creator.followersCount.toLocaleString()} followers</span>
                <span className="text-[8px] bg-[#FF007A]/20 text-[#FF007A] border border-[#FF007A]/15 rounded px-1.5 py-0.5 mt-1.5 font-bold uppercase tracking-wider">
                  Call & Stream
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. LEADERBOARD / RANKING CHARTS PANEL */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3.5">
          <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
            <span>Top Gifters Leaderboard</span>
          </h3>
          
          <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button 
                key={period}
                onClick={() => setRankingPeriod(period)}
                className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded-md transition ${
                  rankingPeriod === period 
                    ? 'bg-[#FF007A] text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Board List */}
        <div className="flex flex-col gap-3">
          {TOP_GIFTERS_MOCK[rankingPeriod].map((gif, idx) => (
            <div 
              key={gif.name}
              className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-3">
                {/* Ranking number badge */}
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  idx === 0 
                    ? 'bg-[#FFD700] text-black font-bold' 
                    : idx === 1 
                      ? 'bg-slate-300 text-slate-900' 
                      : 'bg-amber-600 text-white'
                }`}>
                  {idx + 1}
                </span>

                <img src={gif.avatar} className="w-7 h-7 rounded-full object-cover border border-white/10" alt="" />
                <div>
                  <h4 className="text-white text-[10px] font-bold leading-none">{gif.name}</h4>
                  <span className="text-[8px] text-slate-400 mt-1 inline-block">Lv.{gif.level} Noble member</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[#FFD700] font-mono text-[10px] font-bold">🪙 {gif.spentCoins.toLocaleString()}</span>
                <p className="text-[7px] uppercase text-slate-500 tracking-widest font-black mt-0.5">contributed</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
