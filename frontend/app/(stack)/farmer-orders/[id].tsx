import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
    completeOrder,
    confirmOrder,
    declineOrder,
    fetchOrderById,
    Order,
} from "../../../lib/orderService";

export default function FarmerOrderManagement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await fetchOrderById(id);
      setOrder(data);
    } catch (e) {
      Alert.alert("Error", "Could not load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleUpdateStatus = async (
    action: "confirm" | "decline" | "complete",
  ) => {
    try {
      setActionLoading(true);
      if (action === "confirm") await confirmOrder(id);
      if (action === "decline") await declineOrder(id);
      if (action === "complete") await completeOrder(id);

      Alert.alert("Success", `Order ${action}ed!`);
      loadOrder(); // Refresh to show new status
    } catch (e) {
      Alert.alert("Update Failed", "Could not update order status.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <View className="flex-1 justify-center bg-white dark:bg-black">
        <ActivityIndicator color="#15803d" />
      </View>
    );
  if (!order) return <Text>Order not found.</Text>;

  const isPending = order.status === "pending";
  const isConfirmed = order.status === "confirmed";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black px-6">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>

        <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">
          Order Management
        </Text>
        <Text className="text-3xl font-black text-gray-900 dark:text-white mb-6">
          #{order.id.slice(0, 8)}
        </Text>

        {/* Status Card */}
        <View className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 mb-8 border border-gray-100 dark:border-gray-800">
          <Text className="text-gray-500 dark:text-gray-400 mb-2">
            Current Status
          </Text>
          <Text className="text-2xl font-bold capitalize text-gray-900 dark:text-white">
            {order.status}
          </Text>
        </View>

        {/* Product Details */}
        <Text className="text-lg font-bold mb-4 dark:text-white">
          Items Ordered
        </Text>
        {order.items.map((item, index) => (
          <View
            key={index}
            className="flex-row justify-between items-center mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
          >
            <View>
              <Text className="font-bold text-gray-900 dark:text-white text-lg">
                {item.product_title}
              </Text>
              <Text className="text-gray-500">
                {item.quantity} units requested
              </Text>
            </View>
            <Text className="font-black text-gray-900 dark:text-white">
              ₦{parseFloat(item.unit_price.toString()).toLocaleString()}
            </Text>
          </View>
        ))}

        {/* Buyer Note */}
        {order.note && (
          <View className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
            <Text className="text-orange-800 dark:text-orange-300 font-bold mb-1">
              Buyer's Note:
            </Text>
            <Text className="text-orange-700 dark:text-orange-200">
              {order.note}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons - Sticky at bottom */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-black px-6 pt-4 border-t border-gray-100 dark:border-gray-800"
      >
        {isPending && (
          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={() => handleUpdateStatus("decline")}
              className="flex-1 py-4 rounded-2xl border-2 border-red-500 items-center"
            >
              <Text className="text-red-500 font-bold">Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleUpdateStatus("confirm")}
              className="flex-2 bg-gray-900 dark:bg-white py-4 rounded-2xl items-center px-10"
            >
              <Text className="text-white dark:text-black font-bold text-lg">
                Confirm Order
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isConfirmed && (
          <TouchableOpacity
            onPress={() => handleUpdateStatus("complete")}
            className="w-full bg-green-600 py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-lg">
              Mark as Completed
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
