import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  TextInput as RNTextInput, // FIXED: React Native exports TextInput, not TextInputField
  Text,
  TextInputProps, // FIXED: Changed to valid React Native prop type
  TouchableOpacity,
  View,
} from "react-native";

interface CustomTextInputFieldProps extends Omit<
  TextInputProps,
  "onChangeText" | "value"
> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  inputType?: "default" | "email" | "phone" | "password" | "numeric";
  error?: string;
  onBlur?: () => void;
  leftIconName?: keyof typeof Ionicons.glyphMap;
}

export default function TextInputField({
  label,
  placeholder,
  value,
  onChangeText,
  inputType = "default",
  error,
  onBlur,
  leftIconName,
  ...restProps
}: CustomTextInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = inputType === "password";
  const isSecure = isPassword && !isPasswordVisible;

  const getKeyboardType = (): TextInputProps["keyboardType"] => {
    switch (inputType) {
      case "email":
        return "email-address";
      case "phone":
        return "phone-pad";
      case "numeric":
        return "numeric";
      default:
        return "default";
    }
  };

  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </Text>
      )}

      <View
        className={[
          "flex-row items-center rounded-lg px-4", // Sleeker, rounded-xl looks more modern
          "bg-input-light dark:bg-input-dark", // Starker contrast
          "border",
          error
            ? "border-red-500"
            : isFocused
              ? "border-gray-500 dark:border-gray-400"
              : "border-gray-200 dark:border-[#1a1a1a]",
        ].join(" ")}
      >
        {leftIconName && (
          <Ionicons
            name={leftIconName}
            size={20}
            color="#9BA1A6"
            style={{ marginRight: 8 }}
          />
        )}

        <RNTextInput
          className="flex-1 py-4 text-base text-gray-900 dark:text-gray-100" // Reduced py-4 to py-3 for a slimmer profile
          placeholder={placeholder}
          placeholderTextColor="#9BA1A6"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          keyboardType={getKeyboardType()}
          secureTextEntry={isSecure}
          autoCapitalize={inputType === "email" ? "none" : "sentences"}
          autoCorrect={false}
          {...restProps}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
            className="pl-2"
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9BA1A6"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text className="text-xs text-red-500 mt-1.5">{error}</Text>}
    </View>
  );
}
