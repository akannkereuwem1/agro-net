import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import TextInputField from "../../../components/ui/TextInputField";
import {
  deleteProduct,
  fetchProductById,
  Product,
  updateProduct,
} from "../../../lib/productService";

export default function ListingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadListing = async () => {
      try {
        const data = await fetchProductById(id);
        setProduct(data);
        setForm(data);
      } catch (error) {
        Alert.alert("Error", "Could not load listing.");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadListing();
  }, [id]);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await updateProduct(id, form);
      setProduct({ ...product, ...form } as Product);
      setIsEditing(false);
      Alert.alert("Success", "Listing updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to permanently remove this produce?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(id);
              router.back();
            } catch (error) {
              Alert.alert("Error", "Could not delete listing.");
            }
          },
        },
      ],
    );
  };

  // Helper to format the creation date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-gray-500 dark:text-gray-400">
          Product not found.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-full"
        >
          <Text className="font-semibold text-gray-900 dark:text-white">
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView
        className="flex-1"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HERO IMAGE SECTION --- */}
        <View className="w-full h-96 relative bg-gray-100 dark:bg-gray-900">
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="image-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-400 mt-2 font-medium">
                No photo available
              </Text>
            </View>
          )}

          {/* Floating Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ top: insets.top + 10, left: 20 }}
            className="absolute w-10 h-10 bg-black/40 backdrop-blur-md rounded-full items-center justify-center z-10"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* --- CONTENT OVERLAY --- */}
        <View className="bg-white dark:bg-black rounded-t-3xl -mt-8 px-5 pt-8 pb-12 min-h-screen">
          {isEditing ? (
            /* --- EDIT MODE --- */
            <View>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Edit Listing
              </Text>

              <TextInputField
                label="Produce Name"
                value={form.title || ""}
                onChangeText={(text: string) =>
                  setForm({ ...form, title: text })
                }
              />

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <TextInputField
                    label={`Price (₦)`}
                    inputType="numeric"
                    value={String(form.price_per_unit || "")}
                    onChangeText={(text: string) =>
                      setForm({ ...form, price_per_unit: parseFloat(text) })
                    }
                  />
                </View>
                <View className="flex-1">
                  <TextInputField
                    label={`Stock (${product.unit})`}
                    inputType="numeric"
                    value={String(form.quantity || "")}
                    onChangeText={(text: string) =>
                      setForm({ ...form, quantity: parseFloat(text) })
                    }
                  />
                </View>
              </View>

              <TextInputField
                label="Crop Category"
                value={form.crop_type || ""}
                onChangeText={(text: string) =>
                  setForm({ ...form, crop_type: text })
                }
              />

              <TextInputField
                label="Location"
                value={form.location || ""}
                onChangeText={(text: string) =>
                  setForm({ ...form, location: text })
                }
              />

              <TextInputField
                label="Description"
                value={form.description || ""}
                onChangeText={(text: string) =>
                  setForm({ ...form, description: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
              />

              <View className="flex-row space-x-4 mt-8">
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setForm(product); // Reset form to original
                  }}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 rounded-xl items-center"
                >
                  <Text className="font-bold text-gray-700 dark:text-gray-300 text-base">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-gray-900 dark:bg-white rounded-xl items-center"
                >
                  {isSubmitting ? (
                    <ActivityIndicator
                      color={isSubmitting ? "gray" : "white"}
                    />
                  ) : (
                    <Text className="font-bold text-white dark:text-black text-base">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* --- VIEW MODE --- */
            <View>
              {/* Header Info */}
              <View className="flex-row justify-between items-start mb-6">
                <View className="flex-1 pr-4">
                  <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 leading-tight">
                    {product.title}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`px-2.5 py-1 rounded-md ${product.is_available ? "bg-green-100 dark:bg-green-900/40" : "bg-red-100 dark:bg-red-900/40"}`}
                    >
                      <Text
                        className={`text-xs font-bold uppercase tracking-wider ${product.is_available ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}
                      >
                        {product.is_available ? "Active" : "Draft"}
                      </Text>
                    </View>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      Listed {formatDate(product.created_at)}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₦
                    {parseFloat(
                      product.price_per_unit.toString(),
                    ).toLocaleString()}
                  </Text>
                  <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    per {product.unit}
                  </Text>
                </View>
              </View>

              {/* The "Section List" Details Grid */}
              <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-8 border border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="cube-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 dark:text-gray-300 font-medium">
                      Available Stock
                    </Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold text-base">
                    {parseFloat(product.quantity.toString())} {product.unit}s
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="leaf-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 dark:text-gray-300 font-medium">
                      Crop Category
                    </Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold text-base">
                    {product.crop_type}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <Text className="text-gray-600 dark:text-gray-300 font-medium">
                      Location
                    </Text>
                  </View>
                  <Text
                    className="text-gray-900 dark:text-white font-bold text-base w-1/2 text-right"
                    numberOfLines={1}
                  >
                    {product.location || "Not specified"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-600 dark:text-gray-300 font-medium">
                      Farmer Contact
                    </Text>
                  </View>
                  <Text
                    className="text-gray-900 dark:text-white font-bold text-sm w-1/2 text-right"
                    numberOfLines={1}
                  >
                    {product.farmer_email}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View className="mb-10">
                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  About this produce
                </Text>
                <Text className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {product.description ||
                    "No description provided for this item."}
                </Text>
              </View>

              {/* Bottom Action Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="w-full py-4 bg-gray-900 dark:bg-white rounded-xl items-center flex-row justify-center gap-2 mb-3"
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="pencil"
                    size={20}
                    color={product.is_available ? "white" : "black"}
                    className="dark:text-black text-white"
                  />
                  <Text className="font-bold text-white dark:text-black text-base">
                    Edit Listing
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  className="w-full py-4 bg-transparent border-2 border-red-500 rounded-xl items-center flex-row justify-center gap-2"
                  activeOpacity={0.6}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text className="font-bold text-red-500 text-base">
                    Delete Listing
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
