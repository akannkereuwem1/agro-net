import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

// SIGNUP
// SIGNUP
export const registerUser = async (payload: {
  email: string;
  full_name: string;
  password: string;
  role: "farmer" | "buyer";
}) => {
  console.log(
    "[Auth] Registering user:",
    payload.email,
    "| Role:",
    payload.role,
  );

  const response = await api.post("/users/register/", payload);
  const { tokens, user } = response.data;

  console.log("[Auth] Registration success, storing credentials...");

  // Save everything exactly like you do in loginUser
  await AsyncStorage.setItem("token", tokens.access);
  await AsyncStorage.setItem("role", user.role);
  await AsyncStorage.setItem("user", JSON.stringify(user));

  console.log("[Auth] Token and role saved to AsyncStorage");
  return { tokens, user };
};

// LOGIN
export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  console.log("[Auth] Logging in:", payload.email);
  const response = await api.post("/users/login/", payload);

  const { tokens, user } = response.data;
  console.log(response.data);

  await AsyncStorage.setItem("token", tokens.access);
  console.log("Set token");
  await AsyncStorage.setItem("role", user.role);
  console.log("Set role");
  await AsyncStorage.setItem("user", JSON.stringify(user));

  console.log("[Auth] Token and role saved to AsyncStorage");
  return { tokens, user };
};

//LOGOUT
export const logoutUser = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
  await AsyncStorage.removeItem("role");
};
