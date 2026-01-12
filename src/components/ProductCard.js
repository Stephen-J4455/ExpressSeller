import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { StatusPill } from "./StatusPill";

export const ProductCard = ({ product, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={() => onPress?.(product)}>
      {product.thumbnails?.[0] && (
        <Image source={{ uri: product.thumbnails[0] }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={styles.meta}>{product.category || "No category"}</Text>
          </View>
          <StatusPill value={product.status} />
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag" size={14} color={colors.muted} />
            <Text style={styles.detailText}>
              ${Number(product.price || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cube" size={14} color={colors.muted} />
            <Text style={styles.detailText}>
              Stock: {product.quantity || 0}
            </Text>
          </View>
          {product.sku && (
            <View style={styles.detailItem}>
              <Ionicons name="barcode" size={14} color={colors.muted} />
              <Text style={styles.detailText} numberOfLines={1}>
                {product.sku}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {product.badges && product.badges.length > 0 && (
            <View style={styles.badges}>
              {product.badges.slice(0, 2).map((badge) => (
                <View key={badge} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
              {product.badges.length > 2 && (
                <Text style={styles.moreBadges}>
                  +{product.badges.length - 2}
                </Text>
              )}
            </View>
          )}
          <Pressable
            style={styles.viewButton}
            onPress={() => onPress?.(product)}
          >
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#F3F4F6",
  },
  content: {
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 4,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: colors.dark,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: colors.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  moreBadges: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.light,
  },
  viewButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
});
