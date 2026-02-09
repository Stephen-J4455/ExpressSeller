import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSeller } from "../context/SellerContext";
import { useToast } from "../context/ToastContext";
import { colors } from "../theme/colors";
import { Header } from "../components/Header";

export const FeedbackScreen = () => {
    const { reviews, products, replyToReview, refreshData, loading } = useSeller();
    const toast = useToast();
    const [replyText, setReplyText] = useState("");
    const [selectedReview, setSelectedReview] = useState(null);

    const getProductName = (productId) => {
        const product = products.find((p) => p.id === productId);
        return product ? product.title : "Unknown Product";
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;

        try {
            await replyToReview(selectedReview.id, replyText);
            toast.success("Your reply has been posted!");
            setReplyText("");
            setSelectedReview(null);
            refreshData();
        } catch (error) {
            toast.error("Could not post reply");
        }
    };

    const renderReviewItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(item.express_profiles?.full_name || "U").charAt(0)}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.express_profiles?.full_name || "Anonymous"}</Text>
                        <Text style={styles.productName}>{getProductName(item.product_id)}</Text>
                    </View>
                </View>
                <StatusPill rating={item.rating} />
            </View>

            <Text style={styles.commentText}>{item.comment}</Text>
            <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>

            <TouchableOpacity
                style={styles.replyButton}
                onPress={() => setSelectedReview(item)}
            >
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                <Text style={styles.replyButtonText}>Reply to Customer</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header title="Customer Feedback" />

            <FlatList
                data={reviews}
                keyExtractor={(item) => item.id}
                renderItem={renderReviewItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="star-outline" size={64} color={colors.muted} />
                        <Text style={styles.emptyText}>No reviews yet</Text>
                    </View>
                }
            />

            {selectedReview && (
                <View style={styles.modalOverlay}>
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
                            style={styles.input}
                            placeholder="Type your reply here..."
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleReply}>
                            <Text style={styles.sendButtonText}>Send Reply</Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            )}
        </View>
    );
};

const StatusPill = ({ rating }) => (
    <View style={[styles.pill, { backgroundColor: rating >= 4 ? colors.successLight : colors.warningLight }]}>
        <Ionicons name="star" size={12} color={rating >= 4 ? colors.success : colors.warning} />
        <Text style={[styles.pillText, { color: rating >= 4 ? colors.success : colors.warning }]}>{rating}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E4E8F0",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontWeight: "800",
        color: colors.primary,
    },
    userName: {
        fontWeight: "700",
        color: colors.dark,
    },
    productName: {
        fontSize: 12,
        color: colors.muted,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    pillText: {
        fontSize: 12,
        fontWeight: "800",
    },
    commentText: {
        fontSize: 14,
        color: colors.dark,
        lineHeight: 20,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 12,
        color: colors.muted,
        marginBottom: 16,
    },
    replyButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    replyButtonText: {
        color: colors.primary,
        fontWeight: "600",
        fontSize: 14,
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    replyContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
    },
    replyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    replyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.dark,
    },
    input: {
        backgroundColor: colors.light,
        borderRadius: 12,
        padding: 16,
        height: 120,
        textAlignVertical: "top",
        marginBottom: 16,
    },
    sendButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    sendButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: colors.muted,
        fontSize: 16,
        fontWeight: "600",
    },
});
