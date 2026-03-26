import Button from "@/components/ui/Button";
import TextInputField from "@/components/ui/TextInputField";
import { createProduct } from "@/lib/productService";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { enqueue } from "../../../lib/offlineQueue";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddListing() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    crop_type: "",
    location: "",
    quantity: "1",
    unit: "kg",
    price_per_unit: "",
  });

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const units = ["kg", "bag", "ton", "basket", "piece", "bunch"];

  const handleStep = (
    field: "quantity" | "price_per_unit",
    type: "inc" | "dec",
  ) => {
    const val = parseFloat(form[field]) || 0;
    const newVal = type === "inc" ? val + 1 : val > 0 ? val - 1 : 0;
    setForm({ ...form, [field]: newVal.toString() });
  };

  const pickImage = async () => {
    // Request permission (optional but good practice)
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow camera roll access to upload a photo.",
      );
      return;
    }

    // Launch the picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Keeps the image square, which looks sleek for product grids
      quality: 0.8, // Compress slightly for faster uploads
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  
  const handleCreate = async () => {
    const netState = await NetInfo.fetch();
    if (!form.title || !form.crop_type || !form.price_per_unit || !imageUri) {
      Alert.alert(
        "Error",
        "Please fill in all required fields and add a photo.",
      );
      return;
    }



    try {
    
        
      setIsSubmitting(true);

      // 1. Initialize FormData
      const formData = new FormData();

      // 2. Append all text fields
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("crop_type", form.crop_type);
      formData.append("location", form.location);
      formData.append("quantity", String(parseFloat(form.quantity) || 1));
      formData.append("unit", form.unit);
      formData.append(
        "price_per_unit",
        String(parseFloat(form.price_per_unit) || 0),
      );
      formData.append("is_available", "true");

      // 3. Append the Image
      // React Native requires this specific object structure for file uploads
      const filename = imageUri.split("/").pop() || "product.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("image", {
        // <-- IMPORTANT: Change "image" to whatever field name your backend expects for the file (e.g., "file", "image_url", "photo")
        uri: imageUri,
        name: filename,
        type,
      } as any); // 'as any' bypasses a known TypeScript quirk with RN FormData
    if (netState.isConnected && netState.isInternetReachable) {
      await createProduct(formData);

      Alert.alert("Success", "Your listing has been created!");
    }  else {
    await enqueue({
        type: "CREATE_LISTING",
        payload: {
          ...form,
          imageUri,
        },
      });
    Alert.alert(
      "Saved Offline",
      "No connection detected. Your listing will be posted automatically when you're back online."
    );
  }
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 80,
        }} // FIXED: Bottom padding moved here so you can scroll past the button
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          New Listing
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mb-8 text-base">
          Add your fresh produce and reach more buyers
        </Text>

        <TextInputField
          label="Produce Name *"
          placeholder="e.g. White Garri, Fresh Ugu Leaves..."
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />

        <TextInputField
          label="Description"
          placeholder="Quality, harvest date, freshness..."
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          multiline
          numberOfLines={4} // Reduced slightly for proportion
          textAlignVertical="top"
          style={{ minHeight: 100 }} // Moved from className for absolute reliability
        />

        <TextInputField
          label="Crop Category *"
          placeholder="e.g. Vegetable, Tuber, Grain..."
          value={form.crop_type}
          onChangeText={(text) => setForm({ ...form, crop_type: text })}
        />

        <TextInputField
          label="Location"
          placeholder="e.g. Ogbomosho, Osun State"
          value={form.location}
          onChangeText={(text) => setForm({ ...form, location: text })}
        />

        <View className="h-4" />

        {/* Image Picker - Darker, sleeker background */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Product Photo
          </Text>

          <TouchableOpacity
            onPress={pickImage}
            className="w-full aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-400 dark:border-gray-600 items-center justify-center overflow-hidden"
            activeOpacity={0.7}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center">
                <Ionicons name="camera-outline" size={36} color="#6B7280" />
                <Text className="text-gray-600 dark:text-gray-400 mt-3 text-center font-medium">
                  Tap to add photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quantity + Unit */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quantity Available
          </Text>

          <View className="flex-row items-center gap-3">
            {/* Quantity stepper */}
            <View className="flex-1 flex-row items-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 h-12">
              <TouchableOpacity
                onPress={() => handleStep("quantity", "dec")}
                className="px-4 h-full justify-center"
              >
                <Ionicons name="remove" size={20} color="#4B5563" />
              </TouchableOpacity>

              <TextInput
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "600",
                }}
                value={form.quantity}
                keyboardType="numeric"
                onChangeText={(text) => setForm({ ...form, quantity: text })}
                className="text-gray-900 dark:text-white"
              />

              <TouchableOpacity
                onPress={() => handleStep("quantity", "inc")}
                className="px-4 h-full justify-center"
              >
                <Ionicons name="add" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Unit selector - Darker, High Contrast Active State */}
            <View className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 border border-gray-200 dark:border-gray-800 h-12">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: "center" }}
              >
                {units.map((u) => {
                  const isActive = form.unit === u;
                  return (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setForm({ ...form, unit: u })}
                      className={`px-4 py-1.5 mx-0.5 rounded-lg justify-center ${
                        isActive
                          ? "bg-gray-900 dark:bg-gray-100"
                          : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          isActive
                            ? "text-white dark:text-black font-semibold"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Price */}
        <TextInputField
          label={`Price per ${form.unit} (₦) *`}
          placeholder="0.00"
          keyboardType="numeric"
          value={form.price_per_unit}
          onChangeText={(text) => setForm({ ...form, price_per_unit: text })}
        />

        <View className="mt-4">
          <Button label="Create First Listing" onPress={handleCreate} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
