import api from "./api";

// --- Interfaces ---

export interface OrderItem {
  product_id: string;
  product_title: string;
  quantity: string | number;
  unit_price: string | number;
}

export interface Order {
  id: string;
  buyer: string;
  farmer: string;
  status: "pending" | "confirmed" | "declined" | "completed" | string;
  total_price: string | number;
  note: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface CreateOrderPayload {
  product_id: string;
  quantity: string | number;
  note?: string;
}

// Reusing your PaginatedResponse generic if your orders endpoint is paginated
// (If it's not paginated and just returns an array, we'll return Order[])
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- API Functions ---

// Fetch all orders for the authenticated user (Buyer sees theirs, Farmer sees theirs)
export const fetchOrders = async () => {
  // Update the generic type to use PaginatedResponse<Order>
  const response = await api.get<PaginatedResponse<Order>>("/orders/");
  console.log(response.data);
  return response.data; 
};

// Fetch a single order by ID
export const fetchOrderById = async (id: string) => {
  const response = await api.get<Order>(`/orders/${id}/`);
  return response.data;
};

// Create a new order (Buyer only)
export const createOrder = async (data: CreateOrderPayload) => {
  const response = await api.post<Order>("/orders/", data);
  return response.data;
};

// Confirm an order (Farmer only)
export const confirmOrder = async (id: string) => {
  const response = await api.patch<Order>(`/orders/${id}/confirm/`);
  return response.data;
};

// Decline an order (Farmer only)
export const declineOrder = async (id: string) => {
  const response = await api.patch<Order>(`/orders/${id}/decline/`);
  return response.data;
};

// Mark a paid order as completed (Farmer only)
export const completeOrder = async (id: string) => {
  const response = await api.patch<Order>(`/orders/${id}/complete/`);
  return response.data;
};
