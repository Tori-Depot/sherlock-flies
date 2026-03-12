export interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

export interface GameState {
  sherlockY: number;
  velocity: number;
  pipes: Pipe[];
  score: number;
  highScore: number;
  status: 'idle' | 'playing' | 'dead';
  frame: number;
}
