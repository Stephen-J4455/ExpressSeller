import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export const StatCard = ({ label, value, hint, tone = "primary" }) => {
  return (
    <View
      style={[styles.card, { backgroundColor: tones[tone] || tones.primary }]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

const tones = {
  primary: colors.primary,
  accent: colors.accent,
  success: colors.success,
  info: colors.info,
  warning: colors.warning,
  danger: colors.danger,
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    minWidth: 150,
  },
  label: {
    color: "#fff",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  value: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 8,
  },
  hint: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 6,
    fontSize: 13,
  },
});
