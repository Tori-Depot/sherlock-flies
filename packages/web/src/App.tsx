import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, Pipe } from './types';

// Dynamic — set from window size
let W = window.innerWidth;
let H = window.innerHeight;

const SHERLOCK_SIZE = 90;
const PIPE_W = 70;
const GAP = 280;
const GRAVITY = 0.25;
const JUMP = -6;
const PIPE_SPEED = 2.5;
const PIPE_INTERVAL = 150;
const HITBOX_PADDING = 18; // forgiveness pixels on each side

// Depot palette
const COLORS = {
  bg: '#04040b',
  pipe: '#3c393f',
  pipeHighlight: '#49474e',
  pipeBorder: '#625f69',
  text: '#eeeef0',
  textDim: '#b5b2bc',
  score: '#9eb1ff',
  grass: '#46a758',
  red: '#ff9592',
  amber: '#ffc53d',
  violet: '#6e56cf',
  gridLine: '#1a191b',
};

const GROUND_H = 40;
const SHERLOCK_X = 120;

function drawTerminalBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  for (let y = 0; y < H; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe) {
  const topH = pipe.gapY;
  const bottomY = pipe.gapY + GAP;

  // Top pipe
  ctx.fillStyle = COLORS.pipe;
  ctx.fillRect(pipe.x, 0, PIPE_W, topH);
  ctx.strokeStyle = COLORS.pipeBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pipe.x, 0, PIPE_W, topH);

  // Top cap
  ctx.fillStyle = COLORS.pipeHighlight;
  ctx.fillRect(pipe.x - 5, topH - 24, PIPE_W + 10, 24);
  ctx.strokeRect(pipe.x - 5, topH - 24, PIPE_W + 10, 24);

  // Bottom pipe
  ctx.fillStyle = COLORS.pipe;
  ctx.fillRect(pipe.x, bottomY, PIPE_W, H - GROUND_H - bottomY);
  ctx.strokeStyle = COLORS.pipeBorder;
  ctx.strokeRect(pipe.x, bottomY, PIPE_W, H - GROUND_H - bottomY);

  // Bottom cap
  ctx.fillStyle = COLORS.pipeHighlight;
  ctx.fillRect(pipe.x - 5, bottomY, PIPE_W + 10, 24);
  ctx.strokeRect(pipe.x - 5, bottomY, PIPE_W + 10, 24);
}

function drawGround(ctx: CanvasRenderingContext2D) {
  const groundY = H - GROUND_H;
  ctx.fillStyle = COLORS.pipe;
  ctx.fillRect(0, groundY, W, GROUND_H);
  ctx.strokeStyle = COLORS.grass;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();
}

function drawSherlock(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  y: number,
  velocity: number,
  status: string,
) {
  ctx.save();
  const centerX = SHERLOCK_X + SHERLOCK_SIZE / 2;
  const centerY = y + SHERLOCK_SIZE / 2;

  ctx.translate(centerX, centerY);

  // Base rotation: upward tilt so he looks like he's flying
  // Velocity shifts it: negative vel (jumping) tilts up more, positive (falling) tilts down
  const baseAngle = -20;
  const velInfluence = velocity * 3;
  const angleDeg = Math.min(Math.max(baseAngle + velInfluence, -35), 40);
  ctx.rotate(angleDeg * (Math.PI / 180));

  if (img && img.complete) {
    ctx.drawImage(img, -SHERLOCK_SIZE / 2, -SHERLOCK_SIZE / 2, SHERLOCK_SIZE, SHERLOCK_SIZE);
  } else {
    ctx.fillStyle = COLORS.grass;
    ctx.beginPath();
    ctx.arc(0, 0, SHERLOCK_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, 0);
  }

  if (status === 'dead') {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.arc(0, 0, SHERLOCK_SIZE / 2 + 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawScore(ctx: CanvasRenderingContext2D, score: number, highScore: number) {
  ctx.font = '48px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.score;
  ctx.fillText(`${score}`, W / 2, 80);

  if (highScore > 0) {
    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(`best: ${highScore}`, W / 2, 105);
  }
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  status: 'idle' | 'dead',
  score: number,
) {
  ctx.fillStyle = 'rgba(4, 4, 11, 0.75)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  const cx = W / 2;
  const cy = H / 2;

  // Draw Sherlock in the overlay — big and crisp
  if (img && img.complete) {
    const size = 220;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(cx, cy - 160);
    ctx.rotate(-12 * (Math.PI / 180));
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  if (status === 'idle') {
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = COLORS.text;
    ctx.fillText('Sherlock Flies!!!', cx, cy + 30);

    ctx.font = '16px monospace';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('press space or tap to start', cx, cy + 75);

    ctx.font = '13px monospace';
    ctx.fillStyle = COLORS.violet;
    ctx.fillText('depot.dev', cx, cy + 110);
  } else {
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = COLORS.red;
    ctx.fillText('build failed', cx, cy + 30);

    ctx.font = '22px monospace';
    ctx.fillStyle = COLORS.amber;
    ctx.fillText(`score: ${score}`, cx, cy + 70);

    ctx.font = '15px monospace';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('press space to rebuild', cx, cy + 110);
  }
}

const INITIAL_STATE: GameState = {
  sherlockY: H / 2 - SHERLOCK_SIZE / 2,
  velocity: 0,
  pipes: [],
  score: 0,
  highScore: 0,
  status: 'idle',
  frame: 0,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({ ...INITIAL_STATE });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const [, setTick] = useState(0);

  // Load Sherlock image
  useEffect(() => {
    const img = new Image();
    img.src = '/sherlock.png';
    imgRef.current = img;
  }, []);

  // Handle window resize — make canvas full screen
  useEffect(() => {
    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = W;
        canvas.height = H;
      }
      // Reset sherlock Y if idle
      const s = stateRef.current;
      if (s.status === 'idle') {
        s.sherlockY = H / 2 - SHERLOCK_SIZE / 2;
      }
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'idle') {
      s.status = 'playing';
      s.velocity = JUMP;
      s.pipes = [];
      s.score = 0;
      s.frame = 0;
      s.sherlockY = H / 2 - SHERLOCK_SIZE / 2;
    } else if (s.status === 'playing') {
      s.velocity = JUMP;
    } else if (s.status === 'dead') {
      s.status = 'idle';
      s.sherlockY = H / 2 - SHERLOCK_SIZE / 2;
      s.velocity = 0;
      setTick((t) => t + 1);
    }
  }, []);

  // Keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;

      if (s.status === 'playing') {
        s.frame++;
        s.velocity += GRAVITY;
        // Cap fall speed so it doesn't feel like a brick
        s.velocity = Math.min(s.velocity, 5.5);
        s.sherlockY += s.velocity;

        // Spawn pipes
        if (s.frame % PIPE_INTERVAL === 0) {
          const minGapY = 100;
          const maxGapY = H - GROUND_H - GAP - 100;
          const gapY = minGapY + Math.random() * (maxGapY - minGapY);
          s.pipes.push({ x: W, gapY, passed: false });
        }

        // Move pipes
        for (const pipe of s.pipes) {
          pipe.x -= PIPE_SPEED;
          if (!pipe.passed && pipe.x + PIPE_W < SHERLOCK_X) {
            pipe.passed = true;
            s.score++;
          }
        }

        s.pipes = s.pipes.filter((p) => p.x > -PIPE_W - 20);

        // Collision: ground/ceiling (forgiving — allow a few px above top)
        if (s.sherlockY + SHERLOCK_SIZE > H - GROUND_H) {
          s.status = 'dead';
          s.highScore = Math.max(s.highScore, s.score);
        }
        if (s.sherlockY < -10) {
          s.sherlockY = -10;
          s.velocity = 0;
        }

        // Collision: pipes (with hitbox padding for forgiveness)
        const sx1 = SHERLOCK_X + HITBOX_PADDING;
        const sx2 = SHERLOCK_X + SHERLOCK_SIZE - HITBOX_PADDING;
        const sy1 = s.sherlockY + HITBOX_PADDING;
        const sy2 = s.sherlockY + SHERLOCK_SIZE - HITBOX_PADDING;

        for (const pipe of s.pipes) {
          if (sx2 > pipe.x && sx1 < pipe.x + PIPE_W) {
            if (sy1 < pipe.gapY || sy2 > pipe.gapY + GAP) {
              s.status = 'dead';
              s.highScore = Math.max(s.highScore, s.score);
            }
          }
        }
      }

      // Draw everything
      drawTerminalBg(ctx);
      drawGround(ctx);
      for (const pipe of s.pipes) {
        drawPipe(ctx, pipe);
      }
      drawSherlock(ctx, imgRef.current, s.sherlockY, s.velocity, s.status);

      if (s.status === 'playing') {
        drawScore(ctx, s.score, s.highScore);
      }

      if (s.status === 'idle' || s.status === 'dead') {
        drawOverlay(ctx, imgRef.current, s.status, s.score);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onClick={jump}
      onTouchStart={(e) => {
        e.preventDefault();
        jump();
      }}
      style={{ display: 'block', cursor: 'pointer' }}
    />
  );
}
