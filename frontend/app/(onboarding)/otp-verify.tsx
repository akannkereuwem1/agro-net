import Button from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Text, TextInputField, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 30;

export default function OTPVerifyScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInputField | null)[]>([]);

  const filled = otp.every((d) => d !== "");

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (val: string, index: number) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);
    inputRefs.current[0]?.focus();
  };

  const handleVerify = () => {
    router.push("/(onboarding)/profile-setup");
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

        <View className="flex-1">
          {/* Header */}
          <View className="mb-10">
            <View className="w-14 h-14 rounded-2xl bg-primary-light/10 dark:bg-primary-dark/20 items-center justify-center mb-6">
              <Ionicons name="mail-outline" size={26} color="#1b3427" />
            </View>
            <Text className="text-4xl font-extrabold text-text-light dark:text-text-dark leading-tight mb-2">
              Check your{"\n"}inbox.
            </Text>
            <Text className="text-base text-subtext-light dark:text-subtext-dark">
              We sent a 6-digit code to your email. Enter it below.
            </Text>
          </View>

          {/* OTP boxes */}
          <View className="flex-row gap-3 mb-8">
            {otp.map((digit, i) => (
              <TextInputField
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                value={digit}
                onChangeText={(v) => handleChange(v, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="numeric"
                maxLength={1}
                className={[
                  "flex-1 aspect-square text-center text-xl font-bold rounded-xl border",
                  "text-text-light dark:text-text-dark",
                  "bg-card-light dark:bg-card-dark",
                  digit
                    ? "border-primary-light dark:border-primary-dark"
                    : "border-border-light dark:border-border-dark",
                ].join(" ")}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend */}
          <View className="flex-row items-center gap-1 mb-10">
            <Text className="text-sm text-subtext-light dark:text-subtext-dark">
              Didn't receive it?{" "}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend}>
              <Text
                className={[
                  "text-sm font-bold",
                  canResend
                    ? "text-text-light dark:text-text-dark"
                    : "text-subtext-light dark:text-subtext-dark",
                ].join(" ")}
              >
                {canResend ? "Resend code" : `Resend in ${countdown}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA */}
        <Button
          label="Verify"
          variant="primary"
          disabled={!filled}
          onPress={handleVerify}
        />
      </View>
    </SafeAreaView>
  );
}
