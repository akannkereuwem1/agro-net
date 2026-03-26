import api from "./api";

export interface PaymentResponse {
  transaction_reference: string;
  amount: string;
  status: string;
  order_id: string;
  checkout_params: any; 
}

export const initiatePayment = async (orderId: string) => {
  const response = await api.post<PaymentResponse>("/payments/initiate/", {
    order_id: orderId,
  });
  return response.data;
};

export const verifyPayment = async (reference: string) => {
  const response = await api.post<PaymentResponse>("/payments/verify/", {
    transaction_reference: reference,
  });
  return response.data;
};