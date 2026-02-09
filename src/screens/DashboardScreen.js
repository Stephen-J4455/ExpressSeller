import { LinearGradient } from "expo-linear-gradient";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSeller } from "../context/SellerContext";
import { colors } from "../theme/colors";
import { StatCard } from "../components/StatCard";
import { SectionHeader } from "../components/SectionHeader";
import { OrderCard } from "../components/OrderCard";
import { StatusPill } from "../components/StatusPill";

const { width } = Dimensions.get("window");

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
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroKicker}>Merchant Portal</Text>
            <Text style={styles.heroTitle}>{vendorName}</Text>
            <Text style={styles.heroSubtitle}>
              Monitoring your store's performance and fulfillment.
            </Text>
          </View>
          {logout && (
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.heroActions}>
          <View style={styles.heroChip}>
            <Ionicons name="storefront" size={16} color="#fff" />
            <Text style={styles.heroChipText}>Store Active</Text>
          </View>
          <TouchableOpacity style={styles.heroAction} onPress={refresh}>
            <Ionicons name="sync" size={16} color="#fff" />
            <Text style={styles.heroActionText}>Sync Data</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard
          label="Active Products"
          value={metrics.activeProducts}
          hint={`${metrics.pendingProducts} pending approval`}
          trend="+2.4%"
          tone="primary"
        />
        <StatCard
          label="Total Sold"
          value={metrics.totalSold || 0}
          hint="Items delivered"
          trend="+5.1%"
          tone="info"
        />
        <StatCard
          label="Gross Revenue"
          value={`GH₵${metrics.revenue.toLocaleString()}`}
          hint={`${metrics.inProgressOrders} active orders`}
          trend="+12.7%"
          tone="success"
        />
        <StatCard
          label="Catalog"
          value={`${products.length} Items`}
          hint="Keep it updated"
          trend="+1.2%"
          tone="accent"
        />
      </View>

      <View style={styles.controlsSection}>
        <View style={styles.controlCard}>
          <Text style={styles.controlTitle}>Fulfillment Lanes</Text>
          {orderBreakdown.map(({ status, total }) => (
            <View key={status} style={styles.controlRow}>
              <Text style={styles.controlLabel}>{status}</Text>
              <StatusPill value={total.toString()} />
            </View>
          ))}
        </View>

        <View style={styles.controlCard}>
          <Text style={styles.controlTitle}>Store Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.controlAction}
              onPress={() => navigation.navigate("Catalog")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="add-circle" size={20} color={colors.primary} />
              </View>
              <Text style={styles.controlActionText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlAction}
              onPress={() => navigation.navigate("Orders")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="bicycle" size={20} color={colors.info} />
              </View>
              <Text style={styles.controlActionText}>Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlAction}
              onPress={() => navigation.navigate("Profile")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="help-buoy" size={20} color={colors.success} />
              </View>
              <Text style={styles.controlActionText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlAction}
              onPress={() => navigation.navigate("StatusCreator")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="camera" size={20} color={colors.accent} />
              </View>
              <Text style={styles.controlActionText}>Post Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlAction} onPress={refresh}>
              <View style={[styles.actionIcon, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="refresh-circle" size={20} color={colors.warning} />
              </View>
              <Text style={styles.controlActionText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SectionHeader
        title="Recent Orders"
        subtitle="Manage incoming fulfillment"
      />
      <View style={styles.listContainer}>
        {latestOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {!latestOrders.length ? (
          <Text style={styles.empty}>No recent orders found.</Text>
        ) : null}
      </View>

      <SectionHeader
        title="Performance Snapshot"
        subtitle="Your top performing items"
      />
      <View style={styles.cardGrid}>
        {trendingProducts.map((item) => (
          <View key={item.id} style={styles.trendingCard}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.category || "General"}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>GH₵</Text>
              <Text style={styles.priceValue}>
                {Number(item.price || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
        {!trendingProducts.length ? (
          <Text style={styles.empty}>No trending products identified.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 120,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroKicker: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "85%",
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
  },
  heroChipText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  heroAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
  },
  heroActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  controlsSection: {
    gap: 12,
    marginBottom: 24,
    marginTop: 4,
  },
  controlCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  controlTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  controlLabel: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 14,
    textTransform: "capitalize",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  controlAction: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    width: (width - 64 - 36) / 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  controlActionText: {
    color: colors.dark,
    fontWeight: "700",
    fontSize: 10,
    textAlign: "center",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  trendingCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    width: (width - 32 - 12) / 2,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.dark,
  },
  cardMeta: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  currency: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.primary,
  },
  listContainer: {
    gap: 12,
    marginBottom: 24,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    padding: 20,
  },
});
