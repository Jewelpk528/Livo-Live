/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PhoneOff, Phone, Mic, MicOff, Video, VideoOff, Volume2, Camera, Star, AlertTriangle, ShieldCheck, Play, Pause, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, CallSession } from '../types';

interface CallingViewProps {
  creator: UserProfile;
  user: UserProfile;
  callType: 'voice' | 'video';
  onClose: (durationSeconds: number, accumulatedCost: number, rating?: number) => void;
  onDeductCoins: (coins: number, type: 'gift_sent' | 'call_made', description: string, callback?: () => void) => void;
}

export default function CallingView({ creator, user, callType, onClose, onDeductCoins }: CallingViewProps) {
  const [callState, setCallState] = useState<'dialing' | 'ringing' | 'connected' | 'rating'>('dialing');
  const [duration, setDuration] = useState(0);
  const [accumulatedCost, setAccumulatedCost] = useState(0);
  
  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // Warnings
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);

  // Rating
  const [rating, setRating] = useState(5);

  const ratePerMin = callType === 'video' ? 15 : 5;
  // Deduct coins every 10 seconds for quick visual demonstration in the demo
  // Video: 2.5 coins per 10s (equivalent to 15 coins/min)
  // Voice: 0.83 coins per 10s (equivalent to 5 coins/min)
  const coinsDeductionStep = callType === 'video' ? 3 : 1; 
  const timeStepSeconds = 12; // Deduct step coins every 12 seconds, which fits exactly 15 or 5 per minute!

  // Call connection sequences
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (callState === 'dialing') {
      timeout = setTimeout(() => {
        setCallState('ringing');
      }, 2000);
    } else if (callState === 'ringing') {
      timeout = setTimeout(() => {
        setCallState('connected');
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [callState]);

  // Call timer and automatic coin deductions
  useEffect(() => {
    if (callState !== 'connected') return;

    const timer = setInterval(() => {
      setDuration(prev => {
        const nextTime = prev + 1;
        
        // Auto coin deduction check every 12 seconds
        if (nextTime % timeStepSeconds === 0) {
          // Check if balance is sufficient
          if (user.coins < coinsDeductionStep) {
            clearInterval(timer);
            setCallState('rating'); // force end call to rating
            return prev;
          }

          // Trigger coin deduction on backend/parent
          onDeductCoins(
            coinsDeductionStep, 
            'call_made', 
            `Call duration: ${Math.floor(nextTime / 60)}m ${nextTime % 60}s with ${creator.name}`,
            () => {
              setAccumulatedCost(prevCost => prevCost + coinsDeductionStep);
            }
          );
        }

        // Low balance warning (less than 2 step iterations left)
        if (user.coins <= coinsDeductionStep * 2) {
          setShowLowBalanceWarning(true);
        } else {
          setShowLowBalanceWarning(false);
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [callState, user.coins, coinsDeductionStep, creator.name, onDeductCoins]);

  // Handle Terminating / Ending Call
  const handleEndCall = () => {
    if (callState === 'connected') {
      setCallState('rating');
    } else {
      onClose(0, 0);
    }
  };

  // Submit Call Rating
  const handleSubmitRating = () => {
    onClose(duration, accumulatedCost, rating);
  };

  // Format Duration string
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#090909] text-white flex flex-col justify-between p-6 select-none overflow-hidden">
      
      {/* Dynamic Background Image / Looping Video Frame */}
      {callState !== 'rating' && (
        <div className="absolute inset-0 z-0">
          <img 
            src={creator.avatar} 
            className="w-full h-full object-cover filter blur-[3px] brightness-50" 
            alt="" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        </div>
      )}

      {/* 1. DIALING SCREEN */}
      {callState === 'dialing' && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
          <motion.div 
            animate={{ scale: [1, 1.08, 1] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="relative"
          >
            <img src={creator.avatar} className="w-28 h-28 rounded-full border-4 border-[#FF007A] object-cover shadow-2xl" alt="" />
            <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-[#090909] animate-ping" />
          </motion.div>
          <h2 className="text-xl font-bold mt-4">{creator.name}</h2>
          <p className="text-slate-300 text-xs mt-1 uppercase tracking-widest font-semibold">Dialing secure stream...</p>
        </div>
      )}

      {/* 2. RINGING SCREEN */}
      {callState === 'ringing' && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="absolute inset-[-12px] rounded-full border-2 border-[#FF007A]/30"
            />
            <img src={creator.avatar} className="w-28 h-28 rounded-full border-4 border-[#FF007A] object-cover shadow-2xl" alt="" />
          </div>
          <h2 className="text-xl font-bold mt-4">{creator.name}</h2>
          <p className="text-slate-300 text-xs mt-1 uppercase tracking-widest font-semibold animate-pulse text-[#FF007A]">Ringing host...</p>
        </div>
      )}

      {/* 3. CONNECTED STATE (Active Call) */}
      {callState === 'connected' && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
          
          {/* Active Live Video Feed Frame */}
          {callType === 'video' && isVideoOn && (
            <div className="absolute inset-0 z-0 bg-[#090909]">
              {/* Creator looping screen simulator */}
              <img src={creator.coverPhoto} className="w-full h-full object-cover filter saturate-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
            </div>
          )}

          {/* Connected Call Header */}
          <div className="relative z-10 flex justify-between items-start mt-4">
            <div className="bg-[#0D0D0D]/40 backdrop-blur-md p-1.5 px-3 rounded-full border border-white/10 flex items-center gap-2">
              <img src={creator.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
              <div>
                <h3 className="text-white text-[11px] font-bold leading-none">{creator.name}</h3>
                <span className="text-[8px] text-[#FF007A] font-medium">Approved Creator</span>
              </div>
            </div>

            {/* Timer, Recording Status, Charging Info */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="bg-[#0D0D0D]/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="font-mono text-xs font-bold">{formatTime(duration)}</span>
              </div>
              <div className="bg-[#FF007A]/20 backdrop-blur-md px-2.5 py-0.5 rounded text-[8px] text-[#FF007A] border border-[#FF007A]/20">
                Rate: {ratePerMin} Coins/min
              </div>
              {isRecording && (
                <div className="bg-red-500 text-white text-[7px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <Square className="w-2 h-2 fill-white" /> REC
                </div>
              )}
            </div>
          </div>

          {/* Floating Self-Camera View in Bottom Corner */}
          {callType === 'video' && (
            <div className="absolute bottom-28 right-6 w-24 h-32 bg-[#0D0D0D] rounded-xl border-2 border-white/20 shadow-2xl overflow-hidden z-20 flex flex-col justify-between p-1.5">
              {isVideoOn ? (
                <img src={user.avatar} className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
              ) : (
                <div className="absolute inset-0 bg-[#090909] flex items-center justify-center z-0">
                  <VideoOff className="w-5 h-5 text-slate-600" />
                </div>
              )}
              <span className="relative z-10 text-[7px] bg-black/40 px-1 py-0.5 rounded text-white w-fit font-bold">You</span>
            </div>
          )}

          {/* DYNAMIC LOW BALANCE WARNING BEEP */}
          <AnimatePresence>
            {showLowBalanceWarning && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-24 left-6 right-6 z-30 bg-red-600/90 backdrop-blur border border-red-500 text-white rounded-xl p-3 shadow-lg flex items-center gap-2.5 animate-bounce"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">⚠️ COIN BALANCE RUNNING OUT</h4>
                  <p className="text-[8px] text-white/95 mt-0.5">Call will automatically terminate when coins are fully consumed.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Coins Deducted Display */}
          <div className="absolute bottom-24 left-6 z-10 flex flex-col bg-[#0D0D0D]/40 px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[8px] uppercase tracking-widest text-slate-300 font-semibold">Spent this session</span>
            <span className="text-yellow-400 font-bold font-mono text-sm">🪙 {accumulatedCost} Coins</span>
          </div>

          {/* Calling Action Controls bottom overlay */}
          <div className="relative z-10 flex justify-center items-center gap-4 mb-2">
            {/* 1. Mute Mic */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full shadow-lg border transition ${
                isMuted 
                  ? 'bg-red-500/25 border-red-500/30 text-red-500' 
                  : 'bg-black/50 border-white/10 text-white hover:bg-black/60'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* 2. Call Record toggler */}
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`p-3 rounded-full shadow-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                isRecording 
                  ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                  : 'bg-black/50 border-white/10 text-slate-300 hover:bg-black/60'
              }`}
            >
              {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Camera className="w-4 h-4" />}
              <span className="text-[9px] uppercase tracking-wider">{isRecording ? 'Stop Rec' : 'Record'}</span>
            </button>

            {/* 3. Mute/Unmute Video if type is video */}
            {callType === 'video' && (
              <button 
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3.5 rounded-full shadow-lg border transition ${
                  !isVideoOn 
                    ? 'bg-red-500/25 border-red-500/30 text-red-500' 
                    : 'bg-black/50 border-white/10 text-white hover:bg-black/60'
                }`}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            {/* 4. Disconnect phone btn */}
            <button 
              onClick={handleEndCall}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-xl hover:scale-105 active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>

          {/* Secure encryption tag */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/20 p-1 px-3 rounded-full text-slate-400 text-[8px]">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>End-to-End Encrypted HD Connection</span>
          </div>

         </div>
       )}
 
       {/* 4. RATING SCREEN (Post Call review screen) */}
       {callState === 'rating' && (
         <div className="relative z-10 flex flex-col justify-center items-center flex-grow p-4">
           <div className="bg-[#0D0D0D] border border-white/10 p-6 rounded-3xl w-full max-w-[280px] text-center shadow-2xl">
             <img src={creator.avatar} className="w-20 h-20 rounded-full border-2 border-[#FF007A] mx-auto object-cover" alt="" />
             <h2 className="text-md font-bold mt-3">Rate your call with {creator.name}</h2>
             <p className="text-[10px] text-slate-400 mt-1">Duration: {formatTime(duration)} | Spent: 🪙 {accumulatedCost}</p>
             
             {/* Stars selection bar */}
             <div className="flex justify-center gap-1.5 my-5">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button 
                   key={star} 
                   onClick={() => setRating(star)}
                   className="transition active:scale-75"
                 >
                   <Star className={`w-7 h-7 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                 </button>
               ))}
             </div>
 
             <button 
               onClick={handleSubmitRating}
               className="w-full py-2 bg-gradient-to-r from-[#FF007A] to-[#8E2DE2] text-white font-bold rounded-xl text-xs hover:scale-105 transition active:scale-95 shadow-md"
             >
               Submit Rating & Exit
             </button>
           </div>
         </div>
       )}

    </div>
  );
}
