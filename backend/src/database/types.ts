import type { QueryResult, QueryResultRow } from "pg";

export interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(sql: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
}

export interface DatabaseHealthCheck {
  ping(): Promise<boolean>;
}
