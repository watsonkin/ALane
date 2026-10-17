/**
 * External store for "now". `getSnapshot` stays stable until a tick or a
 * visibility callback moves it, so `useSyncExternalStore` does not loop.
 */
export type NowClock = {
  nowMs: () => number;
  subscribeTick: (onTick: () => void) => () => void;
  subscribeVisible: (onVisible: () => void) => () => void;
};

export type NowStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => string;
};

export function createNowStore(clock: NowClock): NowStore {
  let snapshot: string | null = null;
  const listeners = new Set<() => void>();
  let stopTick: (() => void) | null = null;
  let stopVisible: (() => void) | null = null;

  function iso(): string {
    return new Date(clock.nowMs()).toISOString();
  }

  function emitIfChanged(): void {
    const next = iso();
    if (next === snapshot) return;
    snapshot = next;
    for (const listener of [...listeners]) listener();
  }

  function ensure(): void {
    if (snapshot === null) snapshot = iso();
    if (stopTick) return;
    stopTick = clock.subscribeTick(emitIfChanged);
    stopVisible = clock.subscribeVisible(emitIfChanged);
  }

  function stop(): void {
    stopTick?.();
    stopVisible?.();
    stopTick = null;
    stopVisible = null;
    snapshot = null;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      ensure();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stop();
      };
    },
    getSnapshot() {
      if (snapshot === null) snapshot = iso();
      return snapshot;
    },
  };
}
