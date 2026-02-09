import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../supabase";
import { useSeller } from "../context/SellerContext";
import { useToast } from "../context/ToastContext";
import { colors } from "../theme/colors";

export const SellerChatsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { chats, loading, refresh, sellerId, reviews, products, replyToReview, refreshData } = useSeller();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('messages');

  // Feedback state
  const [replyText, setReplyText] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    if (sellerId) {
      fetchStatuses();
    }
  }, [sellerId]);

  const fetchStatuses = async () => {
    if (!sellerId) return;
    try {
      const { data, error } = await supabase
        .from('express_seller_statuses')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStatuses(data);
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    await fetchStatuses();
    if (refreshData) await refreshData();
    setRefreshing(false);
  };

  const getProductName = (productId) => {
    const product = products?.find((p) => p.id === productId);
    return product ? product.title : "Unknown Product";
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      await replyToReview(selectedReview.id, replyText);
      toast.success("Your reply has been posted!");
      setReplyText("");
      setSelectedReview(null);
      if (refreshData) refreshData();
    } catch (error) {
      toast.error("Could not post reply");
    }
  };

  const handleDeleteStatus = (status) => {
    setStatusToDelete(status);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!statusToDelete) return;
    setDeleteConfirmVisible(false);
    deleteStatus(statusToDelete);
  };

  const deleteStatus = async (status) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('express_seller_statuses')
        .delete()
        .eq('id', status.id);

      if (error) throw error;

      // Delete from storage
      if (status.media_url) {
        const urlParts = status.media_url.split('/seller-statuses/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0];
          await supabase.storage
            .from('seller-statuses')
            .remove([filePath]);
        }
      }

      // Update local state
      setStatuses(statuses.filter(s => s.id !== status.id));
      toast.success('Status deleted successfully');
    } catch (error) {
      console.error('Error deleting status:', error);
      toast.error('Failed to delete status');
    }
  };

  const renderConversation = ({ item }) => {
    const userName = item.user?.full_name || item.user?.email || "Customer";
    const lastMessageText = item.last_message || "No messages yet";
    const timestamp = item.last_message_at ? new Date(item.last_message_at) : new Date(item.created_at);

    return (
      <Pressable
        style={styles.conversationItem}
        onPress={() =>
          navigation.navigate("SellerChat", { conversation: item })
        }
      >
        <View style={styles.avatar}>
          {item.user?.avatar_url ? (
            <Image
              source={{ uri: item.user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.timestamp}>
              {timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessageText}
          </Text>
        </View>
        <View style={styles.rightAction}>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Pressable>
    );
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>
              {(item.express_profiles?.full_name || "U").charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.reviewUserName}>{item.express_profiles?.full_name || "Anonymous"}</Text>
            <Text style={styles.reviewProductName}>{getProductName(item.product_id)}</Text>
          </View>
        </View>
        <View style={[styles.ratingPill, { backgroundColor: item.rating >= 4 ? '#DCFCE7' : '#FEF3C7' }]}>
          <Ionicons name="star" size={12} color={item.rating >= 4 ? '#22C55E' : '#F59E0B'} />
          <Text style={[styles.ratingText, { color: item.rating >= 4 ? '#22C55E' : '#F59E0B' }]}>{item.rating}</Text>
        </View>
      </View>

      <Text style={styles.reviewComment}>{item.comment}</Text>
      <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>

      <TouchableOpacity
        style={styles.replyReviewButton}
        onPress={() => setSelectedReview(item)}
      >
        <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
        <Text style={styles.replyReviewButtonText}>Reply to Customer</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Messages & Reviews</Text>
            <View style={styles.headerSubtitleRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>Customer Support</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addStatusButton}
            onPress={() => navigation.navigate('StatusCreator')}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Status Management */}
        {statuses.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusScroll}
            contentContainerStyle={styles.statusScrollContent}
          >
            {statuses.map((status) => (
              <View key={status.id} style={styles.statusItem}>
                <TouchableOpacity
                  style={styles.statusThumbnailContainer}
                  onPress={() => {/* View status details */ }}
                  activeOpacity={0.8}
                >
                  {status.status_type === 'text' ? (
                    status.gradient_start ? (
                      <LinearGradient
                        colors={[status.gradient_start, status.gradient_end || status.gradient_start]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statusThumbnail}
                      >
                        <Text
                          style={[
                            styles.statusThumbnailText,
                            { color: status.text_color || '#fff' }
                          ]}
                          numberOfLines={3}
                        >
                          {status.status_text}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.statusThumbnail,
                          { backgroundColor: status.background_color || '#FF6B6B' }
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusThumbnailText,
                            { color: status.text_color || '#fff' }
                          ]}
                          numberOfLines={3}
                        >
                          {status.status_text}
                        </Text>
                      </View>
                    )
                  ) : (
                    <Image
                      source={{ uri: status.media_url }}
                      style={styles.statusThumbnail}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.deleteStatusButton}
                    onPress={() => handleDeleteStatus(status)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </TouchableOpacity>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusTime}>
                    {new Date(status.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  <Text style={styles.statusExpiry}>
                    {Math.round((new Date(status.expires_at) - new Date()) / (1000 * 60 * 60))}h left
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Tabs */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabItem, activeTab === 'messages' && styles.tabItemActive]}
            onPress={() => setActiveTab('messages')}
          >
            <Ionicons
              name="chatbubbles"
              size={18}
              color={activeTab === 'messages' ? colors.primary : colors.muted}
            />
            <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
              Messages
            </Text>
            {chats?.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{chats.length}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[styles.tabItem, activeTab === 'feedback' && styles.tabItemActive]}
            onPress={() => setActiveTab('feedback')}
          >
            <Ionicons
              name="star"
              size={18}
              color={activeTab === 'feedback' ? colors.primary : colors.muted}
            />
            <Text style={[styles.tabText, activeTab === 'feedback' && styles.tabTextActive]}>
              Reviews
            </Text>
            {reviews?.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{reviews.length}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {activeTab === 'messages' ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={48}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                When customers message you,{"\n"}they will appear here.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="star-outline"
                  size={48}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>
                Customer reviews will{"\n"}appear here.
              </Text>
            </View>
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Status?</Text>
            <Text style={styles.modalMessage}>This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reply to Review Modal */}
      {selectedReview && (
        <View style={styles.replyModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.replyContainer}
          >
            <View style={styles.replyHeader}>
              <Text style={styles.replyTitle}>Replying to {selectedReview.express_profiles?.full_name || "Customer"}</Text>
              <TouchableOpacity onPress={() => setSelectedReview(null)}>
                <Ionicons name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply here..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity style={styles.sendReplyButton} onPress={handleReply}>
              <Text style={styles.sendReplyButtonText}>Send Reply</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      )}
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
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addStatusButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.dark,
    letterSpacing: -0.5,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
    fontSize: 17,
    fontWeight: "700",
    color: colors.dark,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '400',
  },
  rightAction: {
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  statusScroll: {
    marginTop: 16,
  },
  statusScrollContent: {
    gap: 12,
  },
  statusItem: {
    width: 100,
  },
  statusThumbnailContainer: {
    position: 'relative',
  },
  statusThumbnail: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  statusThumbnailText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  deleteStatusButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statusInfo: {
    marginTop: 6,
  },
  statusTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.dark,
  },
  statusExpiry: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.light,
  },
  cancelButtonText: {
    color: colors.dark,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Tab styles
  tabBar: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.light,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: `${colors.primary}15`,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Review styles
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontWeight: '800',
    color: colors.primary,
    fontSize: 16,
  },
  reviewUserName: {
    fontWeight: '700',
    color: colors.dark,
    fontSize: 15,
  },
  reviewProductName: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  reviewComment: {
    fontSize: 14,
    color: colors.dark,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 16,
  },
  replyReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  replyReviewButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Reply modal styles
  replyModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  replyContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  replyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  replyInput: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
    fontSize: 15,
  },
  sendReplyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendReplyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
