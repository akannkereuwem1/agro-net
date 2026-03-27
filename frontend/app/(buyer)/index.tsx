import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Static demo data ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "All", icon: "apps" },
  { label: "Vegetables", icon: "leaf" },
  { label: "Tubers", icon: "nutrition" },
  { label: "Grains", icon: "ellipse" },
  { label: "Fruits", icon: "flower" },
  { label: "Spices", icon: "flame" },
];

const FEATURED = [
  {
    id: "1", title: "Fresh Tomatoes", farmer: "Adeola's Farm",
    location: "Kano State", price: "₦350/kg",
    category: "Vegetables", badge: "In Season", badgeColor: "#16A34A",
    image: "https://source.unsplash.com/400x400/?fresh+tomatoes",
  },
  {
    id: "2", title: "White Garri", farmer: "Nwosu Produce",
    location: "Enugu State", price: "₦280/kg",
    category: "Tubers", badge: "Popular", badgeColor: "#F97316",
    image: "https://source.unsplash.com/400x400/?cassava,garri",
  },
  {
    id: "3", title: "Scotch Bonnet", farmer: "Bello Farms",
    location: "Kaduna State", price: "₦620/kg",
    category: "Spices", badge: "Fresh", badgeColor: "#0EA5E9",
    image: "https://source.unsplash.com/400x400/?scotch+bonnet",
  },
  {
    id: "4", title: "Sweet Potatoes", farmer: "Okafor Estate",
    location: "Anambra State", price: "₦180/kg",
    category: "Tubers", badge: "In Season", badgeColor: "#16A34A",
    image: "https://source.unsplash.com/400x400/?sweet+potato",
  },
];

const RECENT_ORDERS = [
  { id: "ORD-091", produce: "White Garri", qty: "50 kg", amount: "₦14,000", status: "completed", farmer: "Nwosu Produce" },
  { id: "ORD-088", produce: "Fresh Tomatoes", qty: "15 kg", amount: "₦5,250", status: "confirmed", farmer: "Adeola's Farm" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "#FEF9C3", text: "#854D0E", dot: "#EAB308" },
  confirmed: { bg: "#DCFCE7", text: "#166534", dot: "#16A34A" },
  completed: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
};

export default function BuyerIndex() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const filtered = FEATURED.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View className="bg-white dark:bg-gray-900 px-5 pt-4 pb-5 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium text-gray-400 dark:text-gray-500">
              {greeting} 👋
            </Text>
            <TouchableOpacity className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Ionicons name="notifications-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Find Fresh Produce
          </Text>

          {/* Search bar */}
          <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-4 h-11 border border-gray-200 dark:border-gray-700">
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
              placeholder="Search tomatoes, garri, pepper…"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-sm text-gray-900 dark:text-white"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Promo banner ── */}
        <View className="mx-5 mt-5 rounded-2xl overflow-hidden bg-orange-500 flex-row items-center justify-between px-5 py-4">
          <View className="flex-1">
            <Text className="text-white text-xs font-semibold opacity-80 mb-1">LIMITED TIME</Text>
            <Text className="text-white text-lg font-black leading-tight">
              Buy direct from{"\n"}Nigerian farmers
            </Text>
            <TouchableOpacity
              className="mt-3 bg-white rounded-lg px-4 py-1.5 self-start"
              onPress={() => router.push("/(buyer)/market" as any)}
            >
              <Text className="text-orange-500 text-xs font-bold">Browse Market</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Categories ── */}
        <View className="mt-5">
          <Text className="text-base font-bold text-gray-900 dark:text-white px-5 mb-3">Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {CATEGORIES.map((c) => {
              const isActive = activeCategory === c.label;
              return (
                <TouchableOpacity
                  key={c.label}
                  onPress={() => setActiveCategory(c.label)}
                  className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${
                    isActive
                      ? "bg-orange-500 border-orange-500"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Ionicons
                    name={c.icon as any}
                    size={13}
                    color={isActive ? "#fff" : "#6B7280"}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Produce grid ── */}
        <View className="px-5 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              {activeCategory === "All" ? "Fresh Near You" : activeCategory}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(buyer)/market" as any)}>
              <Text className="text-sm font-medium text-orange-500">See all</Text>
            </TouchableOpacity>
          </View>

          {filtered.length === 0 ? (
            <View className="bg-white dark:bg-gray-900 rounded-2xl p-8 items-center border border-gray-100 dark:border-gray-800">
              <Text style={{ fontSize: 36 }}>🌿</Text>
              <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2">No produce found</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {filtered.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                  style={{ width: "47.5%" }}
                  activeOpacity={0.85}
                >
                  {/* Emoji image area */}
                  <View className="w-full aspect-square bg-gray-50 dark:bg-gray-800 items-center justify-center">
                    <Image
                  source={{ uri: p.image }}
                  className="w-full aspect-square"
                  resizeMode="cover"
                />
                    <View
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: p.badgeColor + "22" }}
                    >
                      <Text className="text-[10px] font-bold" style={{ color: p.badgeColor }}>
                        {p.badge}
                      </Text>
                    </View>
                  </View>
                  <View className="p-3">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                      {p.title}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5" numberOfLines={1}>
                      {p.farmer} · {p.location}
                    </Text>
                    <Text className="text-base font-black text-orange-500 mt-1.5">{p.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Recent orders ── */}
        {RECENT_ORDERS.length > 0 && (
          <View className="px-5 mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-gray-900 dark:text-white">Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push("/(buyer)/orders" as any)}>
                <Text className="text-sm font-medium text-orange-500">See all</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {RECENT_ORDERS.map((order, i) => {
                const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
                return (
                  <View
                    key={order.id}
                    className={`px-4 py-3.5 flex-row items-center ${
                      i !== RECENT_ORDERS.length - 1
                        ? "border-b border-gray-50 dark:border-gray-800"
                        : ""
                    }`}
                  >
                    <View className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mr-3">
                      <Ionicons name="receipt-outline" size={16} color="#F97316" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900 dark:text-white">{order.produce}</Text>
                      <Text className="text-xs text-gray-400 dark:text-gray-500">{order.farmer} · {order.qty}</Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-sm font-bold text-gray-900 dark:text-white">{order.amount}</Text>
                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: s.bg }}
                      >
                        <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                        <Text className="text-[10px] font-semibold capitalize" style={{ color: s.text }}>
                          {order.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}