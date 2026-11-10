export type SqlValue = string | number | null;

export type SqlStatement = {
  bind(...values: SqlValue[]): SqlStatement;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results?: T[] }>;
  first<T>(): Promise<T | null>;
};

export type SqlDatabase = {
  prepare(query: string): SqlStatement;
};
