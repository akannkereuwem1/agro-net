import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const LinkAccountBanner = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push("/(stack)/bank-link")} // Routing to your InterSwitch page
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6 flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-full items-center justify-center mr-4">
          <Ionicons name="card-outline" size={24} color="#2563EB" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
            Link your bank account
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Set up payments for faster checkout
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

export default LinkAccountBanner;
