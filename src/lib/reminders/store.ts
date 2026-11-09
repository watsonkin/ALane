import type { ReminderLocale, SubscriberStatus } from "@/lib/reminders/schema";
import { SQL } from "@/lib/reminders/sql";

export type SubscriberRow = {
  email: string;
  locale: ReminderLocale;
  status: SubscriberStatus;
  verified_at: string | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  last_digest_at: string | null;
  consent_at: string;
  created_at: string;
  updated_at: string;
};

export type CodeRow = {
  email: string;
  code_hash: string;
  expires_at: string;
  wrong_attempts: number;
  locked_until: string | null;
  send_count: number;
  send_window_started_at: string;
  last_sent_at: string;
  pending_locale: ReminderLocale;
};

export type SnapshotRow = {
  payload_json: string;
  sent_at: string | null;
};

export interface RemindersStore {
  getSubscriber(email: string): Promise<SubscriberRow | null>;
  upsertSubscriber(row: SubscriberRow): Promise<void>;
  listActive(): Promise<SubscriberRow[]>;
  purgePendingUnverified(olderThanIso: string): Promise<void>;
  purgeUnsubscribed(olderThanIso: string): Promise<void>;
  getCode(email: string): Promise<CodeRow | null>;
  upsertCode(row: CodeRow): Promise<void>;
  deleteCode(email: string): Promise<void>;
  getSnapshot(): Promise<string | null>;
  saveSnapshot(payloadJson: string, sentAt: string | null): Promise<void>;
  touchActiveDigest(sentAt: string): Promise<void>;
}

export interface RemindersD1Statement {
  bind(...values: unknown[]): RemindersD1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
}

export interface RemindersD1 {
  prepare(query: string): RemindersD1Statement;
}

function subscriberParams(row: SubscriberRow): unknown[] {
  return [
    row.email,
    row.locale,
    row.status,
    row.verified_at,
    row.subscribed_at,
    row.unsubscribed_at,
    row.last_digest_at,
    row.consent_at,
    row.created_at,
    row.updated_at,
  ];
}

function codeParams(row: CodeRow): unknown[] {
  return [
    row.email,
    row.code_hash,
    row.expires_at,
    row.wrong_attempts,
    row.locked_until,
    row.send_count,
    row.send_window_started_at,
    row.last_sent_at,
    row.pending_locale,
  ];
}

export function createD1RemindersStore(db: RemindersD1): RemindersStore {
  return {
    async getSubscriber(email) {
      return db.prepare(SQL.selectSubscriber).bind(email).first<SubscriberRow>();
    },
    async upsertSubscriber(row) {
      const existing = await db.prepare(SQL.selectSubscriber).bind(row.email).first<SubscriberRow>();
      const next = existing ? { ...row, created_at: existing.created_at } : row;
      await db.prepare(SQL.upsertSubscriber).bind(...subscriberParams(next)).run();
    },
    async listActive() {
      const result = await db.prepare(SQL.listActive).all<SubscriberRow>();
      return result.results ?? [];
    },
    async purgePendingUnverified(olderThanIso) {
      await db.prepare(SQL.deletePendingCodes).bind(olderThanIso).run();
      await db.prepare(SQL.deletePendingSubscribers).bind(olderThanIso).run();
    },
    async purgeUnsubscribed(olderThanIso) {
      await db.prepare(SQL.deleteStaleUnsubscribeCodes).bind(olderThanIso).run();
      await db.prepare(SQL.deleteStaleUnsubscribes).bind(olderThanIso).run();
    },
    async getCode(email) {
      return db.prepare(SQL.selectCode).bind(email).first<CodeRow>();
    },
    async upsertCode(row) {
      await db.prepare(SQL.upsertCode).bind(...codeParams(row)).run();
    },
    async deleteCode(email) {
      await db.prepare(SQL.deleteCode).bind(email).run();
    },
    async getSnapshot() {
      const row = await db.prepare(SQL.selectSnapshot).first<SnapshotRow>();
      return row?.payload_json ?? null;
    },
    async saveSnapshot(payloadJson, sentAt) {
      await db.prepare(SQL.upsertSnapshot).bind(sentAt, payloadJson).run();
    },
    async touchActiveDigest(sentAt) {
      await db.prepare(SQL.touchActiveDigest).bind(sentAt).run();
    },
  };
}

export function createMemoryRemindersStore(): RemindersStore {
  const subscribers = new Map<string, SubscriberRow>();
  const codes = new Map<string, CodeRow>();
  let snapshot: string | null = null;

  return {
    async getSubscriber(email) {
      const row = subscribers.get(email);
      return row ? { ...row } : null;
    },
    async upsertSubscriber(row) {
      const existing = subscribers.get(row.email);
      subscribers.set(row.email, {
        ...row,
        created_at: existing?.created_at ?? row.created_at,
      });
    },
    async listActive() {
      return [...subscribers.values()]
        .filter((row) => row.status === "active")
        .sort((a, b) => a.email.localeCompare(b.email))
        .map((row) => ({ ...row }));
    },
    async purgePendingUnverified(olderThanIso) {
      for (const row of subscribers.values()) {
        if (row.status === "pending_verify" && row.updated_at < olderThanIso) {
          subscribers.delete(row.email);
          codes.delete(row.email);
        }
      }
    },
    async purgeUnsubscribed(olderThanIso) {
      for (const row of subscribers.values()) {
        if (
          row.status === "unsubscribed" &&
          row.unsubscribed_at &&
          row.unsubscribed_at < olderThanIso
        ) {
          subscribers.delete(row.email);
          codes.delete(row.email);
        }
      }
    },
    async getCode(email) {
      const row = codes.get(email);
      return row ? { ...row } : null;
    },
    async upsertCode(row) {
      codes.set(row.email, { ...row });
    },
    async deleteCode(email) {
      codes.delete(email);
    },
    async getSnapshot() {
      return snapshot;
    },
    async saveSnapshot(payloadJson) {
      snapshot = payloadJson;
    },
    async touchActiveDigest(sentAt) {
      for (const row of subscribers.values()) {
        if (row.status === "active") {
          subscribers.set(row.email, { ...row, last_digest_at: sentAt, updated_at: sentAt });
        }
      }
    },
  };
}
