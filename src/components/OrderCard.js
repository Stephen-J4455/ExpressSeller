import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { StatusPill } from "./StatusPill";

export const OrderCard = ({ order, onPress, footer }) => {
  return (
    <Pressable style={styles.card} onPress={() => onPress?.(order)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>#{order.order_number}</Text>
        <Text style={styles.meta}>{order.customer?.name || "Guest"}</Text>
        <Text style={styles.price}>${Number(order.total || 0).toFixed(2)}</Text>
        {footer}
      </View>
      <StatusPill value={order.status} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4E8F0",
    flexDirection: "row",
    gap: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
  },
  meta: {
    marginTop: 4,
    color: colors.muted,
  },
  price: {
    marginTop: 10,
    color: colors.primary,
    fontWeight: "700",
  },
});
