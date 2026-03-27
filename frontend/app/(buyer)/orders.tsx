import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import OrderCard from "../../components/OrderCard";
import { fetchOrders, Order } from "../../lib/orderService";

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      // Guard: fetchOrders may return undefined/null/non-array on error or empty state
      const list: Order[] = Array.isArray(data) ? data : [];
      const sortedData = list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setOrders(sortedData);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, []);

  const handleOrderPress = (id: string) => {
    router.push(`/buyer-orders/${id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black px-5">
      <View className="pt-4 pb-2">
        <Text className="text-3xl font-extrabold text-gray-900 dark:text-white">
          My Orders
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-1">
          Track your fresh produce purchases
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={handleOrderPress} />
          )}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F97316"
            />
          }
          ListEmptyComponent={
            <View className="mt-24 items-center px-8">
              <View className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 items-center justify-center mb-4">
                <Ionicons name="receipt-outline" size={36} color="#FB923C" />
              </View>
              <Text className="text-gray-700 dark:text-gray-300 text-lg font-bold text-center">
                No orders yet
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-center mt-2">
                Your order history will appear here once you make a purchase.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}