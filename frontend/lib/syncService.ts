import { getQueue, removeFromQueue } from "./offlineQueue";
import { createProduct } from "./productService";
import { createOrder } from "./orderService";

export async function flushQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return;

  console.log(`Syncing ${queue.length} queued actions...`);

  for (const action of queue) {
    try {
if (action.type === "CREATE_LISTING") {
  const { imageUri, ...fields } = action.payload;

  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) =>
    formData.append(key, String(value))
  );
  formData.append("is_available", "true");

  if (imageUri) {
    const filename = imageUri.split("/").pop() || "product.jpg";
    const match = /\.(\w+)$/.exec(filename);
    formData.append("image", {
      uri: imageUri,
      name: filename,
      type: match ? `image/${match[1]}` : "image/jpeg",
    } as any);
  }

  await createProduct(formData);
} else if (action.type === "CREATE_ORDER") {
        await createOrder(action.payload);
      }
      // Remove from queue only after success
      await removeFromQueue(action.id);
    } catch (err) {
      // Leave it in the queue to retry next time
      console.error(`Failed to sync action ${action.id}:`, err);
    }
  }
}