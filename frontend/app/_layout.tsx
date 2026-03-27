import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import "../global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isHydrated } = useAuthStore();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const role = await AsyncStorage.getItem("role");
        if (raw && role) {
          const user = JSON.parse(raw);
          useAuthStore.getState().setUserFromLogin(user);
          console.log("[Session] Restored user:", user.email, "| Role:", role);
        } else {
          console.log("[Session] No saved session found");
        }
      } catch (e) {
        console.error("[Session] Failed to restore session:", e);
      } finally {
        useAuthStore.getState().setHydrated();
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync("#020617");
  }, []);

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: "#020617" }} />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View className={`flex-1 ${colorScheme === "dark" ? "dark" : ""}`}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#151718" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(buyer)" />
          <Stack.Screen name="(farmer)" />
        </Stack>
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
