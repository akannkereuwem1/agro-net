// components/OrderCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Order } from "../lib/orderService";

interface Props {
  order: Order;
  onPress: (id: string) => void;
}

export default function OrderCard({ order, onPress }: Props) {
  // Logic for status colors
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" };
      case "confirmed":
        return { bg: "bg-blue-100", text: "text-blue-700", label: "Confirmed" };
      case "declined":
        return { bg: "bg-red-100", text: "text-red-700", label: "Declined" };
      case "completed":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          label: "Completed",
        };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", label: status };
    }
  };

  const statusStyle = getStatusStyles(order.status);
  const firstItem = order.items[0]; // Assuming most orders have at least one item

  return (
    <TouchableOpacity
      onPress={() => onPress(order.id)}
      activeOpacity={0.7}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 border border-gray-100 dark:border-gray-800 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-2">
          <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
            Order #{order.id.slice(0, 8)}
          </Text>
          <Text
            className="text-lg font-bold text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {firstItem?.product_title || "Multiple Items"}
          </Text>
        </View>
        <View className={`${statusStyle.bg} px-3 py-1 rounded-full`}>
          <Text className={`${statusStyle.text} text-xs font-bold uppercase`}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-2 pt-3 border-t border-gray-50 dark:border-gray-800">
        <View>
          <Text className="text-gray-400 dark:text-gray-500 text-xs">
            Total Amount
          </Text>
          <Text className="text-lg font-black text-gray-900 dark:text-white">
            ₦{parseFloat(order.total_price.toString()).toLocaleString()}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Text className="text-gray-400 dark:text-gray-500 text-xs mr-1">
            View Details
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
