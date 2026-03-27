import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const api = axios.create({
  baseURL: "https://agronet-backend-02382983bf13.herokuapp.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[API] Token attached to request:", config.url);
    } else {
      console.log("[API] No token found for request:", config.url);
    }
    return config;
  },
  (error) => {
    console.error("[API] Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// RESPONSE interceptor — handle global errors (e.g. 401)
api.interceptors.response.use(
  (response) => {
    console.log(
      "[API] Response from:",
      response.config.url,
      "| Status:",
      response.status,
    );
    return response;
  },
  (error) => {
    console.error(
      "[API] Error from:",
      error.config?.url,
      "| Status:",
      error.response?.status,
      "| Message:",
      error.response?.data,
    ); // 🐛 debug
    if (error.response?.status === 401) {
      // 🔧 Optionally trigger logout here
      console.warn("[API] Unauthorized — consider redirecting to login");
    }
    return Promise.reject(error);
  },
);

export default api;
