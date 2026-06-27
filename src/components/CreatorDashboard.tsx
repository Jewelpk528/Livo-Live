/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, PhoneCall, Gift as GiftIcon, ArrowUpRight, Clock, Landmark, Users, PlusCircle,
  Flame, Star, Sparkles, Calendar, Coins, Music, Image as ImageIcon, Plus, Trash2, Play, Pause, Square
} from 'lucide-react';
import { UserProfile, CreatorStats, WithdrawalRequest, LiveRoom, RoomImage, BackgroundMusicState } from '../types';
import { uploadRoomFile, saveRoomImages, saveRoomMusic } from '../lib/firebaseService';

interface CreatorDashboardProps {
  creators: UserProfile[];
  stats: CreatorStats[];
  withdrawals: WithdrawalRequest[];
  onSubmitWithdrawal: (creatorId: string, coins: number, method: 'bKash' | 'Nagad' | 'Bank Account', accountDetails: string) => void;
  rooms?: LiveRoom[];
}

export default function CreatorDashboard({ creators, stats, withdrawals, onSubmitWithdrawal, rooms }: CreatorDashboardProps) {
  const [activeCreatorIdx, setActiveCreatorIdx] = useState(0);
  const [withdrawalCoins, setWithdrawalCoins] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bKash' | 'Nagad' | 'Bank Account'>('bKash');
  const [accountDetails, setAccountDetails] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const currentCreator = creators[activeCreatorIdx];

  const handleDashboardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, roomId: string, existingImages: RoomImage[]) => {
    const files = e.target.files;
    if (!files) return;

    if (existingImages.length + files.length > 10) {
      alert("Maximum 10 images are allowed.");
      return;
    }

    setIsUploadingMedia(true);
    const updatedImages = [...existingImages];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageUrl = await uploadRoomFile(roomId, file, 'images');
        updatedImages.push({ imageUrl, uploadedAt: new Date().toISOString() });
      }

      await saveRoomImages(roomId, updatedImages);
      alert("🎉 Stream gallery updated successfully!");
    } catch (err: any) {
      console.error("Dashboard Image upload failed:", err);
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleDashboardDeleteImage = async (roomId: string, existingImages: RoomImage[], indexToDelete: number) => {
    const updatedImages = existingImages.filter((_, idx) => idx !== indexToDelete);
    await saveRoomImages(roomId, updatedImages);
  };

  const handleDashboardMoveImage = async (roomId: string, existingImages: RoomImage[], index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= existingImages.length) return;
    
    const updatedImages = [...existingImages];
    const temp = updatedImages[index];
    updatedImages[index] = updatedImages[targetIndex];
    updatedImages[targetIndex] = temp;

    await saveRoomImages(roomId, updatedImages);
  };

  const handleDashboardMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>, roomId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      alert("Only MP3 audio files are supported.");
      return;
    }

    setIsUploadingMedia(true);
    try {
      const audioUrl = await uploadRoomFile(roomId, file, 'music');
      
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', async () => {
        const newMusicState: BackgroundMusicState = {
          fileName: file.name,
          audioUrl,
          isPlaying: false,
          loop: true,
          duration: Math.round(audio.duration || 0)
        };
        await saveRoomMusic(roomId, newMusicState);
        alert("🎉 Background music MP3 uploaded! It is now ready for your stream.");
        setIsUploadingMedia(false);
      });
    } catch (err: any) {
      console.error("Error uploading audio in dashboard:", err);
      alert(`Audio upload failed: ${err.message || err}`);
      setIsUploadingMedia(false);
    }
  };
  const creatorStat = stats.find(s => s.creatorId === currentCreator.id) || {
    creatorId: currentCreator.id,
    totalEarningsCoins: 0,
    liveEarningsCoins: 0,
    callEarningsCoins: 0,
    giftEarningsCoins: 0,
    privateLiveEarningsCoins: 0,
    premiumContentEarningsCoins: 0,
    dailyEarningsCoins: 0,
    weeklyEarningsCoins: 0,
    monthlyEarningsCoins: 0,
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

      {/* 3. WITHDRAWABLE BALANCE ACCENT BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-green-950/20 to-slate-950 border border-green-500/20 p-4 rounded-3xl mb-6 flex justify-between items-center text-left">
        <div>
          <span className="text-green-400 text-[8px] uppercase tracking-widest font-black flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" /> Available Payout Balance
          </span>
          <h4 className="text-white text-2xl font-black font-mono tracking-wide mt-1.5">
            🪙 {availableCoins.toLocaleString()}
          </h4>
          <span className="text-slate-400 text-[8px] block mt-1 uppercase font-bold">
            excluding pending withdrawal amount: {creatorStat.pendingWithdrawalsCoins}
          </span>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-2xl">
          <Coins className="w-6 h-6 text-green-400" />
        </div>
      </div>

      {/* 4. TIMEFRAME EARNINGS BENTO GRID */}
      <h3 className="text-white text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
        <TrendingUp className="w-4 h-4 text-pink-500" />
        <span>Earnings Over Time</span>
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        
        {/* Daily Earnings */}
        <div className="bg-[#0D0D0D] p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between text-left">
          <div>
            <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#FF007A]" /> Daily Earnings
            </span>
            <h4 className="text-white text-base font-black font-mono mt-2">
              🪙 {creatorStat.dailyEarningsCoins.toLocaleString()}
            </h4>
          </div>
          <span className="text-slate-500 text-[7.5px] font-bold uppercase mt-1">Today</span>
        </div>

        {/* Weekly Earnings */}
        <div className="bg-[#0D0D0D] p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between text-left">
          <div>
            <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" /> Weekly Earnings
            </span>
            <h4 className="text-white text-base font-black font-mono mt-2">
              🪙 {creatorStat.weeklyEarningsCoins.toLocaleString()}
            </h4>
          </div>
          <span className="text-slate-500 text-[7.5px] font-bold uppercase mt-1">Last 7 Days</span>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-[#0D0D0D] p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between text-left">
          <div>
            <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-400" /> Monthly Earnings
            </span>
            <h4 className="text-white text-base font-black font-mono mt-2">
              🪙 {creatorStat.monthlyEarningsCoins.toLocaleString()}
            </h4>
          </div>
          <span className="text-slate-500 text-[7.5px] font-bold uppercase mt-1">Current Month</span>
        </div>

        {/* Total Earnings */}
        <div className="bg-[#0D0D0D] p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between text-left">
          <div>
            <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" /> Total Earnings
            </span>
            <h4 className="text-white text-base font-black font-mono mt-2">
              🪙 {creatorStat.totalEarningsCoins.toLocaleString()}
            </h4>
          </div>
          <span className="text-slate-500 text-[7.5px] font-bold uppercase mt-1">Gross Lifetime</span>
        </div>

      </div>

      {/* 5. DETAILED EARNINGS SOURCES CHANNELS */}
      <h3 className="text-white text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>Earning Streams Breakdown</span>
      </h3>
      
      <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-3xl mb-6 text-left flex flex-col gap-4">
        
        {/* Stream 1: Live Gifts */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
            <span className="text-pink-400 flex items-center gap-1">
              <GiftIcon className="w-3.5 h-3.5" /> Live Gifts
            </span>
            <span className="text-white font-mono">
              🪙 {creatorStat.giftEarningsCoins.toLocaleString()}{" "}
              <span className="text-slate-500 text-[8.5px]">({Math.round((creatorStat.giftEarningsCoins / (creatorStat.totalEarningsCoins || 1)) * 100)}%)</span>
            </span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, Math.round((creatorStat.giftEarningsCoins / (creatorStat.totalEarningsCoins || 1)) * 100))}%` }} 
              className="bg-gradient-to-r from-pink-500 to-pink-600 h-full rounded-full" 
            />
          </div>
        </div>

        {/* Stream 2: Calls */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
            <span className="text-indigo-400 flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" /> Direct Calls (Video/Voice)
            </span>
            <span className="text-white font-mono">
              🪙 {creatorStat.callEarningsCoins.toLocaleString()}{" "}
              <span className="text-slate-500 text-[8.5px]">({Math.round((creatorStat.callEarningsCoins / (creatorStat.totalEarningsCoins || 1)) * 100)}%)</span>
            </span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, Math.round((creatorStat.callEarningsCoins / (creatorStat.totalEarningsCoins || 1)) * 100))}%` }} 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full" 
            />
          </div>
        </div>

        {/* Stream 3: Private Live */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
            <span className="text-amber-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> 1-on-1 Private Live Streams
            </span>
            <span className="text-white font-mono">
              🪙 {creatorStat.privateLiveEarningsCoins.toLocaleString()}{" "}
              <span className="text-slate-500 text-[8.5px]">({Math.round((creatorStat.privateLiveEarningsCoins / (creatorStat.totalEarningsCoins || 1)) * 100)}%)</span>
            </span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, Math.round((creatorStat.privateLiveEarningsCoins / (creatorStat.totalEarningsCoins || 1)) * 100))}%` }} 
              className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full" 
            />
          </div>
        </div>

        {/* Stream 4: Premium Content */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
            <span className="text-violet-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5" /> Premium Content Albums
            </span>
            <span className="text-white font-mono">
              🪙 {creatorStat.premiumContentEarningsCoins.toLocaleString()}{" "}
              <span className="text-slate-500 text-[8.5px]">({Math.round((creatorStat.premiumContentEarningsCoins / (creatorStat.totalEarningsCoins || 1)) * 100)}%)</span>
            </span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, Math.round((creatorStat.premiumContentEarningsCoins / (creatorStat.totalEarningsCoins || 1)) * 100))}%` }} 
              className="bg-gradient-to-r from-violet-500 to-purple-600 h-full rounded-full" 
            />
          </div>
        </div>

      </div>

      {/* 4.5 LIVE STREAM MEDIA ASSETS PANEL (Moved from Live Room Settings) */}
      <h3 className="text-white text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
        <Music className="w-4 h-4 text-pink-500" />
        <span>Live Stream Assets</span>
      </h3>

      {(() => {
        const myRoom = rooms?.find(r => r.creatorId === currentCreator.id);
        if (!myRoom) {
          return (
            <div className="bg-[#0D0D0D] border border-white/10 border-dashed rounded-3xl p-6 text-center mb-6 text-left">
              <p className="text-slate-400 text-xs font-bold mb-2">No Active Live Stream Room Found</p>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Start a live stream room from the Home Screen first to configure and manage its background music and horizontal gallery images right here in Creator Studio!
              </p>
            </div>
          );
        }

        const roomImages = myRoom.images || [];
        const roomMusic = myRoom.backgroundMusic || null;

        return (
          <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-3xl mb-6 text-left flex flex-col gap-5">
            
            {/* Gallery Section */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-pink-500" /> Room Gallery Images ({roomImages.length}/10)
                </span>
                <span className="text-[8px] text-slate-500">JPG, JPEG, PNG</span>
              </div>

              <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-pink-500/50 hover:bg-white/5 py-4 rounded-xl cursor-pointer transition text-xs font-bold text-slate-300">
                <Plus className="w-4 h-4 text-pink-500" />
                <span>{isUploadingMedia ? "Uploading..." : "Upload Images"}</span>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  multiple 
                  disabled={isUploadingMedia}
                  onChange={(e) => handleDashboardImageUpload(e, myRoom.id, roomImages)} 
                  className="hidden" 
                />
              </label>

              {roomImages.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto py-2 scrollbar-none">
                  {roomImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/15 flex-shrink-0 group">
                      <img src={img.imageUrl} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-1">
                        <button 
                          onClick={() => handleDashboardDeleteImage(myRoom.id, roomImages, idx)}
                          className="self-end bg-red-600/90 p-1 rounded-full text-white hover:bg-red-700 shadow"
                          title="Delete"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                        <div className="flex justify-between w-full">
                          <button 
                            onClick={() => handleDashboardMoveImage(myRoom.id, roomImages, idx, 'left')}
                            disabled={idx === 0}
                            className="bg-black/80 hover:bg-pink-500 disabled:opacity-20 text-white rounded px-1 text-[8px]"
                            title="Move Left"
                          >
                            ◀
                          </button>
                          <button 
                            onClick={() => handleDashboardMoveImage(myRoom.id, roomImages, idx, 'right')}
                            disabled={idx === roomImages.length - 1}
                            className="bg-black/80 hover:bg-pink-500 disabled:opacity-20 text-white rounded px-1 text-[8px]"
                            title="Move Right"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] text-slate-500">No images added yet. Upload images to show in your stream's active gallery.</p>
              )}
            </div>

            {/* Music Section */}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
              <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-pink-500" /> Default Background Music
              </span>

              {roomMusic ? (
                <div className="bg-slate-950 p-3 rounded-2xl border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                      <Music className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <h4 className="text-white text-[11px] font-bold truncate">{roomMusic.fileName}</h4>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Duration: {Math.floor(roomMusic.duration / 60)}:{(roomMusic.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2.5 pt-1">
                    <button 
                      onClick={async () => {
                        const updated = { ...roomMusic, isPlaying: !roomMusic.isPlaying };
                        await saveRoomMusic(myRoom.id, updated);
                      }}
                      className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                    >
                      {roomMusic.isPlaying ? "Pause on Stream" : "Play on Stream"}
                    </button>

                    <button 
                      onClick={async () => {
                        const updated = { ...roomMusic, loop: !roomMusic.loop };
                        await saveRoomMusic(myRoom.id, updated);
                      }}
                      className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition ${
                        roomMusic.loop 
                          ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
                          : 'bg-slate-900 border-white/10 text-slate-400'
                      }`}
                    >
                      🔁 Loop: {roomMusic.loop ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-slate-950/40 rounded-2xl border border-white/5 text-[10px] text-slate-500 font-bold">
                  No background music selected. Upload an MP3 to start.
                </div>
              )}

              {/* Upload New MP3 input button */}
              <label className="flex items-center justify-center gap-1.5 border border-dashed border-white/15 hover:border-pink-500/50 hover:bg-white/5 py-2.5 rounded-xl cursor-pointer transition text-[10.5px] font-black uppercase tracking-wider text-slate-300 mt-2">
                <Music className="w-3.5 h-3.5 text-pink-500" />
                <span>{isUploadingMedia ? "Uploading MP3..." : "Upload MP3 Music"}</span>
                <input 
                  type="file" 
                  accept="audio/mp3" 
                  disabled={isUploadingMedia}
                  onChange={(e) => handleDashboardMusicUpload(e, myRoom.id)} 
                  className="hidden" 
                />
              </label>

              {roomMusic && (
                <button 
                  onClick={async () => await saveRoomMusic(myRoom.id, null)}
                  className="w-full mt-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-[10px] font-bold rounded-xl transition flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Background Music
                </button>
              )}
            </div>

          </div>
        );
      })()}

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
