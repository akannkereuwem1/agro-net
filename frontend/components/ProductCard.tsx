import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Product } from "../lib/productService";

interface ProductCardProps {
  product: Product;
  onPress: (id: string) => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(product.id)}
      className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden mb-5 border border-gray-100 dark:border-gray-800 shadow-sm"
    >
      {/* Image Container */}
      <View className="w-full h-48 bg-gray-50 dark:bg-gray-800 relative">
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Details Container */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text
            className="flex-1 text-xl font-bold text-gray-900 dark:text-white mr-3"
            numberOfLines={1}
          >
            {product.title}
          </Text>
          <View className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
            <Text className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {product.crop_type}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-3">
          <Ionicons name="location" size={14} color="#9CA3AF" />
          <Text
            className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1.5"
            numberOfLines={1}
          >
            {product.location}
          </Text>
        </View>

        <View className="flex-row justify-between items-end mt-1">
          <Text className="text-xl font-extrabold text-orange-500 dark:text-orange-400">
            ₦{parseFloat(product.price_per_unit.toString()).toLocaleString()}{" "}
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
              / {product.unit}
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
