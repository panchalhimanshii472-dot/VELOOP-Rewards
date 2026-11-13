import { useEffect, useRef, useState } from 'react';

function formatDuration(ms) {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':');
}

/**
 * Computes visual countdown exclusively from backend-provided serverTime and
 * nextClaimAt timestamps, advancing via monotonic performance.now() rather than
 * trusting local system clock changes.
 */
export function useServerCountdown({ serverTime, nextClaimAt, onExpired }) {
  const [remainingMs, setRemainingMs] = useState(null);
  const expiredTriggeredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    if (!serverTime || !nextClaimAt) {
      setRemainingMs(null);
      expiredTriggeredRef.current = false;
      return undefined;
    }

    const serverMs = Date.parse(serverTime);
    const targetMs = Date.parse(nextClaimAt);

    if (!Number.isFinite(serverMs) || !Number.isFinite(targetMs)) {
      setRemainingMs(null);
      return undefined;
    }

    const fetchedAtPerf = performance.now();
    expiredTriggeredRef.current = false;

    const computeRemaining = () => {
      const elapsedSinceFetch = performance.now() - fetchedAtPerf;
      const estimatedServerNow = serverMs + elapsedSinceFetch;
      return Math.max(0, targetMs - estimatedServerNow);
    };

    const initial = computeRemaining();
    setRemainingMs(initial);

    // If initial is already zero or in the past, no countdown is needed.
    // NEVER call onExpired here to prevent recursive fetch/update loops.
    if (initial <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const next = computeRemaining();
      setRemainingMs(next);

      if (next <= 0 && !expiredTriggeredRef.current) {
        expiredTriggeredRef.current = true;
        window.clearInterval(timer);
        if (onExpiredRef.current) {
          onExpiredRef.current();
        }
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [serverTime, nextClaimAt]);

  return {
    remainingMs,
    formattedTime: remainingMs !== null ? formatDuration(remainingMs) : null,
    isActive: remainingMs !== null && remainingMs > 0,
  };
}
