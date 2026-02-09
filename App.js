import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { SellerProvider, useSeller } from "./src/context/SellerContext";
import { ToastProvider } from "./src/context/ToastContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { CatalogScreen } from "./src/screens/CatalogScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { OrderDetailScreen } from "./src/screens/OrderDetailScreen";
import { SellerChatsScreen } from "./src/screens/SellerChatsScreen";
import { SellerChatScreen } from "./src/screens/SellerChatScreen";
import { StatusCreatorScreen } from "./src/screens/StatusCreatorScreen";
import SellerLoginScreen from "./src/screens/SellerLoginScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import { colors } from "./src/theme/colors";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { LoadingAnimation } from "./src/components/LoadingAnimation";
import React, { useState, useEffect } from "react";

import PasswordResetScreen from "./src/screens/PasswordResetScreen";
import * as Linking from "expo-linking";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL("/"), "expressseller://"],
  config: {
    screens: {
      Login: "login",
      ForgotPassword: "forgot-password",
      PasswordReset: "reset-password",
    },
  },
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.light,
    card: "#fff",
    text: colors.dark,
    primary: colors.primary,
    border: "transparent",
  },
};

const icons = {
  Overview: "speedometer",
  Catalog: "pricetags",
  Orders: "cube",
  Chats: "chatbubble",
  Feedback: "star",
  Profile: "person",
};

const normalizeRole = (role) =>
  typeof role === "string" && role.trim().length ? role.toLowerCase() : null;

const MissingConfig = () => (
  <View style={styles.center}>
    <Ionicons name="cloud-offline-outline" size={64} color={colors.primary} />
    <Text style={[styles.title, { marginTop: 16 }]}>Supabase missing</Text>
    <Text style={styles.subtitle}>
      Open supabase.js and drop in your project URL and anon key.
    </Text>
  </View>
);

const SellerStack = ({ onLogout }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs">
      {props => <SellerTabs {...props} onLogout={onLogout} />}
    </Stack.Screen>
    <Stack.Screen name="SellerChat" component={SellerChatScreen} />
    <Stack.Screen name="StatusCreator" component={StatusCreatorScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
  </Stack.Navigator>
);
const SellerTabs = ({ onLogout }) => {
  const { metrics } = useSeller();
  const orderBadge =
    metrics.inProgressOrders > 0
      ? metrics.inProgressOrders > 99
        ? "99+"
        : String(metrics.inProgressOrders)
      : undefined;

  return (
    <Tab.Navigator
      sceneContainerStyle={styles.scene}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={icons[route.name] || "ellipse"}
            size={size}
            color={color}
          />
        ),
        tabBarBadge: route.name === "Orders" ? orderBadge : undefined,
        tabBarBadgeStyle: styles.badge,
      })}
    >
      <Tab.Screen name="Overview" component={DashboardScreen} />
      <Tab.Screen name="Catalog" component={CatalogScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Chats" component={SellerChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={SellerLoginScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
  </Stack.Navigator>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Handle deep links for password reset
  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;

      try {
        // Extract tokens from URL hash or query
        let params = null;
        if (url.includes("#")) {
          const hash = url.split("#")[1];
          params = new URLSearchParams(hash);
        } else if (url.includes("?")) {
          const query = url.split("?")[1];
          params = new URLSearchParams(query);
        }

        if (params) {
          const accessToken = params.get("access_token");
          const type = params.get("type");

          if (accessToken && type === "recovery") {
            setIsResettingPassword(true);

            // Set session
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get("refresh_token") || "",
            });

            if (error) console.error("Error setting session:", error);
          }
        }
      } catch (e) {
        console.error("Deep link error:", e);
      }
    };

    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  // AsyncStorage keys
  const AUTH_USER_KEY = "express_seller_user";
  const AUTH_ROLE_KEY = "express_seller_role";

  // Store authentication state
  const storeAuthState = async (user, role) => {
    try {
      const normalizedRole = normalizeRole(role);
      if (user) {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        await AsyncStorage.setItem(
          AUTH_ROLE_KEY,
          normalizedRole ? normalizedRole : "",
        );
      } else {
        await AsyncStorage.removeItem(AUTH_USER_KEY);
        await AsyncStorage.removeItem(AUTH_ROLE_KEY);
      }
    } catch (error) {
      console.error("Error storing auth state:", error);
    }
  };

  // Retrieve authentication state
  const getStoredAuthState = async () => {
    try {
      const userString = await AsyncStorage.getItem(AUTH_USER_KEY);
      const roleString = await AsyncStorage.getItem(AUTH_ROLE_KEY);
      if (userString) {
        return {
          user: JSON.parse(userString),
          role: roleString || null,
        };
      }
    } catch (error) {
      console.error("Error retrieving auth state:", error);
    }
    return null;
  };

  useEffect(() => {
    // Supabase handles session persistence automatically with our configuration
    // Just listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsResettingPassword(true);
      }

      const newUser = session?.user ?? null;
      const newRole = normalizeRole(newUser?.user_metadata?.role || null);

      setUser(newUser);
      setUserRole(newRole);
      setLoading(false);

      // Store auth state for backup (optional)
      await storeAuthState(newUser, newRole);
    });

    // Initial check
    const checkInitialAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        setUserRole(normalizeRole(user?.user_metadata?.role || null));
      } catch (error) {
        console.error("Error checking initial auth:", error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkInitialAuth();

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear stored auth state
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      await AsyncStorage.removeItem(AUTH_ROLE_KEY);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!supabase) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.scene}>
          <MissingConfig />
        </View>
      </SafeAreaProvider>
    );
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoadingAnimation />
      </SafeAreaProvider>
    );
  }

  if (isResettingPassword) {
    return (
      <SafeAreaProvider>
        <ToastProvider>
          <PasswordResetScreen onComplete={() => setIsResettingPassword(false)} />
        </ToastProvider>
      </SafeAreaProvider>
    );
  }

  const isSeller = user && userRole === "seller";
  const isOtherRole = user && userRole && userRole !== "seller";

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <SellerProvider>
          <NotificationProvider userId={user?.id}>
            <NavigationContainer theme={navTheme} linking={linking}>
              <StatusBar style="dark" />
              {isSeller ? (
                <View style={styles.appBackground}>
                  <SellerStack onLogout={handleLogout} />
                </View>
              ) : isOtherRole ? (
                <View style={styles.scene}>
                  <View style={styles.center}>
                    <Ionicons
                      name="storefront-outline"
                      size={80}
                      color={colors.secondary}
                      style={{ marginBottom: 16 }}
                    />
                    <Text style={styles.title}>Access Denied</Text>
                    <Text style={styles.subtitle}>
                      You do not have seller privileges.
                    </Text>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={handleLogout}
                    >
                      <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <AuthStack />
              )}
            </NavigationContainer>
          </NotificationProvider>
        </SellerProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    backgroundColor: colors.light,
    paddingTop: Platform.OS === "ios" ? 50 : 0,
  },
  scene: {
    flex: 1,
    backgroundColor: colors.light,
    paddingTop: Platform.OS === "ios" ? 50 : 0,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    marginHorizontal: 16,
    borderRadius: 28,
    height: 70,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    shadowColor: colors.dark,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 12,
    position: "absolute",
    bottom: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabLabel: {
    fontWeight: "700",
    fontSize: 12,
  },
  tabBarItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  badge: {
    backgroundColor: colors.warning,
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.dark,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    color: colors.muted,
    textAlign: "center",
  },
});
