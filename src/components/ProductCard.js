import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { StatusPill } from "./StatusPill";

export const ProductCard = ({ product, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(product)}
    >
      {product.thumbnails?.[0] && (
        <Image source={{ uri: product.thumbnails[0] }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {product.title}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="folder-outline" size={12} color={colors.muted} />
              <Text style={styles.metaText}>{product.category || "No category"}</Text>
            </View>
          </View>
          <StatusPill value={product.status} />
        </View>

        <View style={styles.details}>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>GH₵</Text>
            <Text style={styles.priceValue}>
              {Number(product.price || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="cube-outline" size={12} color={colors.muted} />
            <Text style={styles.metaText}>Stock: {product.quantity || 0}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {product.badges && product.badges.length > 0 ? (
            <View style={styles.badges}>
              {product.badges.slice(0, 2).map((badge) => (
                <View key={badge} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          ) : (
             <View style={{ flex: 1 }} />
          )}
          <View style={styles.viewButton}>
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={styles.viewButtonText}>View</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  currency: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  viewButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },
});
