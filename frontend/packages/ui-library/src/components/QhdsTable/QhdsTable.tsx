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
  captionDescription?: ReactNode;
  columns: QhdsTableColumn[];
  contained?: boolean;
  rows: QhdsTableRow[];
  scroll?: boolean;
  striped?: boolean;
}

export function QhdsTable({
  caption,
  captionDescription,
  columns,
  contained = true,
  rows,
  scroll = true,
  striped = false
}: QhdsTableProps) {
  const wrapperClassName = [
    "qld__table__wrapper",
    contained ? "qld__table--contained" : undefined,
    scroll ? "qld__table--scroll" : undefined,
    "ssq-table"
  ]
    .filter(Boolean)
    .join(" ");
  const tableClassName = ["qld__table", "qld__align-middle", striped ? "qld__table--striped" : undefined].filter(Boolean).join(" ");

  return (
    <div className={wrapperClassName} tabIndex={scroll ? 0 : undefined}>
      <table className={tableClassName}>
        <caption className="qld__table__caption">
          {caption}
          {captionDescription ? <span className="qld__caption">{captionDescription}</span> : null}
        </caption>
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
