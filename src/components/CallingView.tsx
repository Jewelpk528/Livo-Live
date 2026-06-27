/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, Phone, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Camera, Star, AlertTriangle, ShieldCheck, Play, Pause, Square, RefreshCw, X, Settings, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, CallHistoryRecord } from '../types';
import { saveCallHistory } from '../lib/firebaseService';

interface CallingViewProps {
  creator: UserProfile;
  user: UserProfile;
  callType: 'voice' | 'video';
  onClose: (durationSeconds: number, accumulatedCost: number, rating?: number) => void;
  onDeductCoins: (coins: number, type: 'gift_sent' | 'call_made', description: string, creatorId?: string, callback?: () => void) => void;
}

export default function CallingView({ creator, user, callType, onClose, onDeductCoins }: CallingViewProps) {
  const [callState, setCallState] = useState<'requesting_permission' | 'dialing' | 'ringing' | 'connected' | 'rating'>('requesting_permission');
  const [duration, setDuration] = useState(0);
  const [accumulatedCost, setAccumulatedCost] = useState(0);
  const [creatorStats, setCreatorStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/init');
        if (res.ok) {
          const data = await res.json();
          const statsList = data.stats || [];
          const matched = statsList.find((s: any) => s.creatorId === creator.id);
          if (matched) {
            setCreatorStats(matched);
          }
        }
      } catch (err) {
        console.error("Error fetching creator stats in CallingView:", err);
      }
    };
    fetchStats();
  }, [creator.id]);
  
  // Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'permanently_denied'>('prompt');
  const [permissionAttempts, setPermissionAttempts] = useState(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showSettingsSimulator, setShowSettingsSimulator] = useState(false);

  // Call session properties
  const callIdRef = useRef<string>(`call_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
  const startedAtRef = useRef<string>('');

  // Audio/video tracks states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // Warnings
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);

  // Rating
  const [rating, setRating] = useState(5);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const ratePerMin = callType === 'video' ? (creator.videoCallRate ?? 5) : (creator.voiceCallRate ?? 1);
  // Deduct coins every 60 seconds (1 minute) as requested.
  const timeStepSeconds = 60; 

  // Cleanup media tracks on unmount or when call ends
  const releaseMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`[CallingView] Stopped track: ${track.kind}`);
      });
      setLocalStream(null);
    }
  };

  useEffect(() => {
    return () => {
      releaseMedia();
    };
  }, [localStream]);

  // Handle Permission Request
  const requestMediaPermissions = async (isRetry = false) => {
    try {
      console.log(`[CallingView] Requesting permissions for callType: ${callType}, facingMode: ${facingMode}`);
      
      const constraints: MediaStreamConstraints = {
        audio: true, // always request mic permission for both voice and video calls
        video: callType === 'video' ? { facingMode: facingMode } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setPermissionStatus('granted');
      setShowPermissionModal(false);
      setShowSettingsSimulator(false);
      
      // Permission granted! Proceed to dialing state
      setCallState('dialing');
    } catch (error: any) {
      console.error('[CallingView] Permission acquisition error:', error);
      setPermissionAttempts(prev => prev + 1);

      // If they deny access, or it has been blocked permanently
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.name === 'SecurityError') {
        if (permissionAttempts >= 1 || isRetry) {
          // If they've denied it more than once, treat as permanently denied
          setPermissionStatus('permanently_denied');
        } else {
          setPermissionStatus('denied');
        }
      } else {
        setPermissionStatus('denied');
      }
      setShowPermissionModal(true);
    }
  };

  // Trigger permission request on mount
  useEffect(() => {
    requestMediaPermissions();
  }, []);

  // Set local video stream srcObject when localStream or localVideoRef changes
  useEffect(() => {
    if (localVideoRef.current && localStream && callType === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, callType]);

  // Handle switching front and back camera
  const handleSwitchCamera = async () => {
    if (callType !== 'video') return;
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);

    if (localStream) {
      // Stop old tracks first
      localStream.getVideoTracks().forEach(track => track.stop());

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: newFacingMode }
        });
        
        // Merge with existing audio track or replace completely
        setLocalStream(newStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
        console.log(`[CallingView] Switched camera to facingMode: ${newFacingMode}`);
      } catch (err) {
        console.error('Failed to switch camera device:', err);
      }
    }
  };

  // Handle toggling microphone mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
  };

  // Handle toggling camera on/off
  const handleToggleCamera = () => {
    const nextVideoOn = !isVideoOn;
    setIsVideoOn(nextVideoOn);
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = nextVideoOn;
      });
    }
  };

  // Call connection sequences (Dialing -> Ringing -> Connected)
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (callState === 'dialing') {
      timeout = setTimeout(() => {
        setCallState('ringing');
      }, 2000);
    } else if (callState === 'ringing') {
      timeout = setTimeout(() => {
        setCallState('connected');
        startedAtRef.current = new Date().toISOString();
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [callState]);

  // Call timer and automatic coin deductions every minute
  useEffect(() => {
    if (callState !== 'connected') return;

    const timer = setInterval(() => {
      setDuration(prev => {
        const nextTime = prev + 1;
        
        // Check low balance warning (less than 2 minutes left)
        if (user.coins < ratePerMin * 2) {
          setShowLowBalanceWarning(true);
        } else {
          setShowLowBalanceWarning(false);
        }

        // Auto coin deduction check every 60 seconds (1 minute)
        if (nextTime % timeStepSeconds === 0) {
          // Check if balance is sufficient for the next minute
          if (user.coins < ratePerMin) {
            clearInterval(timer);
            console.log(`[CallingView] Terminating call due to insufficient coins.`);
            saveAndTerminateCall('completed', nextTime);
            return prev;
          }

          // Trigger coin deduction on backend/parent
          onDeductCoins(
            ratePerMin, 
            'call_made', 
            `Call duration: ${Math.floor(nextTime / 60)}m with ${creator.name}`,
            creator.id,
            () => {
              setAccumulatedCost(prevCost => prevCost + ratePerMin);
            }
          );
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [callState, user.coins, ratePerMin, creator.name, creator.id, onDeductCoins]);

  // Save the record to database and change state to rating
  const saveAndTerminateCall = async (finalStatus: 'completed' | 'missed' | 'cancelled', finalDuration: number) => {
    releaseMedia();
    
    const finalCost = accumulatedCost;
    const startTime = startedAtRef.current || new Date().toISOString();
    const endTime = new Date().toISOString();
    const isCompleted = finalStatus === 'completed';
    const receiverEarned = isCompleted ? Math.floor(finalCost * 0.75) : 0;
    const adminEarned = isCompleted ? Math.floor(finalCost * 0.25) : 0;

    const callRecord: CallHistoryRecord = {
      callId: callIdRef.current,
      callerId: user.uid || 'unregistered_user',
      receiverId: creator.uid || 'unregistered_creator',
      callType: callType,
      startedAt: startTime,
      endedAt: endTime,
      duration: finalDuration,
      coinsCharged: finalCost,
      status: finalStatus,
      receiverEarned,
      adminEarned
    };

    console.log('[CallingView] Saving call record:', callRecord);
    await saveCallHistory(callRecord);

    setCallState('rating');
  };

  // Handle Terminating / Ending Call
  const handleEndCall = () => {
    if (callState === 'connected') {
      saveAndTerminateCall('completed', duration);
    } else if (callState === 'dialing' || callState === 'ringing') {
      saveAndTerminateCall('cancelled', 0);
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
    <div className="absolute inset-0 z-50 bg-[#090909] text-white flex flex-col justify-between p-6 select-none overflow-hidden font-sans">
      
      {/* Background Dim Image */}
      {callState !== 'rating' && (
        <div className="absolute inset-0 z-0">
          <img 
            src={creator.avatar} 
            className="w-full h-full object-cover filter blur-[4px] brightness-[0.3]" 
            alt="" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
        </div>
      )}

      {/* 1. REQUESTING PERMISSIONS SCREEN & FLOATING PREVIEW */}
      {callState === 'requesting_permission' && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="relative"
          >
            <img src={creator.avatar} className="w-24 h-24 rounded-full border-4 border-pink-500 object-cover shadow-2xl" alt="" />
            <div className="absolute -bottom-2 -right-2 bg-pink-500 p-1.5 rounded-full border-2 border-slate-900">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </motion.div>
          <h2 className="text-lg font-black uppercase tracking-wider mt-5 text-center">Secure Stream Setup</h2>
          <p className="text-slate-400 text-xs mt-1 text-center max-w-xs px-4">
            Requesting Camera & Microphone permission to connect a secure HD video link...
          </p>
          <button 
            onClick={() => requestMediaPermissions(true)}
            className="mt-6 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-black uppercase tracking-widest rounded-full transition active:scale-95 shadow-lg flex items-center gap-2"
          >
            <Camera className="w-4 h-4" /> Trigger Permission Setup
          </button>
        </div>
      )}

      {/* 2. DIALING SCREEN with local camera preview if video */}
      {callState === 'dialing' && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
          {/* Local Camera Preview Container during Dialing */}
          {callType === 'video' && localStream && isVideoOn ? (
            <div className="w-44 h-56 bg-slate-950 rounded-2xl border-2 border-pink-500/50 shadow-2xl overflow-hidden relative mb-6">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100" 
              />
              <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-pink-400">
                Local Preview
              </div>
            </div>
          ) : (
            <motion.div 
              animate={{ scale: [1, 1.08, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="relative mb-6"
            >
              <img src={creator.avatar} className="w-28 h-28 rounded-full border-4 border-pink-500 object-cover shadow-2xl" alt="" />
              <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-[#090909] animate-ping" />
            </motion.div>
          )}

          <h2 className="text-xl font-black tracking-tight">{creator.name}</h2>
          <p className="text-[#FF007A] text-[10px] uppercase font-black tracking-widest mt-2 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" /> Setup Dialing Session...
          </p>
        </div>
      )}

      {/* 3. RINGING SCREEN */}
      {callState === 'ringing' && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
          {callType === 'video' && localStream && isVideoOn ? (
            <div className="w-44 h-56 bg-slate-950 rounded-2xl border-2 border-pink-500/50 shadow-2xl overflow-hidden relative mb-6">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100" 
              />
              <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-pink-400">
                Local Preview
              </div>
            </div>
          ) : (
            <div className="relative mb-6">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="absolute inset-[-12px] rounded-full border-2 border-pink-500/30"
              />
              <img src={creator.avatar} className="w-28 h-28 rounded-full border-4 border-pink-500 object-cover shadow-2xl" alt="" />
            </div>
          )}

          <h2 className="text-xl font-black tracking-tight">{creator.name}</h2>
          <p className="text-slate-300 text-[10px] uppercase font-black tracking-widest mt-2 animate-bounce">
            Ringing host...
          </p>
        </div>
      )}

      {/* 4. ACTIVE CONNECTED CALL VIEW */}
      {callState === 'connected' && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
          
          {/* Main Frame (Remote Video Feed Simulator) */}
          {callType === 'video' && (
            <div className="absolute inset-0 z-0 bg-slate-950">
              {isSpeakerOn ? (
                /* Interactive simulated remote camera view using coverPhoto */
                <img src={creator.coverPhoto} className="w-full h-full object-cover filter saturate-110 brightness-75" alt="" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                  <VolumeX className="w-12 h-12 text-slate-600 mb-2 animate-pulse" />
                  <span className="text-xs uppercase font-black tracking-widest">Remote Audio Muted</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
            </div>
          )}

          {/* Connected Call Header */}
          <div className="relative z-10 flex justify-between items-start mt-4">
            <div className="bg-black/55 backdrop-blur-md p-2 px-3.5 rounded-full border border-white/10 flex items-center gap-2">
              <img src={creator.avatar} className="w-7 h-7 rounded-full object-cover border border-pink-500" alt="" />
              <div>
                <h3 className="text-white text-[11px] font-black leading-none">{creator.name}</h3>
                <span className="text-[7.5px] text-[#FF007A] font-black uppercase tracking-wider mt-0.5 block">Approved Host</span>
              </div>
            </div>

            {/* Timer, Coins & Charging Info */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="bg-black/55 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="font-mono text-xs font-black text-pink-400">{formatTime(duration)}</span>
              </div>
              <div className="bg-pink-500/20 backdrop-blur-md px-2.5 py-0.5 rounded text-[8.5px] font-bold text-pink-400 border border-pink-500/30">
                Rate: {ratePerMin} Coins/Min
              </div>
              {isRecording && (
                <div className="bg-red-500 text-white text-[7px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <Square className="w-2 h-2 fill-white" /> REC
                </div>
              )}
            </div>
          </div>

          {/* Floating Local Camera Preview (Bottom Corner) */}
          {callType === 'video' && (
            <div className="absolute bottom-28 right-6 w-24 h-36 bg-slate-950 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-20 flex flex-col justify-between p-1">
              {isVideoOn && localStream ? (
                <div className="absolute inset-0 z-0">
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform -scale-x-100" 
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-0">
                  <VideoOff className="w-5 h-5 text-slate-600" />
                </div>
              )}
              <span className="relative z-10 text-[7px] bg-black/60 px-1.5 py-0.5 rounded text-white w-fit font-bold uppercase tracking-widest">You</span>
            </div>
          )}

          {/* Low Balance Warning */}
          <AnimatePresence>
            {showLowBalanceWarning && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-24 left-6 right-6 z-30 bg-red-600/95 border border-red-500 text-white rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-bounce"
              >
                <AlertTriangle className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">⚠️ Low Coin Balance</h4>
                  <p className="text-[8.5px] text-white/90 mt-0.5">Your coins are running low. Refill soon or the session will terminate automatically.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Session Cost metrics */}
          <div className="absolute bottom-28 left-6 z-10 flex flex-col bg-black/55 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
            <span className="text-[7.5px] uppercase tracking-widest text-slate-400 font-bold">Accumulated Cost</span>
            <span className="text-yellow-400 font-black font-mono text-sm mt-0.5">🪙 {accumulatedCost} Coins</span>
            <span className="text-slate-400 font-mono text-[7px] mt-0.5">Remaining: 🪙 {user.coins - accumulatedCost}</span>
          </div>

          {/* Floating Receiver Earnings Display */}
          <div className="absolute bottom-28 right-6 z-10 flex flex-col bg-black/55 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-right">
            <span className="text-[7.5px] uppercase tracking-widest text-pink-400 font-bold flex items-center gap-1 justify-end">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              <span>Receiver Earnings (Host)</span>
            </span>
            <span className="text-pink-400 font-black font-mono text-sm mt-0.5">🪙 {Math.floor(accumulatedCost * 0.75)} Coins</span>
            <span className="text-slate-400 font-mono text-[7px] mt-0.5 block">
              Today: 🪙 {Math.floor((creatorStats?.dailyEarningsCoins || 1200) + Math.floor(accumulatedCost * 0.75))}
            </span>
            <span className="text-slate-500 font-mono text-[6.5px] block mt-0.5">
              Month: 🪙 {Math.floor((creatorStats?.monthlyEarningsCoins || 3800) + Math.floor(accumulatedCost * 0.75))} | Gross: 🪙 {Math.floor((creatorStats?.totalEarningsCoins || 22500) + Math.floor(accumulatedCost * 0.75))}
            </span>
          </div>

          {/* Call Controls Bar */}
          <div className="relative z-10 flex justify-center items-center gap-3.5 mb-4">
            
            {/* 1. Mute Microphone Toggle */}
            <button 
              onClick={handleToggleMute}
              className={`p-3.5 rounded-full shadow-xl border transition-all active:scale-90 ${
                isMuted 
                  ? 'bg-red-500/30 border-red-500 text-red-500' 
                  : 'bg-black/55 hover:bg-black/75 border-white/10 text-white'
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* 2. Speaker Output Toggle */}
            <button 
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-full shadow-xl border transition-all active:scale-90 ${
                !isSpeakerOn 
                  ? 'bg-red-500/30 border-red-500 text-red-500' 
                  : 'bg-black/55 hover:bg-black/75 border-white/10 text-white'
              }`}
              title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* 3. Camera On/Off Toggle (Only for Video Calls) */}
            {callType === 'video' && (
              <button 
                onClick={handleToggleCamera}
                className={`p-3.5 rounded-full shadow-xl border transition-all active:scale-90 ${
                  !isVideoOn 
                    ? 'bg-red-500/30 border-red-500 text-red-500' 
                  : 'bg-black/55 hover:bg-black/75 border-white/10 text-white'
                }`}
                title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            {/* 4. Switch Camera Device (Only for Video Calls) */}
            {callType === 'video' && isVideoOn && (
              <button 
                onClick={handleSwitchCamera}
                className="p-3.5 bg-black/55 hover:bg-black/75 rounded-full border border-white/10 text-white transition-all active:scale-90 shadow-xl"
                title="Switch Camera Device (Front/Back)"
              >
                <RefreshCw className="w-5 h-5 text-pink-400" />
              </button>
            )}

            {/* 5. End Call Action Button */}
            <button 
              onClick={handleEndCall}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-xl hover:scale-110 active:scale-95 border-2 border-red-500"
              title="End Secure Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>

          {/* Security details tag */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3.5 py-1 rounded-full text-slate-400 text-[8px] uppercase tracking-widest font-mono border border-white/5 shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            <span>Encrypted WebRTC Calling Engine</span>
          </div>

        </div>
      )}

      {/* 5. POST-CALL RATING FEEDBACK MODAL */}
      {callState === 'rating' && (
        <div className="relative z-10 flex flex-col justify-center items-center flex-grow p-4">
          <div className="bg-slate-950 border border-white/10 p-6 rounded-3xl w-full max-w-[290px] text-center shadow-2xl relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <img src={creator.avatar} className="w-20 h-20 rounded-full border-4 border-pink-500 mx-auto object-cover shadow-xl" alt="" />
            </div>
            
            <div className="pt-10">
              <h2 className="text-sm font-black uppercase tracking-wider">How was your call?</h2>
              <p className="text-slate-400 text-[10px] mt-1">Rate your session with {creator.name}</p>
              
              <div className="bg-slate-900 rounded-xl p-2 my-4 border border-white/5 text-[9px] text-slate-400 flex flex-col gap-0.5 font-mono">
                <div>Duration: <span className="text-pink-400 font-bold">{formatTime(duration)}</span></div>
                <div>Coins Spent: <span className="text-yellow-400 font-bold">🪙 {accumulatedCost} Coins</span></div>
              </div>

              {/* Stars selection bar */}
              <div className="flex justify-center gap-2 my-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)}
                    className="transition active:scale-75 hover:scale-110"
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>

              <button 
                onClick={handleSubmitRating}
                className="w-full py-2.5 bg-pink-500 text-white font-black uppercase tracking-widest rounded-xl text-xs hover:bg-pink-600 transition active:scale-95 shadow-lg"
              >
                Submit & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PERMISSIONS REJECTION OVERLAY (DENIED & PERMANENTLY DENIED DIALOGS) */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              
              <h3 className="text-center text-sm font-black uppercase tracking-wider text-white">
                {permissionStatus === 'permanently_denied' ? 'Permission Blocked Permanently' : 'Device Access Required'}
              </h3>
              
              <p className="text-center text-slate-400 text-[10.5px] mt-2 leading-relaxed">
                {permissionStatus === 'permanently_denied' 
                  ? 'Your browser has blocked Camera or Microphone access. To connect this Voice or Video call, you must manually enable access in your settings.'
                  : 'To initiate voice & video streaming with creators, Livo Live requires permission to access your device camera & microphone.'
                }
              </p>

              {permissionStatus === 'permanently_denied' ? (
                /* App Settings Simulator Trigger button */
                <div className="flex flex-col gap-2 mt-5">
                  <button 
                    onClick={() => setShowSettingsSimulator(true)}
                    className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition shadow"
                  >
                    🛠️ Open App Settings
                  </button>
                  <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest font-bold">
                    Or click the lock icon 🔒 next to the web address to enable.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2.5 mt-5">
                  <button 
                    onClick={handleEndCall}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10.5px] font-black uppercase tracking-wider rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => requestMediaPermissions(true)}
                    className="flex-1 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition shadow"
                  >
                    Grant Access
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. APP SETTINGS SIMULATOR PANEL */}
      <AnimatePresence>
        {showSettingsSimulator && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col justify-between p-6">
            <div className="flex flex-col">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">System App Settings</span>
                </div>
                <button 
                  onClick={() => setShowSettingsSimulator(false)}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=60&h=60" className="w-10 h-10 rounded-xl object-cover" alt="" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Livo Live</h4>
                    <span className="text-[8px] text-slate-400">Version 2.4.1 (Web Production Build)</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 flex flex-col gap-3">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">App Permissions</span>
                  
                  {/* Camera Permission Switcher */}
                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2.5">
                      <Camera className="w-4 h-4 text-pink-400" />
                      <span className="text-[11px] font-bold text-slate-200">Camera</span>
                    </div>
                    <button 
                      onClick={() => setPermissionStatus('granted')}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${permissionStatus === 'granted' ? 'bg-pink-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${permissionStatus === 'granted' ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Microphone Permission Switcher */}
                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2.5">
                      <Mic className="w-4 h-4 text-pink-400" />
                      <span className="text-[11px] font-bold text-slate-200">Microphone</span>
                    </div>
                    <button 
                      onClick={() => setPermissionStatus('granted')}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${permissionStatus === 'granted' ? 'bg-pink-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${permissionStatus === 'granted' ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 text-[10px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-white/5 flex gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Enabling permissions here will immediately authorize the active call session with full camera & audio access.</span>
              </div>
            </div>

            <button 
              onClick={() => {
                if (permissionStatus === 'granted') {
                  setShowSettingsSimulator(false);
                  requestMediaPermissions(true);
                } else {
                  setShowSettingsSimulator(false);
                }
              }}
              className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition"
            >
              Apply Settings & Return
            </button>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
