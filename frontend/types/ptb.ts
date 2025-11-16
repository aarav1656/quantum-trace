// PTB Types Stub
export enum PTBNodeType {
  TRANSFER_OBJECTS = 'transfer_objects',
  SPLIT_COINS = 'split_coins',
  MERGE_COINS = 'merge_coins',
  MOVE_CALL = 'move_call',
  PUBLISH = 'publish'
}

export interface PTBNode {
  id: string;
  type: PTBNodeType | string;
  position: { x: number; y: number };
}

export interface PTBEdge {
  id: string;
  source: string;
  target: string;
}

export interface PTBConnection {
  id: string;
  fromNode: string;
  toNode: string;
  port?: string;
}