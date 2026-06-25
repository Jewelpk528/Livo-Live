/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift } from '../types';

interface GiftsAnimationOverlayProps {
  activeGift: Gift | null;
  onComplete: () => void;
}

export default function GiftsAnimationOverlay({ activeGift, onComplete }: GiftsAnimationOverlayProps) {
  const [displayState, setDisplayState] = useState<boolean>(false);

  useEffect(() => {
    if (activeGift) {
      setDisplayState(true);
      const timer = setTimeout(() => {
        setDisplayState(false);
        onComplete();
      }, 3500); // Animation runs for 3.5 seconds
      return () => clearTimeout(timer);
    }
  }, [activeGift, onComplete]);

  if (!activeGift || !displayState) return null;

  const { name, icon, coinValue, animationType } = activeGift;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden bg-black/10">
      <AnimatePresence>
        {displayState && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            
            {/* 1. Rose Shower Animation */}
            {animationType === 'rose-shower' && (
              <div className="absolute inset-0 flex flex-wrap justify-around">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -50, opacity: 0, rotate: 0 }}
                    animate={{ y: '110%', opacity: [0, 1, 1, 0], rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
                    transition={{
                      duration: 2 + Math.random() * 1.5,
                      delay: Math.random() * 0.8,
                      ease: 'linear'
                    }}
                    className="text-2xl mt-4"
                  >
                    🌹
                  </motion.div>
                ))}
              </div>
            )}

            {/* 2. Heart Pulse Animation */}
            {animationType === 'heart-pulse' && (
              <motion.div
                initial={{ scale: 0.1, opacity: 0 }}
                animate={{
                  scale: [0.1, 1.4, 0.9, 1.2, 1, 0],
                  opacity: [0, 1, 1, 1, 1, 0],
                  rotate: [0, -10, 10, -5, 5, 0]
                }}
                transition={{ duration: 3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
                className="flex flex-col items-center"
              >
                <div className="text-8xl filter drop-shadow-[0_10px_15px_rgba(255,62,108,0.5)]">💖</div>
                <div className="mt-4 px-4 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                  <span>Heart Pulse</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{coinValue} Coins</span>
                </div>
              </motion.div>
            )}

            {/* 3. Diamond Ring Animation */}
            {animationType === 'diamond-ring' && (
              <motion.div
                initial={{ y: 100, scale: 0.5, opacity: 0 }}
                animate={{
                  y: [100, 0, 0, -20, 0],
                  scale: [0.5, 1.2, 1, 1.05, 0],
                  opacity: [0, 1, 1, 1, 0]
                }}
                transition={{ duration: 3.2 }}
                className="flex flex-col items-center"
              >
                <div className="text-8xl filter drop-shadow-[0_10px_20px_rgba(18,203,196,0.5)] animate-bounce">💎</div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="absolute text-xl text-yellow-300 pointer-events-none"
                  style={{ width: 140, height: 140 }}
                >
                  <span className="absolute top-0 left-1/2 -translate-x-1/2">✨</span>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2">✨</span>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2">✨</span>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2">✨</span>
                </motion.div>
                <div className="mt-4 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                  <span>Diamond Sparkle</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{coinValue} Coins</span>
                </div>
              </motion.div>
            )}

            {/* 4. Royal Crown Animation */}
            {animationType === 'royal-crown' && (
              <motion.div
                initial={{ y: -150, opacity: 0, scale: 0.4 }}
                animate={{
                  y: [-150, -30, -30, -30, 0],
                  scale: [0.4, 1.3, 1, 1, 0],
                  opacity: [0, 1, 1, 1, 0]
                }}
                transition={{ duration: 3.2 }}
                className="flex flex-col items-center"
              >
                <div className="text-9xl filter drop-shadow-[0_12px_25px_rgba(255,195,18,0.6)]">👑</div>
                <div className="mt-2 text-yellow-300 font-bold tracking-widest text-lg uppercase drop-shadow">ROYAL CROWN</div>
                <div className="mt-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border border-yellow-300">
                  <span>👑 SENT BY TOP GIFTER</span>
                  <span className="bg-slate-900/10 px-1.5 py-0.5 rounded text-[10px]">{coinValue} Coins</span>
                </div>
              </motion.div>
            )}

            {/* 5. Ferrari Drive Animation */}
            {animationType === 'ferrari-drive' && (
              <div className="absolute w-full flex flex-col items-center">
                <motion.div
                  initial={{ x: '-120%', rotate: 2 }}
                  animate={{
                    x: ['-120%', '-20%', '0%', '20%', '150%'],
                    rotate: [2, 0, -2, 0, 5],
                    scale: [0.7, 1.1, 1.2, 1.1, 0.7]
                  }}
                  transition={{ duration: 3.4, times: [0, 0.3, 0.5, 0.7, 1], ease: 'easeInOut' }}
                  className="flex flex-col items-center"
                >
                  <div className="text-9xl filter drop-shadow-[0_15px_15px_rgba(237,76,103,0.6)]">🏎️</div>
                  <div className="text-xs text-red-500 font-mono tracking-widest bg-black/60 px-3 py-1 rounded-md border border-red-500 mt-2">
                    🏎️ FERRARI DRIFT... 💨
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1.5, delay: 0.8 }}
                  className="text-4xl text-yellow-400 absolute bottom-[-40px]"
                >
                  🔥 SPEED RUSH 🔥
                </motion.div>
              </div>
            )}

            {/* 6. Yacht Cruise Animation */}
            {animationType === 'yacht-cruise' && (
              <div className="absolute w-full flex flex-col items-center">
                <motion.div
                  initial={{ x: '120%', y: 20 }}
                  animate={{
                    x: ['120%', '20%', '0%', '-20%', '-150%'],
                    y: [20, 5, 0, 5, 20]
                  }}
                  transition={{ duration: 3.5, ease: 'easeInOut' }}
                  className="flex flex-col items-center"
                >
                  <div className="text-9xl filter drop-shadow-[0_15px_20px_rgba(18,203,196,0.6)]">🛳️</div>
                  <div className="text-xs text-cyan-300 font-semibold uppercase tracking-widest bg-cyan-950/80 px-3 py-1 rounded-md border border-cyan-500 mt-2">
                    🛳️ YACHT CRUISE VOYAGE 🌊
                  </div>
                </motion.div>
                <div className="absolute bottom-[-20px] flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.5, repeat: 4, delay: i * 0.1 }}
                      className="text-xl"
                    >
                      💧
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Lion Roar Animation */}
            {animationType === 'lion-roar' && (
              <motion.div
                initial={{ scale: 0.1, opacity: 0 }}
                animate={{
                  scale: [0.1, 1.4, 1.2, 1.3, 0],
                  opacity: [0, 1, 1, 1, 0]
                }}
                transition={{ duration: 3.5 }}
                className="flex flex-col items-center"
              >
                <div className="text-9xl filter drop-shadow-[0_15px_25px_rgba(255,195,18,0.6)] animate-pulse">🦁</div>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="text-2xl text-amber-500 font-extrabold tracking-widest uppercase drop-shadow mt-2"
                >
                  🦁 ROAAAAR! 🦁
                </motion.div>
                <div className="text-xs text-amber-200 uppercase bg-slate-900/80 border border-amber-500 px-3 py-1 rounded mt-2">
                  Sent KING LION (2,500 Coins)
                </div>
              </motion.div>
            )}

            {/* 8. Rocket Launch Animation */}
            {animationType === 'rocket-launch' && (
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-12">
                <motion.div
                  initial={{ y: 200, scale: 0.6, opacity: 1 }}
                  animate={{
                    y: [200, 100, -50, -400, -800],
                    scale: [0.6, 1, 1.1, 0.8, 0.4]
                  }}
                  transition={{ duration: 3.3, times: [0, 0.2, 0.4, 0.7, 1], ease: 'easeIn' }}
                  className="flex flex-col items-center relative z-20"
                >
                  <div className="text-9xl filter drop-shadow-[0_20px_25px_rgba(255,94,58,0.8)]">🚀</div>
                  
                  {/* Smoke cloud effect */}
                  <div className="flex gap-1 absolute bottom-[-30px]">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 2, 0.5], opacity: [0.8, 0.4, 0] }}
                        transition={{ duration: 0.8, repeat: 3 }}
                        className="w-4 h-4 bg-orange-500/60 rounded-full blur-sm"
                      />
                    ))}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.2, 1, 0.8] }}
                  transition={{ duration: 2, delay: 0.2 }}
                  className="bg-black/80 px-4 py-2 rounded-xl border border-orange-500 text-center z-30 mb-20 shadow-2xl"
                >
                  <div className="text-orange-500 text-sm font-extrabold tracking-widest uppercase animate-pulse">🌌 SPACE ROCKET LAUNCHED 🌌</div>
                  <div className="text-[10px] text-slate-300 mt-1">Super Gifter sends 5,000 Coins gift!</div>
                </motion.div>
              </div>
            )}

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
