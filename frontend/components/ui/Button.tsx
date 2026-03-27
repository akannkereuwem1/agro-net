import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "warning" | "ghost";

interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<
  ButtonVariant,
  { container: string; text: string }
> = {
  primary: {
    container: "bg-primary-light dark:bg-primary-dark",
    text: "text-white",
  },
  secondary: {
    container:
      "bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark",
    text: "text-text-light dark:text-text-dark",
  },
  warning: {
    container: "bg-danger-light dark:bg-danger-dark",
    text: "text-white",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-primary-light dark:text-primary-dark",
  },
};

const sizeClasses: Record<
  "sm" | "md" | "lg",
  { container: string; text: string }
> = {
  sm: { container: "py-2.5 px-4 rounded-lg", text: "text-sm" },
  md: { container: "py-4 px-5 rounded-xl", text: "text-base" },
  lg: { container: "py-5 px-6 rounded-2xl", text: "text-base" },
};

export default function Button({
  label,
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = true,
  size = "md",
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { container, text } = variantClasses[variant];
  const { container: sizeContainer, text: sizeText } = sizeClasses[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={[
        fullWidth ? "w-full" : "self-start",
        sizeContainer,
        container,
        isDisabled ? "opacity-40" : "opacity-100",
      ].join(" ")}
      {...props}
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading && (
          <ActivityIndicator
            size="small"
            color={
              variant === "secondary" || variant === "ghost"
                ? "#1b3427"
                : "#fff"
            }
          />
        )}
        <Text className={["font-bold text-center", sizeText, text].join(" ")}>
          {loading ? "Please wait..." : label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
