import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { PlayerCoordinates } from "../types/minecraft";

interface CoordinatesDisplayProps {
  coordinates: PlayerCoordinates | null;
  isConnected: boolean;
}

export const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({
  coordinates,
  isConnected,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (coordinates) {
      // Pulse animation on coordinate update
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [coordinates?.x, coordinates?.y, coordinates?.z]);

  const formatCoord = (value: number): string => {
    return value.toFixed(1);
  };

  const getDimensionInfo = (dimension: string) => {
    switch (dimension.toLowerCase()) {
      case "overworld":
        return { color: "#4CAF50", emoji: "🌍", name: "Overworld" };
      case "nether":
        return { color: "#FF5722", emoji: "🔥", name: "Nether" };
      case "end":
        return { color: "#9C27B0", emoji: "🌌", name: "End" };
      default:
        return { color: "#2196F3", emoji: "🗺️", name: dimension };
    }
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.disconnectedCard}>
          <Text style={styles.disconnectedIcon}>🔌</Text>
          <Text style={styles.disconnectedText}>Not Connected</Text>
        </View>
      </View>
    );
  }

  if (!coordinates) {
    return (
      <View style={styles.container}>
        <View style={styles.waitingCard}>
          <Text style={styles.waitingIcon}>📡</Text>
          <Text style={styles.waitingText}>Waiting for data...</Text>
        </View>
      </View>
    );
  }

  const dimensionInfo = getDimensionInfo(coordinates.dimension);

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <View style={styles.card}>
        {/* Header with player and dimension badge */}
        <View style={styles.header}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>🎮 {coordinates.playerName}</Text>
            <View style={[styles.dimensionBadge, { backgroundColor: dimensionInfo.color }]}>
              <Text style={styles.dimensionEmoji}>{dimensionInfo.emoji}</Text>
              <Text style={styles.dimensionText}>{dimensionInfo.name}</Text>
            </View>
          </View>
        </View>

        {/* Current coordinates in Nether format */}
        <View style={styles.coordsContainer}>
          <Text style={styles.coordsText}>
            <Text style={styles.dimensionEmoji}>{dimensionInfo.emoji}</Text>
            <Text style={styles.coordValue}> {dimensionInfo.name}: {formatCoord(coordinates.x)}, {formatCoord(coordinates.y)}, {formatCoord(coordinates.z)}</Text>
          </Text>
        </View>

        {/* Additional info - conversion coordinates */}
        {(coordinates.dimension.toLowerCase() === "overworld" || coordinates.dimension.toLowerCase() === "nether") && (
          <View style={styles.infoContainer}>
            {coordinates.dimension.toLowerCase() === "overworld" && (
              <Text style={styles.infoText}>
                🔥 Nether: {(coordinates.x / 8).toFixed(1)}, {coordinates.y.toFixed(1)}, {(coordinates.z / 8).toFixed(1)}
              </Text>
            )}
            
            {coordinates.dimension.toLowerCase() === "nether" && (
              <Text style={styles.infoText}>
                🌍 Overworld: {(coordinates.x * 8).toFixed(1)}, {coordinates.y.toFixed(1)}, {(coordinates.z * 8).toFixed(1)}
              </Text>
            )}
          </View>
        )}

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          Updated: {new Date(coordinates.timestamp).toLocaleTimeString("en-US")}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
  },
  disconnectedCard: {
    backgroundColor: "#2a1a1a",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444444",
  },
  waitingCard: {
    backgroundColor: "#1a1a2a",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444444",
  },
  disconnectedIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  waitingIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  disconnectedText: {
    fontSize: 16,
    color: "#888888",
  },
  waitingText: {
    fontSize: 16,
    color: "#888888",
  },
  header: {
    marginBottom: 24,
  },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  dimensionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  dimensionEmoji: {
    fontSize: 14,
  },
  dimensionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  coordsContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    minHeight: 60,
    justifyContent: "center",
  },
  coordsText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  coordValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
  },
  timestamp: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
});