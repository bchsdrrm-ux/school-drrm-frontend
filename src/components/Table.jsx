import React from 'react';

/**
 * Minimal generic table. columns: [{ key, header, render?(row) }]
 * Deliberately dependency-free (no table library) so it's easy to swap
 * later if a module needs sorting/pagination beyond what this offers.
 */
export default function Table({ columns, rows, isLoading, emptyMessage = 'No records found.' }) {
  if (isLoading) {
    return <div className="text-sm text-slate-500 py-8 text-center">Loading…</div>;
  }
  if (!rows?.length) {
    return <div className="text-sm text-slate-500 py-8 text-center">{emptyMessage}</div>;
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
