import { useEffect, useRef } from 'react';

// =============================================================================
// TYPESCRIPT INTERFACES (Blueprints / Contracts for our data shapes)
// =============================================================================

// Describes the shape of the player-controlled black hole.
interface Player {
  x: number;
  y: number;
  radius: number;
  mass: number;
  color: string;
  name: string;
}

// Describes a floating mass object (star / debris) scattered around the world.
interface MassObject {
  id: number;      // Unique identifier so we can remove it when absorbed
  x: number;       // World X position
  y: number;       // World Y position
  radius: number;  // How large this object is
  mass: number;    // How much mass it grants the player on absorption
  color: string;   // Glow color
  pulseOffset: number; // Each star has its own pulse phase so they don't all pulse in sync
}

// =============================================================================
// WORLD CONSTANTS
// =============================================================================

// The total size of the game world. The player can scroll around inside this.
// Think of it like a large map — the viewport only shows a portion at a time.
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;

// How many floating mass objects exist in the world at once.
const MASS_OBJECT_COUNT = 120;

// The base mass we start with (used to compute radius from mass).
const BASE_MASS = 50;
const BASE_RADIUS = 35;

// =============================================================================
// UTILITY: Calculate radius from mass
// As the player absorbs objects, mass grows. Radius grows proportionally.
// We use a square root so it doesn't grow too fast — same formula agar.io uses.
// =============================================================================
function massToRadius(mass: number): number {
  return BASE_RADIUS * Math.sqrt(mass / BASE_MASS);
}

// =============================================================================
// UTILITY: Generate a random floating mass object at a random world position.
// =============================================================================
function spawnMassObject(id: number): MassObject {
  const mass = Math.random() * 18 + 4; // Random mass between 4 and 22
  const glowColors = [
    '#4cc9f0', // Cyan
    '#f72585', // Pink
    '#7209b7', // Purple
    '#4361ee', // Blue
    '#ffd60aff', // Yellow
    '#80ffdb', // Mint
  ];
  return {
    id,
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    radius: Math.max(4, mass * 0.7),
    mass,
    color: glowColors[Math.floor(Math.random() * glowColors.length)],
    pulseOffset: Math.random() * Math.PI * 2, // Random starting phase
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function GameCanvas() {
  // useRef creates a persistent "box" holding our canvas DOM element across re-renders.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // useEffect runs AFTER React mounts the <canvas> to the DOM.
  // The empty array [] means it runs exactly once on mount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Safety check: canvas must exist

    // Get the 2D drawing engine
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Safety check: 2D context must be available

    let animationFrameId: number;

    // -------------------------------------------------------------------------
    // CANVAS SIZING — Retina / High-DPI display support
    // -------------------------------------------------------------------------
    const handleResize = () => {
      // devicePixelRatio is how many physical pixels fit in one CSS pixel.
      // On a Retina display, dpr = 2 (or higher), so we scale the buffer up.
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr); // From here on, we think in CSS pixels, not physical pixels
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // -------------------------------------------------------------------------
    // PLAYER STATE — starts in the center of the world map
    // -------------------------------------------------------------------------
    const player: Player = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      mass: BASE_MASS,
      radius: BASE_RADIUS,
      color: '#9d4edd',
      name: 'Player',
    };

    // -------------------------------------------------------------------------
    // MOUSE TRACKING
    // The mouse position is in screen/viewport coordinates (0,0 = top-left of window).
    // We convert it to a world-relative direction later for movement.
    // -------------------------------------------------------------------------
    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // -------------------------------------------------------------------------
    // FLOATING MASS OBJECTS — scattered randomly across the world
    // -------------------------------------------------------------------------
    // We use a Map for O(1) deletion when an object is absorbed.
    const massObjects = new Map<number, MassObject>();
    for (let i = 0; i < MASS_OBJECT_COUNT; i++) {
      massObjects.set(i, spawnMassObject(i));
    }

    // Tracks the next ID to assign to a newly spawned object
    let nextObjectId = MASS_OBJECT_COUNT;

    // Animation time tracker — used for pulsating glow effects
    let pulseTime = 0;

    // =========================================================================
    // THE GAME LOOP
    // Called ~60 times per second by the browser via requestAnimationFrame.
    // Each call draws one "frame" of the game.
    // =========================================================================
    const gameLoop = () => {
      pulseTime += 0.03;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // -----------------------------------------------------------------------
      // STEP 1: CLEAR THE SCREEN
      // Fill the entire canvas with the background color to erase the last frame.
      // -----------------------------------------------------------------------
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, vw, vh);

      // -----------------------------------------------------------------------
      // STEP 2: CAMERA / VIEWPORT TRANSFORM
      //
      // The "camera" is just a math trick:
      //   cameraX = player.x - half the screen width
      //   cameraY = player.y - half the screen height
      //
      // This tells us how far the world has "scrolled" relative to the screen.
      // To draw any world object on screen, we subtract the camera offset:
      //   screenX = worldX - cameraX
      //   screenY = worldY - cameraY
      // -----------------------------------------------------------------------
      const cameraX = player.x - vw / 2;
      const cameraY = player.y - vh / 2;

      // -----------------------------------------------------------------------
      // STEP 3: DRAW BACKGROUND GRID (in world space)
      //
      // The grid tiles across the world. We use the modulo (%) operator to
      // figure out where the first visible grid line is, based on the camera offset.
      // This makes the grid "scroll" smoothly with the camera.
      // -----------------------------------------------------------------------
      const gridSize = 60;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      // Offset: where the first grid line appears on screen
      const gridOffsetX = ((-cameraX) % gridSize + gridSize) % gridSize;
      const gridOffsetY = ((-cameraY) % gridSize + gridSize) % gridSize;

      // Draw vertical lines
      for (let x = gridOffsetX; x < vw; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, vh);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = gridOffsetY; y < vh; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(vw, y);
        ctx.stroke();
      }

      // -----------------------------------------------------------------------
      // STEP 4: DRAW WORLD BOUNDARY
      //
      // Show the edges of the game world as a glowing border.
      // We convert world boundary coordinates (0,0) and (WORLD_WIDTH, WORLD_HEIGHT)
      // into screen coordinates by subtracting the camera offset.
      // -----------------------------------------------------------------------
      const worldLeft = 0 - cameraX;
      const worldTop = 0 - cameraY;
      const worldRight = WORLD_WIDTH - cameraX;
      const worldBottom = WORLD_HEIGHT - cameraY;

      ctx.save();
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.5)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 20;
      ctx.strokeRect(worldLeft, worldTop, WORLD_WIDTH, WORLD_HEIGHT);
      ctx.restore();

      // -----------------------------------------------------------------------
      // STEP 5: DRAW FLOATING MASS OBJECTS
      //
      // For each object in the world, convert its position to screen space
      // and draw it as a glowing dot if it is within the visible viewport.
      // -----------------------------------------------------------------------
      massObjects.forEach((obj) => {
        // Convert world position → screen position
        const sx = obj.x - cameraX;
        const sy = obj.y - cameraY;

        // Cull: skip drawing objects completely outside the screen (performance optimization)
        if (sx < -obj.radius * 3 || sx > vw + obj.radius * 3 ||
          sy < -obj.radius * 3 || sy > vh + obj.radius * 3) {
          return;
        }

        // Each object has its own pulse phase so they twinkle independently
        const objPulse = Math.sin(pulseTime + obj.pulseOffset) * 2;

        ctx.save();

        // Outer soft glow
        const objGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, obj.radius * 2.5 + objPulse);
        objGradient.addColorStop(0, obj.color.slice(0, 7) + '99'); // Ensure base 6-char hex before adding opacity

        // Draw the glow halo using a simpler approach: shadow blur
        ctx.beginPath();
        ctx.arc(sx, sy, obj.radius + objPulse * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = obj.color;
        ctx.shadowColor = obj.color;
        ctx.shadowBlur = 18;
        ctx.fill();

        // Bright core center
        ctx.beginPath();
        ctx.arc(sx, sy, obj.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.restore();
      });

      // -----------------------------------------------------------------------
      // STEP 6: UPDATE PLAYER MOVEMENT
      //
      // The player chases the mouse cursor.
      // IMPORTANT: The mouse is in screen space. We treat the screen center as the
      // "neutral" position. How far the mouse is from screen center tells us direction.
      // -----------------------------------------------------------------------
      const screenCenterX = vw / 2;
      const screenCenterY = vh / 2;

      // Direction vector from screen center to mouse cursor
      const dx = mouse.x - screenCenterX;
      const dy = mouse.y - screenCenterY;
      const distance = Math.hypot(dx, dy);

      // Heavier players move slightly slower
      const speed = Math.max(1.5, 6 - player.mass * 0.015);

      // Dead zone: don't move if mouse is very close to center (prevents jitter)
      if (distance > 8) {
        const moveAmount = Math.min(speed, distance * 0.06);
        player.x += (dx / distance) * moveAmount;
        player.y += (dy / distance) * moveAmount;
      }

      // Clamp player inside world boundaries
      player.x = Math.max(player.radius, Math.min(WORLD_WIDTH - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(WORLD_HEIGHT - player.radius, player.y));

      // -----------------------------------------------------------------------
      // STEP 7: ABSORPTION LOGIC
      //
      // Check every mass object to see if the player overlaps it.
      // Overlap = distance between centers < player radius (player is bigger).
      // If absorbed: increase player mass, resize radius, remove the object,
      // and spawn a new one at a random location.
      // -----------------------------------------------------------------------
      const toDelete: number[] = [];

      massObjects.forEach((obj) => {
        const dist = Math.hypot(player.x - obj.x, player.y - obj.y);

        // Absorption condition: player center overlaps into the object
        if (dist < player.radius + obj.radius * 0.5) {
          // Grow the player's mass
          player.mass += obj.mass;

          // Recalculate radius from new mass (square root scaling)
          player.radius = massToRadius(player.mass);

          // Mark this object for deletion (can't delete while iterating the Map)
          toDelete.push(obj.id);
        }
      });

      // Remove absorbed objects and spawn replacements at random world positions
      toDelete.forEach((id) => {
        massObjects.delete(id);
        const newObj = spawnMassObject(nextObjectId++);
        massObjects.set(newObj.id, newObj);
      });

      // -----------------------------------------------------------------------
      // STEP 8: DRAW THE PLAYER (BLACK HOLE) — in screen space
      //
      // The player is always drawn at the center of the screen.
      // The camera transform handles making the world appear to move around them.
      // -----------------------------------------------------------------------
      const px = screenCenterX; // Player is always visually at the screen center
      const py = screenCenterY;
      const r = player.radius;
      const pulse = Math.sin(pulseTime) * 3;

      // --- A. Outer Gravitational Lensing Glow (Accretion Disk) ---
      const glowGradient = ctx.createRadialGradient(
        px, py, r * 0.7,
        px, py, r * 2.2 + pulse
      );
      glowGradient.addColorStop(0, 'rgba(157, 78, 221, 0.8)');
      glowGradient.addColorStop(0.4, 'rgba(114, 9, 183, 0.4)');
      glowGradient.addColorStop(0.8, 'rgba(76, 201, 240, 0.15)');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, r * 2.2 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      ctx.restore();

      // --- B. Swirling Accretion Ring ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, r * 1.25 + pulse * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(224, 170, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#c77dff';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      // --- C. The Event Horizon (Pitch Black Center) ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.fill();
      // Inner border ring
      ctx.strokeStyle = '#3c096c';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // --- D. Player Name & Mass HUD Text (above the black hole) ---
      ctx.save();
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(player.name, px, py - r - 12);

      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillStyle = '#c77dff';
      ctx.fillText(`Mass: ${Math.floor(player.mass)}`, px, py + r + 18);
      ctx.restore();

      // -----------------------------------------------------------------------
      // STEP 9: DRAW MINIMAP (bottom-right corner)
      //
      // A small rectangle that shows the entire world shrunk down.
      // The player dot and mass objects are drawn as tiny dots on the minimap.
      // -----------------------------------------------------------------------
      const MM_W = 160;   // Minimap width in pixels
      const MM_H = 120;   // Minimap height in pixels
      const MM_X = vw - MM_W - 16; // 16px from the right edge
      const MM_Y = vh - MM_H - 16; // 16px from the bottom edge
      // Scale factors: how to convert a world coordinate to a minimap coordinate
      const MM_SCALE_X = MM_W / WORLD_WIDTH;
      const MM_SCALE_Y = MM_H / WORLD_HEIGHT;

      ctx.save();

      // Minimap background
      ctx.fillStyle = 'rgba(5, 5, 15, 0.75)';
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(MM_X, MM_Y, MM_W, MM_H, 6);
      ctx.fill();
      ctx.stroke();

      // "Minimap" label
      ctx.font = '500 9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'left';
      ctx.fillText('MINIMAP', MM_X + MM_H/2, MM_Y - 5);

      // Draw mass objects as tiny colored dots on the minimap
      massObjects.forEach((obj) => {
        ctx.beginPath();
        ctx.arc(
          MM_X + obj.x * MM_SCALE_X,
          MM_Y + obj.y * MM_SCALE_Y,
          1.5,
          0, Math.PI * 2
        );
        ctx.fillStyle = obj.color;
        ctx.fill();
      });

      // Draw the player as a glowing purple dot on the minimap
      ctx.beginPath();
      ctx.arc(
        MM_X + player.x * MM_SCALE_X,
        MM_Y + player.y * MM_SCALE_Y,
        4,
        0, Math.PI * 2
      );
      ctx.fillStyle = '#9d4edd';
      ctx.shadowColor = '#c77dff';
      ctx.shadowBlur = 8;
      ctx.fill();

      // Draw the visible viewport rectangle on the minimap (shows what the camera sees)
      const vpW = vw * MM_SCALE_X;
      const vpH = vh * MM_SCALE_Y;
      const vpX = MM_X + Math.max(0, (player.x - vw / 2)) * MM_SCALE_X;
      const vpY = MM_Y + Math.max(0, (player.y - vh / 2)) * MM_SCALE_Y;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(vpX, vpY, vpW, vpH);

      ctx.restore();

      // -----------------------------------------------------------------------
      // STEP 10: DRAW LEADERBOARD (top-right corner)
      //
      // For now this shows only the local player.
      // When multiplayer is added, this list will include all connected players.
      // -----------------------------------------------------------------------
      const LB_X = vw - 176;
      const LB_Y = 16;
      const LB_W = 160;
      const LB_LINE_H = 20;
      const LB_ENTRIES = 1; // Just the local player for now

      ctx.save();

      // Leaderboard background panel
      ctx.fillStyle = 'rgba(5, 5, 15, 0.75)';
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(LB_X, LB_Y, LB_W, 16 + LB_ENTRIES * LB_LINE_H + 8, 6);
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillStyle = '#c77dff';
      ctx.textAlign = 'center';
      ctx.fillText('LEADERBOARD', LB_X + LB_W / 2, LB_Y + 13);

      // Player row
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`#1  ${player.name}`, LB_X + 10, LB_Y + 13 + LB_LINE_H);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c77dff';
      ctx.fillText(`${Math.floor(player.mass)}`, LB_X + LB_W - 10, LB_Y + 13 + LB_LINE_H);

      ctx.restore();

      // -----------------------------------------------------------------------
      // Schedule the next frame — this creates the continuous animation loop
      // -----------------------------------------------------------------------
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Kick off the first frame!
    animationFrameId = requestAnimationFrame(gameLoop);

    // -------------------------------------------------------------------------
    // CLEANUP — runs when the component is unmounted (removed from screen).
    // Remove all event listeners and cancel the animation loop to prevent memory leaks.
    // -------------------------------------------------------------------------
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty array: this entire setup runs only once on mount

  // ---------------------------------------------------------------------------
  // RENDER — Returns the <canvas> element that fills the entire screen.
  // React attaches the DOM node to canvasRef after mounting.
  // ---------------------------------------------------------------------------
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',      // Removes default inline spacing
        width: '100vw',        // Fills full viewport width
        height: '100vh',       // Fills full viewport height
        cursor: 'crosshair',   // Crosshair cursor for the game
      }}
    />
  );
}
