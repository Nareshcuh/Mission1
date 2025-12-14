import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 255
  isSpeaking: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume, isSpeaking }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      if (!isActive) {
         // Sleeping state
         ctx.beginPath();
         ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
         ctx.fillStyle = '#cbd5e1'; // slate-300
         ctx.fill();
         return;
      }

      // Active state animation
      // Normalize volume mostly between 0 and 1, usually silence is ~0-30 depending on mic noise floor
      const normalizedVol = Math.min(1, Math.max(0, (volume - 20) / 100));
      
      const baseRadius = 40;
      const pulse = normalizedVol * 40; // Expand up to 40px extra
      
      // Outer ripple
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + pulse * 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = isSpeaking ? 'rgba(79, 70, 229, 0.2)' : 'rgba(16, 185, 129, 0.2)'; // Indigo (speaking) vs Emerald (listening)
      ctx.fill();

      // Middle ripple
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + pulse, 0, 2 * Math.PI);
      ctx.fillStyle = isSpeaking ? 'rgba(79, 70, 229, 0.4)' : 'rgba(16, 185, 129, 0.4)';
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + (pulse * 0.2), 0, 2 * Math.PI);
      ctx.fillStyle = isSpeaking ? '#4f46e5' : '#10b981';
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, volume, isSpeaking]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="w-full max-w-[300px] h-auto"
    />
  );
};

export default AudioVisualizer;