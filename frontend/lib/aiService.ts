import api from "./api";

// ─── Price Prediction ──────────────────────────────────────────────────────────

export type PriceUnit = "kg" | "tonnes" | "bags" | "crates" | "pieces";
export type Season = "dry" | "wet" | "harmattan" | "off-season";

export interface PricePredictionRequest {
  crop_type: string;
  quantity: string;   // decimal string e.g. "100.00"
  unit: PriceUnit;
  location: string;
  season: Season;
}

export interface PricePredictionResponse {
  success: boolean;
  predicted_price: string;   // e.g. "450.00"
  lower_bound: string;
  upper_bound: string;
  model_version: string;     // e.g. "gemini-1.5-flash"
}

export const predictPrice = async (
  payload: PricePredictionRequest
): Promise<PricePredictionResponse> => {
  const response = await api.post<PricePredictionResponse>(
    "/ai/predict-price/",
    payload
  );
  return response.data;
};

// ─── Image Classification ──────────────────────────────────────────────────────

export interface ClassificationLabel {
  label: string;
  confidence: number; // 0–1
}

export interface ClassifyImageResponse {
  success: boolean;
  classification_id: string;
  labels: ClassificationLabel[];
  created_at: string; // ISO 8601
}

/**
 * Classify an agricultural image.
 *
 * Pass either:
 *   - `imageUri`  – a local file URI from the image picker (sends multipart/form-data)
 *   - `imageUrl`  – a remote HTTPS URL (sends JSON)
 *
 * Exactly one must be supplied; passing both or neither throws locally.
 */
export const classifyImage = async ({
  imageUri,
  imageUrl,
  mimeType = "image/jpeg",
}: (
  | { imageUri: string; imageUrl?: never; mimeType?: string }
  | { imageUrl: string; imageUri?: never; mimeType?: never }
)): Promise<ClassifyImageResponse> => {
  if (imageUri && imageUrl) {
    throw new Error("Supply either imageUri or imageUrl, not both.");
  }
  if (!imageUri && !imageUrl) {
    throw new Error("Supply either imageUri or imageUrl.");
  }

  if (imageUri) {
    // ── File upload path ──────────────────────────────────────────
    const filename = imageUri.split("/").pop() ?? "image.jpg";

    const formData = new FormData();
    // React Native's FormData accepts this shape for file parts
    formData.append("image", {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const response = await api.post<ClassifyImageResponse>(
      "/ai/classify-image/",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } else {
    // ── URL path ──────────────────────────────────────────────────
    if (!imageUrl!.startsWith("https://")) {
      throw new Error("image_url must use HTTPS.");
    }
    const response = await api.post<ClassifyImageResponse>(
      "/ai/classify-image/",
      { image_url: imageUrl }
    );
    return response.data;
  }
};