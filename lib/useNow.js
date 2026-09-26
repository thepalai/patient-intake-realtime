import { useEffect, useState } from 'react';

// The staff screen's clock. One timer for the whole page, so every card
// works out its status from the same moment.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // The timer's id lives inside the effect, where the cleanup can reach it.
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
