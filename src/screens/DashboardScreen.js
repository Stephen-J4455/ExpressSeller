import { LinearGradient } from "expo-linear-gradient";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSeller } from "../context/SellerContext";
import { colors } from "../theme/colors";
import { StatCard } from "../components/StatCard";
import { SectionHeader } from "../components/SectionHeader";
import { OrderCard } from "../components/OrderCard";

export const DashboardScreen = () => {
  const navigation = useNavigation();
  const { vendorName, metrics, orders, products, refresh, loading, logout } =
    useSeller();
  const latestOrders = orders.slice(0, 3);
  const trendingProducts = products
    .filter((p) => p.status === "active")
    .slice(0, 3);
  const orderBreakdown = ["processing", "packed", "shipped", "delivered"].map(
    (status) => ({
      status,
      total: orders.filter((o) => o.status === status).length,
    })
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 140 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroKicker}>Welcome back</Text>
            <Text style={styles.heroTitle}>{vendorName}</Text>
            <Text style={styles.heroSubtitle}>
              Let's grow your marketplace footprint today.
            </Text>
          </View>
          {logout && (
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroAction}
            onPress={() => navigation.navigate("Catalog")}
          >
            <Ionicons name="cube" size={18} color="#fff" />
            <Text style={styles.heroActionText}>Add product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroAction}
            onPress={() => navigation.navigate("Orders")}
          >
            <Ionicons name="bicycle" size={18} color="#fff" />
            <Text style={styles.heroActionText}>Fulfillment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroAction}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="chatbox-ellipses" size={18} color="#fff" />
            <Text style={styles.heroActionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <StatCard
          label="Active products"
          value={metrics.activeProducts}
          hint={`${metrics.pendingProducts} awaiting approval`}
          tone="primary"
        />
        <StatCard
          label="Revenue (lifetime)"
          value={`GH₵${metrics.revenue.toLocaleString()}`}
          hint={`${metrics.inProgressOrders} orders in progress`}
          tone="success"
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Total Sold"
          value={metrics.totalSold || 0}
          hint="Items delivered"
          tone="success"
        />
        <StatCard
          label="Catalog"
          value={`${products.length} items`}
          hint="Keep it fresh"
          tone="accent"
        />
      </View>

      <SectionHeader
        title="Control center"
        subtitle="Fast actions for daily ops"
      />
      <View style={styles.controlGrid}>
        <TouchableOpacity
          style={styles.controlCard}
          onPress={() => navigation.navigate("Catalog")}
        >
          <Ionicons name="add-circle" size={22} color={colors.primary} />
          <Text style={styles.controlTitle}>New listing</Text>
          <Text style={styles.controlHint}>Draft and request approval</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlCard}
          onPress={() => navigation.navigate("Orders")}
        >
          <Ionicons name="time" size={22} color={colors.primary} />
          <Text style={styles.controlTitle}>Fulfillment lane</Text>
          <Text style={styles.controlHint}>Advance orders to delivered</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlCard}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="help-buoy" size={22} color={colors.primary} />
          <Text style={styles.controlTitle}>Create ticket</Text>
          <Text style={styles.controlHint}>Reach admin support fast</Text>
        </TouchableOpacity>
      </View>

      <SectionHeader
        title="Latest orders"
        subtitle="Track fulfillment momentum"
      />
      {latestOrders.length ? (
        <View style={styles.cardStack}>
          {latestOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No orders yet.</Text>
      )}

      <SectionHeader
        title="Trending products"
        subtitle="Performance snapshot"
      />
      {trendingProducts.length ? (
        <View style={styles.trending}>
          {trendingProducts.map((item) => (
            <View key={item.id} style={styles.trendingCard}>
              <Text style={styles.trendingTitle}>{item.title}</Text>
              <Text style={styles.trendingMeta}>{item.category}</Text>
              <Text style={styles.trendingPrice}>
                GH₵{Number(item.price || 0).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>Activate products to see insights.</Text>
      )}

      <SectionHeader
        title="Fulfillment lanes"
        subtitle="Realtime status distribution"
      />
      <View style={styles.lanes}>
        {orderBreakdown.map(({ status, total }) => (
          <View key={status} style={styles.laneCard}>
            <Text style={styles.laneLabel}>{status}</Text>
            <Text style={styles.laneValue}>{total}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
    padding: 16,
    paddingTop: 50,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroKicker: {
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 8,
  },
  heroActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  heroAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
  },
  heroActionText: {
    color: "#fff",
    fontWeight: "700",
  },
  logoutButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
  controlGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  controlCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E4E8F0",
    gap: 6,
  },
  controlTitle: {
    fontWeight: "800",
    color: colors.dark,
  },
  controlHint: {
    color: colors.muted,
    fontSize: 12,
  },
  cardStack: {
    gap: 14,
    marginBottom: 24,
  },
  trending: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  trendingCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    width: "48%",
    borderWidth: 1,
    borderColor: "#E4E8F0",
  },
  trendingTitle: {
    fontWeight: "700",
    color: colors.dark,
  },
  trendingMeta: {
    marginTop: 4,
    color: colors.muted,
  },
  trendingPrice: {
    marginTop: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  empty: {
    color: colors.muted,
    marginBottom: 24,
  },
  lanes: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  laneCard: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E8F0",
    width: "48%",
  },
  laneLabel: {
    color: colors.muted,
    textTransform: "capitalize",
  },
  laneValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
    marginTop: 4,
  },
});
