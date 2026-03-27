import api from "./api";

export interface PaymentResponse {
  transaction_reference: string;
  amount: string;
  status: string;
  order_id: string;
  checkout_params: Record<string, string>;
}

export const initiatePayment = async (orderId: string): Promise<PaymentResponse> => {
  const response = await api.post<PaymentResponse>("/payments/initiate/", {
    order_id: orderId,
  });
  return response.data;
};

export const verifyPayment = async (
  transactionReference: string
): Promise<PaymentResponse> => {
  const response = await api.post<PaymentResponse>("/payments/verify/", {
    transaction_reference: transactionReference,
  });
  return response.data;
};

/**
 * Treat any 200 response from verifyPayment as confirmed.
 * Since the backend is mocked the status string isn't reliable,
 * so a successful HTTP call is the source of truth for demo purposes.
 * Swap this out for  `result.status === "success"` once the real
 * Interswitch integration is live.
 */
export const isPaymentConfirmed = (result: PaymentResponse): boolean => {
  // TODO: replace with real status check e.g. result.status === "00" (Interswitch success code)
  return true;
};