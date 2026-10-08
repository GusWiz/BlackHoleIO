import { useEffect, useRef } from 'react';

// This is a TypeScript 'interface'. It acts as a blueprint or contract.
// It tells TypeScript exactly what properties a 'Player' object must have
// and what type of data each property should be (numbers or text strings).
// This helps prevent bugs by making sure we don't accidentally forget a property or use the wrong data type.
interface Player {
  x: number;
  y: number;
  radius: number;
  mass: number;
  color: string;
  name: string;
}

export default function GameCanvas() {
  // useRef is a React Hook that creates a persistent "box" to hold data across re-renders.
  // The `<HTMLCanvasElement | null>` part is TypeScript. It means "this box will either hold a 
  // Canvas HTML element, or it will be empty (null)".
  // We initialize it with `null`, and later React will put the actual `<canvas>` element inside it.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // useEffect is a React Hook that runs code AFTER the component has been drawn on the screen.
  // We use it here to start our game loop once the `<canvas>` is actually ready.
  // The empty array `[]` at the end means "only run this setup code exactly once when the component first loads".
  useEffect(() => {
    // Open the "box" and get the actual canvas DOM element.
    const canvas = canvasRef.current;

    // // Safety check: if the canvas doesn't exist yet, stop right here.
    // if (!canvas) return;

    // getContext('2d') gives us the "drawing engine" for the canvas.
    // It returns an object containing all the methods we need to draw shapes, lines, colors, etc.
    const ctx = canvas.getContext('2d');

    // Safety check: if the browser fails to create the 2D drawing engine, stop right here.
    if (!ctx) return;

    // We need to keep track of our animation frame so we can stop the loop later.
    let animationFrameId: number;

    // --- CANVAS SIZING & HIGH-RESOLUTION DISPLAY SUPPORT ---
    const handleResize = () => {
      // Get the display's pixel density. High-end screens (like Mac Retina) have a ratio of 2 or more,
      // meaning they pack 2 or more physical pixels into a single CSS pixel.
      const dpr = window.devicePixelRatio || 1;

      // Set the actual number of pixels in the canvas drawing buffer.
      // We multiply by dpr so the image doesn't look blurry on high-resolution screens.
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      // Reset any previous zooming or scaling.
      ctx.resetTransform();
      // Tell the drawing engine to zoom in based on the pixel ratio.
      // Now, when we say "draw 10 pixels", it will actually draw 20 pixels on a Retina screen, keeping things sharp.
      ctx.scale(dpr, dpr);
    };

    // Tell the browser to run our resize function whenever the user changes the window size.
    window.addEventListener('resize', handleResize);
    // Call it once immediately to set the initial size.
    handleResize();

    // --- INITIALIZE PLAYER ---
    // We create an object that follows the 'Player' blueprint we defined at the top.
    const player: Player = {
      x: window.innerWidth / 2, // Start in the middle horizontally
      y: window.innerHeight / 2, // Start in the middle vertically
      mass: 50,
      radius: 35,
      color: '#9d4edd',
      name: 'Player',
    };

    // --- MOUSE TRACKING ---
    // We create a simple object to remember where the mouse currently is.
    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    // Every time the mouse moves, update our mouse object with the new coordinates.
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    // Listen for mouse movements anywhere on the window.
    window.addEventListener('mousemove', handleMouseMove);

    // This variable helps us create smooth, pulsating animations (like a heartbeat)
    // by constantly increasing and feeding it into a sine wave later.
    let pulseTime = 0;

    // --- THE GAME LOOP ---
    // This function will run 60 times every second (or whatever the screen refresh rate is).
    // Everything that moves or changes in the game happens inside this loop.
    const gameLoop = () => {
      // Increase the time slightly every frame.
      pulseTime += 0.03;

      // --- 1. CLEAR THE SCREEN ---
      // Before drawing the new frame, we must erase the old one!
      // We fill the entire canvas with a very dark blue/black color.
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // --- 2. DRAW BACKGROUND GRID ---
      // We draw faint lines to help give a sense of movement and scale.
      const gridSize = 60; // Space between grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; // Faint, mostly transparent white
      ctx.lineWidth = 1;

      // Draw vertical lines
      for (let x = 0; x < window.innerWidth; x += gridSize) {
        ctx.beginPath(); // Start a new path (like picking up a pen)
        ctx.moveTo(x, 0); // Move pen to the top of the screen
        ctx.lineTo(x, window.innerHeight); // Draw line to the bottom
        ctx.stroke(); // Actually put the ink on the canvas
      }

      // Draw horizontal lines
      for (let y = 0; y < window.innerHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(window.innerWidth, y);
        ctx.stroke();
      }

      // --- 3. UPDATE PLAYER MOVEMENT ---
      // Calculate how far the mouse is from the player on the X and Y axes.
      const dx = mouse.x - player.x;
      const dy = mouse.y - player.y;

      // Math.hypot calculates the straight-line distance between the player and mouse 
      // (using the Pythagorean theorem).
      const distance = Math.hypot(dx, dy);

      // Calculate speed based on mass. Heavier players move slower.
      const speed = Math.max(1.5, 6 - player.mass * 0.02);

      // Only move if the mouse is far enough away (prevents jittering when exactly on top of the mouse).
      if (distance > 5) {
        // We use some math to move a fraction of the distance towards the mouse.
        // dx / distance gives us the "direction", which we multiply by our speed.
        player.x += (dx / distance) * Math.min(speed, distance * 0.08);
        player.y += (dy / distance) * Math.min(speed, distance * 0.08);
      }

      // Ensure the player cannot leave the screen boundaries.
      // Math.max and Math.min are used to clamp the player's X/Y coordinates 
      // between the edge of their radius and the edge of the screen.
      player.x = Math.max(player.radius, Math.min(window.innerWidth - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(window.innerHeight - player.radius, player.y));

      // --- 4. DRAW THE BLACK HOLE PLAYER ---
      const r = player.radius;
      // Math.sin(pulseTime) returns a value smoothly oscillating between -1 and 1.
      // We multiply by 3 to make the pulse noticeable.
      const pulse = Math.sin(pulseTime) * 3;

      // --- A. Outer Gravitational Lensing Glow ---
      // We create a radial gradient, which is a color that fades from a center circle out to an outer circle.
      const glowGradient = ctx.createRadialGradient(
        player.x, player.y, r * 0.7,             // Inner circle (starting point of gradient)
        player.x, player.y, r * 2.2 + pulse      // Outer circle (ending point of gradient, pulsating)
      );

      // Define the colors of the gradient at different percentages (0 to 1).
      glowGradient.addColorStop(0, 'rgba(157, 78, 221, 0.8)');
      glowGradient.addColorStop(0.4, 'rgba(114, 9, 183, 0.4)');
      glowGradient.addColorStop(0.8, 'rgba(76, 201, 240, 0.15)');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fades to completely transparent

      ctx.save(); // Save the current state of the drawing engine
      ctx.beginPath();
      // ctx.arc draws a circle: arc(x, y, radius, startAngle, endAngle)
      // Math.PI * 2 is the radian equivalent of 360 degrees (a full circle).
      ctx.arc(player.x, player.y, r * 2.2 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient; // Fill the circle with our gradient
      ctx.fill();
      ctx.restore(); // Restore the previous state (clearing the gradient fill style)

      // --- B. Swirling Accretion Ring ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, r * 1.25 + pulse * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(224, 170, 255, 0.7)'; // Outline color
      ctx.lineWidth = 3; // Outline thickness

      // Add a glowing effect
      ctx.shadowColor = '#fff07dff';
      ctx.shadowBlur = 15;

      ctx.stroke(); // Draw the outline
      ctx.restore();

      // --- C. The Event Horizon (Pitch Black Center) ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#000000'; // Solid black

      // Make the black center emit a subtle black shadow/glow to blend into the colors
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;

      ctx.fill(); // Fill the solid black circle

      // Inner Event Horizon Border (A thin purple ring right on the edge of the black hole)
      ctx.strokeStyle = '#3c096c';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // --- 5. DRAW HUD (Heads Up Display) TEXT ---
      ctx.save();
      ctx.font = '600 13px system-ui, sans-serif'; // Set font weight, size, and family
      ctx.fillStyle = '#ffffff'; // White text
      ctx.textAlign = 'center'; // Center the text horizontally over the X coordinate

      // Add a small drop shadow to make the text readable against bright backgrounds
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;

      // Draw the player's name above the black hole
      ctx.fillText(player.name, player.x, player.y - r - 12);

      // Draw the mass below the name
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillStyle = '#c77dff'; // Purple text
      ctx.fillText(`Mass: ${player.mass}`, player.x, player.y + 4);
      ctx.restore();

      // --- SCHEDULE THE NEXT FRAME ---
      // requestAnimationFrame tells the browser: "Whenever you are ready to paint the next frame
      // to the screen, call the `gameLoop` function again."
      // This is what creates the continuous animation loop.
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Kick off the very first frame of the game loop!
    animationFrameId = requestAnimationFrame(gameLoop);

    // --- CLEANUP FUNCTION ---
    // This function runs when the component is removed from the screen (unmounted).
    // It's crucial to remove listeners and stop the loop, otherwise they keep running
    // in the background forever and cause memory leaks and errors.
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId); // Stop the game loop
    };
  }, []);
  // Recall: That the '[]' means that the useEffect() only runs once.


  // --- COMPONENT RENDER ---
  // This is the actual HTML that React puts on the page.
  // We pass our `canvasRef` to the `ref` attribute so React can give us the DOM element.
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block', // Removes tiny spacing issues sometimes caused by inline elements
        width: '100vw',   // 100% of the viewport width
        height: '100vh',  // 100% of the viewport height
        cursor: 'crosshair', // Changes the mouse cursor to a crosshair over the game
      }}
    />
  );
}
