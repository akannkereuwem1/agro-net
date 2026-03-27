import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BuyerIndex() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header & Search ── */}
        <View className="bg-white dark:bg-gray-900 px-5 pt-4 pb-5 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium text-gray-500">{greeting} 👋</Text>
            <TouchableOpacity className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Ionicons name="notifications-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            AgriConnect Market
          </Text>

          <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-4 h-12 border border-gray-200 dark:border-gray-700">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search produce, farmers, categories..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-base text-gray-900 dark:text-white"
            />
          </View>
        </View>

        <View className="px-5 mt-6 gap-5">
          {/* ── Banner 1: Primary Hero (Orange) ── */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(buyer)/market" as any)}
            className="bg-orange-500 rounded-3xl p-6 overflow-hidden relative"
          >
            <Ionicons
              name="basket"
              size={120}
              color="white"
              style={{ position: "absolute", right: -20, top: -20, opacity: 0.2 }}
            />
            <Text className="text-white text-xs font-bold tracking-widest uppercase mb-2 opacity-90">
              Direct from Farms
            </Text>
            <Text className="text-white text-2xl font-black leading-tight mb-4">
              Fresh Harvest{"\n"}Available Now
            </Text>
            <View className="bg-white rounded-xl px-5 py-3 self-start">
              <Text className="text-orange-500 font-bold">Browse Market →</Text>
            </View>
          </TouchableOpacity>

          {/* ── Banner 2: Category (Green) ── */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(buyer)/market" as any)}
            className="bg-green-600 rounded-3xl p-6 overflow-hidden relative"
          >
            <Ionicons
              name="leaf"
              size={120}
              color="white"
              style={{ position: "absolute", right: -10, bottom: -20, opacity: 0.2 }}
            />
            <Text className="text-white text-xs font-bold tracking-widest uppercase mb-2 opacity-90">
              In Season
            </Text>
            <Text className="text-white text-2xl font-black leading-tight mb-1">
              Organic Veggies
            </Text>
            <Text className="text-green-100 text-sm mb-4">
              Tomatoes, Peppers, Onions & more
            </Text>
            <View className="bg-green-700 rounded-xl px-5 py-3 self-start">
              <Text className="text-white font-bold">Shop Vegetables</Text>
            </View>
          </TouchableOpacity>

          {/* ── Banner 3: Bulk Orders (Blue) ── */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(buyer)/market" as any)}
            className="bg-blue-500 rounded-3xl p-6 overflow-hidden relative"
          >
            <Ionicons
              name="cube"
              size={120}
              color="white"
              style={{ position: "absolute", right: -20, top: 10, opacity: 0.2 }}
            />
            <Text className="text-white text-xs font-bold tracking-widest uppercase mb-2 opacity-90">
              Wholesale
            </Text>
            <Text className="text-white text-2xl font-black leading-tight mb-1">
              Buy Bulk & Save
            </Text>
            <Text className="text-blue-100 text-sm mb-4">
              Sacks of Garri, Rice, and Tubers
            </Text>
            <View className="bg-white rounded-xl px-5 py-3 self-start">
              <Text className="text-blue-500 font-bold">View Wholesale</Text>
            </View>
          </TouchableOpacity>

          {/* ── Banner 4: Logistics (Dark) ── */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-gray-800 dark:bg-gray-900 rounded-3xl p-6 overflow-hidden relative"
          >
            <Ionicons
              name="bus"
              size={120}
              color="white"
              style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.1 }}
            />
            <Text className="text-white text-xs font-bold tracking-widest uppercase mb-2 opacity-70">
              Logistics
            </Text>
            <Text className="text-white text-xl font-bold leading-tight mb-1">
              Nationwide Delivery
            </Text>
            <Text className="text-gray-400 text-sm">
              From the farm gate straight to your warehouse.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}