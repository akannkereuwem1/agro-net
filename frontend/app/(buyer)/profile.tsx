import LinkAccountBanner from "@/components/LinkAccountBanner";
import { logoutUser } from "@/lib/authService";
import { fetchUserProfile } from "@/lib/userService";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Profile = () => {
  const { full_name, email, role, clearAuth, updateUser } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadFreshProfile = async () => {
      try {
        const freshData = await fetchUserProfile();
        updateUser({
          full_name: freshData.full_name,
          email: freshData.email,
          role: freshData.role,
          isActive: freshData.is_active,
        });
      } catch (error) {
        console.log("Failed to refresh profile", error);
      }
    };
    loadFreshProfile();
  }, []);

  async function handleLogout() {
    clearAuth();
    await logoutUser();
    router.replace("/(onboarding)");
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper for menu items to keep the JSX clean
  const MenuItem = ({
    icon,
    label,
    onPress,
    isLast = false,
    textColor = "",
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center py-4 px-4 ${!isLast ? "border-b border-gray-50 dark:border-gray-800" : ""}`}
    >
      <View className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 items-center justify-center mr-4">
        <Ionicons
          name={icon}
          size={20}
          color={textColor === "text-red-500" ? "#EF4444" : "#6B7280"}
        />
      </View>
      <Text
        className={`flex-1 text-base font-medium ${textColor || "text-gray-800 dark:text-gray-200"}`}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Header Section --- */}
        <View className="items-center mb-8">
          <View className="relative">
            <View className="w-24 h-24 bg-orange-500 rounded-full items-center justify-center shadow-xl shadow-orange-500/40">
              <Text className="text-white text-3xl font-black">
                {getInitials(full_name)}
              </Text>
            </View>
            <TouchableOpacity
              className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-black shadow-sm"
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color="#F57C00" />
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-black text-gray-900 dark:text-white mt-4">
            {full_name || "User"}
          </Text>

          <View className="bg-orange-50 dark:bg-orange-900/20 px-4 py-1.5 rounded-full mt-2">
            <Text className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
              {role} Account
            </Text>
          </View>
        </View>

        {/* --- Content --- */}
        <LinkAccountBanner />

        <View className="mt-6">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4 mb-3">
            Account Settings
          </Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <MenuItem icon="person-outline" label="Account Details" />
            <MenuItem icon="notifications-outline" label="Notifications" />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Privacy & Security"
            />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              isLast={true}
            />
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4 mb-3">
            Actions
          </Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <MenuItem
              icon="log-out-outline"
              label="Log Out"
              textColor="text-red-500"
              isLast={true}
              onPress={() => {
                Alert.alert("Log Out", "Are you sure you want to log out?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Log out",
                    onPress: handleLogout,
                    style: "destructive",
                  },
                ]);
              }}
            />
          </View>
        </View>

        {/* --- Footer Info --- */}
        <View className="mt-10 items-center">
          <Text className="text-gray-400 dark:text-gray-600 text-xs font-medium">
            Version 1.0.4 (Stable)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;
