import { create } from "zustand";

type Role = "farmer" | "buyer";

interface AuthState {
  email: string;
  full_name: string;
  password: string;
  role: Role | null;
  userId: string | null;
  isActive: boolean;
  isLoggedIn: boolean;
  isHydrated: boolean;

  setSignupFields: (fields: {
    email: string;
    full_name: string;
    password: string;
  }) => void;
  setRole: (role: Role) => void;
  setUserFromLogin: (user: {
    id: string;
    email: string;
    full_name: string;
    role: Role;
    is_active: boolean;
  }) => void;
  setHydrated: () => void;
  clearAuth: () => void;
  updateUser: (updates: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: "",
  full_name: "",
  password: "",
  role: null,
  userId: null,
  isActive: false,
  isLoggedIn: false,
  isHydrated: false,

  setSignupFields: (fields) => {
    console.log("[Store] Signup fields set:", fields.email);
    set(fields);
  },

  updateUser: (updates: any) => {
    set((state) => ({ ...state, ...updates }));
  },

  setRole: (role) => {
    console.log("[Store] Role set:", role);
    set({ role });
  },

  setUserFromLogin: (user) => {
    console.log("[Store] User set from login:", user.email, user.role);
    set({
      userId: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      isActive: user.is_active,
      isLoggedIn: true, // ← set here
    });
  },

  setHydrated: () => {
    console.log("[Store] Hydration complete");
    set({ isHydrated: true });
  },

  clearAuth: () => {
    console.log("[Store] Auth cleared");
    set({
      email: "",
      full_name: "",
      password: "",
      role: null,
      userId: null,
      isActive: false,
      isLoggedIn: false,
    });
  },
}));
