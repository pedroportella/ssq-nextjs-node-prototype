import type { ReactNode } from "react";

import "./QhdsTable.scss";

export interface QhdsTableColumn {
  header: ReactNode;
  key: string;
  render?: (row: QhdsTableRow) => ReactNode;
}

export type QhdsTableRow = Record<string, ReactNode>;

export interface QhdsTableProps {
  caption: ReactNode;
  columns: QhdsTableColumn[];
  rows: QhdsTableRow[];
}

export function QhdsTable({ caption, columns, rows }: QhdsTableProps) {
  return (
    <div className="ssq-table" tabIndex={0}>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={String(row.id ?? rowIndex)}>
              {columns.map((column) => (
                <td data-label={typeof column.header === "string" ? column.header : undefined} key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
