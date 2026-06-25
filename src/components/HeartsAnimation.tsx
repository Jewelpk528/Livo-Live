/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Heart {
  id: number;
  x: number;
  scale: number;
  color: string;
}

interface HeartsAnimationProps {
  trigger: number;
}

const COLORS = [
  '#FF3E6C', // pink-rose
  '#FF5E3A', // orange-red
  '#FF2A6D', // hot pink
  '#FFC312', // bright gold
  '#C4E538', // lime
  '#12CBC4', // cyan
  '#FDA7DF', // lavender
  '#ED4C67'  // ruby
];

export default function HeartsAnimation({ trigger }: HeartsAnimationProps) {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    const newHeart: Heart = {
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 120, // offset left-right
      scale: 0.6 + Math.random() * 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };

    setHearts((prev) => [...prev.slice(-30), newHeart]); // keep max 30 hearts in memory
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 1, y: '80%', x: 0, scale: 0.2 }}
            animate={{
              opacity: [1, 0.9, 0.4, 0],
              y: '-10%',
              x: [0, heart.x * 0.4, heart.x * 0.8, heart.x],
              scale: [0.2, heart.scale, heart.scale * 1.1, heart.scale]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="absolute bottom-16 right-6 text-2xl drop-shadow-md select-none"
            style={{ color: heart.color }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
