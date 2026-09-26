'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
}

export function AudioVisualizer({ stream }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayWidth = rect.width || canvas.offsetWidth || 300;
      const displayHeight = rect.height || canvas.offsetHeight || 48;

      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    audioContextRef.current = audioCtx;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.4; // Faster raw response, smoothed by our Lerp later
    analyserRef.current = analyser;

    let source: MediaStreamAudioSourceNode | null = null;
    try {
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (e) {
      console.error('Failed to create media stream source:', e);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // STATE BUFFERS
    let waveHistory: number[] = new Array(200).fill(0);
    let smoothedEnergy = 0; // Used for Buttery Lerping

    const draw = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.offsetWidth || canvasRef.current.getBoundingClientRect().width;
      const height = canvasRef.current.offsetHeight || canvasRef.current.getBoundingClientRect().height;

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      const barWidth = 3; // Upgraded from 2 to 3 for a bolder, premium look
      const gap = 3; // Increased breathing room
      const startX = width / 2;
      const maxBarsPerSide = Math.floor(((width * 0.75) / 2) / (barWidth + gap));

      // 1. CALCULATE RAW ENERGY
      let currentEnergy = 0;
      for (let i = 0; i < 25; i++) {
        currentEnergy += dataArray[i];
      }
      currentEnergy = currentEnergy / 25;

      // Strict Noise Gate
      if (currentEnergy < 15) {
        currentEnergy = 0;
      }

      // 2. LINEAR INTERPOLATION (LERP)
      // This forces the center peak to glide smoothly rather than snap erratically
      smoothedEnergy += (currentEnergy - smoothedEnergy) * 0.15; // 15% glide factor

      // 3. TARGET HEIGHT CALCULATION
      let targetHeight = (smoothedEnergy / 255) * height * 2.0;
      if (targetHeight > height * 0.85) targetHeight = height * 0.85;

      // 4. PROPAGATE WAVE
      waveHistory.unshift(targetHeight);
      if (waveHistory.length > maxBarsPerSide) {
        waveHistory.pop();
      }

      // Because of the lerp, true silence approaches 0 asymptotically.
      // We check if the highest value in the buffer is visually negligible.
      const maxHistoryValue = Math.max(...waveHistory);
      const isCompletelySilent = maxHistoryValue < 1.0;

      // 5. PREMIUM CANVAS STYLING
      // Apply a subtle, hardware-accelerated neon bloom when active
      ctx.shadowBlur = isCompletelySilent ? 0 : 12;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.35)'; // emerald-500 shadow
      ctx.fillStyle = isCompletelySilent ? '#52525b' : '#10b981'; // zinc-600 resting, emerald active

      // 6. RENDER THE RIPPLE
      for (let i = 0; i < maxBarsPerSide; i++) {
        const historyHeight = waveHistory[i] || 0;

        // 7. COSINE TAPER ("DUMPING")
        // Math.cos creates an ultra-smooth, organic teardrop fade compared to a linear polynomial
        const taper = Math.pow(Math.cos((i / maxBarsPerSide) * (Math.PI / 2)), 1.5);

        const finalHeight = Math.max(3, historyHeight * taper); // 3px minimum height for bolder resting dots
        const y = height / 2 - finalHeight / 2;

        // Draw Right Side
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(startX + i * (barWidth + gap), y, barWidth, finalHeight, 1.5);
        } else {
          ctx.rect(startX + i * (barWidth + gap), y, barWidth, finalHeight);
        }
        ctx.fill();

        // Draw Left Side (Mirror)
        if (i !== 0) {
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(startX - i * (barWidth + gap), y, barWidth, finalHeight, 1.5);
          } else {
            ctx.rect(startX - i * (barWidth + gap), y, barWidth, finalHeight);
          }
          ctx.fill();
        }
      }

      // Reset shadow blur so it doesn't affect subsequent unrelated canvas draws
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      try {
        if (source) source.disconnect();
      } catch (_) {}
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current?.close().catch(() => {});
      }
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-11 my-auto transition-opacity duration-300 block"
    />
  );
}
