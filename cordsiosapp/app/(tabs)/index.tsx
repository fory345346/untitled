import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { CoordinatesDisplay } from "../../components/CoordinatesDisplay";
import { ServerScanner } from "../../components/ServerScanner";
import { MinecraftAPI } from "../../services/MinecraftAPIClient";
import { PlayerCoordinates } from "../../types/minecraft";

const REFRESH_INTERVAL = 500; // 500ms as requested

// Request network permissions for Android
const requestNetworkPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      // These permissions are already declared in AndroidManifest.xml
      // and are considered "normal" permissions that don't require runtime request
      // on modern Android versions
      return true;
    } catch (err) {
      console.warn('Permission check failed:', err);
      return false;
    }
  }
  return true; // iOS doesn't need these permissions
};

export default function HomeScreen() {
  const [coordinates, setCoordinates] = useState<PlayerCoordinates | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedServer, setConnectedServer] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const apiRef = useRef<MinecraftAPI | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Request permissions on app start
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        const granted = await requestNetworkPermissions();
        setPermissionsGranted(granted);
      } catch (error) {
        console.error("Failed to initialize permissions:", error);
        setPermissionsGranted(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePermissions();
  }, []);

  // Fade in animation
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start updates silently
  const startUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (apiRef.current && isConnected) {
        try {
          const coords = await apiRef.current.fetchCoordinates();
          setCoordinates(coords);
          setLastUpdate(Date.now());
        } catch (error) {
          console.error("Failed to fetch coordinates:", error);
          // Don't disconnect immediately, just log the error
          // Only disconnect after multiple consecutive failures
        }
      }
    }, REFRESH_INTERVAL);
  };

  const stopUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleConnect = async (ip: string, port: number) => {
    if (!permissionsGranted) {
      Alert.alert(
        'Permissions Required',
        'Network permissions are required to connect to Minecraft servers. Please restart the app and grant permissions.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const api = new MinecraftAPI(ip, port);

      // Test connection
      await api.checkHealth();

      // Get initial coordinates
      const coords = await api.fetchCoordinates();

      apiRef.current = api;
      setCoordinates(coords);
      setIsConnected(true);
      setConnectedServer(`${ip}:${port}`);
      setLastUpdate(Date.now());

      // Start updates
      startUpdates();

    } catch (error) {
      console.error("Connection failed:", error);
      Alert.alert(
        'Connection Failed',
        'Could not connect to the server. Please check if the server is running and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisconnect = () => {
    stopUpdates();
    apiRef.current = null;
    setCoordinates(null);
    setIsConnected(false);
    setConnectedServer("");
    setLastUpdate(0);
  };

  const getConnectionStatus = () => {
    if (!isConnected) return "Not Connected";
    if (!lastUpdate) return "Waiting for data";

    const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
    if (secondsAgo < 2) return "🟢 Connected";
    if (secondsAgo < 10) return `🟡 ${secondsAgo}s ago`;
    return "🔴 No data";
  };

  // Get server name from coordinates or fallback to IP
  const getServerName = () => {
    if (coordinates?.playerName) {
      return `${coordinates.playerName}'s Server`;
    }
    return connectedServer;
  };

  // Show loading screen
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Minecraft Tracker</Text>
            <Text style={styles.subtitle}>Live coordinate tracking</Text>

            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{getConnectionStatus()}</Text>
              {isConnected && (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={handleDisconnect}
                >
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Main content */}
          <View style={styles.mainContent}>
            {!permissionsGranted && (
              <View style={styles.permissionWarning}>
                <Text style={styles.permissionText}>
                  ⚠️ Network permissions required for server discovery
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={async () => {
                    const granted = await requestNetworkPermissions();
                    setPermissionsGranted(granted);
                  }}
                >
                  <Text style={styles.retryText}>Retry Permissions</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isConnected && (
              <ServerScanner
                onConnect={handleConnect}
                isConnected={isConnected}
                connectedServer={connectedServer}
              />
            )}

            <CoordinatesDisplay
              coordinates={coordinates}
              isConnected={isConnected}
            />

            {isConnected && coordinates && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Last Update</Text>
                  <Text style={styles.statValue}>
                    {lastUpdate ? new Date(lastUpdate).toLocaleTimeString("en-US") : "—"}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Playing On</Text>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                    {getServerName()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#888888",
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#888888",
  },
  disconnectButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disconnectText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  mainContent: {
    flex: 1,
  },
  permissionWarning: {
    backgroundColor: "#FF9500",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  permissionText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  retryText: {
    color: "#FF9500",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#888888",
  },
  statValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
});