import { HealthResponse, PlayerCoordinates } from "../types/minecraft";

export interface ServerInfo {
  ip: string;
  port: number;
  playerName: string;
  isOnline: boolean;
}

export class MinecraftAPI {
  private baseURL: string;
  private timeout: number;

  constructor(computerIP: string, port: number = 8080, timeout: number = 3000) {
    this.baseURL = "http://" + computerIP + ":" + port;
    this.timeout = timeout;
  }

  async fetchCoordinates(): Promise<PlayerCoordinates> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.baseURL + "/coords", {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch coordinates`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      throw error;
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.baseURL + "/health", {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Server not responding`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error checking health:", error);
      throw error;
    }
  }

  // Поиск серверов в локальной сети
  static async findServers(port: number = 8080): Promise<ServerInfo[]> {
    const servers: ServerInfo[] = [];
    const baseIPs = await MinecraftAPI.getLocalNetworkBases();
    
    console.log("Scanning networks:", baseIPs);
    
    for (const baseIP of baseIPs) {
      const promises: Promise<ServerInfo | null>[] = [];
      
      // Сканируем популярные IP адреса сначала
      const priorityIPs = [1, 100, 101, 102, 103, 104, 105, 110, 150, 200];
      const allIPs = [...priorityIPs, ...Array.from({length: 254}, (_, i) => i + 1)
        .filter(i => !priorityIPs.includes(i))];
      
      for (const i of allIPs.slice(0, 30)) { // Уменьшаем до 30 IP для стабильности
        const ip = baseIP + "." + i;
        promises.push(MinecraftAPI.testServer(ip, port));
      }
      
      const results = await Promise.allSettled(promises);
      
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          servers.push(result.value);
        }
      }
    }
    
    return servers;
  }

  private static async testServer(ip: string, port: number): Promise<ServerInfo | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // Уменьшаем timeout

      // Сначала проверяем health
      const healthResponse = await fetch(`http://${ip}:${port}/health`, {
        signal: controller.signal,
        method: "GET",
      });

      if (!healthResponse.ok) {
        clearTimeout(timeoutId);
        return null;
      }

      // Затем получаем координаты для никнейма
      const coordsResponse = await fetch(`http://${ip}:${port}/coords`, {
        signal: controller.signal,
        method: "GET",
      });

      clearTimeout(timeoutId);

      if (coordsResponse.ok) {
        const coords = await coordsResponse.json();
        return {
          ip,
          port,
          playerName: coords.playerName || "Unknown Player",
          isOnline: true,
        };
      }

      return {
        ip,
        port,
        playerName: "Player Offline",
        isOnline: false,
      };
    } catch (error) {
      // Игнорируем ошибки для неактивных серверов
      return null;
    }
  }

  private static async getLocalNetworkBases(): Promise<string[]> {
    // Упрощенная версия без WebRTC для стабильности
    const bases = ["192.168.1", "192.168.0", "10.0.0", "172.16.0"];
    
    try {
      // Пытаемся определить IP через простой запрос
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const ip = data.ip;
        
        // Извлекаем базовый IP
        const parts = ip.split('.');
        if (parts.length === 4) {
          const baseIP = parts.slice(0, 3).join('.');
          if (baseIP.startsWith("192.168.") || 
              baseIP.startsWith("10.") || 
              baseIP.startsWith("172.")) {
            return [baseIP, ...bases.filter(b => b !== baseIP)];
          }
        }
      }
    } catch (error) {
      console.log("Could not determine local network, using defaults");
    }
    
    return bases;
  }
}