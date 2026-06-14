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
  striped?: boolean;
}

export function QhdsTable({ caption, columns, rows, striped = false }: QhdsTableProps) {
  const tableClassName = ["qld__table", "qld__table--contained", striped ? "qld__table--striped" : ""].filter(Boolean).join(" ");

  return (
    <div className="qld__table__container qld__table--scroll ssq-table" tabIndex={0}>
      <table className={tableClassName}>
        <caption className="qld__table__caption">{caption}</caption>
        <thead className="qld__table__head">
          <tr className="qld__table__row">
            {columns.map((column) => (
              <th className="qld__table__header" key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="qld__table__body">
          {rows.map((row, rowIndex) => (
            <tr className="qld__table__row" key={String(row.id ?? rowIndex)}>
              {columns.map((column) => (
                <td
                  className="qld__table__cell"
                  data-label={typeof column.header === "string" ? column.header : undefined}
                  key={column.key}
                >
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
