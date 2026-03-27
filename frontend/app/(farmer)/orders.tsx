import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchOrders, Order } from "../../lib/orderService";

export default function FarmerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      
      // FIX: Map correctly from the paginated "results" array
      const list: Order[] = data && Array.isArray(data.results) ? data.results : [];
      
      const sortedData = list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setOrders(sortedData);
    } catch (error) {
      console.error("Farmer Orders Load Error:", error);
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

  const renderOrderCard = ({ item }: { item: Order }) => {
    const isPending = item.status === "pending";

    return (
      <TouchableOpacity
        onPress={() => router.push(`/farmer-orders/${item.id}`)}
        activeOpacity={0.8}
        className="bg-white dark:bg-gray-900 rounded-3xl p-5 mb-4 border border-gray-100 dark:border-gray-800 shadow-sm"
      >
        <View className="flex-row justify-between items-center mb-4">
          <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
            <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold">
              #{item.id.slice(0, 8)}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${
              isPending
                ? "bg-orange-100"
                : item.status === "confirmed"
                  ? "bg-blue-100"
                  : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase ${
                isPending
                  ? "text-orange-700"
                  : item.status === "confirmed"
                    ? "text-blue-700"
                    : "text-gray-600"
              }`}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {item.items && item.items[0]?.product_title ? item.items[0].product_title : "Bulk Order"}
        </Text>

        <View className="flex-row items-center mb-4">
          <Ionicons name="person-outline" size={14} color="#9CA3AF" />
          <Text className="text-gray-500 ml-1 text-sm">
            Buyer: {item.buyer.slice(0, 8)}...
          </Text>
        </View>

        <View className="flex-row justify-between items-end pt-4 border-t border-gray-50 dark:border-gray-800">
          <View>
            <Text className="text-gray-400 text-xs uppercase font-bold">
              Payout
            </Text>
            <Text className="text-2xl font-black text-gray-900 dark:text-white">
              ₦{parseFloat(item.total_price.toString()).toLocaleString()}
            </Text>
          </View>

          {isPending && (
            <View className="bg-orange-500 rounded-full p-2">
              <Ionicons name="flash" size={18} color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-gray-50 dark:bg-black px-5">
      <View className="pt-4 mb-6">
        <Text className="text-3xl font-black text-gray-900 dark:text-white">
          Sales
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 font-medium">
          Manage your incoming orders
        </Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#15803d" className="mt-10" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#15803d"
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 text-lg font-medium mt-4">
                No orders found.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}