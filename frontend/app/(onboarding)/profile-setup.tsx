import { useForm } from "@/hooks/useForm";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import TextInputField from "../../components/ui/TextInputField";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { role } = useAuthStore();
  const isFarmer = role === "farmer";

  const { values, errors, set, touch, validate } = useForm(
    { businessName: "", location: "" },
    {
      businessName: (v) =>
        !v.trim()
          ? `${isFarmer ? "Farm" : "Company"} name is required`
          : undefined,
      location: (v) => (!v.trim() ? "Location is required" : undefined),
    },
  );

  const handleContinue = () => {
    if (!validate()) return;
    router.push("/(onboarding)/bank-link");
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <View className="pt-4 pb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="self-start flex-row items-center gap-1"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#5F6B73" />
              <Text className="text-subtext-light dark:text-subtext-dark text-sm">
                Back
              </Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View className="mb-10">
            {/* Role badge */}
            <View className="self-start bg-primary-light/10 dark:bg-primary-dark/20 px-3 py-1 rounded-full mb-4">
              <Text className="text-xs font-semibold text-primary-light dark:text-primary-dark capitalize tracking-wide">
                {isFarmer ? "🌾 Farmer" : "🏪 Buyer"}
              </Text>
            </View>
            <Text className="text-4xl font-extrabold text-text-light dark:text-text-dark leading-tight mb-2">
              Set up your{"\n"}profile.
            </Text>
            <Text className="text-base text-subtext-light dark:text-subtext-dark">
              Help others know who they're trading with.
            </Text>
          </View>

          {/* Photo picker */}
          <View className="mb-6">
            <Text className="text-xs font-semibold uppercase tracking-widest text-subtext-light dark:text-subtext-dark mb-2">
              Profile Photo
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              className="flex-row items-center gap-4 bg-card-light dark:bg-card-dark border border-dashed border-border-light dark:border-border-dark rounded-xl p-4"
            >
              <View className="w-14 h-14 rounded-full bg-background-light dark:bg-background-dark items-center justify-center border border-border-light dark:border-border-dark">
                <Ionicons name="person-outline" size={24} color="#9BA1A6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-text-light dark:text-text-dark mb-0.5">
                  Choose a photo
                </Text>
                <Text className="text-xs text-subtext-light dark:text-subtext-dark">
                  JPG or PNG, up to 5MB
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9BA1A6" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="mb-6">
            <TextInputField
              label={isFarmer ? "Farm name" : "Company name"}
              placeholder={
                isFarmer ? "e.g. Green Valley Farm" : "e.g. Fresh Supplies Ltd"
              }
              value={values.businessName}
              onChangeText={set("businessName")}
              onBlur={touch("businessName")}
              inputType="email"
              error={errors.businessName}
            />
            <TextInputField
              label="Location"
              placeholder="e.g. Lagos, Nigeria"
              value={values.location}
              onChangeText={set("location")}
              onBlur={touch("location")}
              inputType="email"
              error={errors.location}
            />
          </View>

          {/* Step indicator */}
          <View className="flex-row items-center gap-1.5 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className={[
                  "h-1 rounded-full",
                  i === 2
                    ? "w-6 bg-primary-light dark:bg-primary-dark"
                    : "w-2 bg-border-light dark:bg-border-dark",
                ].join(" ")}
              />
            ))}
          </View>

          {/* Action */}
          <Button label="Continue" variant="primary" onPress={handleContinue} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
