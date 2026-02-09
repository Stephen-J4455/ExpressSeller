import { StyleSheet, Text, View, Platform } from "react-native";
import { colors } from "../theme/colors";

export const Header = ({ title }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: colors.dark,
        letterSpacing: -0.5,
    },
});
