"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type ActivityItem,
  getActivity,
  subscribeActivity,
  addActivity,
  updateActivity,
  clearActivity,
} from "@/lib/activity/store";

export function useActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => subscribeActivity(setItems), []);

  const add = useCallback(
    (item: Parameters<typeof addActivity>[0]) => addActivity(item),
    [],
  );
  const update = useCallback(
    (id: string, patch: Partial<ActivityItem>) => updateActivity(id, patch),
    [],
  );
  const clear = useCallback(() => clearActivity(), []);

  return { items, add, update, clear, getActivity };
}
