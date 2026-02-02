import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";

const SellerContext = createContext();

// AsyncStorage keys
const AUTH_USER_KEY = "express_seller_user";
const AUTH_ROLE_KEY = "express_seller_role";

// Local fallback categories in case the DB returns empty
const DEFAULT_CATEGORIES = [
  {
    id: "default-fashion",
    name: "Fashion",
    icon: "shirt-outline",
    color: "#F3F6FF",
  },
  {
    id: "default-grocery",
    name: "Grocery",
    icon: "basket-outline",
    color: "#FFF4E5",
  },
  {
    id: "default-beauty",
    name: "Beauty",
    icon: "sparkles-outline",
    color: "#FDF0FF",
  },
  {
    id: "default-electronics",
    name: "Electronics",
    icon: "hardware-chip-outline",
    color: "#E8F4FF",
  },
  { id: "default-home", name: "Home", icon: "home-outline", color: "#EAF7F0" },
];

export const SellerProvider = ({ children }) => {
  // Seed with defaults so UI always has something to show
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get seller ID from user profile
  const getSellerId = useCallback(async () => {
    if (!supabase) return null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Helper to either fetch or create seller row for this user
      const ensureSellerRecord = async () => {
        // Try fetch first
        const { data: existing } = await supabase
          .from("express_sellers")
          .select("id, name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing) return existing;

        const baseName =
          user.user_metadata?.name || user.email?.split("@")[0] || "Seller";
        let candidateName = baseName;
        let attempt = 0;
        while (attempt < 3) {
          const { data: created, error: insertErr } = await supabase
            .from("express_sellers")
            .insert({
              user_id: user.id,
              name: candidateName,
              email: user.email,
              phone: user.user_metadata?.phone || null,
            })
            .select("id, name")
            .single();

          if (!insertErr) return created;

          // Handle unique name collisions by appending suffix
          if (insertErr.code === "23505") {
            attempt += 1;
            candidateName = `${baseName}-${user.id.slice(0, 6 + attempt)}`;
            continue;
          }

          console.error("Error creating seller row:", insertErr);
          return null;
        }
        return null;
      };

      const seller = await ensureSellerRecord();
      return seller;
    } catch (error) {
      console.error("Error getting seller:", error);
      return null;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      await AsyncStorage.removeItem(AUTH_ROLE_KEY);
      setSellerId(null);
      setProfile(null);
      setProducts([]);
      setOrders([]);
      setCategories(DEFAULT_CATEGORIES);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    console.log("fetchAll called, supabase:", !!supabase);
    if (!supabase) return;
    setLoading(true);
    setError("");

    try {
      const seller = await getSellerId();
      if (!seller) {
        setCategories((prev) => (prev.length ? prev : DEFAULT_CATEGORIES));
        setLoading(false);
        return;
      }

      setSellerId(seller.id);

      const [categoriesRes, productsRes, ordersRes, profileRes] =
        await Promise.all([
          supabase.from("express_categories").select("id,name,icon,color"),
          supabase
            .from("express_products")
            .select(
              "id,title,price,category,status,thumbnail,thumbnails,badges,description,discount,sizes,quantity,sold_count,rating,created_at",
            )
            .eq("seller_id", seller.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("express_orders")
            .select(
              "id,order_number,status,total,customer,shipping_address,eta,payment_status,created_at,items:express_order_items(id,title,quantity,price,thumbnail)",
            )
            .eq("seller_id", seller.id)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("express_sellers")
            .select(
              "id,name,email,phone,location,rating,fulfillment_speed,weekly_target,avatar,is_verified,created_at,badges",
            )
            .eq("id", seller.id)
            .single(),
        ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (productsRes.error) throw productsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (profileRes.error && profileRes.error.code !== "PGRST116")
        throw profileRes.error;

      let resolvedCategories = categoriesRes.data || [];

      // If no categories in DB, seed the default ones
      if (resolvedCategories.length === 0) {
        const { data: insertedCategories, error: insertError } = await supabase
          .from("express_categories")
          .insert(
            DEFAULT_CATEGORIES.map((cat) => ({
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
            })),
          )
          .select("id,name,icon,color");

        if (!insertError && insertedCategories) {
          resolvedCategories = insertedCategories;
        } else {
          // Fallback to defaults if insert fails
          resolvedCategories = DEFAULT_CATEGORIES;
        }
      }

      setCategories(resolvedCategories);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setProfile(profileRes.data || null);
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);

      // Use local defaults if categories failed to load
      setCategories((prev) => (prev.length ? prev : DEFAULT_CATEGORIES));
    } finally {
      setLoading(false);
    }
  }, [getSellerId]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!supabase || !sellerId) return;

    // Subscribe to order changes
    const ordersChannel = supabase
      .channel("seller-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "express_orders",
          filter: `seller_id=eq.${sellerId}`,
        },
        (payload) => {
          console.log("Order change:", payload);
          if (payload.eventType === "INSERT") {
            // Fetch full order with items
            supabase
              .from("express_orders")
              .select("*,items:express_order_items(*)")
              .eq("id", payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) setOrders((prev) => [data, ...prev]);
              });
            // Show notification
            Alert.alert(
              "New Order!",
              `Order #${payload.new.order_number} received`,
            );
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? { ...order, ...payload.new }
                  : order,
              ),
            );
          }
        },
      )
      .subscribe();

    // Subscribe to product changes
    const productsChannel = supabase
      .channel("seller-products")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "express_products",
          filter: `seller_id=eq.${sellerId}`,
        },
        (payload) => {
          console.log("Product change:", payload);
          if (payload.eventType === "UPDATE") {
            setProducts((prev) =>
              prev.map((product) =>
                product.id === payload.new.id
                  ? { ...product, ...payload.new }
                  : product,
              ),
            );
            // Notify on status change
            if (payload.old.status !== payload.new.status) {
              const statusMessages = {
                active: "approved and is now live",
                rejected: "rejected",
                pending: "submitted for review",
              };
              const msg = statusMessages[payload.new.status];
              if (msg) {
                Alert.alert(
                  "Product Update",
                  `"${payload.new.title}" has been ${msg}`,
                );
              }
            }
          }
        },
      )
      .subscribe();

    return () => {
      ordersChannel.unsubscribe();
      productsChannel.unsubscribe();
    };
  }, [sellerId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const metrics = useMemo(() => {
    const pendingProducts = products.filter(
      (p) => p.status === "pending",
    ).length;
    const activeProducts = products.filter((p) => p.status === "active").length;
    const draftProducts = products.filter((p) => p.status === "draft").length;
    const revenue = orders
      .filter((o) => o.payment_status === "success")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const inProgressOrders = orders.filter((o) =>
      ["processing", "packed"].includes(o.status),
    ).length;
    const totalSold = products.reduce((sum, p) => sum + (p.sold_count || 0), 0);
    return {
      pendingProducts,
      activeProducts,
      draftProducts,
      revenue,
      inProgressOrders,
      totalSold,
    };
  }, [products, orders]);

  const createProduct = useCallback(
    async ({
      title,
      price,
      category,
      thumbnails,
      badges,
      description,
      discount,
      sizes,
      colors,
      quantity,
      sku,
      weight,
      weight_unit,
      barcode,
      vendor,
      slug,
      compare_at_price,
      cost_price,
      tags,
      track_inventory,
      allow_backorder,
      specifications,
    }) => {
      if (!supabase) {
        Alert.alert("Error", "Not authenticated as seller");
        return;
      }

      // Re-fetch seller id in case local state is stale
      const ensuredSellerId = sellerId || (await getSellerId())?.id;
      if (!ensuredSellerId) {
        Alert.alert(
          "Seller profile missing",
          "We could not find your seller account. Please re-login or contact support.",
        );
        return;
      }

      if (!sellerId) setSellerId(ensuredSellerId);

      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice)) {
        Alert.alert("Invalid price", "Price must be numeric");
        return;
      }

      const categoryObj = categories.find((c) => c.name === category);

      const payload = {
        seller_id: ensuredSellerId,
        vendor: vendor || profile?.name || "Seller",
        title,
        price: numericPrice,
        category,
        category_id: categoryObj?.id || null,
        thumbnail: thumbnails?.[0] || null,
        thumbnails: thumbnails?.length ? thumbnails : null,
        status: "pending",
        badges: badges?.length ? badges : null,
        description: description || null,
        discount: discount || 0,
        sizes: sizes?.length ? sizes : null,
        colors: colors?.length ? colors : null,
        quantity: quantity || 0,
        sku: sku || null,
        weight: weight || null,
        weight_unit: weight_unit || "kg",
        barcode: barcode || null,
        slug: slug || null,
        compare_at_price: compare_at_price || null,
        cost_price: cost_price || null,
        tags: tags?.length ? tags : null,
        track_inventory: track_inventory !== false,
        allow_backorder: allow_backorder === true,
        specifications: specifications || null,
      };

      const { data, error: insertError } = await supabase
        .from("express_products")
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        Alert.alert("Unable to create product", insertError.message);
        return;
      }

      setProducts((prev) => [data, ...prev]);
      return data;
    },
    [sellerId, profile, getSellerId, categories],
  );

  const updateProductStatus = useCallback(async (productId, status) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("express_products")
      .update({ status })
      .eq("id", productId);
    if (updateError) {
      Alert.alert("Unable to update status", updateError.message);
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status } : p)),
    );
  }, []);

  const updateProduct = useCallback(async (productId, updates) => {
    if (!supabase) return;
    const { data, error: updateError } = await supabase
      .from("express_products")
      .update(updates)
      .eq("id", productId)
      .select()
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }
    setProducts((prev) => prev.map((p) => (p.id === productId ? data : p)));
    return data;
  }, []);

  const deleteProduct = useCallback(async (productId) => {
    if (!supabase) return;
    const { error: deleteError } = await supabase
      .from("express_products")
      .delete()
      .eq("id", productId);
    if (deleteError) {
      Alert.alert("Unable to delete product", deleteError.message);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const advanceOrderStatus = useCallback(async (orderId, status) => {
    if (!supabase) return;
    const updates = { status, updated_at: new Date().toISOString() };
    if (status === "shipped") {
      updates.shipped_at = new Date().toISOString();
    } else if (status === "delivered") {
      updates.delivered_at = new Date().toISOString();
    }
    const { error: updateError } = await supabase
      .from("express_orders")
      .update(updates)
      .eq("id", orderId);
    if (updateError) {
      Alert.alert("Unable to update order", updateError.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)),
    );
  }, []);

  const createSupportTicket = useCallback(
    async ({ subject, message, priority }) => {
      if (!supabase || !sellerId) return;
      const body = {
        seller_id: sellerId,
        vendor: profile?.name,
        subject,
        priority: priority || "medium",
        messages: [
          {
            at: new Date().toISOString(),
            author: profile?.name || "Seller",
            body: message,
          },
        ],
      };
      const { error: ticketError } = await supabase
        .from("express_support_tickets")
        .insert(body);
      if (ticketError) {
        Alert.alert("Unable to create ticket", ticketError.message);
        return;
      }
      Alert.alert("Success", "Support ticket created");
    },
    [sellerId, profile],
  );

  const updateProfile = useCallback(
    async (updates) => {
      if (!supabase || !sellerId) return;
      const { data, error: updateError } = await supabase
        .from("express_sellers")
        .update(updates)
        .eq("id", sellerId)
        .select()
        .single();
      if (updateError) {
        Alert.alert("Unable to update profile", updateError.message);
        return;
      }
      setProfile(data);
      Alert.alert("Success", "Profile updated");
    },
    [sellerId],
  );

  const value = {
    categories,
    products,
    orders,
    profile,
    sellerId,
    vendorName: profile?.name || "Seller",
    loading,
    error,
    metrics,
    refresh: fetchAll,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    advanceOrderStatus,
    createSupportTicket,
    updateProfile,
    logout,
  };

  return (
    <SellerContext.Provider value={value}>{children}</SellerContext.Provider>
  );
};

export const useSeller = () => {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error("useSeller must be used inside SellerProvider");
  }
  return context;
};
