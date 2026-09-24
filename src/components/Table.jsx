import React from 'react';

/**
 * Minimal generic table. columns: [{ key, header, render?(row) }]
 * Deliberately dependency-free (no table library) so it's easy to swap
 * later if a module needs sorting/pagination beyond what this offers.
 */
export default function Table({ columns, rows, isLoading, emptyMessage = 'No records found.' }) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" role="status" aria-label="Loading">
        <div className="h-10 bg-slate-50 border-b border-slate-200" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100 last:border-0">
            {(columns.length ? columns : [0, 1, 2]).slice(0, 5).map((c, j) => (
              <div key={j} className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (!rows?.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th key={col.key} className="text-left font-medium text-slate-500 px-4 py-2.5 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
