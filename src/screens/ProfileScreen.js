import { useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSeller } from "../context/SellerContext";
import { colors } from "../theme/colors";
import { supabase } from "../../supabase";

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
  const {
    profile,
    categories,
    products,
    metrics,
    createSupportTicket,
    updateProfile,
  } = useSeller();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || "");
  const [editEmail, setEditEmail] = useState(profile?.email || "");
  const [editPhone, setEditPhone] = useState(profile?.phone || "");
  const [editLocation, setEditLocation] = useState(profile?.location || "");
  const [editFulfillmentSpeed, setEditFulfillmentSpeed] = useState(
    profile?.fulfillment_speed || "",
  );
  const [editWeeklyTarget, setEditWeeklyTarget] = useState(
    profile?.weekly_target?.toString() || "",
  );
  const [editAvatar, setEditAvatar] = useState(profile?.avatar || "");
  const [editFacebook, setEditFacebook] = useState(
    profile?.social_facebook || "",
  );
  const [editInstagram, setEditInstagram] = useState(
    profile?.social_instagram || "",
  );
  const [editTwitter, setEditTwitter] = useState(profile?.social_twitter || "");
  const [editWhatsapp, setEditWhatsapp] = useState(
    profile?.social_whatsapp || "",
  );
  const [editWebsite, setEditWebsite] = useState(profile?.social_website || "");
  const [saving, setSaving] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts = {};
    products
      .filter((p) => p.status === "active")
      .forEach((product) => {
        const category = product.category;
        counts[category] = (counts[category] || 0) + 1;
      });
    return counts;
  }, [products]);

  useEffect(() => {
    if (!editing) {
      setEditName(profile?.name || "");
      setEditEmail(profile?.email || "");
      setEditPhone(profile?.phone || "");
      setEditLocation(profile?.location || "");
      setEditFulfillmentSpeed(profile?.fulfillment_speed || "");
      setEditWeeklyTarget(profile?.weekly_target?.toString() || "");
      setEditAvatar(profile?.avatar || "");
      setEditFacebook(profile?.social_facebook || "");
      setEditInstagram(profile?.social_instagram || "");
      setEditTwitter(profile?.social_twitter || "");
      setEditWhatsapp(profile?.social_whatsapp || "");
      setEditWebsite(profile?.social_website || "");
    }
  }, [profile, editing]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const ext = uri.split(".").pop() || "jpg";
      const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const fileData = new Uint8Array(arrayBuffer);
      const { data, error } = await supabase.storage
        .from("express-products")
        .upload(fileName, fileData, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("express-products")
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      let avatarUrl = editAvatar;
      if (
        editAvatar &&
        editAvatar !== profile?.avatar &&
        !editAvatar.startsWith("http")
      ) {
        avatarUrl = await uploadImage(editAvatar);
      }
      const updates = {
        name: editName,
        email: editEmail,
        phone: editPhone,
        location: editLocation,
        fulfillment_speed: editFulfillmentSpeed,
        weekly_target: editWeeklyTarget ? parseFloat(editWeeklyTarget) : null,
        avatar: avatarUrl,
        social_facebook: editFacebook,
        social_instagram: editInstagram,
        social_twitter: editTwitter,
        social_whatsapp: editWhatsapp,
        social_website: editWebsite,
      };
      await updateProfile(updates);
      setEditing(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setEditName(profile?.name || "");
    setEditEmail(profile?.email || "");
    setEditPhone(profile?.phone || "");
    setEditLocation(profile?.location || "");
    setEditFulfillmentSpeed(profile?.fulfillment_speed || "");
    setEditWeeklyTarget(profile?.weekly_target?.toString() || "");
    setEditAvatar(profile?.avatar || "");
    setEditFacebook(profile?.social_facebook || "");
    setEditInstagram(profile?.social_instagram || "");
    setEditTwitter(profile?.social_twitter || "");
    setEditWhatsapp(profile?.social_whatsapp || "");
    setEditWebsite(profile?.social_website || "");
    setEditing(true);
  };

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
        <View style={styles.header}>
          {editing ? (
            <View style={styles.avatarEdit}>
              <Pressable onPress={pickImage} style={styles.avatarContainer}>
                {editAvatar ? (
                  <Image source={{ uri: editAvatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={40} color={colors.muted} />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </Pressable>
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => setEditing(false)}
                  style={styles.cancelButton}
                >
                  <Ionicons name="close" size={20} color={colors.muted} />
                </Pressable>
                <Pressable
                  onPress={saveProfile}
                  style={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.headerView}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={40} color={colors.muted} />
                </View>
              )}
              <Pressable onPress={startEditing} style={styles.editButton}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Store Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Store name"
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              keyboardType="email-address"
            />
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="Store location"
            />
            <Text style={styles.label}>Fulfillment Speed</Text>
            <TextInput
              style={styles.input}
              value={editFulfillmentSpeed}
              onChangeText={setEditFulfillmentSpeed}
              placeholder="e.g., Same day, 2-3 days"
            />
            <Text style={styles.label}>Weekly Target ($)</Text>
            <TextInput
              style={styles.input}
              value={editWeeklyTarget}
              onChangeText={setEditWeeklyTarget}
              placeholder="Target revenue"
              keyboardType="numeric"
            />

            <Text style={styles.sectionTitle}>Social Media Links</Text>
            <Text style={styles.label}>Facebook</Text>
            <TextInput
              style={styles.input}
              value={editFacebook}
              onChangeText={setEditFacebook}
              placeholder="https://facebook.com/yourpage"
              keyboardType="url"
            />
            <Text style={styles.label}>Instagram</Text>
            <TextInput
              style={styles.input}
              value={editInstagram}
              onChangeText={setEditInstagram}
              placeholder="https://instagram.com/yourhandle"
              keyboardType="url"
            />
            <Text style={styles.label}>Twitter/X</Text>
            <TextInput
              style={styles.input}
              value={editTwitter}
              onChangeText={setEditTwitter}
              placeholder="https://twitter.com/yourhandle"
              keyboardType="url"
            />
            <Text style={styles.label}>WhatsApp</Text>
            <TextInput
              style={styles.input}
              value={editWhatsapp}
              onChangeText={setEditWhatsapp}
              placeholder="+1234567890"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={editWebsite}
              onChangeText={setEditWebsite}
              placeholder="https://yourwebsite.com"
              keyboardType="url"
            />
          </View>
        ) : (
          <>
            <Text style={styles.title}>{profile?.name || "Seller"}</Text>
            <Text style={styles.subtitle}>
              {profile?.email || "Add contact"}
            </Text>
            {profile?.phone && (
              <Text style={styles.subtitle}>{profile.phone}</Text>
            )}
            {profile?.location && (
              <Text style={styles.subtitle}>{profile.location}</Text>
            )}

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
                      <Ionicons
                        name={badge.icon}
                        size={14}
                        color={badge.color}
                      />
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
                <Text style={styles.metaValue}>
                  ${profile?.weekly_target || 0}
                </Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>Fulfillment</Text>
                <Text style={styles.metaValue}>
                  {profile?.fulfillment_speed || "Standard"}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Category coverage</Text>
        <View style={styles.tagGrid}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.tag}>
              <Text style={styles.tagTitle}>{cat.name}</Text>
              <Text style={styles.tagSubtitle}>
                Live items: {categoryCounts[cat.name] || 0}
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
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    padding: 8,
  },
  avatarEdit: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    padding: 10,
    backgroundColor: colors.light,
    borderRadius: 8,
  },
  saveButton: {
    padding: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  editForm: {
    marginTop: 10,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
    marginTop: 24,
    marginBottom: 12,
  },
});
