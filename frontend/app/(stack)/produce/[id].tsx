import { useCartStore } from "@/store/cartStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { fetchProductById, Product } from "../../../lib/productService";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem, removeItem } = useCartStore(); // Pull the action from our store
  const [orderQty, setOrderQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        if (id) {
          const data = await fetchProductById(id);
          setProduct(data);
        }
      } catch (error) {
        console.error("Failed to load product details:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem(product, orderQty);
    setIsAdded(true);
    Alert.alert(
      "Added to Cart",
      `${orderQty} ${product.unit}(s) of ${product.title} added!`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "Go to Cart", onPress: () => router.push("/(buyer)/cart") },
      ],
    );
  };

  const removeFromCart = () => {
    if (!product) return;
    removeItem(product.id);
    setIsAdded(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#F57C00" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white dark:bg-black p-4">
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color="#9BA1A6"
          className="mb-4"
        />
        <Text className="text-lg text-gray-500 dark:text-gray-400 text-center">
          Product not found or has been removed.
        </Text>
        <TouchableOpacity
          className="mt-6 bg-gray-900 dark:bg-white px-8 py-4 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white dark:text-black font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        bounces={false}
      >
        {/* Header Image & Back Button */}
        <View className="w-full h-80 relative bg-gray-100 dark:bg-gray-900">
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="image-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-400 mt-2 font-medium">
                No photo available
              </Text>
            </View>
          )}

          {/* Floating Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ top: insets.top + 10, left: 20 }}
            className="absolute w-10 h-10 bg-black/40 backdrop-blur-md rounded-full items-center justify-center z-10"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content Section Overlay */}
        <View className="bg-white dark:bg-black rounded-t-3xl -mt-8 px-5 pt-8 pb-12 min-h-[60vh]">
          {/* Title and Crop Type */}
          <View className="flex-row justify-between items-start mb-4">
            <Text className="flex-1 text-3xl font-extrabold text-gray-900 dark:text-white mr-4 leading-tight">
              {product.title}
            </Text>
            <View className="bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-md">
              <Text className="text-sm text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
                {product.crop_type}
              </Text>
            </View>
          </View>

          {/* Location & Farmer Info */}
          <View className="flex-row items-center mb-8 gap-4">
            <View className="flex-row items-center flex-1">
              <Ionicons name="location" size={16} color="#9CA3AF" />
              <Text
                className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1.5"
                numberOfLines={1}
              >
                {product.location}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="person-circle" size={16} color="#9CA3AF" />
              <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1.5">
                Verified Farmer
              </Text>
            </View>
          </View>

          {/* Price & Quantity Stats row */}
          <View className="flex-row justify-between items-center mb-8 bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
            <View>
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Price
              </Text>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                ₦
                {parseFloat(product.price_per_unit.toString()).toLocaleString()}
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {" "}
                  / {product.unit}
                </Text>
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Available
              </Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {Number(product.quantity).toLocaleString()}{" "}
                <Text className="text-base font-medium">{product.unit}s</Text>
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            About this produce
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
            {product.description || "No description provided for this product."}
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        className="px-5 pt-4 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800"
      >
        <TouchableOpacity
          className={`flex-row justify-center items-center py-4 rounded-xl ${
            product.is_available
              ? "bg-orange-500 dark:bg-orange-600"
              : "bg-gray-300 dark:bg-gray-800"
          }`}
          disabled={!product.is_available}
          onPress={isAdded ? removeFromCart : handleAddToCart}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cart"
            size={20}
            color={product.is_available ? "white" : "#9CA3AF"}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`text-lg font-bold ${product.is_available ? "text-white" : "text-gray-500"}`}
          >
            {isAdded ? "Remove from Cart" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
