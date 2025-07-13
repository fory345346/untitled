export interface PlayerCoordinates {
  x: number;
  y: number;
  z: number;
  dimension: string;
  timestamp: number;
  playerName: string;
}

export interface ApiResponse {
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: number;
}

export interface InfoResponse {
  mod: string;
  version: string;
  endpoints: string[];
}

export interface ConnectionStatus {
  connected: boolean;
  lastUpdate: number;
  error?: string;
}

export interface ServerInfo {
  ip: string;
  port: number;
  playerName: string;
  isOnline: boolean;
}