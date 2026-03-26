import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PERKS = [
  { icon: "flash-outline", label: "Instant payouts to your bank" },
  { icon: "shield-checkmark-outline", label: "256-bit encrypted & secure" },
  { icon: "refresh-outline", label: "Easy to update anytime" },
];

export default function BankLinkScreen() {
  const router = useRouter();
  const { role } = useAuthStore();

  const handleLink = async () => {
    alert("Bank linking simulated");
  };

  const handleSkip = async () => {
    goToTabs();
  };

  function goToTabs() {
    if (role === "buyer") {
      router.replace("/(buyer)");
    } else if (role === "farmer") {
      router.replace("/(farmer)");
    }
  }

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

        <View className="flex-1">
          {/* Header */}
          <View className="mb-10">
            <View className="w-14 h-14 rounded-2xl bg-primary-light/10 dark:bg-primary-dark/20 items-center justify-center mb-6">
              <Ionicons name="card-outline" size={26} color="#1b3427" />
            </View>
            <Text className="text-4xl font-extrabold text-text-light dark:text-text-dark leading-tight mb-2">
              Link your{"\n"}bank.
            </Text>
            <Text className="text-base text-subtext-light dark:text-subtext-dark">
              {role === "farmer"
                ? "Get paid directly when buyers place orders."
                : "Pay farmers quickly and securely."}
            </Text>
          </View>

          {/* Perks */}
          <View className="gap-4 mb-10">
            {PERKS.map(({ icon, label }) => (
              <View key={label} className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-card-light dark:bg-card-dark items-center justify-center">
                  <Ionicons name={icon as any} size={18} color="#1b3427" />
                </View>
                <Text className="text-sm text-text-light dark:text-text-dark font-medium flex-1">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Provider badge */}
          <View className="flex-row items-center gap-2 bg-card-light dark:bg-card-dark rounded-xl px-4 py-3 self-start">
            <Ionicons name="business-outline" size={14} color="#9BA1A6" />
            <Text className="text-xs text-subtext-light dark:text-subtext-dark">
              Powered by{" "}
              <Text className="font-semibold text-text-light dark:text-text-dark">
                InterSwitch
              </Text>
            </Text>
          </View>
        </View>

        {/* Step indicator */}
        <View className="flex-row items-center gap-1.5 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className={[
                "h-1 rounded-full",
                i === 3
                  ? "w-6 bg-primary-light dark:bg-primary-dark"
                  : "w-2 bg-border-light dark:bg-border-dark",
              ].join(" ")}
            />
          ))}
        </View>

        {/* Actions */}
        <View className="gap-3">
          <Button
            label="Link Bank Account"
            variant="primary"
            onPress={handleLink}
          />
          <Button label="Skip for now" variant="ghost" onPress={handleSkip} />
        </View>
      </View>
    </SafeAreaView>
  );
}
