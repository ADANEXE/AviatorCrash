import { useEffect, useRef } from "react";
import { useGame, GameState, GameHistory } from "@/contexts/GameContext";

export default function GameCanvas() {
  const { gameState, gameHistory } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Previous game results display
  const renderGameHistory = (history: GameHistory[]) => {
    return history.map((item) => (
      <div 
        key={item.id}
        className="flex-shrink-0 bg-[#0F1923] rounded-md px-2 py-1 font-mono text-sm"
      >
        <span 
          className={item.crashPoint < 2 ? "text-[#FF3D57]" : "text-[#FF6B00]"}
        >
          {item.crashPoint.toFixed(2)}x
        </span>
      </div>
    ));
  };

  // Game canvas animation
  useEffect(() => {
    if (!canvasRef.current || !planeRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const plane = planeRef.current;
    
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawCurve(ctx, canvas.width, canvas.height);
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Draw the curve path
    function drawCurve(ctx: CanvasRenderingContext2D, width: number, height: number) {
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 107, 0, 0.3)';
      ctx.lineWidth = 2;
      
      // Start at bottom left
      const startX = 50;
      const startY = height - 50;
      
      ctx.moveTo(startX, startY);
      
      // Create a smooth curve to top right
      ctx.bezierCurveTo(
        width / 3, height / 2,  // Control point 1
        width / 2, height / 3,  // Control point 2
        width - 100, 50         // End point
      );
      
      ctx.stroke();
    }
    
    // Animate plane based on game state
    const animatePlane = () => {
      if (gameState.status === 'in-progress' && plane) {
        const multiplier = gameState.currentMultiplier;
        const progress = Math.min((multiplier - 1) / 9, 1); // Scale based on multiplier (1-10x)
        
        // Calculate position along curve
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const startX = 50;
        const startY = canvasHeight - 50;
        const endX = canvasWidth - 100;
        const endY = 50;
        
        // Use bezier curve calculations to position plane
        const t = progress;
        const x = Math.pow(1-t, 3) * startX + 
                  3 * Math.pow(1-t, 2) * t * (canvasWidth / 3) + 
                  3 * (1-t) * Math.pow(t, 2) * (canvasWidth / 2) + 
                  Math.pow(t, 3) * endX;
                  
        const y = Math.pow(1-t, 3) * startY + 
                  3 * Math.pow(1-t, 2) * t * (canvasHeight / 2) + 
                  3 * (1-t) * Math.pow(t, 2) * (canvasHeight / 3) + 
                  Math.pow(t, 3) * endY;
        
        // Calculate rotation based on position
        const angle = -30 + (progress * 60); // -30 to 30 degrees
        
        // Update plane position and rotation
        plane.style.left = `${x}px`;
        plane.style.bottom = `${canvasHeight - y}px`;
        plane.style.transform = `rotate(${angle}deg)`;
        
        animationRef.current = requestAnimationFrame(animatePlane);
      } else if (gameState.status === 'crashed' && plane) {
        // Crash animation
        plane.style.transform = 'rotate(90deg)';
      } else if (gameState.status === 'waiting' && plane) {
        // Reset plane position
        plane.style.left = '50px';
        plane.style.bottom = '50px';
        plane.style.transform = 'rotate(-30deg)';
      }
    };
    
    // Start or stop animation based on game state
    if (gameState.status === 'in-progress') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animatePlane);
    } else if (gameState.status === 'waiting') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Reset plane position
      plane.style.left = '50px';
      plane.style.bottom = '50px';
      plane.style.transform = 'rotate(-30deg)';
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  // Get game status text
  const getGameStatusText = (state: GameState) => {
    switch (state.status) {
      case 'waiting':
        return 'READY FOR TAKEOFF';
      case 'in-progress':
        return 'PLANE TAKING OFF';
      case 'crashed':
        return `CRASHED AT ${state.crashPoint?.toFixed(2)}x`;
      default:
        return 'WAITING...';
    }
  };

  return (
    <div className="bg-[#1A2634] rounded-xl overflow-hidden shadow-lg">
      {/* Game Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#8A96A3]/10">
        <div className="flex items-center space-x-2">
          <span className="flex items-center text-[#00C853]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <circle cx="10" cy="10" r="5" />
            </svg>
            Live Game
          </span>
        </div>
        <div className="flex space-x-3">
          <button className="text-[#8A96A3] hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Game Canvas */}
      <div className="game-canvas h-[350px] sm:h-[400px] relative bg-gradient-radial from-[#1B2735] to-[#090A0F]">
        {/* Curve Path Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        
        {/* Plane Icon */}
        <div 
          ref={planeRef}
          className="plane absolute"
          style={{ bottom: '50px', left: '50px', transform: 'rotate(-30deg)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6B00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        
        {/* Dynamic Multiplier */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div 
            className={`multiplier-display text-5xl sm:text-7xl font-mono font-bold ${
              gameState.status === 'crashed' ? 'text-[#FF3D57]' : 'text-[#FF6B00]'
            } ${gameState.status === 'in-progress' ? 'animate-pulse' : ''}`}
          >
            {gameState.currentMultiplier.toFixed(2)}x
          </div>
          {/* Game State Indicator */}
          <div className="mt-2 font-medium text-white bg-[#0F1923]/70 px-3 py-1 rounded-full text-sm">
            {getGameStatusText(gameState)}
          </div>
        </div>
        
        {/* Previous Results */}
        <div className="absolute bottom-4 left-4 right-4 flex space-x-2 overflow-x-auto py-2 px-1">
          {renderGameHistory(gameHistory)}
        </div>
      </div>
    </div>
  );
}
