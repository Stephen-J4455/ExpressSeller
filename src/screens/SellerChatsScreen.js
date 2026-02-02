import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../supabase";
import { useSeller } from "../context/SellerContext";
import { colors } from "../theme/colors";

export const SellerChatsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { seller } = useSeller();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
    setupRealtimeSubscription();
  }, [seller]);

  const fetchConversations = async () => {
    if (!seller) return;

    try {
      const { data, error } = await supabase
        .from("express_chat_conversations")
        .select(
          `
          *,
          user:express_profiles!user_id(id, full_name, email)
        `,
        )
        .eq("seller_id", seller.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!seller) return;

    const channel = supabase
      .channel(`seller-chats-${seller.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "express_chat_conversations",
          filter: `seller_id=eq.${seller.id}`,
        },
        () => {
          fetchConversations();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "express_chat_conversations",
          filter: `seller_id=eq.${seller.id}`,
        },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderConversation = ({ item }) => {
    const lastMessage = item.last_message?.[0];
    const userName = item.user?.full_name || item.user?.email || "Customer";

    return (
      <Pressable
        style={styles.conversationItem}
        onPress={() =>
          navigation.navigate("SellerChat", { conversation: item })
        }
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.muted} />
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.timestamp}>
              {lastMessage
                ? new Date(lastMessage.created_at).toLocaleDateString()
                : new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage?.message || "No messages yet"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Chats</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-outline"
              size={64}
              color={colors.muted}
            />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Customer chats will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.light,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 16,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark,
  },
  listContainer: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: colors.muted,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.muted,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.muted,
  },
});
