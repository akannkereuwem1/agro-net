import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, useColorScheme } from "react-native";

const BackButton = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <TouchableOpacity
      onPress={() => router.back()}
      className="h-10 w-10 items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark"
      activeOpacity={0.7}
    >
      <Feather
        name="chevron-left"
        size={24}
        color={colorScheme === "dark" ? "#fff" : "#000"}
      />
    </TouchableOpacity>
  );
};

export default BackButton;
