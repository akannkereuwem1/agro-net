import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export interface Product {
  id: string;
  title: string;
  description: string;
  crop_type: string;
  quantity: string | number;
  unit: string;
  price_per_unit: string | number;
  location: string;
  image_url: string | null;
  is_available: boolean;
}

interface Props {
  product: Product;
  onPress: (id: string) => void;
}

export default function FarmerListingCard({ product, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(product.id)}
      className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-gray-800"
    >
      {/* Big Social-Media Style Image Container */}
      <View className="w-full h-64 relative bg-gray-50 dark:bg-gray-800">
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-400 mt-2 font-medium">No photo yet</Text>
          </View>
        )}

        {/* Floating Status Badge (Top Right) */}
        <View className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-full backdrop-blur-md">
          <View className="flex-row items-center gap-1.5">
            <View
              className={`w-2 h-2 rounded-full ${
                product.is_available ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <Text className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {product.is_available ? "Active" : "Draft"}
            </Text>
          </View>
        </View>

        {/* Floating Stock Badge (Bottom Left) */}
        <View className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-md">
          <Text className="text-xs font-medium text-white">
            Stock: {parseFloat(product.quantity.toString())} {product.unit}
          </Text>
        </View>
      </View>

      {/* Card Details (Bottom Section) */}
      <View className="p-5">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-4">
            <Text
              className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
              numberOfLines={1}
            >
              {product.title}
            </Text>

            {/* Meta tags: Crop Type & Location */}
            <View className="flex-row items-center gap-3">
              <View className="bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md">
                <Text className="text-xs font-semibold text-green-700 dark:text-green-400">
                  {product.crop_type}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location" size={12} color="#6B7280" />
                <Text
                  className="text-xs text-gray-500 dark:text-gray-400"
                  numberOfLines={1}
                >
                  {product.location}
                </Text>
              </View>
            </View>
          </View>

          {/* Price */}
          <View className="items-end">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              ₦{parseFloat(product.price_per_unit.toString()).toLocaleString()}
            </Text>
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
              per {product.unit}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text
          className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed"
          numberOfLines={2}
        >
          {product.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
