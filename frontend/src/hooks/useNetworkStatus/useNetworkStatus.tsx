import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

type NetworkStatus = {
  isOnline: boolean; // navigator.onLine
  isReachable: boolean; // light ping to server
  lastChecked: number | null;
};

const PING_PATH = "/healthcheck.txt"; // optional small endpoint; fallback to supabase url
const REACHABLE_TIMEOUT = 3000;

export function useNetworkStatus(pingUrl?: string) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isReachable, setIsReachable] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  const url = pingUrl || (() => {
    try {
      const base = (supabase as any).url || '';
      return base || window.location.origin;
    } catch (e) {
      return window.location.origin;
    }
  })();

  const checkReachable = useCallback(async (signal?: AbortSignal) => {
    if (typeof window === 'undefined') return;
    const target = url + PING_PATH;
    const controller = new AbortController();
    const s = signal || controller.signal;
    let ok = false;
    try {
      const timer = setTimeout(() => controller.abort(), REACHABLE_TIMEOUT);
      const res = await fetch(target, { method: 'GET', cache: 'no-store', signal: s });
      clearTimeout(timer);
      ok = res && res.ok;
    } catch (e) {
      ok = false;
    }
    setIsReachable(ok);
    setLastChecked(Date.now());
    return ok;
  }, [url]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // initial quick reachability check
    let aborted = false;
    (async () => {
      try {
        await checkReachable();
      } catch (e) { /* ignore */ }
      if (aborted) return;
    })();

    return () => {
      aborted = true;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [checkReachable]);

  // recompute derived reachable status: if navigator says offline, then unreachable
  useEffect(() => {
    if (!isOnline) setIsReachable(false);
    else {
      // if online, perform a quick ping
      const ac = new AbortController();
      checkReachable(ac.signal).catch(() => {});
      return () => ac.abort();
    }
  }, [isOnline, checkReachable]);

  return useMemo<NetworkStatus>(() => ({ isOnline, isReachable, lastChecked }), [isOnline, isReachable, lastChecked]);
}

export default useNetworkStatus;
