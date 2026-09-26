"use client";

export type ActivityStatus =
  | "pending"
  | "confirming"
  | "success"
  | "failed"
  | "rejected";

export type ActivityItem = {
  id: string;
  chainId: number;
  hash?: string;
  status: ActivityStatus;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: string;
  amountOut?: string;
  feeTier?: number;
  slippageBps?: number;
  error?: string;
  explorerUrl?: string;
  createdAt: number;
  updatedAt: number;
  privacyMode: "public" | "private";
};

type Listener = (items: ActivityItem[]) => void;

const STORAGE_KEY = "astroswap.activity.v1";
let memory: ActivityItem[] = [];
const listeners = new Set<Listener>();

function load(): ActivityItem[] {
  if (typeof window === "undefined") return memory;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return memory;
    memory = JSON.parse(raw) as ActivityItem[];
    return memory;
  } catch {
    return memory;
  }
}

function persist(items: ActivityItem[]) {
  memory = items;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota */
    }
  }
  listeners.forEach((l) => l(items));
}

export function getActivity(): ActivityItem[] {
  return load();
}

export function subscribeActivity(listener: Listener): () => void {
  listeners.add(listener);
  listener(load());
  return () => listeners.delete(listener);
}

export function addActivity(
  item: Omit<ActivityItem, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
): ActivityItem {
  const now = Date.now();
  const full: ActivityItem = {
    ...item,
    id: item.id ?? `act_${now}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  const next = [full, ...load()].slice(0, 50);
  persist(next);
  return full;
}

export function updateActivity(
  id: string,
  patch: Partial<ActivityItem>,
): void {
  const next = load().map((item) =>
    item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item,
  );
  persist(next);
}

export function clearActivity(): void {
  persist([]);
}
