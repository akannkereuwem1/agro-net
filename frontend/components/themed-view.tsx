import { useThemeColor } from "@/hooks/use-theme-color";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  className,
  scrollable = false,
  keyboardAvoiding = false,
  children,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
  );

  const inner = (
    <View
      style={[
        { backgroundColor, flex: 1, padding: 15, alignItems: "center" },
        style,
      ]}
      className={className}
      {...otherProps}
    >
      {children}
    </View>
  );

  const content = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  ) : (
    inner
  );

  const wrapped = keyboardAvoiding ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      {wrapped}
    </SafeAreaView>
  );
}
