"use client";

import { useSyncExternalStore } from "react";
import { createNowStore, type NowClock } from "@/lib/now-store";
import { NOW_TICK_MS, readNowMs } from "@/lib/now";

function browserNowMs(): number {
  if (typeof window === "undefined") return Date.now();
  return readNowMs({
    nowMs: Date.now(),
    search: window.location.search,
    nodeEnv: process.env.NODE_ENV,
    hostname: window.location.hostname,
  });
}

const browserClock: NowClock = {
  nowMs: browserNowMs,
  subscribeTick(onTick) {
    const id = window.setInterval(onTick, NOW_TICK_MS);
    return () => window.clearInterval(id);
  },
  subscribeVisible(onVisible) {
    const onChange = () => {
      if (document.visibilityState === "visible") onVisible();
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  },
};

const nowStore = createNowStore(browserClock);

/**
 * First paint (and hydration) returns `serverAsOf`. After hydration the
 * snapshot switches to the device clock, then refreshes every 60s and when
 * the tab becomes visible.
 */
export function useNow(serverAsOf: string): string {
  return useSyncExternalStore(nowStore.subscribe, nowStore.getSnapshot, () => serverAsOf);
}
