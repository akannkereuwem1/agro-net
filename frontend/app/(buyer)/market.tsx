import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../../components/ProductCard";
import TextInputField from "../../components/ui/TextInputField";  
import { fetchProducts, Product } from "../../lib/productService";

export default function Market() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to load products
  const loadProducts = async (query = "") => {
    try {
      setLoading(true);
      const data = await fetchProducts({ search: query });
      setProducts(data.results);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      // You could add a toast or error state here
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts(searchQuery);
  }, [searchQuery]);

  // Handle search submission (runs when user presses "enter" on keyboard)
  const handleSearchSubmit = () => {
    loadProducts(searchQuery);
  };

  // Navigate to details page
  const handleProductPress = (id: string) => {
    router.push(`/(stack)/produce/${id}`); // Assumes you use Expo Router
  };

  return (
    /* Replaced View with SafeAreaView and adjusted padding to px-4 pt-4 */
        <SafeAreaView 
      edges={['top', 'left', 'right']} 
      className="flex-1 bg-gray-50 dark:bg-background-dark p-4"
    >
      {/* Search Header */}
      <View className="mb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Marketplace
        </Text>
        <TextInputField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for yams, tomatoes, etc..."
          leftIconName="search-outline"
          onSubmitEditing={handleSearchSubmit} // Triggers search on keyboard "Done/Return"
          returnKeyType="search"
        />
      </View>

      {/* Product List */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F57C00" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={handleProductPress} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F57C00"
            />
          }
          ListEmptyComponent={
            <View className="py-10 items-center">
              <Text className="text-gray-500">No products found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
