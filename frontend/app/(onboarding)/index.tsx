import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const images = [
  require("../../assets/images/welcomepic1.jpg"),
  require("../../assets/images/welcomepic2.jpg"),
  require("../../assets/images/welcomepic3.jpg"),
  require("../../assets/images/welcomepic4.jpg"),
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out to 0
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setIndex((prev) => (prev + 1) % images.length);
        // Fade back in to 1
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Background Slideshow - Forced to back */}
      <Animated.Image
        key={index}
        source={images[index]}
        resizeMode="cover"
        style={{
          position: "absolute",
          width: width,
          height: height,
          opacity: fadeAnim,
        }}
      />

      {/* The Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
        style={StyleSheet.absoluteFill} // Use style here instead of className for the background layer
      >
        <SafeAreaView className="flex-1 justify-between px-6">
          <Badge className="mt-4" />

          <View className="pb-10">
            <Text className="text-white text-4xl font-extrabold leading-tight mb-3">
              Grow Together,{"\n"}Sell Smarter.
            </Text>
            <Text className="text-white/70 text-base leading-relaxed mb-8">
              Connect directly with farmers and buyers — no middlemen, more
              profit.
            </Text>

            <Button
              label="Get Started"
              onPress={() => router.push("/(onboarding)/signup")}
            />

            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/signin")}
              className="items-center py-4 mt-2"
              activeOpacity={0.7}
            >
              <Text className="text-white/60 text-sm">
                Already have an account?{" "}
                <Text className="text-white font-bold">Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
