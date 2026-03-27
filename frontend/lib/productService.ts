import api from "./api";

export interface Product {
  id: string;
  farmer: string;
  farmer_email: string;
  title: string;
  description: string;
  crop_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  location: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Fetch all products with optional filters
export const fetchProducts = async (params?: {
  search?: string;
  page?: number;
  crop_type?: string;
}) => {
  const response = await api.get<PaginatedResponse<Product>>("/products/", {
    params,
  });
  return response.data;
};

export const fetchMyProducts = async (params?: {
  search?: string;
  page?: number;
  crop_type?: string;
}) => {
  const response = await api.get<PaginatedResponse<Product>>("/products/my/", {
    params,
  });
  console.log(response.data);
  return response.data;
};

// Fetch a single product by ID
export const fetchProductById = async (id: string) => {
  const response = await api.get<Product>(`/products/${id}/`);
  return response.data;
};

export const createProduct = async (data: FormData | Partial<Product>) => {
  const response = await api.post("/products/", data);
  return response.data;
};

export const updateProduct = async (id: string, data: Partial<Product>) => {
  const response = await api.patch(`/products/${id}/`, data);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await api.delete(`/products/${id}/`);
  return response.data;
};
