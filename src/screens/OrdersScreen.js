import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSeller } from "../context/SellerContext";
import { colors } from "../theme/colors";
import { OrderCard } from "../components/OrderCard";
import { SectionHeader } from "../components/SectionHeader";

const statusFilters = [
  "processing",
  "packed",
  "shipped",
  "delivered",
  "canceled",
];

export const OrdersScreen = () => {
  const { orders, refresh, loading, advanceOrderStatus } = useSeller();
  const [filter, setFilter] = useState("processing");
  const [searchQuery, setSearchQuery] = useState("");
  const statusSummary = statusFilters.map((status) => ({
    status,
    total: orders.filter((order) => {
      if (status === "processing")
        return ["processing", "packed"].includes(order.status);
      if (status === "shipped")
        return ["shipped", "delivered"].includes(order.status);
      return order.status === status;
    }).length,
  }));

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter
    if (filter === "processing") {
      filtered = filtered.filter((order) =>
        ["processing", "packed"].includes(order.status)
      );
    } else if (filter === "shipped") {
      filtered = filtered.filter((order) =>
        ["shipped", "delivered"].includes(order.status)
      );
    } else {
      filtered = filtered.filter((order) => order.status === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (order) =>
          order.id?.toLowerCase().includes(query) ||
          order.customer_name?.toLowerCase().includes(query) ||
          order.customer_email?.toLowerCase().includes(query) ||
          order.items?.some((item) => item.title?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [orders, filter, searchQuery]);

  const nextStatus = {
    processing: "packed",
    packed: "shipped",
    shipped: "delivered",
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <SectionHeader title="Orders" subtitle="Manage fulfillment" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryRow}
      >
        {statusSummary.map(({ status, total }) => (
          <View key={status} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{status}</Text>
            <Text style={styles.summaryValue}>{total}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.muted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.muted}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filters}>
        {statusFilters.map((status) => (
          <Pressable
            key={status}
            style={[
              styles.filterChip,
              filter === status && styles.filterChipActive,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                filter === status && styles.filterTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={{ gap: 16, paddingBottom: 140 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders in this lane.</Text>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            footer={
              nextStatus[item.status] ? (
                <Pressable
                  style={styles.progressButton}
                  onPress={() =>
                    advanceOrderStatus(item.id, nextStatus[item.status])
                  }
                >
                  <Text style={styles.progressText}>
                    Mark as {nextStatus[item.status]}
                  </Text>
                </Pressable>
              ) : item.status === "delivered" ? (
                <Text style={styles.success}>Delivered</Text>
              ) : null
            }
          />
        )}
      />
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
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E4E8F0",
  },
  filterChipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  filterText: {
    color: colors.dark,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D8DDE8",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.dark,
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    paddingRight: 6,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E4E8F0",
    minWidth: 110,
  },
  summaryLabel: {
    color: colors.muted,
    textTransform: "capitalize",
  },
  summaryValue: {
    fontWeight: "800",
    color: colors.dark,
    fontSize: 18,
    marginTop: 4,
  },
  empty: {
    color: colors.muted,
    marginTop: 40,
  },
  progressButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  progressText: {
    color: "#fff",
    fontWeight: "700",
  },
  success: {
    marginTop: 18,
    color: colors.success,
    fontWeight: "700",
  },
});
