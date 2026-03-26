import BackButton from "@/components/ui/BackButton";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TextInputField from "@/components/ui/TextInputField";
import { useForm } from "@/hooks/useForm";
import { loginUser } from "@/lib/authService";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { setUserFromLogin, role } = useAuthStore();
  const { values, errors, set, touch, validate } = useForm(
    { email: "", password: "" },
    {
      email: (v) =>
        !v
          ? "Email is required"
          : !/\S+@\S+\.\S+/.test(v)
            ? "Enter a valid email"
            : undefined,
      password: (v) =>
        !v
          ? "Password is required"
          : v.length < 6
            ? "At least 6 characters"
            : undefined,
    },
  );

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setServerError(null);
    try {
      const { user } = await loginUser({
        email: values.email,
        password: values.password,
      });

      setUserFromLogin(user);
      console.log("role at login:", user.role);
      if (user.role === "buyer") {
        console.log("Navigated to buyer");
        router.replace("/(buyer)");
      } else if (user.role === "farmer") {
        console.log("Navigated to farmer");
        router.replace("/(farmer)");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.detail || err.message || "Something went wrong";
      setServerError(message);
      console.error("[Login] Failed:", err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-12 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-10">
            <View className="gap-4">
              <BackButton />
              <Badge />
            </View>

            <Text className="text-4xl mt-3 font-extrabold text-text-light dark:text-text-dark leading-tight mb-2">
              Welcome{"\n"}back.
            </Text>
            <Text className="text-base text-subtext-light dark:text-subtext-dark">
              Sign in to continue to your account.
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <TextInputField
              label="Email address"
              placeholder="you@example.com"
              value={values.email}
              onChangeText={set("email")}
              onBlur={touch("email")}
              inputType="email"
              error={errors.email}
            />
            <TextInputField
              label="Password"
              placeholder="Enter your password"
              value={values.password}
              onChangeText={set("password")}
              onBlur={touch("password")}
              inputType="password"
              error={errors.password}
            />

            {/* Forgot password */}
            <TouchableOpacity className="self-end -mt-2 mb-2">
              <Text className="text-sm text-subtext-light dark:text-subtext-dark">
                Forgot password?
              </Text>
            </TouchableOpacity>

            {serverError && (
              <Text className="text-red-700 text-center">{serverError}</Text>
            )}
          </View>

          {/* Actions */}
          <View className="gap-3">
            <Button
              label="Sign In"
              variant="primary"
              onPress={handleLogin}
              loading={isLoading}
            />
            <Button
              label="Create an account"
              variant="secondary"
              onPress={() => router.push("/(onboarding)/signup")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
