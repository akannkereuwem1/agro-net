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

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View className="px-5 pt-6 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">
                AgriConnect
              </Text>
              <Text className="text-4xl font-black text-white tracking-tight">
                Welcome, Buyer.
              </Text>
            </View>
            <TouchableOpacity className="w-12 h-12 rounded-full bg-zinc-900 items-center justify-center border border-zinc-800">
              <Ionicons name="notifications" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-zinc-900 rounded-2xl px-5 h-14 border border-zinc-800">
            <Ionicons name="search" size={20} color="#A1A1AA" />
            <TextInput
              placeholder="Search produce, farmers..."
              placeholderTextColor="#71717A"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-3 text-base text-white font-medium"
              selectionColor="#F59E0B"
            />
          </View>
        </View>

        <View className="px-5 mt-2 gap-4">
          {/* ── Banner 1: Premium Deep Orange ── */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(buyer)/market" as any)}
            className="bg-[#9A3412] rounded-[32px] p-7 overflow-hidden relative"
          >
            <Ionicons
              name="basket"
              size={180}
              color="white"
              style={{ position: "absolute", right: -40, top: -20, opacity: 0.08 }}
            />
            <Text className="text-[#FFEDD5] text-xs font-black tracking-widest uppercase mb-2 opacity-80">
              Direct from Farms
            </Text>
            <Text className="text-white text-3xl font-black leading-tight mb-6 tracking-tight">
              Fresh Harvest{"\n"}Available Now
            </Text>
            <View className="bg-black/30 rounded-full px-6 py-3.5 self-start">
              <Text className="text-white font-bold text-sm">Browse Market</Text>
            </View>
          </TouchableOpacity>

          {/* ── Banner 2: Premium Emerald ── */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(buyer)/market" as any)}
            className="bg-[#065F46] rounded-[32px] p-7 overflow-hidden relative"
          >
            <Ionicons
              name="leaf"
              size={180}
              color="white"
              style={{ position: "absolute", right: -30, bottom: -40, opacity: 0.08 }}
            />
            <Text className="text-[#D1FAE5] text-xs font-black tracking-widest uppercase mb-2 opacity-80">
              In Season
            </Text>
            <Text className="text-white text-2xl font-black leading-tight mb-2 tracking-tight">
              Organic Veggies
            </Text>
            <Text className="text-[#A7F3D0] text-sm mb-6 font-medium">
              Tomatoes, Peppers & Onions
            </Text>
            <View className="bg-black/30 rounded-full px-6 py-3.5 self-start">
              <Text className="text-white font-bold text-sm">Shop Vegetables</Text>
            </View>
          </TouchableOpacity>

          {/* ── Banner 3: Stealth Logistics ── */}
          <TouchableOpacity
            activeOpacity={0.9}
            className="bg-zinc-900 rounded-[32px] p-7 overflow-hidden relative border border-zinc-800"
          >
            <Ionicons
              name="rocket"
              size={160}
              color="white"
              style={{ position: "absolute", right: -20, bottom: -30, opacity: 0.03 }}
            />
            <Text className="text-zinc-500 text-xs font-black tracking-widest uppercase mb-2">
              Logistics
            </Text>
            <Text className="text-white text-xl font-black leading-tight mb-2 tracking-tight">
              Nationwide Delivery
            </Text>
            <Text className="text-zinc-500 text-sm font-medium">
              Farm gate straight to your warehouse.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}