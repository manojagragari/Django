"use client";

/**
 * Table with a horizontal scroll container of its own.
 *
 * Wide tables must never make the page body scroll sideways, so the overflow is
 * owned by this wrapper. On narrow screens each row collapses into a stacked
 * card via the `label` data attribute.
 */

import { EmptyState, Skeleton, cx } from "./Primitives";

export function DataTable({
  columns,
  rows,
  keyField = "id",
  loading = false,
  empty,
  footer,
  rowClassName,
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (!rows?.length) {
    return empty ?? <EmptyState title="Nothing here yet" />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  "whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-faint",
                  column.align === "right" ? "text-right" : "text-left",
                  column.align === "center" && "text-center",
                  column.headClassName
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row[keyField] ?? index}
              className={cx(
                "border-b border-line last:border-0 transition-colors hover:bg-raised",
                rowClassName?.(row)
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "px-4 py-3 align-middle text-ink",
                    column.align === "right" && "text-right tabular-nums",
                    column.align === "center" && "text-center",
                    column.className
                  )}
                >
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="border-t border-line-strong bg-raised font-semibold">{footer}</tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** Compact key/value list used where a table would be overkill on mobile. */
export function DefinitionList({ items }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(({ label, value, strong }) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-xs text-muted">{label}</dt>
          <dd
            className={cx(
              "text-right text-sm tabular-nums",
              strong ? "font-bold text-ink" : "text-ink"
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
