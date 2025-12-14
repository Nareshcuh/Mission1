export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface AudioVisualizerData {
  volume: number;
}