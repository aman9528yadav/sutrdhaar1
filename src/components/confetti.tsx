
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfettiPiece = ({ id, x, y, rotation, color }: { id: number; x: number; y: number; rotation: number; color: string }) => {
  const destinationX = x + (Math.random() - 0.5) * 400;
  const destinationY = y + (Math.random() - 0.5) * 400;

  return (
    <motion.div
      key={id}
      initial={{ x, y, rotate: rotation, opacity: 1, scale: 1 }}
      animate={{
        x: destinationX,
        y: destinationY,
        opacity: 0,
        scale: 0.5,
        rotate: rotation + 360,
      }}
      transition={{ duration: Math.random() * 1.5 + 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: '12px',
        height: '12px',
        backgroundColor: color,
        transform: `translateX(-50%) translateY(-50%)`,
      }}
      className="rounded-full"
    />
  );
};

export function Confetti() {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const newPieces = Array.from({ length: 150 }).map((_, index) => ({
      id: index,
      x: 0,
      y: 0,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {pieces.map((piece) => (
          <ConfettiPiece key={piece.id} {...piece} />
        ))}
      </AnimatePresence>
    </div>
  );
}
