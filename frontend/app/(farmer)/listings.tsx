import Button from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FarmerListingCard from "../../components/ListingCard";
import { fetchMyProducts, Product } from "../../lib/productService";

export default function FarmerListings() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyListings = async () => {
    try {
      setLoading(true);
      // Assuming your backend returns ONLY the logged-in user's products here,
      // or you pass a parameter like { farmer_id: myId }
      const data = await fetchMyProducts();
      setProducts(data.results);
    } catch (error) {
      console.error("Failed to load listings", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMyListings();
  }, []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMyListings();
  }, []);

  return (
    <SafeAreaView 
  edges={['top', 'left', 'right']} 
  className="flex-1 bg-gray-50 dark:bg-background-dark"
>
      <View className="flex-1 p-4 ">
        {/* Top Header & Add Button */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            My Produce
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(stack)/(listings)/add")}
            className="flex-row items-center px-4 py-2 rounded-lg"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-bold ml-1">Add Listing</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2E7D32" className="mt-10" />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FarmerListingCard
                product={item}
                onPress={(id) => router.push(`/(stack)/(listings)/${id}`)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#2E7D32"
              />
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons
                  name="basket-outline"
                  size={64}
                  color="#F2F2F2"
                  mb-4
                />
                <Text className="text-lg font-bold text-black dark:text-white mb-2">
                  No Listings Yet
                </Text>
                <Text className="text-center text-gray-500 mb-6 px-4">
                  You haven't added any produce to your storefront yet. Start
                  selling by adding your first item!
                </Text>
                <Button
                  label="Create First Listing"
                  onPress={() => router.push("/(stack)/(listings)/add")}
                />
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
