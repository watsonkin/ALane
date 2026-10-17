import assert from "node:assert/strict";
import test from "node:test";
import { createNowStore } from "@/lib/now-store";

test("snapshot stays cached until a tick or a visible event", () => {
  let ms = Date.parse("2026-10-17T23:59:30+02:00");
  let onTick = () => {};
  let onVisible = () => {};
  let tickSubs = 0;
  let visibleSubs = 0;

  const store = createNowStore({
    nowMs: () => ms,
    subscribeTick(callback) {
      tickSubs += 1;
      onTick = callback;
      return () => {
        tickSubs -= 1;
        onTick = () => {};
      };
    },
    subscribeVisible(callback) {
      visibleSubs += 1;
      onVisible = callback;
      return () => {
        visibleSubs -= 1;
        onVisible = () => {};
      };
    },
  });

  const seen: string[] = [];
  const stopA = store.subscribe(() => seen.push(store.getSnapshot()));
  const stopB = store.subscribe(() => seen.push(store.getSnapshot()));
  const first = store.getSnapshot();
  onTick();
  assert.equal(seen.length, 0);
  assert.equal(store.getSnapshot(), first);

  ms += 5_000;
  assert.equal(store.getSnapshot(), first);
  onTick();
  assert.equal(seen.length, 2);

  ms = Date.parse("2026-10-18T00:00:00+02:00");
  onTick();
  assert.equal(seen.length, 4);
  assert.equal(store.getSnapshot(), "2026-10-17T22:00:00.000Z");

  ms += 60_000;
  onVisible();
  assert.equal(seen.length, 6);
  assert.notEqual(store.getSnapshot(), first);
  assert.equal(tickSubs, 1);
  assert.equal(visibleSubs, 1);

  stopA();
  assert.equal(tickSubs, 1);
  stopB();
  assert.equal(tickSubs, 0);
  assert.equal(visibleSubs, 0);
});
