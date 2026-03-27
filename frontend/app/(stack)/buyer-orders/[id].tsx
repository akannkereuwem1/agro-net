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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchOrderById, Order } from "../../../lib/orderService";
import { initiatePayment } from "../../../lib/paymentService"; // Make sure you created this from the previous step

export default function BuyerOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

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

  const handlePayNow = async () => {
    try {
      setIsPaying(true);
      const paymentData = await initiatePayment(order!.id);
      
      // TODO: Open Interswitch WebView Modal using paymentData.checkout_params
      console.log("Proceed to Interswitch with:", paymentData);
      
      Alert.alert(
        "Payment Initiated", 
        "This is where the Interswitch screen would pop up. (WebView implementation needed)."
      );
      
    } catch (error) {
      Alert.alert("Payment Error", "Could not start the payment process.");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return <View className="flex-1 justify-center bg-gray-50 dark:bg-black"><ActivityIndicator color="#F57C00" /></View>;
  if (!order) return <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-black"><Text className="dark:text-white">Order not found.</Text></View>;

  const isConfirmed = order.status === "confirmed";
  const isPending = order.status === "pending";

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center px-5 py-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#1F2937" className="dark:text-white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">Order Details</Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Status Banner */}
        <View className={`p-5 rounded-2xl mb-6 flex-row items-center ${
          isPending ? 'bg-gray-100 dark:bg-gray-800' :
          isConfirmed ? 'bg-orange-100 dark:bg-orange-900/40' :
          order.status === 'completed' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
        }`}>
          <Ionicons 
            name={isConfirmed ? "wallet" : isPending ? "time" : order.status === 'completed' ? "checkmark-circle" : "close-circle"} 
            size={32} 
            color={isConfirmed ? "#C2410C" : isPending ? "#4B5563" : order.status === 'completed' ? "#15803D" : "#B91C1C"} 
          />
          <View className="ml-4 flex-1">
            <Text className="text-lg font-bold text-gray-900 dark:text-white capitalize">{order.status}</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {isPending ? "Waiting for the farmer to confirm stock." :
               isConfirmed ? "Farmer confirmed! Please proceed to payment." :
               order.status === 'completed' ? "Order completed successfully." : "This order was declined."}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Items</Text>
        <View className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          {order.items.map((item, index) => (
            <View key={index} className={`flex-row justify-between items-center ${index !== order.items.length - 1 ? 'border-b border-gray-50 dark:border-gray-800 pb-4 mb-4' : ''}`}>
              <View className="flex-1 pr-4">
                <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">{item.product_title}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</Text>
              </View>
              <Text className="text-base font-black text-gray-900 dark:text-white">
                ₦{parseFloat(item.unit_price.toString()).toLocaleString()}
              </Text>
            </View>
          ))}
          <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Text className="text-gray-500 dark:text-gray-400 font-bold">Total</Text>
            <Text className="text-2xl font-black text-orange-500">
              ₦{parseFloat(order.total_price.toString()).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Farmer Details */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Seller Info</Text>
        <View className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Ionicons name="person-circle-outline" size={24} color="#9CA3AF" />
            <Text className="text-base text-gray-900 dark:text-white ml-3 font-medium">Verified Farmer</Text>
          </View>
          <Text className="text-sm text-gray-500 dark:text-gray-400 ml-9">
            ID: {order.farmer.slice(0, 12)}...
          </Text>
        </View>

      </ScrollView>

      {/* Action Bar */}
      {isConfirmed && (
        <View style={{ paddingBottom: Math.max(insets.bottom, 20) }} className="absolute bottom-0 w-full bg-white dark:bg-gray-900 px-5 pt-4 border-t border-gray-100 dark:border-gray-800 shadow-lg">
          <TouchableOpacity
            onPress={handlePayNow}
            disabled={isPaying}
            className="w-full bg-orange-500 py-4 rounded-xl items-center shadow-md active:opacity-90"
          >
            {isPaying ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">Pay ₦{parseFloat(order.total_price.toString()).toLocaleString()}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}