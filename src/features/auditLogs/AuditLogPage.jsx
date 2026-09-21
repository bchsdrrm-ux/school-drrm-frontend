import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import Table from '../../components/Table';
import Modal from '../../components/Modal';

const ACTION_STYLES = {
  CREATE: 'bg-green-50 text-green-700 border-green-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  STATUS_CHANGE: 'bg-purple-50 text-purple-700 border-purple-200',
  APPROVE: 'bg-teal-50 text-teal-700 border-teal-200',
  LOGIN: 'bg-slate-100 text-slate-600 border-slate-200',
  EMERGENCY_ACTIVATE: 'bg-orange-50 text-orange-700 border-orange-200',
};

const PAGE_SIZE = 50;

function ActionBadge({ value }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${ACTION_STYLES[value] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterOptions, setFilterOptions] = useState({ entityTypes: [], actions: [] });
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [detailLog, setDetailLog] = useState(null);

  useEffect(() => {
    api.get('/audit-logs/filter-options').then(setFilterOptions).catch(() => {});
  }, []);

  const load = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (entityTypeFilter) params.set('entityType', entityTypeFilter);
    if (actionFilter) params.set('action', actionFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('limit', PAGE_SIZE);
    params.set('offset', page * PAGE_SIZE);

    api.get(`/audit-logs?${params.toString()}`)
      .then((res) => { setLogs(res.rows); setTotal(res.total); })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  };
  useEffect(load, [entityTypeFilter, actionFilter, dateFrom, dateTo, page]);

  // Any filter change resets to page 0 — otherwise a narrowed filter could
  // leave the user stranded on a page number past the new (smaller) result set.
  const applyFilter = (setter) => (value) => { setter(value); setPage(0); };

  const columns = [
    { key: 'created_at', header: 'Timestamp', render: (r) => new Date(r.created_at).toLocaleString() },
    { key: 'user', header: 'User', render: (r) => r.first_name ? `${r.first_name} ${r.last_name}` : '—' },
    { key: 'action', header: 'Action', render: (r) => <ActionBadge value={r.action} /> },
    { key: 'entity_type', header: 'Entity', render: (r) => r.entity_type.replaceAll('_', ' ') },
    { key: 'ip_address', header: 'IP', render: (r) => r.ip_address || '—' },
    { key: 'details', header: '', render: (r) => (
        (r.before_data || r.after_data) ? (
          <button onClick={() => setDetailLog(r)} className="text-xs font-medium text-brand-700 hover:underline">View Details</button>
        ) : <span className="text-xs text-slate-400">—</span>
      ) },
  ];

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">Every create, edit, deletion, approval, and Emergency Mode activation across the system.</p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select value={entityTypeFilter} onChange={(e) => applyFilter(setEntityTypeFilter)(e.target.value)} className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
          <option value="">All entities</option>
          {filterOptions.entityTypes.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
        </select>
        <select value={actionFilter} onChange={(e) => applyFilter(setActionFilter)(e.target.value)} className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
          <option value="">All actions</option>
          {filterOptions.actions.map((a) => <option key={a} value={a}>{a.replaceAll('_', ' ')}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => applyFilter(setDateFrom)(e.target.value)} className="text-sm border border-slate-300 rounded-lg px-3 py-1.5" />
        <span className="text-xs text-slate-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => applyFilter(setDateTo)(e.target.value)} className="text-sm border border-slate-300 rounded-lg px-3 py-1.5" />
      </div>

      {error && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={logs} isLoading={isLoading} emptyMessage="No matching audit log entries." />

      {total > 0 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500">Showing {from}–{to} of {total}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              disabled={to >= total}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {detailLog && (
        <Modal title={`${detailLog.action.replaceAll('_', ' ')} — ${detailLog.entity_type.replaceAll('_', ' ')}`} onClose={() => setDetailLog(null)} wide>
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              {new Date(detailLog.created_at).toLocaleString()} · {detailLog.first_name ? `${detailLog.first_name} ${detailLog.last_name}` : 'Unknown user'}
              {detailLog.ip_address && ` · ${detailLog.ip_address}`}
            </div>
            {detailLog.before_data && (
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">Before</div>
                <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(detailLog.before_data, null, 2)}</pre>
              </div>
            )}
            {detailLog.after_data && (
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">After</div>
                <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(detailLog.after_data, null, 2)}</pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
