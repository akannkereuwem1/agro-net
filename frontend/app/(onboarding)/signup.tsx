import BackButton from "@/components/ui/BackButton";
import { useForm } from "@/hooks/useForm";
import { useAuthStore } from "@/store/authStore";
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
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import TextInputField from "../../components/ui/TextInputField";

export default function SignUpScreen() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { setSignupFields } = useAuthStore();

  const { values, errors, set, touch, validate } = useForm(
    { fullName: "", email: "", password: "" },
    {
      fullName: (v) => (!v.trim() ? "Full name is required" : undefined),
      email: (v) =>
        !v
          ? "Email is required"
          : !/\S+@\S+\.\S+/.test(v)
            ? "Enter a valid email"
            : undefined,
      password: (v) =>
        !v
          ? "Password is required"
          : v.length < 8
            ? "At least 8 characters"
            : undefined,
    },
  );

  const handleProceed = () => {
    if (!validate()) return;
    setSignupFields({
      email: values.email,
      full_name: values.fullName,
      password: values.password,
    });
    router.push("/(onboarding)/role-select");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView
        style={{ flex: 1 }}
        edges={["top", "left", "right"]}
        className="bg-background-light dark:bg-background-dark"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: 40 + bottom,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <View className="pt-4 pb-8">
            <BackButton />
          </View>

          {/* Header */}
          <View className="mb-10">
            <Text className="text-4xl font-extrabold text-text-light dark:text-text-dark leading-tight mb-2">
              Create your{"\n"}account.
            </Text>
            <Text className="text-base text-subtext-light dark:text-subtext-dark">
              Join thousands of farmers and buyers on AgroNet.
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <TextInputField
              label="Full name"
              placeholder="Your Full name"
              onChangeText={set("fullName")}
              value={values.fullName}
              onBlur={touch("fullName")}
              error={errors.fullName}
            />
            <TextInputField
              label="Email address"
              placeholder="Your Email"
              onChangeText={set("email")}
              value={values.email}
              onBlur={touch("email")}
              inputType="email"
              error={errors.email}
            />
            <TextInputField
              label="Password"
              placeholder="Create a strong password"
              onChangeText={set("password")}
              value={values.password}
              onBlur={touch("password")}
              inputType="password"
              error={errors.password}
            />
          </View>

          {/* Actions */}
          <View className="gap-3">
            <Button
              label="Continue"
              variant="primary"
              onPress={handleProceed}
            />
          </View>

          {/* Sign in nudge */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-subtext-light dark:text-subtext-dark text-sm">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/signin")}
            >
              <Text className="text-text-light dark:text-text-dark text-sm font-bold">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
