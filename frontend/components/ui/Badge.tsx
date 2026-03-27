import React from "react";
import { Text, View } from "react-native";

interface BadgeProps {
  label?: string;
  className?: string; // Allow custom positioning from parent
}

const Badge = ({ label = "🌱 AgroNet", className = "" }: BadgeProps) => {
  return (
    <View
      className={`self-start bg-white/10 border border-white/20 px-3 py-1 rounded-full flex-row items-center ${className}`}
    >
      <Text className="text-[10px] font-bold tracking-[1px] uppercase text-white">
        {label}
      </Text>
    </View>
  );
};

export default Badge;
