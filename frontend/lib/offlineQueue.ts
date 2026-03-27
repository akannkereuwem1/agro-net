import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "offline_queue";

export type QueuedAction = {
  id: string;
  type: "CREATE_LISTING" | "CREATE_ORDER"; // extend as needed
  payload: any;
  createdAt: string;
};

export async function enqueue(action: Omit<QueuedAction, "id" | "createdAt">) {
  const existing = await getQueue();
  const newAction: QueuedAction = {
    ...action,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, newAction]));
}

export async function getQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function removeFromQueue(id: string) {
  const existing = await getQueue();
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(existing.filter((a) => a.id !== id))
  );
}