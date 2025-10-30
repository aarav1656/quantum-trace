// PTB Types Stub
export interface PTBNode {
  id: string;
  type: string;
  position: { x: number; y: number };
}

export interface PTBEdge {
  id: string;
  source: string;
  target: string;
}