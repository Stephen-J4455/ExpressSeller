import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

const toneMap = {
  pending: colors.warning,
  active: colors.success,
  draft: colors.muted,
  rejected: colors.danger,
  processing: colors.info,
  packed: colors.secondary,
  shipped: colors.primary,
  delivered: colors.success,
  canceled: colors.danger,
};

export const StatusPill = ({ value }) => {
  const normalized = value?.toLowerCase?.() || "pending";
  const tone = toneMap[normalized] || colors.muted;
  return (
    <View style={[styles.pill, { backgroundColor: tone + "22" }]}>
      <Text style={[styles.text, { color: tone }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
