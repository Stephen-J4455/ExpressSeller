import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSeller } from "../context/SellerContext";
import { colors } from "../theme/colors";

const BADGE_CONFIG = {
  verified: { label: "Verified", icon: "checkmark-circle", color: "#10B981" },
  top_seller: { label: "Top Seller", icon: "trophy", color: "#F59E0B" },
  fast_shipping: { label: "Fast Shipping", icon: "flash", color: "#3B82F6" },
  eco_friendly: { label: "Eco Friendly", icon: "leaf", color: "#22C55E" },
  local: { label: "Local", icon: "location", color: "#8B5CF6" },
  trending: { label: "Trending", icon: "trending-up", color: "#EC4899" },
  premium: { label: "Premium", icon: "star", color: "#EAB308" },
};

export const ProfileScreen = () => {
  const { profile, categories, metrics, createSupportTicket } = useSeller();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const submitTicket = async () => {
    if (!subject || !message) return;
    setSubmitting(true);
    await createSupportTicket({ subject, message, priority });
    setSubject("");
    setMessage("");
    setPriority("medium");
    setSubmitting(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 140 }}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{profile?.name || "Seller"}</Text>
        <Text style={styles.subtitle}>{profile?.email || "Add contact"}</Text>

        {profile?.badges && profile.badges.length > 0 && (
          <View style={styles.badgeContainer}>
            {profile.badges.map((badgeId) => {
              const badge = BADGE_CONFIG[badgeId];
              if (!badge) return null;
              return (
                <View
                  key={badgeId}
                  style={[
                    styles.badge,
                    { backgroundColor: badge.color + "20" },
                  ]}
                >
                  <Ionicons name={badge.icon} size={14} color={badge.color} />
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {badge.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.row}>
          <View>
            <Text style={styles.metaLabel}>Rating</Text>
            <Text style={styles.metaValue}>{profile?.rating || "--"}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Weekly target</Text>
            <Text style={styles.metaValue}>${profile?.weekly_target || 0}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Fulfillment</Text>
            <Text style={styles.metaValue}>
              {profile?.fulfillment_speed || "Standard"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Category coverage</Text>
        <View style={styles.tagGrid}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.tag}>
              <Text style={styles.tagTitle}>{cat.name}</Text>
              <Text style={styles.tagSubtitle}>
                Live items: {metrics.activeProducts}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Need support?</Text>
        <Text style={styles.subtitle}>
          Create a ticket and our admin team will respond quickly.
        </Text>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="e.g. Featured placement"
        />
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, { height: 120 }]}
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Share details..."
        />

        <View style={styles.priorityRow}>
          {[
            { key: "low", label: "Low" },
            { key: "medium", label: "Medium" },
            { key: "high", label: "High" },
          ].map(({ key, label }) => (
            <Pressable
              key={key}
              style={[
                styles.priorityChip,
                priority === key && styles.priorityChipActive,
              ]}
              onPress={() => setPriority(key)}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === key && styles.priorityTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={submitTicket}
          disabled={submitting || !subject || !message}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Send ticket</Text>
          )}
        </Pressable>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4E8F0",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.dark,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.dark,
    marginTop: 4,
    fontWeight: "700",
  },
  section: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 12,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 12,
    flexBasis: "48%",
  },
  tagTitle: {
    fontWeight: "700",
    color: colors.dark,
  },
  tagSubtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: "600",
    color: colors.dark,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8DDE8",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8DDE8",
  },
  priorityChipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  priorityText: {
    color: colors.dark,
    fontWeight: "600",
  },
  priorityTextActive: {
    color: "#fff",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
