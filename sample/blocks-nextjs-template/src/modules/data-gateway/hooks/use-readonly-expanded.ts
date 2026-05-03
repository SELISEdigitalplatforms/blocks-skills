import { useEffect, useState } from "react";

// Shared state management for readonly section expansion
let sharedReadonlyExpanded = false;
const listeners = new Set<(value: boolean) => void>();

export function useReadonlyExpanded() {
  const [isExpanded, setIsExpanded] = useState(sharedReadonlyExpanded);

  useEffect(() => {
    const listener = (value: boolean) => setIsExpanded(value);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setExpanded = (value: boolean) => {
    sharedReadonlyExpanded = value;
    listeners.forEach((listener) => listener(value));
  };

  return [isExpanded, setExpanded] as const;
}
