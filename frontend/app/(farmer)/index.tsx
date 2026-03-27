import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Static demo data ──────────────────────────────────────────────────────────
const STATS = [
  { label: "Revenue", value: "₦184,500", icon: "trending-up", color: "#16A34A", bg: "#DCFCE7" },
  { label: "Listings", value: "12", icon: "leaf", color: "#15803D", bg: "#DCFCE7" },
  { label: "Orders", value: "8", icon: "receipt-outline", color: "#F97316", bg: "#FFEDD5" },
  { label: "Views", value: "1.2k", icon: "eye-outline", color: "#0EA5E9", bg: "#E0F2FE" },
];

const RECENT_ORDERS = [
  { id: "ORD-001", buyer: "Chukwuemeka O.", produce: "White Garri", qty: "50 kg", amount: "₦12,500", status: "confirmed", time: "2h ago" },
  { id: "ORD-002", buyer: "Fatima A.", produce: "Fresh Tomatoes", qty: "30 kg", amount: "₦8,700", status: "pending", time: "5h ago" },
  { id: "ORD-003", buyer: "Ngozi I.", produce: "Ugu Leaves", qty: "10 bunches", amount: "₦3,200", status: "completed", time: "Yesterday" },
  { id: "ORD-004", buyer: "Taiwo B.", produce: "Yellow Pepper", qty: "20 kg", amount: "₦6,400", status: "completed", time: "Yesterday" },
];

const QUICK_ACTIONS = [
  { label: "Add Listing", icon: "add-circle", color: "#16A34A", route: "/(farmer)/add" },
  { label: "My Listings", icon: "grid", color: "#0D9488", route: "/(farmer)/listings" },
  { label: "Orders", icon: "receipt", color: "#F97316", route: "/(farmer)/orders" },
  { label: "AI Price", icon: "sparkles", color: "#8B5CF6", route: "/(farmer)/add" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "#FEF9C3", text: "#854D0E", dot: "#EAB308" },
  confirmed: { bg: "#DCFCE7", text: "#166534", dot: "#16A34A" },
  completed: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
  declined:  { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

export default function FarmerIndex() {
  const router = useRouter();
  const hour = new Date().getHours();


  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <View className="bg-white dark:bg-gray-900 px-5 pt-4 pb-6 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center justify-between mb-1">
            <TouchableOpacity className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Ionicons name="notifications-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Farm
          </Text>

          {/* Earnings strip */}
          <View className="mt-4 bg-green-950 rounded-md  p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-green-100 text-xs font-medium mb-1">Total Earnings</Text>
              <Text className="text-white text-3xl font-black">₦184,500</Text>
              <Text className="text-green-200 text-xs mt-1">↑ 14% from last month</Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-green-500 items-center justify-center">
              <Ionicons name="wallet" size={28} color="#fff" />
            </View>
          </View>
        </View>

        {/* ── Stats grid ── */}
        <View className="px-5 pt-5">
          <View className="flex-row flex-wrap gap-3">
            {STATS.map((s) => (
              <View
                key={s.label}
                className="flex-1 min-w-[44%] bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800"
                style={{ minWidth: "45%" }}
              >
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mb-3"
                  style={{ backgroundColor: s.bg }}
                >
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                </View>
                <Text className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</Text>
                <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View className="px-5 mt-6">
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => router.push(a.route as any)}
                className="flex-1 items-center bg-white dark:bg-gray-900 rounded-2xl py-4 border border-gray-100 dark:border-gray-800"
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                  style={{ backgroundColor: a.color + "18" }}
                >
                  <Ionicons name={a.icon as any} size={20} color={a.color} />
                </View>
                <Text className="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Recent Orders ── */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-900 dark:text-white">Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push("/(farmer)/orders" as any)}>
              <Text className="text-sm font-medium text-green-600">See all</Text>
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
                  {/* Avatar placeholder */}
                  <View className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 items-center justify-center mr-3">
                    <Text className="text-sm font-bold text-green-700 dark:text-green-400">
                      {order.buyer[0]}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                      {order.buyer}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                      {order.produce} · {order.qty}
                    </Text>
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

        {/* ── Tip card ── */}
        <View className="mx-5 mt-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 flex-row items-start gap-3 border border-amber-100 dark:border-amber-800/40">
          <Ionicons name="bulb-outline" size={20} color="#D97706" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-0.5">Harvest tip</Text>
            <Text className="text-xs text-amber-700 dark:text-amber-500 leading-5">
              Dry season prices for tomatoes are typically 20–35% higher. Consider staggering your harvest.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}