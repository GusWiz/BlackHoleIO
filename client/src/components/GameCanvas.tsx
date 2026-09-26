import { useEffect, useRef } from 'react';

interface Player {
  x: number;
  y: number;
  radius: number;
  mass: number;
  color: string;
  name: string;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Canvas sizing with Retina/High-DPI display support
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Player State
    const player: Player = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      mass: 50,
      radius: 35,
      color: '#9d4edd',
      name: 'Player',
    };

    // Mouse Tracking
    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation time tracker for pulsating effects
    let pulseTime = 0;

    // --- GAME LOOP ---
    const gameLoop = () => {
      pulseTime += 0.03;

      // 1. Clear Screen
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // 2. Draw Subtle Background Grid
      const gridSize = 60;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      for (let x = 0; x < window.innerWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, window.innerHeight);
        ctx.stroke();
      }
      for (let y = 0; y < window.innerHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(window.innerWidth, y);
        ctx.stroke();
      }

      // 3. Update Player Movement (Smooth glide towards mouse)
      const dx = mouse.x - player.x;
      const dy = mouse.y - player.y;
      const distance = Math.hypot(dx, dy);

      // Speed inversely proportional to mass (bigger = slightly slower)
      const speed = Math.max(1.5, 6 - player.mass * 0.02);

      if (distance > 5) {
        player.x += (dx / distance) * Math.min(speed, distance * 0.08);
        player.y += (dy / distance) * Math.min(speed, distance * 0.08);
      }

      // Keep player inside window bounds for now
      player.x = Math.max(player.radius, Math.min(window.innerWidth - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(window.innerHeight - player.radius, player.y));

      // 4. Draw Black Hole Effects
      const r = player.radius;
      const pulse = Math.sin(pulseTime) * 3;

      // Outer Gravitational Lensing Glow (Accretion Disk)
      const glowGradient = ctx.createRadialGradient(
        player.x,
        player.y,
        r * 0.7,
        player.x,
        player.y,
        r * 2.2 + pulse
      );
      glowGradient.addColorStop(0, 'rgba(157, 78, 221, 0.8)');
      glowGradient.addColorStop(0.4, 'rgba(114, 9, 183, 0.4)');
      glowGradient.addColorStop(0.8, 'rgba(76, 201, 240, 0.15)');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, r * 2.2 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      ctx.restore();

      // Swirling Accretion Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, r * 1.25 + pulse * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(224, 170, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#c77dff';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      // The Event Horizon (Pitch Black Center)
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Inner Event Horizon Border
      ctx.strokeStyle = '#3c096c';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Player Name & Mass HUD Text
      ctx.save();
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(player.name, player.x, player.y - r - 12);

      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillStyle = '#c77dff';
      ctx.fillText(`Mass: ${player.mass}`, player.x, player.y + 4);
      ctx.restore();

      // Next frame
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        cursor: 'crosshair',
      }}
    />
  );
}
