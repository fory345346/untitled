import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MinecraftAPI, ServerInfo } from "../services/MinecraftAPIClient";

interface ServerScannerProps {
  onConnect: (ip: string, port: number) => void;
  isConnected: boolean;
  connectedServer?: string;
}

export const ServerScanner: React.FC<ServerScannerProps> = ({
  onConnect,
  isConnected,
  connectedServer,
}) => {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!isConnected) {
      scanForServers();
    }
  }, [isConnected]);

  const scanForServers = async () => {
    setIsScanning(true);
    setServers([]);
    
    // Progress animation
    Animated.timing(scanProgress, {
      toValue: 1,
      duration: 8000,
      useNativeDriver: false,
    }).start();

    try {
      const foundServers = await MinecraftAPI.findServers();
      setServers(foundServers);
    } catch (error) {
      console.error("Scan failed:", error);
      // Don't show error to user, just log it
    } finally {
      setIsScanning(false);
      scanProgress.setValue(0);
    }
  };

  const renderServer = ({ item }: { item: ServerInfo }) => (
    <TouchableOpacity
      style={[
        styles.serverItem,
        connectedServer === `${item.ip}:${item.port}` && styles.connectedServer
      ]}
      onPress={() => onConnect(item.ip, item.port)}
      disabled={isConnected}
    >
      <View style={styles.serverInfo}>
        <Text style={styles.playerName}>
          {item.isOnline ? "🎮" : "😴"} {item.playerName}
        </Text>
        <Text style={styles.serverAddress}>{item.ip}:{item.port}</Text>
        <Text style={[styles.status, item.isOnline ? styles.online : styles.offline]}>
          {item.isOnline ? "In Game" : "Offline"}
        </Text>
      </View>
      <View style={styles.connectButton}>
        <Text style={styles.connectText}>
          {connectedServer === `${item.ip}:${item.port}` ? "✓" : "→"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.connectedContainer}>
          <Text style={styles.connectedText}>🟢 Connected to {connectedServer}</Text>
          <TouchableOpacity style={styles.scanButton} onPress={scanForServers}>
            <Text style={styles.scanButtonText}>🔄 Scan Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Servers</Text>
        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.scanningButton]} 
          onPress={scanForServers}
          disabled={isScanning}
        >
          {isScanning ? (
            <View style={styles.scanningContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Scanning...</Text>
            </View>
          ) : (
            <Text style={styles.scanButtonText}>🔍 Find Servers</Text>
          )}
        </TouchableOpacity>
      </View>

      {isScanning && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: scanProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Scanning local network...</Text>
        </View>
      )}

      {servers.length > 0 ? (
        <View style={styles.serverListContainer}>
          <FlatList
            data={servers}
            renderItem={renderServer}
            keyExtractor={(item) => `${item.ip}:${item.port}`}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      ) : !isScanning ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🔍</Text>
          <Text style={styles.emptyTitle}>No Servers Found</Text>
          <Text style={styles.emptySubtitle}>
            Make sure Minecraft with mod is running
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    margin: 16,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scanButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scanningButton: {
    backgroundColor: "#555555",
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  scanningContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#333333",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
  },
  serverListContainer: {
    maxHeight: 300,
  },
  serverItem: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  connectedServer: {
    backgroundColor: "#1a4a1a",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  serverInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  serverAddress: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: "500",
  },
  online: {
    color: "#4CAF50",
  },
  offline: {
    color: "#FF9800",
  },
  connectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  connectText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
  connectedContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  connectedText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 16,
  },
});