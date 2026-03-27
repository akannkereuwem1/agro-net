import api from "./api";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "farmer" | "buyer";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch the authenticated user's profile
export const fetchUserProfile = async () => {
  const response = await api.get<UserProfile>("/users/profile/");
  return response.data;
};
