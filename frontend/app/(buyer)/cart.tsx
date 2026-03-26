import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { createOrder } from "../../lib/orderService";
import { useCartStore } from "../../store/cartStore";

// Renders a styled placeholder when no image URL is available
function ProductImagePlaceholder() {
  return (
    <View className="w-20 h-20 rounded-xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center border border-orange-100 dark:border-orange-800">
      <Ionicons name="leaf-outline" size={28} color="#F97316" />
    </View>
  );
}

export default function Cart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } =
    useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    try {
      setIsSubmitting(true);

      for (const item of items) {
        await createOrder({
          product_id: item.id,
          quantity: item.cartQuantity,
          note: "Order placed via mobile app",
        });
      }

      Alert.alert("Success!", "Your orders have been placed successfully.", [
        {
          text: "View Orders",
          onPress: () => {
            clearCart();
            router.push("/(buyer)/orders");
          },
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Order Failed",
        "Something went wrong while placing your order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center bg-white dark:bg-gray-900 p-4 rounded-2xl mb-3 border border-gray-100 dark:border-gray-800">
      {/* Thumbnail or placeholder */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          className="w-20 h-20 rounded-xl bg-gray-100"
        />
      ) : (
        <ProductImagePlaceholder />
      )}

      {/* Info */}
      <View className="flex-1 ml-4">
        <Text
          className="text-base font-bold text-gray-900 dark:text-white mb-0.5"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text className="text-orange-500 font-semibold text-sm mb-2">
          ₦{parseFloat(item.price_per_unit).toLocaleString()}{" "}
          <Text className="text-gray-400 font-normal">/ {item.unit}</Text>
        </Text>

        {/* Stepper */}
        <View className="flex-row items-center self-start bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <TouchableOpacity
            onPress={() =>
              updateQuantity(item.id, Math.max(1, item.cartQuantity - 1))
            }
            className="w-9 h-9 items-center justify-center"
          >
            <Ionicons name="remove" size={16} color="#6B7280" />
          </TouchableOpacity>
          <Text className="w-8 text-center font-bold text-gray-900 dark:text-white text-sm">
            {item.cartQuantity}
          </Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, item.cartQuantity + 1)}
            className="w-9 h-9 items-center justify-center"
          >
            <Ionicons name="add" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtotal + Delete */}
      <View className="items-end ml-2 gap-2">
        <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
          ₦
          {(
            parseFloat(item.price_per_unit) * item.cartQuantity
          ).toLocaleString()}
        </Text>
        <TouchableOpacity
          onPress={() => removeItem(item.id)}
          className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full"
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const itemCount = items.reduce((sum, i) => sum + i.cartQuantity, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black">
      <View className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1 mr-3">
            <Text
              className="text-3xl font-extrabold text-gray-900 dark:text-white"
              numberOfLines={1}
            >
              Your Cart
            </Text>
            {items.length > 0 && (
              <Text className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
            )}
          </View>
          {items.length > 0 && (
            <TouchableOpacity
              onPress={() => clearCart()}
              className="flex-row items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-full"
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text className="text-red-500 font-semibold text-sm">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center pt-24">
              <View className="w-24 h-24 rounded-full bg-orange-50 dark:bg-orange-900/20 items-center justify-center mb-5">
                <Ionicons name="cart-outline" size={44} color="#FB923C" />
              </View>
              <Text className="text-xl font-bold text-gray-700 dark:text-gray-300">
                Your cart is empty
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-center mt-2 px-8">
                Add fresh produce from the market to get started
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(buyer)/market")}
                className="mt-8 bg-orange-500 px-8 py-3 rounded-full flex-row items-center gap-2"
              >
                <Ionicons name="storefront-outline" size={18} color="white" />
                <Text className="text-white font-bold">Browse Market</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Sticky Checkout Panel */}
      {items.length > 0 && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          className="bg-white dark:bg-gray-900 px-5 pt-5 border-t border-gray-100 dark:border-gray-800"
        >
          {/* Price Breakdown */}
          <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                Subtotal ({itemCount} items)
              </Text>
              <Text className="text-gray-700 dark:text-gray-300 font-semibold">
                ₦{getTotalPrice().toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                Delivery
              </Text>
              <Text className="text-green-500 font-semibold text-sm">Free</Text>
            </View>
            <View className="h-px bg-gray-200 dark:bg-gray-700 my-3" />
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-900 dark:text-white font-bold text-base">
                Total
              </Text>
              <Text className="text-2xl font-extrabold text-gray-900 dark:text-white">
                ₦{getTotalPrice().toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
            activeOpacity={0.85}
            className="w-full bg-orange-500 h-14 rounded-2xl items-center justify-center flex-row gap-2"
            style={{
              shadowColor: "#F97316",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="bag-check-outline" size={22} color="white" />
                <Text className="text-white text-lg font-bold">
                  Place Order
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}