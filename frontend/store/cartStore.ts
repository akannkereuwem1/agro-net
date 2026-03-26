import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Product } from "../lib/productService";

// Define what a Cart Item looks like (Product + selected quantity)
export interface CartItem extends Product {
  cartQuantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (item) => item.id === product.id,
        );

        if (existingItem) {
          // If already in cart, just update the quantity
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, cartQuantity: item.cartQuantity + quantity }
                : item,
            ),
          });
        } else {
          // Otherwise, add as a new item
          set({
            items: [...currentItems, { ...product, cartQuantity: quantity }],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, cartQuantity: quantity } : item,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + Number(item.price_per_unit) * item.cartQuantity,
          0,
        );
      },
    }),
    {
      name: "cart-storage", // Unique name for the storage key
      storage: createJSONStorage(() => AsyncStorage), // Tell Zustand to use AsyncStorage
    },
  ),
);
