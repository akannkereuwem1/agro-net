import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SplashScreen() {
  const router = useRouter();
  const { isLoggedIn, role, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (isLoggedIn && role === "farmer") {
      console.log("[Splash] Going to farmer");
      router.replace("/(farmer)");
    } else if (isLoggedIn && role === "buyer") {
      console.log("[Splash] Going to buyer");
      router.replace("/(buyer)");
    } else {
      console.log("[Splash] Going to onboarding");
      router.replace("/(onboarding)");
    }
  }, [isHydrated]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
      <Text className="text-3xl font-extrabold text-primary-light dark:text-primary-dark">
        🌱 AgroNet
      </Text>
    </SafeAreaView>
  );
}
