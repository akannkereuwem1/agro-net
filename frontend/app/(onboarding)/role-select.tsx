import Button from "@/components/ui/Button";
import { registerUser } from "@/lib/authService";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Role = "farmer" | "buyer";

const roles: {
  id: Role;
  emoji: string;
  title: string;
  subtitle: string;
  perks: string[];
}[] = [
  {
    id: "farmer",
    emoji: "👨‍🌾",
    title: "I'm a Farmer",
    subtitle: "Sell your harvest directly to buyers",
    perks: [
      "List produce & set prices",
      "Manage incoming orders",
      "Get paid fast",
    ],
  },
  {
    id: "buyer",
    emoji: "🛒",
    title: "I'm a Buyer",
    subtitle: "Source fresh produce without middlemen",
    perks: [
      "Browse verified farmers",
      "Place & track orders",
      "Direct pricing",
    ],
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const { email, full_name, password, setRole, setUserFromLogin, role } =
    useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

    function goToTabs() {
    if (role === "buyer") {
      router.replace("/(buyer)");
    } else if (role === "farmer") {
      router.replace("/(farmer)");
    }
  }

  const handleRegister = async () => {
    if (selected) {
      setIsLoading(true);
      setServerError(null);
      setRole(selected);
      // You can remove the manual AsyncStorage.setItem("role", selected) here
      // since registerUser handles it all now!

      try {
        // Destructure the user from our updated registerUser response
        const { user } = await registerUser({
          email,
          full_name,
          password,
          role: selected,
        });

        setUserFromLogin(user);

        // Route to the next step
        goToTabs();
      } catch (err: any) {
        const message =
          err.response?.data?.detail || err.message || "Something went wrong";
        setServerError(message);
        console.error("[Signup] Failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-6 pt-4 pb-10 justify-between">
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="self-start flex-row items-center gap-1 mb-10"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#5F6B73" />
          <Text className="text-subtext-light dark:text-subtext-dark text-sm">
            Back
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="mb-10">
          <Text className="text-4xl font-extrabold text-text-light dark:text-text-dark leading-tight mb-2">
            Who are{"\n"}you?
          </Text>
          <Text className="text-base text-suobtext-light dark:text-subtext-dark">
            Pick your role — you can only choose one.
          </Text>
        </View>

        {/* Role cards */}
        <View className="flex-1 gap-4 mb-10">
          {roles.map((role) => {
            const isSelected = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                onPress={() => setSelected(role.id)}
                activeOpacity={0.8}
                className={[
                  "rounded-2xl p-5 border-2",
                  isSelected
                    ? "bg-primary-light/10 dark:bg-primary-dark/20 border-primary-light dark:border-primary-dark"
                    : "bg-card-light dark:bg-card-dark border-transparent",
                ].join(" ")}
              >
                {/* Top row */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-3xl">{role.emoji}</Text>
                    <View>
                      <Text className="text-base font-bold text-text-light dark:text-text-dark">
                        {role.title}
                      </Text>
                      <Text className="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">
                        {role.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Radio */}
                  <View
                    className={[
                      "w-5 h-5 rounded-full border-2 items-center justify-center",
                      isSelected
                        ? "border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark"
                        : "border-border-light dark:border-border-dark",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>
                </View>

                {/* Divider */}
                <View className="h-px bg-border-light dark:bg-border-dark mb-3" />

                {/* Perks */}
                <View className="gap-1.5">
                  {role.perks.map((perk) => (
                    <View key={perk} className="flex-row items-center gap-2">
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={isSelected ? "#1b3427" : "#9BA1A6"}
                      />
                      <Text className="text-xs text-subtext-light dark:text-subtext-dark">
                        {perk}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
          {serverError && (
            <Text className="text-red-700 text-center">{serverError}</Text>
          )}
        </View>

        {/* CTA */}
        <Button
          loading={isLoading}
          label="Continue"
          variant="primary"
          disabled={!selected}
          onPress={handleRegister}
        />
      </View>
    </SafeAreaView>
  );
}
